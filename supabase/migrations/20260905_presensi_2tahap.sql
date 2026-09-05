-- =====================================================================
-- Barqignite Private Sport — Presensi 2 Tahap
-- Migration: 20260905_presensi_2tahap.sql
--
-- Tujuan:
--   1. Tambah kolom waktu_submit ke tabel presensi (timestamp server)
--   2. Ubah constraint status_hadir agar support 'Menunggu Konfirmasi'
--   3. Update view rekap_presensi_bulanan:
--      - Tidak menghitung 'Menunggu Konfirmasi' sebagai Hadir
--      - Tambah kolom jumlah_pending untuk monitoring
-- =====================================================================

BEGIN;

-- -------------------------------------------------------------------
-- STEP 1: Tambah kolom waktu_submit
-- Diisi otomatis saat insert dengan NOW() (timestamp server, bukan klien)
-- -------------------------------------------------------------------
ALTER TABLE public.presensi
  ADD COLUMN IF NOT EXISTS waktu_submit TIMESTAMPTZ DEFAULT NOW();

-- Isi kolom waktu_submit untuk data lama (pakai tanggal kolom tanggal jika ada)
UPDATE public.presensi
SET waktu_submit = (tanggal::date)::timestamptz
WHERE waktu_submit IS NULL;

-- -------------------------------------------------------------------
-- STEP 2: Update constraint status_hadir
-- Tambahkan nilai 'Menunggu Konfirmasi' ke constraint yang ada
-- -------------------------------------------------------------------

-- Drop constraint lama jika ada
ALTER TABLE public.presensi
  DROP CONSTRAINT IF EXISTS presensi_status_hadir_check;

-- Buat constraint baru yang include semua nilai valid
ALTER TABLE public.presensi
  ADD CONSTRAINT presensi_status_hadir_check
  CHECK (status_hadir IN ('Hadir', 'Izin', 'Sakit', 'Alpa', 'Menunggu Konfirmasi'));

-- -------------------------------------------------------------------
-- STEP 3: Update view rekap_presensi_bulanan
-- Pastikan 'Menunggu Konfirmasi' TIDAK dihitung sebagai Hadir
-- Tambah jumlah_pending untuk monitoring admin
-- -------------------------------------------------------------------
DROP VIEW IF EXISTS public.rekap_presensi_bulanan;

CREATE VIEW public.rekap_presensi_bulanan
  WITH (security_invoker = true)
AS
SELECT
  id_anggota,
  nama_anggota,
  cabang_olahraga,
  kategori,
  (EXTRACT(year  FROM tanggal::date))::text AS tahun,
  (EXTRACT(month FROM tanggal::date))::text AS bulan,
  -- Hanya hitung yang sudah dikonfirmasi admin (status = 'Hadir')
  count(*) FILTER (WHERE status_hadir = 'Hadir')               AS jumlah_hadir,
  count(*) FILTER (WHERE status_hadir = 'Izin')                AS jumlah_izin,
  count(*) FILTER (WHERE status_hadir = 'Sakit')               AS jumlah_sakit,
  count(*) FILTER (WHERE status_hadir = 'Alpa')                AS jumlah_alpa,
  -- Menunggu Konfirmasi: belum diproses admin
  count(*) FILTER (WHERE status_hadir = 'Menunggu Konfirmasi') AS jumlah_pending,
  -- Total sesi yang sudah final (dikonfirmasi admin)
  count(*) FILTER (WHERE status_hadir IN ('Hadir', 'Izin', 'Sakit', 'Alpa')) AS total_sesi_final,
  count(*)                                                      AS total_sesi
FROM public.presensi
GROUP BY
  id_anggota, nama_anggota, cabang_olahraga, kategori,
  (EXTRACT(year  FROM tanggal::date))::text,
  (EXTRACT(month FROM tanggal::date))::text
ORDER BY
  (EXTRACT(year  FROM tanggal::date))::text DESC,
  (EXTRACT(month FROM tanggal::date))::text DESC,
  nama_anggota;

COMMIT;
