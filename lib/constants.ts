// ===================================================
// Konstanta Aplikasi — Single Source of Truth
// Semua komponen WAJIB import dari sini
// ===================================================

/**
 * Nilai kategori yang valid untuk galeri & tabel lain.
 * Harus cocok persis (case-sensitive) dengan:
 *   - CHECK constraint di tabel galeri_dokumentasi
 *   - Filter tab di admin dan halaman publik
 */
export const KATEGORI = {
  BASKET: 'Basket',
  RENANG: 'Renang',
} as const;

export type KategoriType = typeof KATEGORI[keyof typeof KATEGORI];

/** Array untuk render tab filter / tombol kategori */
export const KATEGORI_LIST: KategoriType[] = [KATEGORI.BASKET, KATEGORI.RENANG];

/** Tab filter termasuk "Semua" */
export const FILTER_TABS = ['Semua', KATEGORI.BASKET, KATEGORI.RENANG] as const;
export type FilterTabType = typeof FILTER_TABS[number];

/** Emoji per kategori */
export const KATEGORI_EMOJI: Record<KategoriType, string> = {
  [KATEGORI.BASKET]: '🏀',
  [KATEGORI.RENANG]: '🏊',
};

/** Warna Tailwind class per kategori */
export const KATEGORI_BG: Record<KategoriType, string> = {
  [KATEGORI.BASKET]: 'bg-basket',
  [KATEGORI.RENANG]: 'bg-renang',
};
