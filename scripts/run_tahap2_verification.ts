import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import { auditSourceMetadata } from './audit_source_metadata.js';
import { createVerifiedBackup } from './backup_db_store.js';
import { runPostgresStagingTests } from './run_pg_staging_tests.js';
import { runDryRunMigration } from './migrate_legacy_data.js';

async function executeTahap2CompleteSuite() {
  console.log('=============================================================================');
  console.log('       EXEKUSI LENGKAP TAHAP 2 (REVISED: BUKTI IDEMPOTENSI & AUDIT TELEMETRI)');
  console.log('=============================================================================\n');

  // Step 1: Audit Telemetry
  console.log('>>> STEP 1: AUDIT TELEMETRI & INTEGRITAS METADATA BERKAS SUMBER...');
  const auditMeta = auditSourceMetadata();

  // Step 2: Create verified SHA-256 backup
  console.log('\n>>> STEP 2: PROSEDUR BACKUP SUMBER DATA VERIFIED SHA-256...');
  const backupResult = createVerifiedBackup();

  console.log('\n>>> STEP 3: PENGUJIAN SKEMA & CONSTRAINT DATABASE POSTGRESQL STAGING...');
  await runPostgresStagingTests();

  console.log('\n>>> STEP 4: MENYIAPKAN DATABASE MIGRASI STAGING BERSIH...');
  const migrationDb = new PGlite();
  const ddl = fs.readFileSync(path.join(process.cwd(), 'migrations', '001_initial_schema.sql'), 'utf8');
  await migrationDb.exec(ddl);

  const tableNames = ['legacy_id_map', 'users', 'assignments', 'activities', 'reports', 'report_versions', 'attachments', 'staff_studies'];
  const getCounts = async () => {
    const result: Record<string, number> = {};
    for (const table of tableNames) {
      const rows = await migrationDb.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${table};`);
      result[table] = Number(rows.rows[0].count);
    }
    return result;
  };
  const getMappings = async () => (await migrationDb.query(
    'SELECT entity_type, legacy_id, pg_id::text FROM legacy_id_map ORDER BY entity_type, legacy_id;'
  )).rows;

  console.log('>>> STEP 4A: DRY-RUN MIGRASI RUN #1...');
  const migrationRun1 = await runDryRunMigration(migrationDb);
  const countsRun1 = await getCounts();
  const mappingsRun1 = await getMappings();

  console.log('>>> STEP 4B: DRY-RUN MIGRASI RUN #2 PADA DATABASE YANG SAMA...');
  const migrationRun2 = await runDryRunMigration(migrationDb);
  const countsRun2 = await getCounts();
  const mappingsRun2 = await getMappings();

  console.table(tableNames.map((table) => ({
    table,
    run1_count: countsRun1[table],
    run2_count: countsRun2[table],
    difference: countsRun2[table] - countsRun1[table]
  })));
  console.log('MAPPING_RUN_1', JSON.stringify(mappingsRun1));
  console.log('MAPPING_RUN_2', JSON.stringify(mappingsRun2));
  const countFailures = tableNames.filter((table) => countsRun1[table] !== countsRun2[table]);
  const mappingFailure = JSON.stringify(mappingsRun1) !== JSON.stringify(mappingsRun2);
  if (countFailures.length || mappingFailure) {
    console.error('IDEMPOTENCY_FAILED', { countFailures, mappingFailure });
    process.exitCode = 1;
    return;
  }
  console.log('IDEMPOTENCY_PASSED: COUNT(*) dan pemetaan legacy_id tidak berubah.');

  console.log('\n-----------------------------------------------------------------------------');
  console.log(' TABEL PEMETAAN ID-BY-ID & FIELD PENTING (PEMBUKTIAN TRANSFORMATION PARITY)');
  console.log('-----------------------------------------------------------------------------');
  console.table(migrationRun1.idMappingDetails);

  console.log('\n-----------------------------------------------------------------------------');
  console.log(' LAPORAN FIELD HAKIKI YANG TIDAK DAPAT DIPETAKAN (UNMAPPED FIELDS REPORT)');
  console.log('-----------------------------------------------------------------------------');
  console.table(migrationRun1.unmappedFieldsReport);

  console.log('\n=============================================================================');
  console.log(' 🎉 EXEKUSI REVISI TAHAP 2 SELESAI 100% SUKSES!');
  console.log(` ✓ Waktu Pembacaan: ${auditMeta.readTime}`);
  console.log(` ✓ File Size      : ${auditMeta.fileSize} bytes`);
  console.log(` ✓ SHA-256 Hash   : ${auditMeta.sha256Hash}`);
  console.log('=============================================================================\n');
}

executeTahap2CompleteSuite().catch((err) => {
  console.error('Fatal Suite Execution Error:', err);
  process.exit(1);
});
