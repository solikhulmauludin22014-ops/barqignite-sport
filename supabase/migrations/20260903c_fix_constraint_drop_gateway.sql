-- ============================================================
-- Fix: check constraint metode_bayar + hapus sisa payment gateway
-- Tanggal: 2026-09-03
-- ============================================================

-- 1. Drop constraint lama yang tidak kompatibel dengan nilai baru
--    (constraint asli hanya izinkan 'Tunai','Transfer','VA Bank','QRIS')
ALTER TABLE pembayaran_spp
  DROP CONSTRAINT IF EXISTS pembayaran_spp_metode_bayar_check;

-- 2. Buat constraint baru yang mencakup semua nilai yang mungkin dipakai
--    (termasuk nilai lama untuk kompatibilitas data historis)
ALTER TABLE pembayaran_spp
  ADD CONSTRAINT pembayaran_spp_metode_bayar_check
  CHECK (
    metode_bayar IN (
      'Tunai',    -- nilai lama (data historis)
      'Cash',     -- alias Tunai dari sistem manual baru
      'Transfer', -- transfer bank manual
      'QRIS',     -- scan QRIS manual
      'VA Bank',  -- nilai lama dari gateway (data historis)
      ''          -- kosong (belum diisi / data lama)
    )
  );

-- 3. (Opsional) Backup data log_transaksi_gateway sebelum dihapus
--    Jalankan ini TERPISAH dulu untuk melihat isinya:
-- SELECT * FROM log_transaksi_gateway LIMIT 100;

-- 4. Drop tabel log_transaksi_gateway (sudah tidak dipakai)
--    CATATAN: Jalankan SELECT di atas dulu untuk pastikan tidak ada data penting
DROP TABLE IF EXISTS public.log_transaksi_gateway;

-- 5. Verifikasi constraint baru
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'pembayaran_spp'::regclass AND contype = 'c';
