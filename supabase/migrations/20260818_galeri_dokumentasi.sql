-- ===================================================
-- Barqignite Private Sport — Galeri Dokumentasi
-- Jalankan di Supabase SQL Editor
-- ===================================================

-- Tabel galeri_dokumentasi
CREATE TABLE IF NOT EXISTS galeri_dokumentasi (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  judul       TEXT        NOT NULL,
  kategori    TEXT        NOT NULL CHECK (kategori IN ('Basket', 'Renang')),
  foto_url    TEXT        NOT NULL,
  tanggal     DATE,
  is_featured BOOLEAN     DEFAULT false,
  urutan      INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_galeri_kategori ON galeri_dokumentasi(kategori);
CREATE INDEX IF NOT EXISTS idx_galeri_featured ON galeri_dokumentasi(is_featured DESC);
CREATE INDEX IF NOT EXISTS idx_galeri_urutan ON galeri_dokumentasi(urutan ASC);

-- RLS (Row Level Security)
ALTER TABLE galeri_dokumentasi ENABLE ROW LEVEL SECURITY;

-- Policy: siapa saja bisa baca (untuk landing page publik)
CREATE POLICY "Public can view galeri"
  ON galeri_dokumentasi FOR SELECT
  USING (true);

-- Policy: hanya authenticated (admin) yang bisa insert/update/delete
CREATE POLICY "Admin can insert galeri"
  ON galeri_dokumentasi FOR INSERT
  WITH CHECK (true); -- gunakan service role key dari API routes admin

CREATE POLICY "Admin can update galeri"
  ON galeri_dokumentasi FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete galeri"
  ON galeri_dokumentasi FOR DELETE
  USING (true);

-- ===================================================
-- Supabase Storage: Buat bucket via Dashboard
-- ===================================================
-- Langkah manual di Supabase Dashboard:
-- 1. Buka Storage > New Bucket
-- 2. Nama bucket: galeri-dokumentasi
-- 3. Public bucket: ON (agar foto bisa diakses publik)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Atau jalankan SQL berikut (jika Supabase versi mendukung):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('galeri-dokumentasi', 'galeri-dokumentasi', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
-- ON CONFLICT (id) DO NOTHING;

-- ===================================================
-- Contoh data seed (opsional, hapus sebelum production)
-- ===================================================
-- INSERT INTO galeri_dokumentasi (judul, kategori, foto_url, tanggal, is_featured, urutan) VALUES
-- ('Latihan Basket — Sesi Dribbling', 'Basket', 'https://[supabase-url]/storage/v1/object/public/galeri-dokumentasi/contoh.jpg', '2026-08-01', true, 1),
-- ('Sesi Renang Pagi', 'Renang', 'https://[supabase-url]/storage/v1/object/public/galeri-dokumentasi/contoh2.jpg', '2026-08-05', false, 2);
