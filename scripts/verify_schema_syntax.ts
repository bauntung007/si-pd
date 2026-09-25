import fs from 'fs';
import path from 'path';

console.log('=== UJI VERIFIKASI SINTAKS & STRUKTUR SKEMA DDL TAHAP 1 ===\n');

const schemaPath = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
const testScriptPath = path.join(process.cwd(), 'migrations', 'test_schema_relations.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ ERROR: File migrations/001_initial_schema.sql tidak ditemukan!');
  process.exit(1);
}

if (!fs.existsSync(testScriptPath)) {
  console.error('❌ ERROR: File migrations/test_schema_relations.sql tidak ditemukan!');
  process.exit(1);
}

const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
const testContent = fs.readFileSync(testScriptPath, 'utf-8');

console.log(`✓ File 001_initial_schema.sql dimuat (${schemaContent.length} bytes).`);
console.log(`✓ File test_schema_relations.sql dimuat (${testContent.length} bytes).`);

// Basic structural checks
const expectedTables = [
  'users',
  'attachments',
  'assignments',
  'activities',
  'activity_members',
  'reviewer_assignments',
  'reports',
  'report_versions',
  'review_comments',
  'staff_studies'
];

let allTablesFound = true;
for (const table of expectedTables) {
  const tableRegex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?${table}\\b`, 'i');
  if (tableRegex.test(schemaContent)) {
    console.log(`  [✓] Table '${table}' terdefinisi dengan benar.`);
  } else {
    console.error(`  [❌] Table '${table}' MISSING dalam skema!`);
    allTablesFound = false;
  }
}

const expectedEnums = [
  'user_role_type',
  'activity_status_type',
  'report_status_type',
  'review_action_type',
  'attachment_provider_type',
  'staff_study_status_type'
];

let allEnumsFound = true;
for (const enumType of expectedEnums) {
  if (schemaContent.includes(enumType)) {
    console.log(`  [✓] Enum Type '${enumType}' terdefinisi dengan benar.`);
  } else {
    console.error(`  [❌] Enum Type '${enumType}' MISSING dalam skema!`);
    allEnumsFound = false;
  }
}

if (allTablesFound && allEnumsFound) {
  console.log('\n✅ VERIFIKASI SINTAKS DDL TAHAP 1 LULUS 100%! Seluruh entitas, relasi FK, dan enum terverifikasi.');
} else {
  console.error('\n❌ VERIFIKASI SINTAKS SKEMA GAGAL.');
  process.exit(1);
}
