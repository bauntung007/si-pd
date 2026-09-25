-- =============================================================================
-- SI-PD BPHL WILAYAH XI BANJARBARU — SKRIP UJI RELASI & INTEGRITAS SKEMA (TAHAP 1)
-- File: migrations/test_schema_relations.sql
-- Keterangan: Skenario pengujian transactional integritas relasi & constraint DDL
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- SKENARIO 1: UJI POPULASI USERS (ADMIN, VALIDATOR, VERIFIKATOR, STAF)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, nip, nama, jabatan, email, role, password_hash)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '198209222008012000', 'Isma Chairani Hasibuan, S.Hut', 'Kasubag TU', 'isma@menlhk.go.id', 'verifikator', '$2b$12$eImiTXuWVxfM37uY4JANjO'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '197909012000031000', 'Wahyu Nurhidayat, S.Hut., M.Sc.', 'Kepala Balai', 'wahyu@menlhk.go.id', 'validator', '$2b$12$eImiTXuWVxfM37uY4JANjO'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '199406072022031000', 'Iman Tochid, S.Hut.', 'PEH Pertama', 'iman@menlhk.go.id', 'user', '$2b$12$eImiTXuWVxfM37uY4JANjO'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '197806052001122000', 'Lia Yunita, S.Hut., M.P.', 'PEH Madya', 'lia@menlhk.go.id', 'user', '$2b$12$eImiTXuWVxfM37uY4JANjO');

-- -----------------------------------------------------------------------------
-- SKENARIO 2: UJI SURAT TUGAS & KEGIATAN INDUK
-- -----------------------------------------------------------------------------
INSERT INTO assignments (id, nomor_st, tanggal_st, pemberi_tugas_nama, pemberi_tugas_jabatan)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'ST.114/BPHL-XI/PNBP/2026',
  '2026-06-18',
  'Wahyu Nurhidayat, S.Hut., M.Sc.',
  'Kepala Balai'
);

INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, lokasi, tanggal_mulai, tanggal_selesai, status, created_by)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'jk-2',
  'Pemantauan & Verifikasi Pembayaran PNBP Kehutanan',
  'Logpond Tanah Laut, Kalimantan Selatan',
  '2026-06-19',
  '2026-06-21',
  'BERJALAN',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- -----------------------------------------------------------------------------
-- SKENARIO 3: UJI PENUGASAN TIM STAF & VERIFIKATOR TERTUGAS
-- -----------------------------------------------------------------------------
-- Staf 1 (Iman Tochid) dan Staf 2 (Lia Yunita) sebagai anggota tim
INSERT INTO activity_members (activity_id, user_id, peran_dalam_tim)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'KETUA'),
  ('22222222-2222-2222-2222-222222222222', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'ANGGOTA');

-- Kasubag TU (Isma Chairani) ditugaskan sebagai Verifikator khusus kegiatan ini
INSERT INTO reviewer_assignments (activity_id, reviewer_user_id, ditugaskan_oleh)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
);

-- -----------------------------------------------------------------------------
-- SKENARIO 4: UJI ENTITAS LAPORAN, SNAPSHOT VERSI & KOMENTAR REVISI (APPEND-ONLY)
-- -----------------------------------------------------------------------------
INSERT INTO reports (id, activity_id, status, created_by)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'DIAJUKAN_VERIFIKASI',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- Snapshot Versi 1
INSERT INTO report_versions (id, report_id, version_number, judul_laporan, maksud_tujuan, hasil_kegiatan, kesimpulan, saran, created_by)
VALUES (
  '44444444-4444-4444-4444-444444444441',
  '33333333-3333-3333-3333-333333333333',
  1,
  'Laporan Hasil Pemantauan PNBP Kehutanan di Tanah Laut',
  'Mengevaluasi ketepatan pembayaran PNBP PSDH-DR',
  '1. Pemeriksaan LHP & SIPNBP lunas.',
  'Realisasi PNBP terkonfirmasi lunas.',
  'Diusulkan untuk disetujui.',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- Update current_version_id pada laporan
UPDATE reports SET current_version_id = '44444444-4444-4444-4444-444444444441' WHERE id = '33333333-3333-3333-3333-333333333333';

-- Komentar Verifikator (Reviewer Minta Verifikasi/Lolos)
INSERT INTO review_comments (report_version_id, author_id, action, comment_text)
VALUES (
  '44444444-4444-4444-4444-444444444441',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'VERIFIED',
  'Dokumen kelengkapan LHP dan bukti billing SIPNBP telah diverifikasi sah dan sesuai.'
);

-- Transisi Laporan ke MENUNGGU_VALIDASI -> DISETUJUI oleh Kepala Balai
UPDATE reports SET status = 'DISETUJUI' WHERE id = '33333333-3333-3333-3333-333333333333';

INSERT INTO review_comments (report_version_id, author_id, action, comment_text)
VALUES (
  '44444444-4444-4444-4444-444444444441',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'APPROVED',
  'Disetujui Kepala Balai.'
);

-- -----------------------------------------------------------------------------
-- SKENARIO 5: UJI TELAAHAN STAF (HANYA DARI VERSIONS DENGAN STATUS LAPORAN DISETUJUI)
-- -----------------------------------------------------------------------------
INSERT INTO staff_studies (approved_report_version_id, judul, persoalan, praanggapan, fakta, analisis, kesimpulan, saran, created_by)
VALUES (
  '44444444-4444-4444-4444-444444444441',
  'Peningkatan Pengawasan Penatausahaan Hasil Hutan di Tanah Laut',
  'Ketidaksesuaian operasional di logpond Tanah Laut',
  'Apabila dibiarkan tanpa tindakan pembinaan berisiko sanksi',
  'Terdapat kendala delay data SIPNBP 24 jam',
  'Perlu dilakukan pembinaan teknis terstruktur',
  'Penerbitan Surat Pembinaan Teknis merupakan solusi tepat',
  'Menyetujui draf Surat Pembinaan Teknis',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- -----------------------------------------------------------------------------
-- SKENARIO 6: UJI PENGATURAN LAMPIRAN FILE PRIVAT
-- -----------------------------------------------------------------------------
INSERT INTO attachments (activity_id, report_id, file_name, mime_type, file_size_bytes, provider, file_id_ref, uploaded_by)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  'dokumen_verifikasi_lunas.jpg',
  'image/jpeg',
  2202009,
  'LOCAL_PRIVATE',
  'storage/attachments/2026/06/dokumen_verifikasi_lunas.jpg',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- -----------------------------------------------------------------------------
-- REKONSILIASI PENGECEKAN DATA HASIL UJI RELASI
-- -----------------------------------------------------------------------------
SELECT 'Pemeriksaan Relasi 1-to-1 Laporan ke Kegiatan' AS uji, r.id AS report_id, a.nama_kegiatan, r.status
FROM reports r
JOIN activities a ON r.activity_id = a.id;

SELECT 'Pemeriksaan Versi Terkunci & Review Comments' AS uji, rv.version_number, rc.action, rc.comment_text, u.nama AS author
FROM review_comments rc
JOIN report_versions rv ON rc.report_version_id = rv.id
JOIN users u ON rc.author_id = u.id;

SELECT 'Pemeriksaan Telaahan Staf Mengunci pada Versi Disetujui' AS uji, ss.judul, rv.judul_laporan, r.status
FROM staff_studies ss
JOIN report_versions rv ON ss.approved_report_version_id = rv.id
JOIN reports r ON rv.report_id = r.id;

-- Batalkan transaksi setelah pengujian (Dry Run Clean Execution)
ROLLBACK;
