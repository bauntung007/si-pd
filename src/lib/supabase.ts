import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables safely
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if valid credentials are supplied
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' &&
  !supabaseUrl.includes('YOUR_PROJECT_ID')
);

// Initialize Supabase Client dynamically
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload a photo file to Supabase Storage Bucket 'lampiran-lpd'
 */
export async function uploadToSupabaseStorage(
  file: File | Blob, 
  fileName: string
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase || !isSupabaseConfigured) {
    return { url: null, error: 'Supabase belum dikonfigurasi dengan URL & Anon Key yang valid.' };
  }

  try {
    const ext = fileName.split('.').pop() || 'jpg';
    const cleanFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `laporan/${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('lampiran-lpd')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Gagal upload ke Supabase Storage:', error.message);
      return { url: null, error: error.message };
    }

    // Get public URL for uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('lampiran-lpd')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Error exception upload Supabase Storage:', err);
    return { url: null, error: err.message || 'Error tidak diketahui saat upload ke Storage.' };
  }
}
