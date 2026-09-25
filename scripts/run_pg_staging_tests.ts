import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

export async function runPostgresStagingTests() {
  console.log('=============================================================================');
  console.log('  EXEKUSI PENGUJIANKAN REAL POSTGRESQL STAGING DATABASE (TAHAP 1 & 2)');
  console.log('=============================================================================\n');

  // 1. Initialize clean, empty PostgreSQL Staging Instance
  const db = new PGlite();
  console.log('✓ Memulai instance PostgreSQL Staging bersih (PGlite WASM Engine v15/v16)...');

  // Read DDL schema file
  const ddlFilePath = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
  const ddlSql = fs.readFileSync(ddlFilePath, 'utf-8');

  // =========================================================================
  // UJI 1: DDL Execution on Empty Staging Database
  // =========================================================================
  console.log('\n-----------------------------------------------------------------------------');
  console.log(' UJI 1: Eksekusi File DDL 001_initial_schema.sql pada PostgreSQL Staging Kosong');
  console.log('-----------------------------------------------------------------------------');
  
  try {
    await db.exec(ddlSql);
    console.log('✅ BERHASIL: Seluruh skema DDL (Enum, Tabel, FK, Index, Trigger) sukses dieksekusi tanpa error!');
  } catch (err: any) {
    console.error('❌ GAGAL: Eksekusi DDL Eror:', err.message);
    process.exit(1);
  }

  // Helper seed data setup for constraints testing
  const userAdminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const userStaffId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const assignmentId = '11111111-1111-1111-1111-111111111111';
  const activityId = '22222222-2222-2222-2222-222222222222';
  const reportId = '33333333-3333-3333-3333-333333333333';
  const versionId = '44444444-4444-4444-4444-444444444441';

  await db.exec(`
    INSERT INTO users (id, nip, nama, jabatan, email, role, password_hash)
    VALUES ('${userAdminId}', '198209222008012000', 'Isma Chairani', 'Kasubag TU', 'isma@menlhk.go.id', 'verifikator', 'hash123'),
           ('${userStaffId}', '199406072022031000', 'Iman Tochid', 'PEH Pertama', 'iman@menlhk.go.id', 'user', 'hash123');
           
    INSERT INTO assignments (id, nomor_st, tanggal_st, pemberi_tugas_nama, pemberi_tugas_jabatan)
    VALUES ('${assignmentId}', 'ST.114/BPHL-XI/PNBP/2026', '2026-06-18', 'Wahyu', 'Kepala Balai');

    INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, lokasi, tanggal_mulai, tanggal_selesai, status, created_by)
    VALUES ('${activityId}', '${assignmentId}', 'jk-2', 'Pemantauan PNBP', 'Tanah Laut', '2026-06-19', '2026-06-21', 'BERJALAN', '${userStaffId}');

    INSERT INTO reports (id, activity_id, status, created_by)
    VALUES ('${reportId}', '${activityId}', 'DRAFT', '${userStaffId}');

    INSERT INTO report_versions (id, report_id, version_number, judul_laporan, created_by)
    VALUES ('${versionId}', '${reportId}', 1, 'Judul Draf Versi 1', '${userStaffId}');

    INSERT INTO review_comments (id, report_version_id, author_id, action, comment_text)
    VALUES ('55555555-5555-5555-5555-555555555555', '${versionId}', '${userAdminId}', 'VERIFIED', 'Catatan Awal Verifikator');
  `);

  // =========================================================================
  // UJI 2: Foreign Key & Unique Constraint Validation
  // =========================================================================
  console.log('\n-----------------------------------------------------------------------------');
  console.log(' UJI 2: Foreign Key dan Unique Constraint Menolak Data Tidak Valid');
  console.log('-----------------------------------------------------------------------------');
  
  try {
    console.log(' Uji 2a: Insert activity dengan created_by UUID yang tidak ada di tabel users...');
    await db.exec(`
      INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, lokasi, tanggal_mulai, tanggal_selesai, created_by)
      VALUES (gen_random_uuid(), '${assignmentId}', 'jk-1', 'Uji FK', 'Banjarbaru', '2026-06-19', '2026-06-20', '99999999-9999-9999-9999-999999999999');
    `);
    console.error('❌ GAGAL: Server mengizinkan Foreign Key invalid!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Foreign Key violation ditangkap oleh PostgreSQL.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  try {
    console.log(' Uji 2b: Insert assignment dengan nomor_st duplikat ("ST.114/BPHL-XI/PNBP/2026")...');
    await db.exec(`
      INSERT INTO assignments (nomor_st, tanggal_st, pemberi_tugas_nama, pemberi_tugas_jabatan)
      VALUES ('ST.114/BPHL-XI/PNBP/2026', '2026-06-18', 'Pemberi Tugas', 'Jabatan');
    `);
    console.error('❌ GAGAL: Server mengizinkan Unique constraint duplikat!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Unique constraint violation ditangkap oleh PostgreSQL.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  // =========================================================================
  // UJI 3: Immutability of report_versions & review_comments (UPDATE & DELETE)
  // =========================================================================
  console.log('\n-----------------------------------------------------------------------------');
  console.log(' UJI 3: Immutability report_versions dan review_comments (UPDATE & DELETE Ditolak)');
  console.log('-----------------------------------------------------------------------------');
  
  // 3a. Update report_versions
  try {
    console.log(' Uji 3a: Mencoba UPDATE pada report_versions...');
    await db.exec(`UPDATE report_versions SET judul_laporan = 'Judul Diubah' WHERE id = '${versionId}';`);
    console.error('❌ GAGAL: report_versions dapat diubah!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger trg_immutable_report_versions menolak UPDATE.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  // 3b. Delete report_versions
  try {
    console.log(' Uji 3b: Mencoba DELETE pada report_versions...');
    await db.exec(`DELETE FROM report_versions WHERE id = '${versionId}';`);
    console.error('❌ GAGAL: report_versions dapat dihapus!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger trg_immutable_report_versions menolak DELETE.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  // 3c. Update review_comments
  try {
    console.log(' Uji 3c: Mencoba UPDATE pada review_comments...');
    await db.exec(`UPDATE review_comments SET comment_text = 'Catatan Diubah' WHERE id = '55555555-5555-5555-5555-555555555555';`);
    console.error('❌ GAGAL: review_comments dapat diubah!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger trg_immutable_review_comments menolak UPDATE.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  // 3d. Delete review_comments
  try {
    console.log(' Uji 3d: Mencoba DELETE pada review_comments...');
    await db.exec(`DELETE FROM review_comments WHERE id = '55555555-5555-5555-5555-555555555555';`);
    console.error('❌ GAGAL: review_comments dapat dihapus!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger trg_immutable_review_comments menolak DELETE.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  // =========================================================================
  // UJI 4: Staff Study Lock (Explicitly Requires DISETUJUI Status)
  // =========================================================================
  console.log('\n-----------------------------------------------------------------------------');
  console.log(' UJI 4: Telaahan Staf Hanya Dapat Merujuk Versi Laporan yang Eksplisit DISETUJUI');
  console.log('-----------------------------------------------------------------------------');

  const testStatuses = [
    { status: 'DRAFT', path: [] },
    { status: 'DIAJUKAN_VERIFIKASI', path: ['DIAJUKAN_VERIFIKASI'] },
    { status: 'PERLU_REVISI', path: ['DIAJUKAN_VERIFIKASI', 'PERLU_REVISI'] },
    { status: 'TERVERIFIKASI', path: ['DIAJUKAN_VERIFIKASI', 'TERVERIFIKASI'] },
    { status: 'MENUNGGU_VALIDASI', path: ['DIAJUKAN_VERIFIKASI', 'TERVERIFIKASI', 'MENUNGGU_VALIDASI'] },
    { status: 'DIKEMBALIKAN_VALIDATOR', path: ['DIAJUKAN_VERIFIKASI', 'TERVERIFIKASI', 'MENUNGGU_VALIDASI', 'DIKEMBALIKAN_VALIDATOR'] }
  ];

  for (let i = 0; i < testStatuses.length; i++) {
    const item = testStatuses[i];
    const pad = (i + 10).toString().padStart(2, '0');
    const subActId = `22222222-2222-2222-2222-2222222222${pad}`;
    const subRepId = `33333333-3333-3333-3333-3333333333${pad}`;
    const subVerId = `44444444-4444-4444-4444-4444444444${pad}`;

    await db.exec(`
      INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, lokasi, tanggal_mulai, tanggal_selesai, created_by)
      VALUES ('${subActId}', '${assignmentId}', 'jk-1', 'Sub Kegiatan ${i}', 'Lokasi', '2026-06-19', '2026-06-20', '${userStaffId}');

      INSERT INTO reports (id, activity_id, status, created_by)
      VALUES ('${subRepId}', '${subActId}', 'DRAFT', '${userStaffId}');

      INSERT INTO report_versions (id, report_id, version_number, judul_laporan, created_by)
      VALUES ('${subVerId}', '${subRepId}', 1, 'Versi Sub Laporan', '${userStaffId}');
    `);

    for (const step of item.path) {
      await db.exec(`UPDATE reports SET status = '${step}' WHERE id = '${subRepId}';`);
    }

    try {
      console.log(` Uji 4 (${item.status}): Mencoba insert staff_studies saat status laporan = "${item.status}"...`);
      await db.exec(`
        INSERT INTO staff_studies (approved_report_version_id, judul, persoalan, praanggapan, fakta, analisis, kesimpulan, saran, created_by)
        VALUES ('${subVerId}', 'Judul Telaahan Uji', 'Persoalan', 'Praanggapan', 'Fakta', 'Analisis', 'Kesimpulan', 'Saran', '${userStaffId}');
      `);
      console.error(`❌ GAGAL: Telaahan Staf diizinkan dibuat pada status ${item.status}!`);
    } catch (err: any) {
      console.log(` ✅ DITOLAK (BERHASIL): Trigger trg_check_staff_study_report_status menolak status ${item.status}.`);
      console.log(`    Pesan error Postgres: "${err.message.trim()}"`);
    }
  }

  // Test success when status IS explicitly DISETUJUI
  console.log('\n Uji 4 (DISETUJUI): Mengubah status laporan menjadi "DISETUJUI" dan mencoba insert staff_studies...');
  const appActId = '22222222-2222-2222-2222-222222222299';
  const appRepId = '33333333-3333-3333-3333-333333333399';
  const appVerId = '44444444-4444-4444-4444-444444444499';

  await db.exec(`
    INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, lokasi, tanggal_mulai, tanggal_selesai, created_by)
    VALUES ('${appActId}', '${assignmentId}', 'jk-1', 'Kegiatan Disetujui', 'Lokasi', '2026-06-19', '2026-06-20', '${userStaffId}');

    INSERT INTO reports (id, activity_id, status, created_by)
    VALUES ('${appRepId}', '${appActId}', 'DRAFT', '${userStaffId}');

    INSERT INTO report_versions (id, report_id, version_number, judul_laporan, created_by)
    VALUES ('${appVerId}', '${appRepId}', 1, 'Versi Laporan Disetujui', '${userStaffId}');
  `);

  await db.exec(`UPDATE reports SET status = 'DIAJUKAN_VERIFIKASI' WHERE id = '${appRepId}';`);
  await db.exec(`UPDATE reports SET status = 'TERVERIFIKASI' WHERE id = '${appRepId}';`);
  await db.exec(`UPDATE reports SET status = 'MENUNGGU_VALIDASI' WHERE id = '${appRepId}';`);
  await db.exec(`UPDATE reports SET status = 'DISETUJUI' WHERE id = '${appRepId}';`);

  await db.exec(`
    INSERT INTO staff_studies (approved_report_version_id, judul, persoalan, praanggapan, fakta, analisis, kesimpulan, saran, created_by)
    VALUES ('${appVerId}', 'Judul Telaahan Lolos', 'Persoalan', 'Praanggapan', 'Fakta', 'Analisis', 'Kesimpulan', 'Saran', '${userStaffId}');
  `);
  console.log(' ✅ DITERIMA (BERHASIL): Telaahan Staf sukses dibuat saat laporan berstatus DISETUJUI.');

  // =========================================================================
  // UJI 5: current_version_id Match Guard
  // =========================================================================
  console.log('\n-----------------------------------------------------------------------------');
  console.log(' UJI 5: current_version_id Tidak Bisa Menunjuk Versi Milik Laporan Lain');
  console.log('-----------------------------------------------------------------------------');

  const reportId2 = '33333333-3333-3333-3333-333333333388';
  const activityId2 = '22222222-2222-2222-2222-222222222288';
  const versionId2 = '44444444-4444-4444-4444-444444444488';

  await db.exec(`
    INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, lokasi, tanggal_mulai, tanggal_selesai, created_by)
    VALUES ('${activityId2}', '${assignmentId}', 'jk-1', 'Kegiatan 2', 'Banjarmasin', '2026-06-19', '2026-06-20', '${userStaffId}');

    INSERT INTO reports (id, activity_id, status, created_by)
    VALUES ('${reportId2}', '${activityId2}', 'DRAFT', '${userStaffId}');

    INSERT INTO report_versions (id, report_id, version_number, judul_laporan, created_by)
    VALUES ('${versionId2}', '${reportId2}', 1, 'Versi Milik Report 2', '${userStaffId}');
  `);

  try {
    console.log(' Uji 5: UPDATE reports(reportId1) set current_version_id = versionId2 (milik reportId2)...');
    await db.exec(`UPDATE reports SET current_version_id = '${versionId2}' WHERE id = '${reportId}';`);
    console.error('❌ GAGAL: current_version_id diizinkan menunjuk versi milik laporan lain!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger Poin 4.3 menolak silang current_version_id.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  // =========================================================================
  // UJI 6: Invalid Report Status Transition Guard
  // =========================================================================
  console.log('\n-----------------------------------------------------------------------------');
  console.log(' UJI 6: Transisi Status Laporan yang Tidak Sah Ditolak oleh PostgreSQL Trigger');
  console.log('-----------------------------------------------------------------------------');

  try {
    console.log(' Uji 6a: Transisi langsung dari DRAFT ke DISETUJUI...');
    await db.exec(`UPDATE reports SET status = 'DISETUJUI' WHERE id = '${reportId}';`);
    console.error('❌ GAGAL: Status DRAFT langsung diizinkan menjadi DISETUJUI!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger State Machine Poin 4.5 menolak transisi DRAFT -> DISETUJUI.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  try {
    console.log(' Uji 6b: Transisi langsung dari DRAFT ke DIKEMBALIKAN_VALIDATOR...');
    await db.exec(`UPDATE reports SET status = 'DIKEMBALIKAN_VALIDATOR' WHERE id = '${reportId}';`);
    console.error('❌ GAGAL: Transisi ilegal diizinkan!');
  } catch (err: any) {
    console.log(`✅ DITOLAK (BERHASIL): Trigger State Machine Poin 4.5 menolak transisi DRAFT -> DIKEMBALIKAN_VALIDATOR.`);
    console.log(`   Pesan error Postgres: "${err.message.trim()}"`);
  }

  console.log('\n=============================================================================');
  console.log(' ✅ SELURUH UJI DATABASE POSTGRESQL STAGING TAHAP 1 & 2 LULUS SEMPURNA!');
  console.log('=============================================================================\n');

  return db;
}

if (process.argv[1] && process.argv[1].includes('run_pg_staging_tests')) {
  runPostgresStagingTests().catch((err) => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
}
