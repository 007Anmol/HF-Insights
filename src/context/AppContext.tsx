import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';
import { supabase, type DbScan } from '../supabase';
import { loadScans, saveScans, loadUser, saveUser } from '@utils/storage';

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
    summary: string;
    recommendations: string[];
    laymanTerms?: { term: string; plain: string }[];
  };
};

type AppContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  scans: ScanItem[];
  addScan: (s: ScanItem) => void;
  removeScan: (id: string) => void;
  clearScans: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [scans, setScans] = useState<ScanItem[]>([]);

  useEffect(() => {
    if (!supabase) return;
    
    (async () => {
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      if (user) setUserState({ id: user.id, name: user.user_metadata?.name || user.email || 'User', email: user.email || '' });
      await fetchScans();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) setUserState({ id: user.id, name: user.user_metadata?.name || user.email || 'User', email: user.email || '' });
      else setUserState(null);
      fetchScans();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchScans = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const mapped: ScanItem[] = (data as DbScan[]).map(d => ({
        id: d.id,
        uri: d.image_url,
        storagePath: d.storage_path,
        createdAt: new Date(d.created_at).getTime(),
        insights: d.insights,
      }));
      setScans(mapped);
      await saveScans(mapped);
    } catch (e) {
      const cached = await loadScans();
      if (cached.length) setScans(cached);
    }
  };

  const setUser = async (u: User | null) => {
    setUserState(u);
    await saveUser(u);
  };

  const addScan = async (s: ScanItem) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      // Try inserting with storage_path; if the column doesn't exist, fallback gracefully
      let { error } = await supabase.from('scans').insert({
        image_url: s.uri,
        storage_path: s.storagePath,
        insights: s.insights,
      });
      if (error) {
        // Retry without storage_path
        const retry = await supabase.from('scans').insert({
          image_url: s.uri,
          insights: s.insights,
        });
        error = retry.error ?? null;
        if (error) throw error;
      }
      await fetchScans();
      Toast.show({ type: 'success', text1: 'Scan saved', text2: 'Insights generated successfully.' });
    } catch (e: any) {
      setScans(prev => {
        const next = [s, ...prev];
        saveScans(next);
        return next;
      });
      Toast.show({ type: 'info', text1: 'Saved locally', text2: 'Will sync when online.' });
    }
  };

  const removeScan = async (id: string) => {
    try {
      const target = scans.find(s => s.id === id);
      if (target?.storagePath && supabase) {
        // remove from storage first (best-effort)
        try {
          await supabase.storage.from('scans').remove([target.storagePath]);
        } catch {}
      }
      if (!supabase) throw new Error('Supabase client not initialized');
      await supabase.from('scans').delete().eq('id', id);
      await fetchScans();
    } catch {
      setScans(prev => {
        const next = prev.filter(s => s.id !== id);
        saveScans(next);
        return next;
      });
    }
  };

  const clearScans = async () => {
    setScans([]);
    await saveScans([]);
  };

  const value = useMemo(
    () => ({ user, setUser, scans, addScan, removeScan, clearScans }),
    [user, scans]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
