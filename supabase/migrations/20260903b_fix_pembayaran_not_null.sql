-- ============================================================
-- Fix: kolom NOT NULL lama yang tidak ada defaultnya di pembayaran_spp
-- Tanggal: 2026-09-03
-- Penyebab: kolom payment_gateway_id & status_gateway kemungkinan
-- dibuat NOT NULL (tanpa DEFAULT) di tabel awal, tapi sekarang tidak
-- dikirim dari form manual. Perlu diberi DEFAULT ''.
-- ============================================================

-- 1. Beri DEFAULT '' pada kolom yang dulunya wajib diisi dari gateway
ALTER TABLE pembayaran_spp
  ALTER COLUMN payment_gateway_id SET DEFAULT '',
  ALTER COLUMN status_gateway      SET DEFAULT '';

-- 2. Isi yang NULL dengan '' supaya tidak ada NULL di kolom ini
UPDATE pembayaran_spp
  SET payment_gateway_id = ''
  WHERE payment_gateway_id IS NULL;

UPDATE pembayaran_spp
  SET status_gateway = ''
  WHERE status_gateway IS NULL;

-- 3. Pastikan kolom nomor_kwitansi & catatan dari migration sebelumnya sudah ada
-- (aman dijalankan ulang karena pakai IF NOT EXISTS)
ALTER TABLE pembayaran_spp
  ADD COLUMN IF NOT EXISTS nomor_kwitansi TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS catatan        TEXT DEFAULT '';

-- 4. Pastikan counter di pengaturan_pembayaran ada
ALTER TABLE pengaturan_pembayaran
  ADD COLUMN IF NOT EXISTS nomor_kwitansi_terakhir INTEGER DEFAULT 0;

-- Upsert row SETTING-001 supaya counter bisa diincrement
INSERT INTO pengaturan_pembayaran (id, tanggal_jatuh_tempo, catatan_keterlambatan, nomor_kwitansi_terakhir)
VALUES ('SETTING-001', 'Tanggal 10 setiap bulan', 'Keterlambatan pembayaran mempengaruhi status keaktifan anggota', 0)
ON CONFLICT (id) DO UPDATE SET
  nomor_kwitansi_terakhir = COALESCE(pengaturan_pembayaran.nomor_kwitansi_terakhir, 0);

-- 5. Verifikasi — jalankan setelah migration untuk cek
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'pembayaran_spp'
-- ORDER BY ordinal_position;
