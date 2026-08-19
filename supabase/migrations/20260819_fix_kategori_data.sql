-- ===================================================
-- Diagnostik & Fix Data Kategori Galeri
-- Jalankan di Supabase SQL Editor
-- ===================================================

-- LANGKAH 1: Lihat semua nilai kategori yang ada di DB (diagnostik)
SELECT
  kategori,
  COUNT(*) AS jumlah,
  STRING_AGG(judul, ', ' ORDER BY created_at DESC) AS contoh_judul
FROM galeri_dokumentasi
GROUP BY kategori
ORDER BY jumlah DESC;

-- ===================================================
-- LANGKAH 2: Fix kategori yang tersimpan salah casing
-- (Jalankan SETELAH melihat hasil diagnostik di atas)
-- ===================================================

-- Fix: 'renang' atau 'RENANG' → 'Renang' (canonical)
UPDATE galeri_dokumentasi
SET kategori = 'Renang'
WHERE LOWER(kategori) = 'renang'
  AND kategori <> 'Renang';

-- Fix: 'basket' atau 'BASKET' → 'Basket' (canonical)
UPDATE galeri_dokumentasi
SET kategori = 'Basket'
WHERE LOWER(kategori) = 'basket'
  AND kategori <> 'Basket';

-- Bersihkan nilai kategori yang benar-benar tidak valid
-- (ganti ke 'Basket' sebagai fallback, sesuaikan manual jika perlu)
UPDATE galeri_dokumentasi
SET kategori = 'Basket'
WHERE kategori NOT IN ('Basket', 'Renang');

-- ===================================================
-- LANGKAH 3: Verifikasi hasil fix
-- ===================================================
SELECT kategori, COUNT(*) AS jumlah
FROM galeri_dokumentasi
GROUP BY kategori;

-- ===================================================
-- LANGKAH 4: Pastikan CHECK constraint aktif
-- ===================================================
-- Cek apakah constraint sudah ada
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'galeri_dokumentasi'::regclass
  AND contype = 'c';

-- Kalau constraint BELUM ada, jalankan ini:
-- ALTER TABLE galeri_dokumentasi
--   ADD CONSTRAINT galeri_kategori_check
--   CHECK (kategori IN ('Basket', 'Renang'));
