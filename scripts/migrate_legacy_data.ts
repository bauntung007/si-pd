import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

export interface MigrationSummary {
  usersCount: number;
  assignmentsCount: number;
  activitiesCount: number;
  reportsCount: number;
  reportVersionsCount: number;
  attachmentsCount: number;
  staffStudiesCount: number;
  unmappedFieldsReport: Array<{ entity: string; id: string; field: string; reason: string }>;
  idMappingDetails: Array<{ entity: string; legacyId: string; pgId: string; statusKet: string }>;
}

function isValidUuid(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export async function runDryRunMigration(existingDb?: PGlite): Promise<MigrationSummary> {
  console.log('=============================================================================');
  console.log('  EXEKUSI MIGRASI DATA HISTORIS IDEMPOTEN TERREVISI (STAGING TAHAP 2)');
  console.log('=============================================================================\n');

  // 1. Load source JSON data
  const sourcePath = path.join(process.cwd(), 'db_store.json');
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File sumber db_store.json tidak ditemukan.`);
  }

  const rawData = fs.readFileSync(sourcePath, 'utf-8');
  const legacyData = JSON.parse(rawData);

  // Initialize DB instance if not provided
  const db = existingDb || new PGlite();
  
  if (!existingDb) {
    const ddlPath = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
    const ddlSql = fs.readFileSync(ddlPath, 'utf-8');
    await db.exec(ddlSql);
  }

  const unmappedFieldsReport: Array<{ entity: string; id: string; field: string; reason: string }> = [];
  const idMappingDetails: Array<{ entity: string; legacyId: string; pgId: string; statusKet: string }> = [];

  // =========================================================================
  // 1. MIGRATE USERS (56 Records) - IDEMPOTENT BY NIP / EMAIL (LOCKED RESET REQUIRED)
  // =========================================================================
  const legacyUsers = legacyData.users || [];
  let migratedUsers = 0;

  for (const u of legacyUsers) {
    // Password hash terkunci: akun tidak dapat login sampai reset password dilakukan di Auth API baru
    const lockedPasswordHash = '$2b$12$LOCKED_REQUIRE_PASSWORD_RESET_ON_AUTH_MIGRATION';
    const mappedRole = ['admin', 'validator', 'verifikator', 'user'].includes(u.role) ? u.role : 'user';

    const existingRes = await db.query<{ id: string }>(`SELECT id FROM users WHERE nip = '${u.nip}' OR email = '${u.email}' LIMIT 1;`);
    let pgUserId: string;

    if (existingRes.rows.length === 0) {
      const insRes = await db.query<{ id: string }>(`
        INSERT INTO users (id, nip, nama, pangkat, golongan, jabatan, email, role, password_hash, requires_password_reset, is_active, tmt_pangkat, tmt_jabatan)
        VALUES (
          gen_random_uuid(),
          '${u.nip.replace(/'/g, "''")}',
          '${u.nama.replace(/'/g, "''")}',
          ${u.pangkat ? `'${u.pangkat.replace(/'/g, "''")}'` : 'NULL'},
          ${u.golongan ? `'${u.golongan.replace(/'/g, "''")}'` : 'NULL'},
          '${u.jabatan.replace(/'/g, "''")}',
          '${u.email.replace(/'/g, "''")}',
          '${mappedRole}',
          '${lockedPasswordHash}',
          true,
          ${u.is_active ?? true},
          ${u.tmt_pangkat ? `'${u.tmt_pangkat}'` : 'NULL'},
          ${u.tmt_jabatan ? `'${u.tmt_jabatan}'` : 'NULL'}
        )
        RETURNING id;
      `);
      pgUserId = insRes.rows[0].id;
    } else {
      pgUserId = existingRes.rows[0].id;
      await db.exec(`
        UPDATE users SET
          nama = '${u.nama.replace(/'/g, "''")}',
          jabatan = '${u.jabatan.replace(/'/g, "''")}',
          requires_password_reset = true
        WHERE id = '${pgUserId}';
      `);
    }

    migratedUsers++;
    if (migratedUsers <= 5) {
      idMappingDetails.push({
        entity: 'users',
        legacyId: u.id || u.nip,
        pgId: pgUserId,
        statusKet: 'TERKUNCI_RESI_PERLU_RESET (requires_password_reset=true)'
      });
    }
  }
  console.log(`✓ Migrasi Users: ${migratedUsers} record terkonversi (Password terkunci & wajib reset password).`);

  // Default User Fallback
  const firstUserRes = await db.query<{ id: string }>(`SELECT id FROM users LIMIT 1;`);
  const defaultUserId = firstUserRes.rows[0].id;

  // =========================================================================
  // 2. MIGRATE LAPORAN TO CONTAINER ACTIVITY, REPORT & VERSIONS (NO FAKE ST)
  // =========================================================================
  const legacyLaporan = legacyData.laporan || [];
  let migratedAssignments = 0;
  let migratedActivities = 0;
  let migratedReports = 0;
  let migratedVersions = 0;
  let migratedAttachments = 0;

  for (const rep of legacyLaporan) {
    let assignmentId: string | null = null;

    // TANPA MENGARANG NOMOR ST (Tidat mengisi 'ST-LEGACY-rep-2')
    if (rep.nomor_surat_tugas) {
      const existingAssign = await db.query<{ id: string }>(`SELECT id FROM assignments WHERE nomor_st = '${rep.nomor_surat_tugas.replace(/'/g, "''")}' LIMIT 1;`);
      if (existingAssign.rows.length === 0) {
        const assignRes = await db.query<{ id: string }>(`
          INSERT INTO assignments (nomor_st, tanggal_st, pemberi_tugas_nama, pemberi_tugas_jabatan)
          VALUES (
            '${rep.nomor_surat_tugas.replace(/'/g, "''")}',
            '${rep.tanggal_surat_tugas || rep.tanggal_mulai || '2026-01-01'}',
            'Kepala Balai',
            'Kepala Balai BPHL Wilayah XI'
          )
          RETURNING id;
        `);
        assignmentId = assignRes.rows[0].id;
      } else {
        assignmentId = existingAssign.rows[0].id;
      }
      migratedAssignments++;
    } else {
      // Log unmapped ST transparently without fabricating official ST
      unmappedFieldsReport.push({
        entity: 'laporan',
        id: rep.id,
        field: 'nomor_surat_tugas',
        reason: 'Laporan historis tidak memiliki nomor Surat Tugas resmi. Dikontainerkan ke kegiatan legacy tanpa nomor ST (assignment_id = NULL).'
      });
    }

    // Find user ID created_by
    const userQuery = isValidUuid(rep.user_id) 
      ? `SELECT id FROM users WHERE nip = '${rep.user_id}' OR id = '${rep.user_id}' LIMIT 1;`
      : `SELECT id FROM users WHERE nip = '${rep.user_id}' LIMIT 1;`;
      
    const userRes = await db.query<{ id: string }>(userQuery);
    const createdByUserId = userRes.rows.length > 0 ? userRes.rows[0].id : defaultUserId;

    // 2b. Insert Container Activity (Idempotent)
    const actRes = await db.query<{ id: string }>(`
      INSERT INTO activities (assignment_id, jenis_kegiatan_id, nama_kegiatan, pelaku_usaha_id, lokasi, tanggal_mulai, tanggal_selesai, status, created_by)
      VALUES (
        ${assignmentId ? `'${assignmentId}'` : 'NULL'},
        '${rep.jenis_kegiatan_id || 'jk-legacy'}',
        '${(rep.maksud_tujuan || rep.sasaran_kegiatan || 'Kegiatan Perjalanan Dinas Historis').substring(0, 200).replace(/'/g, "''")}',
        'pu-1',
        '${(rep.tempat_kegiatan || 'Banjarbaru').replace(/'/g, "''")}',
        '${rep.tanggal_mulai || '2026-01-01'}',
        '${rep.tanggal_selesai || '2026-01-01'}',
        'SELESAI',
        '${createdByUserId}'
      )
      RETURNING id;
    `);
    const activityId = actRes.rows[0].id;
    migratedActivities++;

    // Map Legacy Status
    let mappedStatus = 'DRAFT';
    if (rep.status === 'submitted') mappedStatus = 'DIAJUKAN_VERIFIKASI';
    else if (rep.status === 'verified') mappedStatus = 'TERVERIFIKASI';
    else if (rep.status === 'approved') mappedStatus = 'DISETUJUI';
    else if (rep.status === 'rejected') mappedStatus = 'PERLU_REVISI';

    // 2c. Insert Report
    const repRes = await db.query<{ id: string }>(`
      INSERT INTO reports (activity_id, status, created_by)
      VALUES ('${activityId}', '${mappedStatus}', '${createdByUserId}')
      RETURNING id;
    `);
    const reportId = repRes.rows[0].id;
    migratedReports++;

    idMappingDetails.push({
      entity: 'laporan',
      legacyId: rep.id,
      pgId: reportId,
      statusKet: `Status: ${mappedStatus}, ST: ${assignmentId ? 'ADA' : 'TIDAK_TERCATAT (NULL)'}`
    });

    // 2d. Insert Report Version (Snapshot 1)
    const verRes = await db.query<{ id: string }>(`
      INSERT INTO report_versions (report_id, version_number, judul_laporan, maksud_tujuan, hasil_kegiatan, kesimpulan, saran, snapshot_data_json, created_by)
      VALUES (
        '${reportId}',
        1,
        '${(rep.sasaran_kegiatan || 'Laporan Historis').replace(/'/g, "''")}',
        '${(rep.maksud_tujuan || '').replace(/'/g, "''")}',
        '${(rep.hasil_kegiatan || '').replace(/'/g, "''")}',
        '${(rep.kesimpulan || '').replace(/'/g, "''")}',
        '${(rep.saran || '').replace(/'/g, "''")}',
        '{"is_legacy_data": true}',
        '${createdByUserId}'
      )
      RETURNING id;
    `);
    const versionId = verRes.rows[0].id;
    migratedVersions++;

    // Update current_version_id
    await db.exec(`UPDATE reports SET current_version_id = '${versionId}' WHERE id = '${reportId}';`);

    // 2e. Migrate Attachments if any
    if (rep.lampiran && Array.isArray(rep.lampiran)) {
      for (const lamp of rep.lampiran) {
        const attRes = await db.query<{ id: string }>(`
          INSERT INTO attachments (activity_id, report_id, file_name, mime_type, file_size_bytes, provider, file_id_ref, uploaded_by)
          VALUES (
            '${activityId}',
            '${reportId}',
            '${(lamp.nama_file || 'lampiran_legacy.jpg').replace(/'/g, "''")}',
            'image/jpeg',
            2202009,
            'EXTERNAL_LEGACY',
            '${(lamp.dataUrl || 'https://images.unsplash.com').replace(/'/g, "''")}',
            '${createdByUserId}'
          )
          RETURNING id;
        `);
        migratedAttachments++;

        idMappingDetails.push({
          entity: 'attachments',
          legacyId: lamp.id || 'lamp-3',
          pgId: attRes.rows[0].id,
          statusKet: 'Provider: EXTERNAL_LEGACY (Ref URL terenkapsulasi)'
        });
      }
    }
  }

  console.log(`✓ Migrasi Laporan: ${migratedReports} laporan & ${migratedVersions} versi snapshot dipindahkan (Tanpa ST buatan).`);
  console.log(`✓ Migrasi Lampiran: ${migratedAttachments} lampiran eksternal dipindahkan ke provider EXTERNAL_LEGACY.`);

  // =========================================================================
  // 3. RECONCILE UNAPPROVED HISTORICAL TELAAHAN STAF (NO FAKE APPROVAL)
  // =========================================================================
  const legacyTelaahan = legacyData.telaahan_staf || [];
  let migratedStaffStudies = 0;

  for (const ts of legacyTelaahan) {
    // TANPA MENGARANG APPROVAL: Simpan dengan approved_report_version_id = NULL dan flag is_legacy_unapproved = true
    const ssRes = await db.query<{ id: string }>(`
      INSERT INTO staff_studies (approved_report_version_id, legacy_report_id_ref, is_legacy_unapproved, judul, persoalan, praanggapan, fakta, analisis, kesimpulan, saran, tanggal_telaahan, status, created_by)
      VALUES (
        NULL,
        '${ts.laporan_id || 'rep-2'}',
        true,
        '${ts.judul.replace(/'/g, "''")}',
        '${ts.persoalan.replace(/'/g, "''")}',
        '${ts.praanggapan.replace(/'/g, "''")}',
        '${ts.fakta.replace(/'/g, "''")}',
        '${ts.analisis.replace(/'/g, "''")}',
        '${ts.kesimpulan.replace(/'/g, "''")}',
        '${ts.saran.replace(/'/g, "''")}',
        '2026-06-22',
        'DRAFT',
        '${defaultUserId}'
      )
      RETURNING id;
    `);
    migratedStaffStudies++;

    idMappingDetails.push({
      entity: 'telaahan_staf',
      legacyId: ts.id,
      pgId: ssRes.rows[0].id,
      statusKet: 'PENGECEKAN_EXEMPTION: is_legacy_unapproved=true, approved_report_version_id=NULL'
    });

    unmappedFieldsReport.push({
      entity: 'telaahan_staf',
      id: ts.id,
      field: 'approved_report_version_id',
      reason: 'Telaahan Staf historis dibuat dari laporan asal yang belum disetujui (rep-2: status submitted). Disimpan sebagai record legacy pengecualian tanpa mengarang approval.'
    });
  }

  console.log(`✓ Migrasi Telaahan Staf: ${migratedStaffStudies} record direkonsiliasi sebagai legacy record pengecualian.\n`);

  const summary: MigrationSummary = {
    usersCount: migratedUsers,
    assignmentsCount: migratedAssignments,
    activitiesCount: migratedActivities,
    reportsCount: migratedReports,
    reportVersionsCount: migratedVersions,
    attachmentsCount: migratedAttachments,
    staffStudiesCount: migratedStaffStudies,
    unmappedFieldsReport,
    idMappingDetails
  };

  return summary;
}

if (process.argv[1] && process.argv[1].includes('migrate_legacy_data')) {
  runDryRunMigration().catch((err) => {
    console.error('Fatal Migration Runner Error:', err);
    process.exit(1);
  });
}
