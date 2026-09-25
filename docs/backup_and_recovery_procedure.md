# Prosedur Backup & Pemulihan Data SI-PD BPHL XI (Tahap 2)

**Versi:** 1.0  
**Tanggal:** 25 September 2026  
**Status:** Dokumen Prosedur Operasional Terverifikasi  

---

## 1. Prosedur Pembuatan Backup Terverifikasi (Pre-Cutover Backup)

1. **Jendela Pemeliharaan (Maintenance Window):**
   - Sebelum proses migrasi atau *cutover* database dilakukan, sistem aplikasi dihentikan sejenak dari aktivitas penulisan (*read-only mode*).
2. **Eksekusi Script Backup:**
   - Jalankan script backup otomatis:
     ```powershell
     npx tsx scripts/backup_db_store.ts
     ```
3. **Hasil Keluaran Backup:**
   - File JSON Backup: `backups/db_store_backup_<timestamp>.json`
   - File Hash SHA-256: `backups/db_store_backup_<timestamp>.json.sha256`
4. **Verifikasi Integritas SHA-256:**
   - Jalankan verifikasi checksum hash SHA-256 untuk memastikan berkas backup tidak mengalami kerusakan byte:
     ```powershell
     Get-FileHash -Algorithm SHA256 backups/db_store_backup_<timestamp>.json
     ```
   - Bandingkan nilai hash yang dihasilkan dengan isi file `.sha256`.

---

## 2. Prosedur Pemulihan Data (Data Recovery & Rollback)

Jika terjadi insiden kritis atau keharusan membatalkan migrasi/cutover:

1. **Pengembalian Sumber Persistence:**
   - Salin file backup terverifikasi `backups/db_store_backup_<timestamp>.json` kembali ke lokasi utama `db_store.json`.
2. **Pencatatan Delta Log (Post-Backup Write Reconciliation):**
   - Apabila terdapat transaksi tulis yang terjadi selama rentang waktu antara pembuatan backup dan penghentian sistem, baca file *write-ahead delta log* `backups/delta_log_<timestamp>.json` dan gabungkan (*merge*) record transaksi baru secara inkremental.
3. **Keamanan Autentikasi Saat Rollback:**
   - Prosedur rollback **TIDAK BUKAN MELEMAHKAN KEAMANAN** (tidak membalikkan sistem ke API Key publik yang terbuka). Sistem tetap menggunakan middleware autentikasi terenkripsi yang aman.

---

## 3. Aturan Kerahasiaan & Sanitasi Log (Zero Plaintext Policy)

1. **Dilarang Mencetak Password Plaintext:** Seluruh output log migrasi dan backup wajib menyamarkan atau mengecualikan field `password` / `password_hash`.
2. **Dilarang Mencetak Connection String / Secret Key:** Kredensial database, JWT secret, atau API Key tidak boleh dituliskan dalam laporan terminal, commit, maupun dokumentasi terpublikasi.
3. **Pemberlakuan Hashing Bcrypt:** Seluruh password akun pengguna lama yang dipindahkan ke PostgreSQL dikonversi ke format hash bcrypt (cost factor 12).
