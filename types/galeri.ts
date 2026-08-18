export interface GaleriItem {
  id: string;
  judul: string;
  kategori: 'Basket' | 'Renang';
  foto_url: string;
  tanggal?: string;
  is_featured: boolean;
  urutan: number;
  created_at: string;
}
