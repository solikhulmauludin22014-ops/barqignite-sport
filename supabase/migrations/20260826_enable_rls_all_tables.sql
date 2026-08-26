-- =====================================================================
-- Barqignite Private Sport — RLS Security Hardening
-- Migration: 20260826_enable_rls_all_tables.sql
--
-- Tujuan:
--   1. Drop policy publik yang terlalu lebar / tidak diperlukan
--   2. Aktifkan RLS di 10 tabel yang punya policy tapi RLS belum aktif
--   3. Fix 3 view SECURITY DEFINER -> SECURITY INVOKER (Postgres 15+)
--
-- Catatan arsitektur:
--   - Semua akses Next.js pakai service_role key -> bypass RLS, tidak ada yg rusak
--   - supabasePublic (anon key) tidak dipakai langsung dari browser di kode saat ini
--   - Policy "SVC *" (auth.role() = 'service_role') tetap dipertahankan
--   - Yang di-drop hanya policy yang buka akses anon terlalu lebar
-- =====================================================================

BEGIN;

-- =====================================================================
-- STEP 1: DROP POLICIES YANG TERLALU LEBAR / TIDAK DIPERLUKAN
-- =====================================================================

-- tabel anggota: data sensitif (nama, alamat, no HP, email, tgl lahir)
-- "Public select anggota" USING(true) membuka SELECT ke semua anon
-- Akses anggota sudah aman lewat /api/* (service role)
DROP POLICY IF EXISTS "Public select anggota" ON public.anggota;

-- tabel pembayaran_spp: "Public select spp" USING(true) memungkinkan
-- SELECT * semua SPP semua anggota tanpa filter apapun via PostgREST
-- Fitur "Cek Status Pembayaran" sudah lewat /api/pembayaran (service role)
DROP POLICY IF EXISTS "Public select spp" ON public.pembayaran_spp;

-- tabel pendaftar: "Public insert pendaftar" tidak diperlukan
-- Form pendaftaran sudah aman lewat /api/pendaftar POST (service role)
DROP POLICY IF EXISTS "Public insert pendaftar" ON public.pendaftar;

-- tabel presensi: kedua policy publik tidak diperlukan
-- Form presensi publik sudah lewat /api/presensi/public (service role)
-- Admin presensi sudah lewat /api/presensi (service role, ada session check)
DROP POLICY IF EXISTS "Public insert presensi" ON public.presensi;
DROP POLICY IF EXISTS "Public select presensi" ON public.presensi;

-- =====================================================================
-- STEP 2: AKTIFKAN RLS DI SEMUA 10 TABEL
--
-- Policy yang tersisa setelah drop di atas:
--   admin:                 SVC admin      (ALL, service_role only)     -> deny all anon
--   anggota:               SVC anggota    (ALL, service_role only)     -> deny all anon
--   branding:              Public read    (SELECT, anon OK)            -> publik bisa read
--                          SVC branding   (ALL, service_role)
--   jadwal:                Public read    (SELECT, anon OK)            -> publik bisa read
--                          SVC jadwal     (ALL, service_role)
--   kas:                   SVC kas        (ALL, service_role only)     -> deny all anon
--   log_transaksi_gateway: SVC log        (ALL, service_role only)     -> deny all anon
--   pelatih:               Public read    (SELECT, anon OK)            -> publik bisa read
--                          SVC pelatih    (ALL, service_role)
--   pembayaran_spp:        SVC spp        (ALL, service_role only)     -> deny all anon
--   pendaftar:             SVC pendaftar  (ALL, service_role only)     -> deny all anon
--   presensi:              SVC presensi   (ALL, service_role only)     -> deny all anon
-- =====================================================================

ALTER TABLE public.admin                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_transaksi_gateway ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelatih               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran_spp        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftar             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi              ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- STEP 3: FIX 3 VIEW SECURITY DEFINER -> SECURITY INVOKER
--
-- Dengan security_invoker = true, view menggunakan hak akses (dan RLS)
-- dari user yang melakukan query, BUKAN hak akses pembuat view.
-- Karena ketiga view query tabel sensitif yang kini RLS-nya aktif dan
-- tidak ada policy untuk anon, anon user tidak bisa mengakses view ini.
-- (Postgres 15+ — didukung Supabase platform)
-- =====================================================================

-- -------------------------------------------------------------------
-- View: rekap_kas_bulanan
-- Source: tabel `kas` (data keuangan) — admin only
-- -------------------------------------------------------------------
DROP VIEW IF EXISTS public.rekap_kas_bulanan;

CREATE VIEW public.rekap_kas_bulanan
  WITH (security_invoker = true)
AS
SELECT
  (EXTRACT(year  FROM created_at))::text AS tahun,
  (EXTRACT(month FROM created_at))::text AS bulan,
  sum(nominal::numeric) FILTER (WHERE jenis = 'Masuk')  AS total_masuk,
  sum(nominal::numeric) FILTER (WHERE jenis = 'Keluar') AS total_keluar,
  (
    sum(nominal::numeric) FILTER (WHERE jenis = 'Masuk')
    - COALESCE(sum(nominal::numeric) FILTER (WHERE jenis = 'Keluar'), 0::numeric)
  ) AS selisih
FROM public.kas
GROUP BY
  (EXTRACT(year  FROM created_at))::text,
  (EXTRACT(month FROM created_at))::text
ORDER BY
  (EXTRACT(year  FROM created_at))::text DESC,
  (EXTRACT(month FROM created_at))::text DESC;

-- -------------------------------------------------------------------
-- View: rekap_presensi_bulanan
-- Source: tabel `presensi` (data absensi) — admin only
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
  count(*) FILTER (WHERE status_hadir = 'Hadir') AS jumlah_hadir,
  count(*) FILTER (WHERE status_hadir = 'Izin')  AS jumlah_izin,
  count(*) FILTER (WHERE status_hadir = 'Sakit') AS jumlah_sakit,
  count(*) FILTER (WHERE status_hadir = 'Alpa')  AS jumlah_alpa,
  count(*)                                        AS total_sesi
FROM public.presensi
GROUP BY
  id_anggota, nama_anggota, cabang_olahraga, kategori,
  (EXTRACT(year  FROM tanggal::date))::text,
  (EXTRACT(month FROM tanggal::date))::text
ORDER BY
  (EXTRACT(year  FROM tanggal::date))::text DESC,
  (EXTRACT(month FROM tanggal::date))::text DESC,
  nama_anggota;

-- -------------------------------------------------------------------
-- View: rekap_spp_bulanan
-- Source: tabel `pembayaran_spp` (data keuangan SPP) — admin only
-- -------------------------------------------------------------------
DROP VIEW IF EXISTS public.rekap_spp_bulanan;

CREATE VIEW public.rekap_spp_bulanan
  WITH (security_invoker = true)
AS
SELECT
  bulan,
  tahun,
  cabang_olahraga,
  count(*)                                                         AS total_anggota,
  count(*) FILTER (WHERE status_bayar = 'Lunas')                  AS lunas,
  count(*) FILTER (WHERE status_bayar = 'Belum')                  AS belum_bayar,
  count(*) FILTER (WHERE status_bayar = 'Terlambat')              AS terlambat,
  sum(nominal::numeric) FILTER (WHERE status_bayar = 'Lunas')     AS total_terkumpul
FROM public.pembayaran_spp
GROUP BY bulan, tahun, cabang_olahraga
ORDER BY tahun DESC, bulan DESC;

COMMIT;

-- =====================================================================
-- VERIFIKASI — jalankan query ini setelah migration untuk konfirmasi:
-- =====================================================================
--
-- 1. Cek RLS aktif di semua tabel:
-- SELECT tablename, rowsecurity AS rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('admin','anggota','branding','jadwal','kas',
--                     'log_transaksi_gateway','pelatih','pembayaran_spp',
--                     'pendaftar','presensi')
-- ORDER BY tablename;
--
-- 2. Cek policy yang tersisa:
-- SELECT tablename, policyname, cmd, roles, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
--
-- 3. Cek view tidak lagi SECURITY DEFINER (harus kosong):
-- SELECT viewname FROM information_schema.views
-- WHERE table_schema = 'public'
--   AND view_definition ILIKE '%security_definer%';
-- =====================================================================
