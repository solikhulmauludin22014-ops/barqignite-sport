-- ============================================================
-- Barqignite Private Sport — Comprehensive Fix Migration
-- File: 20260929_comprehensive_fix.sql
-- Tanggal: 2026-09-29
--
-- Apa yang dilakukan:
--   1. Pastikan kolom pelatih.pengalaman & sertifikasi bisa NULL/empty
--   2. Buat bucket prestasi-photos jika belum ada + policy-nya
--   3. Buat bucket bukti-pembayaran jika belum ada + policy-nya
--   4. Pastikan semua policy storage bucket sudah lengkap
--   5. Verifikasi kolom pelatih konsisten dengan type TypeScript
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FIX TABEL PELATIH: kolom opsional boleh kosong (empty string)
-- ============================================================

-- Pastikan kolom sertifikasi & pengalaman bisa string kosong (NOT NULL tapi default '')
ALTER TABLE public.pelatih
  ALTER COLUMN sertifikasi SET DEFAULT '',
  ALTER COLUMN pengalaman SET DEFAULT '';

-- Update NULL menjadi string kosong agar konsisten
UPDATE public.pelatih SET sertifikasi = '' WHERE sertifikasi IS NULL;
UPDATE public.pelatih SET pengalaman = '' WHERE pengalaman IS NULL;
UPDATE public.pelatih SET foto_url = '' WHERE foto_url IS NULL;

-- ============================================================
-- 2. BUCKET prestasi-photos (untuk fitur Prestasi)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prestasi-photos',
  'prestasi-photos',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Policy read publik untuk prestasi-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'prestasi_photos_public_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "prestasi_photos_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'prestasi-photos');
    $policy$;
  END IF;
END $$;

-- Policy upload untuk prestasi-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'prestasi_photos_auth_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "prestasi_photos_auth_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'prestasi-photos');
    $policy$;
  END IF;
END $$;

-- Policy delete untuk prestasi-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'prestasi_photos_auth_delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "prestasi_photos_auth_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'prestasi-photos');
    $policy$;
  END IF;
END $$;

-- ============================================================
-- 3. BUCKET bukti-pembayaran (opsional, untuk fitur upload bukti)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-pembayaran',
  'bukti-pembayaran',
  false,   -- private: hanya diakses via signed URL atau service role
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- ============================================================
-- 4. VERIFIKASI — jalankan query ini setelah migration:
-- ============================================================
-- SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;
-- SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' ORDER BY policyname;
-- SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'pelatih' ORDER BY ordinal_position;

COMMIT;
