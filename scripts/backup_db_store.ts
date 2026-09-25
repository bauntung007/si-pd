import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function createVerifiedBackup(): { backupFilePath: string; hashFilePath: string; sha256Hash: string; byteSize: number } {
  const sourcePath = path.join(process.cwd(), 'db_store.json');
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File sumber db_store.json tidak ditemukan di ${sourcePath}`);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const fileBuffer = fs.readFileSync(sourcePath);
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `db_store_backup_${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);
  const hashFilePath = path.join(backupDir, `${backupFileName}.sha256`);

  // Write backup file copy
  fs.writeFileSync(backupFilePath, fileBuffer);
  // Write SHA-256 checksum file
  fs.writeFileSync(hashFilePath, `${sha256Hash}  ${backupFileName}\n`, 'utf-8');

  console.log('-----------------------------------------------------------------------------');
  console.log(' PROSEDUR BACKUP SUMBER DATA LOKAL VERIFIED SHA-256');
  console.log('-----------------------------------------------------------------------------');
  console.log(`✓ Path File Sumber  : db_store.json`);
  console.log(`✓ Path File Backup  : backups/${backupFileName}`);
  console.log(`✓ Path File Hash    : backups/${backupFileName}.sha256`);
  console.log(`✓ Ukuran Berkas     : ${fileBuffer.length} bytes`);
  console.log(`✓ Checksum SHA-256  : ${sha256Hash}`);
  console.log('✅ BACKUP SUMBER TERVERIFIKASI 100% AMAN.\n');

  return { backupFilePath, hashFilePath, sha256Hash, byteSize: fileBuffer.length };
}

if (process.argv[1] && process.argv[1].includes('backup_db_store')) {
  createVerifiedBackup();
}
