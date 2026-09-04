import type { Metadata } from 'next';
import PrestasiPage from './client-page';

export const metadata: Metadata = {
  title: 'Prestasi Club — Barqignite Private Sport Sidoarjo',
  description:
    'Kumpulan prestasi dan pencapaian atlet Barqignite Private Sport di cabang Basket dan Renang — dari kompetisi lokal hingga kejuaraan nasional.',
  keywords: ['prestasi basket sidoarjo', 'prestasi renang sidoarjo', 'barqignite sport', 'kejuaraan basket sidoarjo'],
  openGraph: {
    title: 'Prestasi Club — Barqignite Private Sport',
    description: 'Prestasi dan pencapaian atlet Barqignite Private Sport Sidoarjo',
    url: 'https://www.barqignitesports.web.id/prestasi',
  },
};

export default function Page() {
  return <PrestasiPage />;
}
