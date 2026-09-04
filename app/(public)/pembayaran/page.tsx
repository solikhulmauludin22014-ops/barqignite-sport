import type { Metadata } from 'next';
import PembayaranClient from './client-page';

export const metadata: Metadata = {
  title: 'Info Pembayaran SPP — Barqignite Private Sport Sidoarjo',
  description:
    'Informasi biaya SPP, nomor rekening, dan cara pembayaran untuk cabang Basket dan Renang Barqignite Private Sport Sidoarjo. Pembayaran dilakukan langsung kepada admin.',
  keywords: ['biaya spp basket sidoarjo', 'biaya renang sidoarjo', 'pembayaran barqignite', 'info rekening barqignite'],
  openGraph: {
    title: 'Info Pembayaran SPP — Barqignite Private Sport',
    description: 'Informasi biaya dan cara pembayaran SPP Barqignite Private Sport Sidoarjo',
    url: 'https://www.barqignitesports.web.id/pembayaran',
  },
};

export default function PembayaranPage() {
  return <PembayaranClient />;
}
