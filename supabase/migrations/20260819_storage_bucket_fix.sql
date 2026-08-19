-- ===================================================
-- Barqignite Private Sport — Storage Bucket Fix
-- Jalankan di Supabase SQL Editor (satu kali)
-- ===================================================

-- 1. Buat bucket galeri-dokumentasi (public)
-- Public = foto bisa diakses langsung via URL tanpa auth
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'galeri-dokumentasi',
  'galeri-dokumentasi',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- ===================================================
-- 2. Storage RLS Policies
-- ===================================================

-- Allow public SELECT (agar URL foto bisa langsung diakses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public can view galeri-dokumentasi'
  ) THEN
    CREATE POLICY "Public can view galeri-dokumentasi"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'galeri-dokumentasi');
  END IF;
END $$;

-- Allow authenticated users to INSERT (upload)
-- Catatan: upload sebenarnya dilakukan via server API route (service role),
-- tapi policy ini diperlukan sebagai fallback + future-proofing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated can upload galeri-dokumentasi'
  ) THEN
    CREATE POLICY "Authenticated can upload galeri-dokumentasi"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'galeri-dokumentasi');
  END IF;
END $$;

-- Allow authenticated users to DELETE (hapus file saat hapus foto)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated can delete galeri-dokumentasi'
  ) THEN
    CREATE POLICY "Authenticated can delete galeri-dokumentasi"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'galeri-dokumentasi');
  END IF;
END $$;

-- ===================================================
-- Verifikasi (jalankan ini terpisah untuk cek hasil)
-- ===================================================
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'galeri-dokumentasi';
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
