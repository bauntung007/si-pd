export type UserRole = 'admin' | 'verifikator' | 'validator' | 'user';

export interface KopSuratConfig {
  kementerian: string;
  dirjen: string;
  balai: string;
  alamat: string;
  kota_pos: string;
}

export interface User {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  pangkat?: string;
  golongan?: string;
  tmt_pangkat?: string;
  tmt_jabatan?: string;
  username?: string;
  password?: string;
}

export interface JenisKegiatan {
  id: string;
  nama_kegiatan: string;
  slug: string;
  maksud_tujuan: string;
  sasaran_kegiatan?: string; // Default Sasaran Kegiatan per kegiatan
  metode_pelaksanaan: string; // Template metode pelaksanaan per kegiatan
  template_hasil_data_umum: string; // Template hasil data umum per kegiatan (contains placeholders/parentheses)
  template_hasil_poin_penting: string; // Template hasil poin penting per kegiatan (contains placeholders/parentheses)
  template_hasil: string; // Legacy fallback
  dasar_hukum: string[]; // List of regulations. Baris pertama diisi "{nomor_surat_tugas} & {tanggal}" secara otomatis
  is_active: boolean;
}

export interface PelakuUsaha {
  id: string;
  nama: string;
  jenis_usaha: 'PBPH' | 'PBPHH' | 'IPKR' | 'Lainnya';
  slk_no: string;
  slk_tanggal: string;
  alamat: string;
  pimpinan: string;
  is_active: boolean;

  // PBPH specific fields
  sk_pbph_no?: string;
  sk_pbph_tanggal?: string;
  luas_areal?: string;
  sk_rkuph_no?: string;
  sk_rkuph_tanggal?: string;
  slk_masa_berlaku?: string;
  slk_penerbit?: string;
  rktph_tahun?: string; // 2025, 2026, 2027, 2028, ...
  sk_rktph_no?: string;
  sk_rktph_tanggal?: string;
  luas_rktph?: string;
  target_rktph_jenis?: 'Penanaman' | 'Produksi HHK' | 'Produksi HHBK' | 'Pembayaran PSDH' | 'Pembayaran DR' | '';
  target_rktph_hhbk_jenis?: 'Buah' | 'Biji' | 'Daun' | 'Rimpang' | '';

  // PBPHH specific fields
  sk_pbphh_no?: string;
  sk_pbphh_tanggal?: string;
  kapasitas_produksi_jenis?: 'Veneer' | 'Plywood' | 'Kayu Gergajian' | 'Serpih' | 'Block Board' | '';
}

export interface Lampiran {
  id: string;
  nama_file: string;
  dataUrl: string; // Base64 for storing locally
  tipe: 'foto' | 'dokumen';
  ukuran: string;
}

export interface RiwayatPerubahan {
  id: string;
  laporan_id: string;
  user_id: string;
  user_nama: string;
  action: string;
  status_before: string;
  status_after: string;
  timestamp: string;
}

export interface Laporan {
  id: string;
  user_id: string; // Pembuat laporan
  jenis_kegiatan_id: string;
  nomor_surat_tugas: string;
  tanggal_surat_tugas: string;
  tempat_kegiatan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  pelaksana_ids: string[]; // List of user IDs participating
  sasaran_kegiatan: string;
  maksud_tujuan: string;
  metode_pelaksanaan?: string; // New: Metode Pelaksanaan per laporan
  hasil_data_umum?: string; // New: Hasil Data Umum per laporan
  hasil_poin_penting?: string; // New: Hasil Poin Penting per laporan
  pelaku_usaha_id?: string; // New: Selected Pelaku Usaha from database
  custom_placeholders?: Record<string, string>; // New: Store filled input values of "(.....)"
  hasil_kegiatan: string; // Consolidated text for backward compatibility
  kesimpulan: string;
  saran: string;
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'revision';
  catatan_verifikator?: string;
  verifikator_id?: string;
  submitted_at?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  lampiran: Lampiran[];
  riwayat_perubahan?: RiwayatPerubahan[];
}

export interface AppNotification {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
  laporan_id?: string;
}

export interface TelaahanStaf {
  id: string;
  laporan_id: string; // Hubungan ke LPD
  judul: string; // TENTANG
  persoalan: string; // A. Persoalan
  praanggapan: string; // B. Praanggapan
  fakta: string; // C. Fakta yang Mempengaruhi
  analisis: string; // D. Analisis
  kesimpulan: string; // E. Kesimpulan
  saran: string; // F. Saran/Rekomendasi
  tanggal_telaahan: string; // Banjarbaru, dd+1 setelah validasi atau custom
  penyusun_ids: string[]; // List of user IDs chosen from LPD pelaksana_ids
  created_at: string;
  updated_at: string;
}
