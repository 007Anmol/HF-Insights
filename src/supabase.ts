import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra as any;
const SUPABASE_URL = extra?.supabaseUrl;
const SUPABASE_ANON_KEY = extra?.supabaseAnonKey;

// Validate URL format
const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase config missing: set expo.extra.supabaseUrl and supabaseAnonKey in app.json');
}

if (SUPABASE_URL && !isValidUrl(SUPABASE_URL)) {
  console.error('Invalid Supabase URL. Please set a valid URL in app.json');
}

// Only create client if we have valid credentials
export const supabase = SUPABASE_URL && isValidUrl(SUPABASE_URL) && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export type DbScan = {
  id: string;
  user_id: string;
  image_url: string;
  storage_path?: string;
  created_at: string;
  insights: {
    title: string;
    summary: string;
    recommendations: string[];
    laymanTerms?: { term: string; plain: string }[];
  };
};
