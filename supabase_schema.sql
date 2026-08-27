-- ====================================================================
-- SKEMA DATABASE POSTGRESQL SILAPERDIN (BPHL WILAYAH XI BANJARBARU)
-- DDL Migration & RLS Security Policies for Supabase Cloud
-- ====================================================================

-- 1. TABEL USERS (Pegawai & Akun Sistem)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  nip TEXT NOT NULL,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  pangkat TEXT,
  golongan TEXT,
  tmt_pangkat TEXT,
  tmt_jabatan TEXT,
  username TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL JENIS_KEGIATAN (Master Template Perjalanan Dinas)
CREATE TABLE IF NOT EXISTS public.jenis_kegiatan (
  id TEXT PRIMARY KEY,
  nama_kegiatan TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  maksud_tujuan TEXT NOT NULL,
  sasaran_kegiatan TEXT,
  metode_pelaksanaan TEXT,
  template_hasil_data_umum TEXT,
  template_hasil_poin_penting TEXT,
  template_hasil TEXT,
  dasar_hukum TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL PELAKU_USAHA (Master Objek Perizinan PBPH, PBPHH, IPKR)
CREATE TABLE IF NOT EXISTS public.pelaku_usaha (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  jenis_usaha TEXT NOT NULL, -- 'PBPH' | 'PBPHH' | 'IPKR' | 'Lainnya'
  slk_no TEXT NOT NULL,
  slk_tanggal TEXT NOT NULL,
  alamat TEXT NOT NULL,
  pimpinan TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- PBPH specific fields
  sk_pbph_no TEXT,
  sk_pbph_tanggal TEXT,
  luas_areal TEXT,
  sk_rkuph_no TEXT,
  sk_rkuph_tanggal TEXT,
  slk_masa_berlaku TEXT,
  slk_penerbit TEXT,
  rktph_tahun TEXT,
  sk_rktph_no TEXT,
  sk_rktph_tanggal TEXT,
  luas_rktph TEXT,
  target_rktph_jenis TEXT,
  target_rktph_hhbk_jenis TEXT,

  -- PBPHH specific fields
  sk_pbphh_no TEXT,
  sk_pbphh_tanggal TEXT,
  kapasitas_produksi_jenis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL LAPORAN (Laporan Perjalanan Dinas LPD)
CREATE TABLE IF NOT EXISTS public.laporan (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  jenis_kegiatan_id TEXT NOT NULL REFERENCES public.jenis_kegiatan(id),
  nomor_surat_tugas TEXT NOT NULL,
  tanggal_surat_tugas TEXT NOT NULL,
  tempat_kegiatan TEXT NOT NULL,
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT NOT NULL,
  pelaksana_ids TEXT[] DEFAULT '{}',
  sasaran_kegiatan TEXT NOT NULL,
  maksud_tujuan TEXT NOT NULL,
  metode_pelaksanaan TEXT,
  hasil_data_umum TEXT,
  hasil_poin_penting TEXT,
  pelaku_usaha_id TEXT REFERENCES public.pelaku_usaha(id) ON DELETE SET NULL,
  custom_placeholders JSONB DEFAULT '{}'::jsonb,
  hasil_kegiatan TEXT NOT NULL,
  kesimpulan TEXT NOT NULL,
  saran TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'revision'
  catatan_verifikator TEXT,
  verifikator_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lampiran JSONB DEFAULT '[]'::jsonb,
  riwayat_perubahan JSONB DEFAULT '[]'::jsonb
);

-- 5. TABEL NOTIFICATIONS (Notifikasi Sistem In-App)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  laporan_id TEXT REFERENCES public.laporan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL TELAAHAN_STAF (Kajian Dinas AI Telaahan Staf)
CREATE TABLE IF NOT EXISTS public.telaahan_staf (
  id TEXT PRIMARY KEY,
  laporan_id TEXT NOT NULL REFERENCES public.laporan(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  persoalan TEXT NOT NULL,
  praanggapan TEXT NOT NULL,
  fakta TEXT NOT NULL,
  analisis TEXT NOT NULL,
  kesimpulan TEXT NOT NULL,
  saran TEXT NOT NULL,
  tanggal_telaahan TEXT NOT NULL,
  penyusun_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEKS KINERJA (PERFORMANCE INDEXES)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_laporan_user_id ON public.laporan(user_id);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON public.laporan(status);
CREATE INDEX IF NOT EXISTS idx_laporan_jenis_kegiatan ON public.laporan(jenis_kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_telaahan_laporan_id ON public.telaahan_staf(laporan_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelaku_usaha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telaahan_staf ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read access for application data API
CREATE POLICY "Allow public read users" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write users" ON public.users FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read jenis_kegiatan" ON public.jenis_kegiatan FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write jenis_kegiatan" ON public.jenis_kegiatan FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read pelaku_usaha" ON public.pelaku_usaha FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write pelaku_usaha" ON public.pelaku_usaha FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read laporan" ON public.laporan FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write laporan" ON public.laporan FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read telaahan_staf" ON public.telaahan_staf FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public write telaahan_staf" ON public.telaahan_staf FOR ALL TO anon, authenticated USING (true);

-- ====================================================================
-- SUPABASE STORAGE BUCKET UNTUK FOTO (lampiran-lpd)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lampiran-lpd', 'lampiran-lpd', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public access to lampiran-lpd bucket"
ON storage.objects FOR ALL TO anon, authenticated
USING (bucket_id = 'lampiran-lpd');
