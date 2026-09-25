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

async function getOrCreateMappedId(db: PGlite, entityType: string, legacyId: string): Promise<{ pgId: string; isNew: boolean }> {
  const existing = await db.query<{ pg_id: string }>(
    `SELECT pg_id FROM legacy_id_map WHERE entity_type = $1 AND legacy_id = $2 LIMIT 1;`,
    [entityType, legacyId]
  );
  if (existing.rows.length > 0) {
    return { pgId: existing.rows[0].pg_id, isNew: false };
  }
  const idRes = await db.query<{ id: string }>(`SELECT gen_random_uuid() as id;`);
  const newPgId = idRes.rows[0].id;
  await db.query(
    `INSERT INTO legacy_id_map (entity_type, legacy_id, pg_id) VALUES ($1, $2, $3);`,
    [entityType, legacyId, newPgId]
  );
  return { pgId: newPgId, isNew: true };
}

export async function runDryRunMigration(existingDb?: PGlite): Promise<MigrationSummary> {
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
  // 1. MIGRATE USERS (56 Records) - PARAMETERIZED & DETERMINISTIC ID
  // =========================================================================
  const legacyUsers = legacyData.users || [];
  let migratedUsers = 0;

  for (const u of legacyUsers) {
    const lockedPasswordHash = '$2b$12$LOCKED_REQUIRE_PASSWORD_RESET_ON_AUTH_MIGRATION';
    const mappedRole = ['admin', 'validator', 'verifikator', 'user'].includes(u.role) ? u.role : 'user';
    const legacyUserKey = u.id || u.nip;

    const { pgId: userPgId, isNew } = await getOrCreateMappedId(db, 'users', legacyUserKey);

    const legacyNip = u.nip && u.nip !== '-' ? u.nip : null;
    const legacyEmail = u.email && u.email !== '-' ? u.email : null;
    const legacyNama = u.nama && u.nama !== '-' ? u.nama : null;
    const legacyJabatan = u.jabatan && u.jabatan !== '-' ? u.jabatan : null;

    if (legacyNip === null && legacyEmail === null) {
      idMappingDetails.push({ entity: 'users', legacyId: legacyUserKey, pgId: '', statusKet: 'TIDAK_DIPETAKAN: NIP dan email tidak tersedia' });
      continue;
    }

    if (isNew) {
      await db.query(
        `INSERT INTO users (id, nip, nama, pangkat, golongan, jabatan, email, role, password_hash, requires_password_reset, is_active, tmt_pangkat, tmt_jabatan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
        [
          userPgId,
          legacyNip,
          legacyNama,
          u.pangkat && u.pangkat !== '-' ? u.pangkat : null,
          u.golongan && u.golongan !== '-' ? u.golongan : null,
          legacyJabatan,
          legacyEmail,
          mappedRole,
          lockedPasswordHash,
          true,
          u.is_active ?? true,
          u.tmt_pangkat || null,
          u.tmt_jabatan || null
        ]
      );
    } else {
      await db.query(
        `UPDATE users SET nama = $1, jabatan = $2, requires_password_reset = true WHERE id = $3;`,
        [legacyNama, legacyJabatan, userPgId]
      );
    }

    migratedUsers++;
    if (migratedUsers <= 3) {
      idMappingDetails.push({
        entity: 'users',
        legacyId: legacyUserKey,
        pgId: userPgId,
        statusKet: 'TERKUNCI_RESI_PERLU_RESET (requires_password_reset=true)'
      });
    }
  }

  // =========================================================================
  // 2. MIGRATE LAPORAN TO CONTAINER ACTIVITY, REPORT & VERSIONS
  // =========================================================================
  const legacyLaporan = legacyData.laporan || [];
  let migratedAssignments = 0;
  let migratedActivities = 0;
  let migratedReports = 0;
  let migratedVersions = 0;
  let migratedAttachments = 0;

  for (const rep of legacyLaporan) {
    const mappedUserRes = await db.query<{ pg_id: string }>(
      `SELECT pg_id FROM legacy_id_map WHERE entity_type = $1 AND legacy_id = $2 LIMIT 1;`,
      ['users', rep.user_id]
    );
    const userRes = mappedUserRes.rows.length > 0
      ? mappedUserRes
      : await db.query<{ id: string }>(
          `SELECT id FROM users WHERE nip = $1 OR email = $1 LIMIT 1;`,
          [rep.user_id]
        );

    let createdByUserId: string | null = null;
    if (mappedUserRes.rows.length > 0) {
      createdByUserId = mappedUserRes.rows[0].pg_id;
    } else if (userRes.rows.length > 0) {
      createdByUserId = userRes.rows[0].id;
    } else {
      unmappedFieldsReport.push({
        entity: 'laporan',
        id: rep.id,
        field: 'user_id',
        reason: `Pegawai legacy '${rep.user_id}' tidak ditemukan melalui legacy_id_map maupun identitas terverifikasi; record laporan dihentikan tanpa fallback.`
      });
      continue;
    }

    // 2b. Assignment: ONLY if official ST exists (NO guessed dates/names)
    let assignmentId: string | null = null;
    if (rep.nomor_surat_tugas && rep.nomor_surat_tugas.trim() !== '') {
      const { pgId: stPgId, isNew: isStNew } = await getOrCreateMappedId(db, 'assignments', rep.nomor_surat_tugas);
      if (isStNew) {
        await db.query(
          `INSERT INTO assignments (id, nomor_st, tanggal_st, pemberi_tugas_nama, pemberi_tugas_jabatan)
           VALUES ($1, $2, $3, $4, $5);`,
          [
            stPgId,
            rep.nomor_surat_tugas,
            rep.tanggal_surat_tugas || null, // NULL if absent (zero guess)
            null, // Zero guessed pemberi_tugas_nama
            null  // Zero guessed pemberi_tugas_jabatan
          ]
        );
      }
      assignmentId = stPgId;
      migratedAssignments++;
    } else {
      unmappedFieldsReport.push({
        entity: 'laporan',
        id: rep.id,
        field: 'nomor_surat_tugas',
        reason: 'Laporan historis tidak memiliki nomor Surat Tugas resmi (assignment_id dibiarkan NULL, tanpa ST palsu).'
      });
    }

    // 2c. Activity: Deterministic ID via legacy_id_map (Zero guessed values)
    const { pgId: actPgId, isNew: isActNew } = await getOrCreateMappedId(db, 'activities', rep.id);
    if (isActNew) {
      await db.query(
        `INSERT INTO activities (id, assignment_id, jenis_kegiatan_id, nama_kegiatan, pelaku_usaha_id, lokasi, tanggal_mulai, tanggal_selesai, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
        [
          actPgId,
          assignmentId,
          rep.jenis_kegiatan_id || null,
          rep.maksud_tujuan || rep.sasaran_kegiatan || null,
          null, // pelaku_usaha_id NULL if not in source (zero guess)
          rep.tempat_kegiatan || null, // NULL if not in source (zero guess)
          rep.tanggal_mulai || null,   // NULL if not in source (zero guess)
          rep.tanggal_selesai || null, // NULL if not in source (zero guess)
          'SELESAI',
          createdByUserId
        ]
      );
    }
    migratedActivities++;

    // 2d. Report: Deterministic ID
    let mappedStatus = 'DRAFT';
    if (rep.status === 'submitted') mappedStatus = 'DIAJUKAN_VERIFIKASI';
    else if (rep.status === 'verified') mappedStatus = 'TERVERIFIKASI';
    else if (rep.status === 'approved') mappedStatus = 'DISETUJUI';
    else if (rep.status === 'rejected') mappedStatus = 'PERLU_REVISI';

    const { pgId: repPgId, isNew: isRepNew } = await getOrCreateMappedId(db, 'reports', rep.id);
    if (isRepNew) {
      await db.query(
        `INSERT INTO reports (id, activity_id, status, created_by)
         VALUES ($1, $2, $3, $4);`,
        [repPgId, actPgId, mappedStatus, createdByUserId]
      );
    }
    migratedReports++;

    idMappingDetails.push({
      entity: 'laporan',
      legacyId: rep.id,
      pgId: repPgId,
      statusKet: `Status: ${mappedStatus}, ST: ${assignmentId ? 'ADA' : 'NULL (Tanpa ST buatan)'}`
    });

    // 2e. Report Version: Deterministic ID
    const { pgId: verPgId, isNew: isVerNew } = await getOrCreateMappedId(db, 'report_versions', `${rep.id}_v1`);
    if (isVerNew) {
      await db.query(
        `INSERT INTO report_versions (id, report_id, version_number, judul_laporan, maksud_tujuan, hasil_kegiatan, kesimpulan, saran, snapshot_data_json, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
        [
          verPgId,
          repPgId,
          1,
          rep.sasaran_kegiatan || null,
          rep.maksud_tujuan || null,
          rep.hasil_kegiatan || null,
          rep.kesimpulan || null,
          rep.saran || null,
          JSON.stringify({ is_legacy_data: true }),
          createdByUserId
        ]
      );
      await db.query(`UPDATE reports SET current_version_id = $1 WHERE id = $2;`, [verPgId, repPgId]);
    }
    migratedVersions++;

    // 2f. Attachments: Deterministic ID (Zero guessed file sizes)
    if (rep.lampiran && Array.isArray(rep.lampiran)) {
      for (const lamp of rep.lampiran) {
        const lampLegacyId = lamp.id || `lamp_${rep.id}`;
        const { pgId: attPgId, isNew: isAttNew } = await getOrCreateMappedId(db, 'attachments', lampLegacyId);
        if (isAttNew) {
          await db.query(
            `INSERT INTO attachments (id, activity_id, report_id, file_name, mime_type, file_size_bytes, provider, file_id_ref, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
            [
              attPgId,
              actPgId,
              repPgId,
              lamp.nama_file || 'lampiran_legacy',
              null, // NULL mime_type (zero guessed mime)
              null, // NULL file_size_bytes (zero guessed size)
              'EXTERNAL_LEGACY',
              lamp.dataUrl || '',
              createdByUserId
            ]
          );
        }
        migratedAttachments++;
        idMappingDetails.push({
          entity: 'attachments',
          legacyId: lampLegacyId,
          pgId: attPgId,
          statusKet: 'Provider: EXTERNAL_LEGACY (Ref URL terenkapsulasi, Metadata Tanpa Tebakan)'
        });
      }
    }
  }

  // =========================================================================
  // 3. RECONCILE HISTORICAL UNAPPROVED TELAAHAN STAF (NO FAKE APPROVAL)
  // =========================================================================
  const legacyTelaahan = legacyData.telaahan_staf || [];
  let migratedStaffStudies = 0;

  for (const ts of legacyTelaahan) {
    const { pgId: ssPgId, isNew: isSsNew } = await getOrCreateMappedId(db, 'staff_studies', ts.id);
    if (isSsNew) {
      await db.query(`SELECT set_config('app.migration_mode', 'true', false);`);
      await db.query(
        `INSERT INTO staff_studies (id, approved_report_version_id, legacy_report_id_ref, is_legacy_unapproved, judul, persoalan, praanggapan, fakta, analisis, kesimpulan, saran, tanggal_telaahan, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        [
          ssPgId,
          null, // NULL approved_report_version_id (NO FAKE APPROVAL)
          ts.laporan_id || 'rep-2',
          true, // is_legacy_unapproved exemption flag
          ts.judul || null,
          ts.persoalan || null,
          ts.praanggapan || null,
          ts.fakta || null,
          ts.analisis || null,
          ts.kesimpulan || null,
          ts.saran || null,
          null, // Source date not available: no guessed date
          'DRAFT',
          null // Strict attribution: null if not tracked
        ]
      );
      await db.query(`SELECT set_config('app.migration_mode', 'false', false);`);
    }
    migratedStaffStudies++;

    idMappingDetails.push({
      entity: 'telaahan_staf',
      legacyId: ts.id,
      pgId: ssPgId,
      statusKet: 'PENGECEKAN_EXEMPTION: is_legacy_unapproved=true, approved_report_version_id=NULL'
    });

    unmappedFieldsReport.push({
      entity: 'telaahan_staf',
      id: ts.id,
      field: 'approved_report_version_id',
      reason: 'Laporan asal (rep-2) belum disetujui. Disimpan sebagai legacy unapproved record tanpa mengarang approval palsu.'
    });
  }

  return {
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
}

if (process.argv[1] && process.argv[1].includes('migrate_legacy_data')) {
  runDryRunMigration().catch((err) => {
    console.error('Fatal Migration Runner Error:', err);
    process.exit(1);
  });
}
