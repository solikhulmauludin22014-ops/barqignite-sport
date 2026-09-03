-- ============================================================
-- Migrasi: Penyederhanaan alur pembayaran manual + kwitansi
-- Tanggal: 2026-09-03
-- ============================================================

-- 1. Tambah kolom nomor_kwitansi ke tabel pembayaran_spp
ALTER TABLE pembayaran_spp 
  ADD COLUMN IF NOT EXISTS nomor_kwitansi TEXT,
  ADD COLUMN IF NOT EXISTS catatan TEXT;

-- 2. Tambah kolom counter nomor kwitansi ke tabel pengaturan_pembayaran
ALTER TABLE pengaturan_pembayaran
  ADD COLUMN IF NOT EXISTS nomor_kwitansi_terakhir INTEGER DEFAULT 0;

-- 3. Pastikan baris SETTING-001 ada (upsert) agar counter bisa digunakan
INSERT INTO pengaturan_pembayaran (id, tanggal_jatuh_tempo, catatan_keterlambatan, nomor_kwitansi_terakhir)
VALUES ('SETTING-001', 'Tanggal 10 setiap bulan', 'Keterlambatan pembayaran mempengaruhi status keaktifan anggota', 0)
ON CONFLICT (id) DO UPDATE SET
  nomor_kwitansi_terakhir = COALESCE(pengaturan_pembayaran.nomor_kwitansi_terakhir, 0);

-- 4. (Opsional) Buat index untuk pencarian nomor_kwitansi
CREATE INDEX IF NOT EXISTS idx_pembayaran_spp_nomor_kwitansi 
  ON pembayaran_spp (nomor_kwitansi);

-- 5. (Opsional) Backfill: data historis yang sudah Lunas tapi belum punya nomor_kwitansi
-- tidak perlu diisi — akan ditangani di frontend dengan label "KW-LAMA"
