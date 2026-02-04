import { supabase } from '../supabase';
import type { DbScan } from '../supabase';

export async function saveScan(
  imageUrl: string,
  storagePath: string,
  insights: DbScan['insights']
) {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scans')
    .insert([
      {
        image_url: imageUrl,
        storage_path: storagePath,
        insights: insights,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getUserScans() {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DbScan[];
}

export async function uploadScanImage(file: Blob, fileName: string) {
  if (!supabase) throw new Error('Supabase not initialized');

  const path = `${Date.now()}-${fileName}`;
  
  const { error } = await supabase.storage
    .from('scans')
    .upload(path, file);

  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from('scans')
    .getPublicUrl(path);

  return { path, publicUrl: urlData.publicUrl };
}

export async function deleteScan(scanId: string) {
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('id', scanId);

  if (error) throw error;
}