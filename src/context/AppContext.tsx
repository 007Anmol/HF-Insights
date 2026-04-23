import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase, type DbScan } from '../supabase';
import { loadScans, saveScans, loadUser, saveUser } from '@utils/storage';
import { BACKEND_URL, pingBackendHealth } from '../insights';

export type User = {
  id: string;
  name: string;
  email: string;
};

export type ScanItem = {
  id: string;
  uri: string;
  storagePath?: string;
  createdAt: number;
  insights: {
    title: string;
    // New API fields
    xray_type?: string;
    source?: string;
    findings?: string[];
    possible_conditions?: string[];
    possible_symptoms?: string[];
    confidence_score?: number;
    // Legacy fields (optional)
    summary?: string;
    recommendations?: string[];
    laymanTerms?: { term: string; plain: string }[];
  };
};

type AppContextType = {
  user: User | null;
  authReady: boolean;
  setUser: (u: User | null) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  scans: ScanItem[];
  addScan: (s: ScanItem) => Promise<string>;
  removeScan: (id: string) => void;
  clearScans: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [scans, setScans] = useState<ScanItem[]>([]);

  const toAppUser = (sessionUser: any): User => ({
    id: sessionUser.id,
    name: sessionUser.user_metadata?.name || sessionUser.email || 'User',
    email: sessionUser.email || '',
  });

  useEffect(() => {
    const HEARTBEAT_MS = 8 * 60 * 1000;

    const pingIfActive = async () => {
      if (AppState.currentState !== 'active') return;
      await pingBackendHealth();
    };

    const initialPingTimer = setTimeout(() => {
      void pingIfActive();
    }, 2000);

    const heartbeatInterval = setInterval(() => {
      void pingIfActive();
    }, HEARTBEAT_MS);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void pingBackendHealth();
      }
    });

    return () => {
      clearTimeout(initialPingTimer);
      clearInterval(heartbeatInterval);
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const authReadyTimer = setTimeout(() => {
      if (isActive) setAuthReady(true);
    }, 4000);

    const markAuthReady = () => {
      if (!isActive) return;
      setAuthReady(true);
      clearTimeout(authReadyTimer);
    };

    if (!supabase) {
      (async () => {
        const cachedUser = await loadUser();
        const cachedScans = await loadScans();
        if (cachedUser && isActive) setUserState(cachedUser);
        if (cachedScans.length && isActive) setScans(cachedScans);
        markAuthReady();
      })();
      return () => {
        isActive = false;
        clearTimeout(authReadyTimer);
      };
    }
    
    (async () => {
      try {
        const [cachedUser, session] = await Promise.all([
          loadUser(),
          supabase.auth.getSession(),
        ]);

        if (cachedUser) {
          if (isActive) setUserState(cachedUser);
        }

        const sessionUser = session?.data?.session?.user;
        if (sessionUser) {
          const normalized = toAppUser(sessionUser);
          if (isActive) setUserState(normalized);
          await saveUser(normalized);
          void fetchScans(sessionUser.id);
        } else {
          void fetchScans(cachedUser?.id ?? null);
        }
      } catch (err) {
        console.warn('Session init failed:', err);
      } finally {
        markAuthReady();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        const normalized = toAppUser(sessionUser);
        setUserState(normalized);
        await saveUser(normalized);
        void fetchScans(sessionUser.id);
      } else {
        setUserState(null);
        await saveUser(null);
        void fetchScans(null);
      }

      markAuthReady();
    });
    return () => {
      isActive = false;
      clearTimeout(authReadyTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchScans = async (overrideUserId?: string | null) => {
    try {
      if (!supabase) return;
      const userId = overrideUserId ?? user?.id ?? null;

      // Avoid fetching all rows when unauthenticated; show cached scans only.
      if (!userId) {
        const cached = await loadScans();
        setScans(cached);
        return;
      }

      const query = supabase.from('scans').select('*').order('created_at', { ascending: false });
      const { data, error } = userId ? await query.eq('user_id', userId) : await query;
      if (error) throw error;
      const mapped: ScanItem[] = (data as DbScan[]).map(d => ({
        id: d.id,
        uri: d.image_url,
        storagePath: d.storage_path,
        createdAt: new Date(d.created_at).getTime(),
        insights: d.insights,
      }));
      // Merge with locally cached scans to preserve visibility of legacy/offline items
      const cached = await loadScans();
      const ids = new Set(mapped.map(m => m.id));
      const merged = [...mapped, ...cached.filter(c => !ids.has(c.id))];
      setScans(merged);
      await saveScans(merged);
    } catch (e) {
      const cached = await loadScans();
      if (cached.length) setScans(cached);
    }
  };

  const setUser = async (u: User | null) => {
    setUserState(u);
    await saveUser(u);
  };

  const clearAccountState = async () => {
    setUserState(null);
    setScans([]);
    await saveUser(null);
    await saveScans([]);
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    } finally {
      await clearAccountState();
    }
  };

  const deleteAccount = async () => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new Error('No active session found');
    }

    const response = await fetch(`${BACKEND_URL}/account/delete`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Unable to delete account');
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      await clearAccountState();
    }
  };

  const addScan = async (s: ScanItem): Promise<string> => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      // Try inserting with storage_path; if the column doesn't exist, fallback gracefully
      let { data: inserted, error } = await supabase.from('scans').insert({
        user_id: userId,
        image_url: s.uri,
        storage_path: s.storagePath,
        insights: s.insights,
      }).select('*').single();
      if (error) {
        // Retry without storage_path
        const retry = await supabase.from('scans').insert({
          user_id: userId,
          image_url: s.uri,
          insights: s.insights,
        }).select('*').single();
        error = retry.error ?? null;
        inserted = retry.data ?? null;
        if (error) throw error;
      }
      await fetchScans();
      Toast.show({ type: 'success', text1: 'Scan saved', text2: 'Insights generated successfully.' });
      if (inserted && (inserted as DbScan).id) {
        return (inserted as DbScan).id;
      }
      return s.id;
    } catch (e: any) {
      setScans(prev => {
        const next = [s, ...prev];
        saveScans(next);
        return next;
      });
      Toast.show({ type: 'info', text1: 'Saved locally', text2: 'Will sync when online.' });
      return s.id;
    }
  };

  const removeScan = async (id: string) => {
    // Immediately update UI by removing from state
    setScans(prev => prev.filter(s => s.id !== id));
    
    try {
      const target = scans.find(s => s.id === id);
      if (target?.storagePath && supabase) {
        // remove from storage first (best-effort)
        try {
          await supabase.storage.from('scans').remove([target.storagePath]);
        } catch {}
      }
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase.from('scans').delete().eq('id', id);
      if (error) throw error;
      
      // Update local cache
      const cached = await loadScans();
      const updated = cached.filter(s => s.id !== id);
      await saveScans(updated);
      
      // Refresh from server to ensure sync
      await fetchScans();
    } catch (e) {
      // Ensure local storage is updated even if cloud deletion fails
      const cached = await loadScans();
      const updated = cached.filter(s => s.id !== id);
      await saveScans(updated);
    }
  };

  const clearScans = async () => {
    setScans([]);
    await saveScans([]);
  };

  const value = useMemo(
    () => ({ user, authReady, setUser, signOut, deleteAccount, scans, addScan, removeScan, clearScans }),
    [user, authReady, scans]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
