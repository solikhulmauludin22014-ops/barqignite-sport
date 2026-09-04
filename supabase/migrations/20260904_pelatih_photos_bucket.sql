-- ============================================================
-- Buat bucket "pelatih-photos" di Supabase Storage
-- + RLS policy: upload oleh authenticated, baca publik
-- Tanggal: 2026-09-04
-- ============================================================

-- 1. Buat bucket publik untuk foto pelatih
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pelatih-photos',
  'pelatih-photos',
  true,                          -- public: bisa diakses tanpa auth (untuk tampil di halaman publik)
  10485760,                      -- 10 MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'];

-- 2. Policy: siapa saja bisa READ (select) — untuk tampil di halaman publik
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'pelatih_photos_public_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "pelatih_photos_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'pelatih-photos');
    $policy$;
  END IF;
END $$;

-- 3. Policy: hanya authenticated user (admin) yang bisa INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'pelatih_photos_auth_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "pelatih_photos_auth_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'pelatih-photos');
    $policy$;
  END IF;
END $$;

-- 4. Policy: hanya authenticated user yang bisa DELETE (hapus foto lama)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'pelatih_photos_auth_delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "pelatih_photos_auth_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'pelatih-photos');
    $policy$;
  END IF;
END $$;
