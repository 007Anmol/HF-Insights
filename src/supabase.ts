import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Hardcoded values for production builds
const SUPABASE_URL = 'https://sjqpojzczgabguzkjljf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcXBvanpjemdhYmd1emtqbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MzE1MjcsImV4cCI6MjA4NTEwNzUyN30.z7Yzj1vfj3UK4nzgnTyMuLHFYqz9oCYoHQl-b4TP3as';

// Always create the client with hardcoded values
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type DbScan = {
  id: string;
  user_id: string;
  image_url: string;
  storage_path?: string;
  created_at: string;
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
