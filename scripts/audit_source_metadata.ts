import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function auditSourceMetadata() {
  const filePath = path.join(process.cwd(), 'db_store.json');
  const stats = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const data = JSON.parse(fileBuffer.toString('utf-8'));

  const usersCount = Array.isArray(data.users) ? data.users.length : 0;
  const jenisKegiatanCount = Array.isArray(data.jenis_kegiatan) ? data.jenis_kegiatan.length : 0;
  const pelakuUsahaCount = Array.isArray(data.pelaku_usaha) ? data.pelaku_usaha.length : 0;
  const laporanCount = Array.isArray(data.laporan) ? data.laporan.length : 0;
  const telaahanCount = Array.isArray(data.telaahan_staf) ? data.telaahan_staf.length : 0;

  console.log('=============================================================================');
  console.log('   AUDIT TELEMETRI & VERIFIKASI SUBSTANSI FILE SUMBER db_store.json');
  console.log('=============================================================================');
  console.log(`✓ Waktu Pembacaan File : ${new Date().toISOString()}`);
  console.log(`✓ Path Berkas Sumber   : ${filePath}`);
  console.log(`✓ Ukuran File Berkas   : ${stats.size} bytes`);
  console.log(`✓ Waktu Modifikasi     : ${stats.mtime.toISOString()}`);
  console.log(`✓ SHA-256 Checksum     : ${sha256Hash}`);
  console.log('-----------------------------------------------------------------------------');
  console.log(`✓ Inventaris Actual Array Record di File db_store.json:`);
  console.log(`   - users          : ${usersCount} record`);
  console.log(`   - jenis_kegiatan : ${jenisKegiatanCount} record`);
  console.log(`   - pelaku_usaha   : ${pelakuUsahaCount} record`);
  console.log(`   - laporan        : ${laporanCount} record`);
  console.log(`   - telaahan_staf  : ${telaahanCount} record`);
  console.log('=============================================================================\n');

  return {
    readTime: new Date().toISOString(),
    fileSize: stats.size,
    sha256Hash,
    usersCount,
    jenisKegiatanCount,
    pelakuUsahaCount,
    laporanCount,
    telaahanCount
  };
}

if (process.argv[1] && process.argv[1].includes('audit_source_metadata')) {
  auditSourceMetadata();
}
