import { NextResponse } from 'next/server';
import type { CabangData } from '@/types';

// Default data
const DEFAULT_CABANG: CabangData[] = [
  {
    id: '1',
    nama_cabang: 'Basket',
    deskripsi: 'Cabang olahraga basket dengan program latihan komprehensif untuk semua usia. Fokus pada teknik dasar, strategi bermain, dan pengembangan fisik.',
    foto_url: '',
    nominal_spp_default: '250000',
    lokasi_utama: 'Lapangan Basket Indoor Barqignite',
  },
  {
    id: '2',
    nama_cabang: 'Renang',
    deskripsi: 'Cabang olahraga renang dengan fasilitas kolam renang modern. Program terstruktur dari level beginner hingga kompetitif dengan pelatih bersertifikat.',
    foto_url: '',
    nominal_spp_default: '300000',
    lokasi_utama: 'Kolam Renang Barqignite Sport Center',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: DEFAULT_CABANG,
  });
}
