import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Trophy, Shield, Target, Flame, Zap, Phone, Instagram, Mail, MapPin, Calendar, Play
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import basketLogo from '@/LOGO BARQIGNITE BASKETBALL.jpeg';
import swimLogo from '@/LOGO BARQIGNITE SWIM.png';
import CounterStats from '@/components/public/CounterStats';
import GallerySection from '@/components/public/GallerySection';
export const metadata: Metadata = {
  title: 'Beranda — Barqignite Private Sport Sidoarjo',
  description: 'Club olahraga Basket & Renang terbaik di Sidoarjo. Bergabunglah dan raih prestasi bersama Barqignite Private Sport.',
};

export const revalidate = 60;

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getBranding() {
  try {
    const { data, error } = await supabase.from('branding').select('*').eq('id', 'BRAND-001').single();
    if (error) return null;
    return data;
  } catch { return null; }
}

async function getStats() {
  try {
    const { count: basket } = await supabase.from('pendaftar').select('*', { count: 'exact', head: true }).eq('status_pendaftaran', 'Diterima').eq('cabang_olahraga', 'Basket');
    const { count: renang } = await supabase.from('pendaftar').select('*', { count: 'exact', head: true }).eq('status_pendaftaran', 'Diterima').eq('cabang_olahraga', 'Renang');
    return { basket: basket || 0, renang: renang || 0, total: (basket || 0) + (renang || 0) };
  } catch { return { basket: 0, renang: 0, total: 0 }; }
}

async function getPrestasiCount() {
  try {
    const { count } = await supabase.from('prestasi').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch { return 0; }
}

async function getFeaturedPrestasi() {
  try {
    const { data } = await supabase
      .from('prestasi')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('urutan', { ascending: true })
      .order('tahun', { ascending: false })
      .limit(4);
    return data || [];
  } catch { return []; }
}

async function getGaleri() {
  try {
    const { data } = await supabase
      .from('galeri_dokumentasi')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(12);
    return data || [];
  } catch { return []; }
}

async function getNextSchedule() {
  try {
    const { data, error } = await supabase
      .from('jadwal')
      .select('*')
      .eq('jenis', 'Latihan')
      .limit(1);
    
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}

// ─── Local gallery photos (dari folder /public) ───────────────────────────────
const localGalleryPhotos = [
  { id: 'local-1', judul: 'Sesi Latihan Kegiatan', kategori: 'Basket' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.12.15.jpeg', tanggal: '2026-08-18', is_featured: true, urutan: 1, created_at: '2026-08-18' },
  { id: 'local-2', judul: 'Sesi Latihan Kegiatan', kategori: 'Basket' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.12.24.jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 2, created_at: '2026-08-18' },
  { id: 'local-3', judul: 'Sesi Latihan Kegiatan', kategori: 'Renang' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.24.32 (1).jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 3, created_at: '2026-08-18' },
  { id: 'local-4', judul: 'Sesi Latihan Kegiatan', kategori: 'Renang' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.24.32.jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 4, created_at: '2026-08-18' },
  { id: 'local-5', judul: 'Sesi Latihan Kegiatan', kategori: 'Basket' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.24.33 (1).jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 5, created_at: '2026-08-18' },
  { id: 'local-6', judul: 'Sesi Latihan Kegiatan', kategori: 'Basket' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.24.33.jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 6, created_at: '2026-08-18' },
  { id: 'local-7', judul: 'Sesi Latihan Kegiatan', kategori: 'Renang' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.24.36.jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 7, created_at: '2026-08-18' },
  { id: 'local-8', judul: 'Sesi Latihan Kegiatan', kategori: 'Renang' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.24.42.jpeg', tanggal: '2026-08-18', is_featured: true, urutan: 8, created_at: '2026-08-18' },
  { id: 'local-9', judul: 'Sesi Latihan Kegiatan', kategori: 'Basket' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.35.01.jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 9, created_at: '2026-08-18' },
  { id: 'local-10', judul: 'Sesi Latihan Kegiatan', kategori: 'Basket' as const, foto_url: '/WhatsApp Image 2026-08-18 at 15.35.16.jpeg', tanggal: '2026-08-18', is_featured: false, urutan: 10, created_at: '2026-08-18' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BerandaPage() {
  const [branding, stats, prestasiCount, featuredPrestasi, dbGaleri, nextSchedule] = await Promise.all([
    getBranding(), getStats(), getPrestasiCount(), getFeaturedPrestasi(), getGaleri(), getNextSchedule(),
  ]);

  const tagline = branding?.tagline || 'Membentuk Atlet Basket & Renang Berprestasi';

  const noWa = branding?.no_wa_admin || '6285606900934';
  const instagram = branding?.instagram || 'barqignite.sportsda';
  const email = branding?.email_club || '';
  const alamat = branding?.alamat_club || '';

  const cleanWa = noWa.replace(/\D/g, '');
  const finalWa = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa;
  const waLink = `https://wa.me/${finalWa}`;
  const cleanIg = instagram.replace('@', '');
  const igLink = `https://www.instagram.com/${cleanIg}?igsh=MWI0bGhtMGc3Z25pOA==`;

  // Gabungkan foto dari DB + foto lokal (DB diprioritaskan, lokal sebagai fallback/tambahan)
  const galeriItems = dbGaleri.length > 0 ? dbGaleri : localGalleryPhotos;

  const counterStats = [
    { label: 'Total Anggota', value: stats.total, href: '/atlet', color: 'basket' as const },
    { label: 'Prestasi Club', value: prestasiCount, suffix: prestasiCount > 0 ? '+' : '', href: '/prestasi', color: 'renang' as const },
    { label: 'Atlet Basket', value: stats.basket, href: '/atlet?cabang=Basket', color: 'basket' as const },
    { label: 'Atlet Renang', value: stats.renang, href: '/atlet?cabang=Renang', color: 'renang' as const },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          HERO — Athletic Editorial Split
      ════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-arena-900">

        {/* Diagonal Split Backgrounds */}
        <div className="absolute inset-0 flex">
          {/* Left: Basket (Diagonal Clip) */}
          <div
            className="w-1/2 h-full bg-basket/10 relative overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 18vw) 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 texture-parquet opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-arena-900/70 via-transparent to-transparent" />
          </div>

          {/* Right: Renang (Diagonal Clip) */}
          <div
            className="absolute right-0 w-[60%] h-full bg-renang/5"
            style={{ clipPath: 'polygon(18vw 0, 100% 0, 100% 100%, 0 100%)', zIndex: 0 }}
          >
            <div className="absolute inset-0 texture-water opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-l from-arena-900/70 via-transparent to-transparent" />
          </div>
        </div>

        {/* Subtle noise/grain overlay for premium feel */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
          }}
        />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-24 pb-8">
          
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 items-center lg:items-end">
            
            {/* 1) TEXT SECTION (Mobile: Order 1, Desktop: Left Column) */}
            <div className="lg:col-span-6 xl:col-span-5 z-20 w-full mb-12 lg:mb-0 lg:pb-12 animate-fade-in-up flex flex-col justify-end h-full">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-3 mb-6 lg:mb-8">
                <span className="block w-10 h-[1.5px] bg-basket" />
                <span className="text-basket text-[10px] font-bold uppercase tracking-[0.4em] font-sans">
                  Private Sport · Sidoarjo
                </span>
                <span className="block w-10 h-[1.5px] bg-renang" />
              </div>

              {/* Main Heading */}
              <h1 className="font-display leading-none uppercase mb-4 select-none">
                <span
                  className="block jersey-headline jersey-headline-basket"
                  style={{ fontSize: 'clamp(4rem, 10vw, 10.5rem)', lineHeight: 0.87 }}
                >
                  Barqignite
                </span>
                <span
                  className="block jersey-headline jersey-headline-renang"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 7rem)', lineHeight: 1.05, marginTop: '0.1em' }}
                >
                  Private Sport
                </span>
                <span
                  className="block font-sans font-light"
                  style={{ fontSize: 'clamp(1.2rem, 2.8vw, 2.5rem)', letterSpacing: '0.45em', lineHeight: 1.6, color: 'rgb(var(--color-neutral-light) / 0.25)', WebkitTextStroke: '1px rgb(var(--color-neutral-light) / 0.3)', fontWeight: 300 }}
                >
                  Sidoarjo
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-muted text-xs md:text-sm max-w-lg mt-6 lg:mt-8 mb-8 lg:mb-12 uppercase font-semibold tracking-[0.18em] leading-loose">
                {tagline}
              </p>
            </div>

            {/* 2) PHOTO SECTION (Mobile: Order 2, Desktop: Right Column) */}
            <div className="lg:col-span-6 xl:col-span-7 z-10 w-full relative mb-12 lg:mb-0 flex justify-center items-end lg:h-[750px]">
              
              {/* Glow Behind */}
              <div className="absolute inset-0 bg-gradient-radial from-basket/20 via-renang/10 to-transparent blur-[80px] -z-10 rounded-full scale-110"></div>
              
              {/* Background Text "COACH NAFIS" */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none w-full">
                <h2 className="font-display font-black text-arena-900/5 dark:text-white/5 text-center leading-[0.8] tracking-tighter" style={{ fontSize: 'clamp(100px, 15vw, 180px)' }}>
                  COACH<br/>NAFIS
                </h2>
              </div>

              {/* Number "24" */}
              <div className="absolute top-0 right-0 lg:right-10 -z-10 pointer-events-none opacity-20">
                <span className="font-display font-black text-transparent text-arena-900 dark:text-white" style={{ fontSize: 'clamp(80px, 10vw, 120px)', WebkitTextStrokeWidth: '2px', WebkitTextStrokeColor: 'currentColor', lineHeight: 1 }}>24</span>
              </div>

              {/* Cutout Image with Glow Line Fade */}
              <div className="relative w-[90%] max-w-[450px] lg:max-w-none lg:w-[85%] xl:w-[75%] aspect-[3/4] lg:h-full lg:aspect-auto">
                 <Image src="/fd0532d7-593a-43e9-a3e4-d7060080119c.png" alt="Coach Nafis" fill className="object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]" priority style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }} />
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-basket to-transparent blur-[2px] opacity-70"></div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-basket/50 to-transparent"></div>
              </div>

              {/* Mini Name Badge */}
              <div className="absolute top-4 left-4 lg:left-0 bg-white/80 dark:bg-arena-800/80 backdrop-blur-md border border-neutral-200 dark:border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-arena-900/10 dark:bg-white/10 flex items-center justify-center border border-arena-900/20 dark:border-white/20"><span className="font-display font-black text-arena-900 dark:text-white text-sm">B</span></div>
                <div>
                  <h3 className="type-card-title text-arena-900 dark:text-white leading-none text-sm">Barqiyyah Nafis</h3>
                  <p className="text-primary-600 dark:text-primary-400 text-[9px] font-bold uppercase tracking-widest mt-1">Founder & Head Coach</p>
                </div>
              </div>

              {/* Quote */}
              <div className="absolute bottom-20 left-0 lg:-left-10 bg-white/90 dark:bg-arena-900/90 backdrop-blur-md border border-neutral-200 dark:border-white/10 p-4 rounded-2xl shadow-xl max-w-[200px] lg:max-w-[250px] hidden sm:block">
                <p className="text-arena-900/90 dark:text-neutral-light/90 text-xs lg:text-sm font-medium leading-relaxed font-sans mb-2">"Membentuk karakter pemenang tidak hanya di lapangan, tapi dalam setiap aspek kehidupan."</p>
                <span className="type-label text-primary-600 dark:text-primary-400">— Coach Nafis</span>
              </div>

              {/* Small Cards */}
              <div className="absolute -bottom-6 lg:bottom-10 right-0 lg:-right-10 flex flex-col gap-3">
                {/* Next Schedule */}
                {nextSchedule && (
                  <Link href="/jadwal" className="glass-card-hover border border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-arena-800/90 backdrop-blur-xl p-3 rounded-2xl flex items-center gap-3 w-48 shadow-xl group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-arena-900/5 dark:bg-white/5 flex items-center justify-center shrink-0 border border-arena-900/10 dark:border-white/5 group-hover:border-renang transition-colors">
                      <Calendar className="w-4 h-4 text-arena-900 dark:text-white" />
                    </div>
                    <div>
                      <p className="type-label text-renang mb-0.5">Latihan Berikutnya</p>
                      <h4 className="font-bold text-arena-900 dark:text-white text-[11px] leading-tight group-hover:text-renang transition-colors">{nextSchedule.cabang_olahraga} — {nextSchedule.hari}</h4>
                    </div>
                  </Link>
                )}
                
                {/* Gallery */}
                <Link href="#galeri" className="glass-card-hover border border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-arena-800/90 backdrop-blur-xl p-3 rounded-2xl flex items-center gap-3 w-48 shadow-xl group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-arena-100 dark:bg-arena-700 flex items-center justify-center shrink-0 border border-arena-900/10 dark:border-white/5 group-hover:border-basket transition-colors">
                    <Play className="w-4 h-4 text-basket/70 group-hover:text-basket" />
                  </div>
                  <div>
                    <p className="type-label text-primary-600 dark:text-primary-400 mb-0.5">Dokumentasi</p>
                    <h4 className="font-bold text-arena-900 dark:text-white text-[11px] leading-tight group-hover:text-basket transition-colors">Lihat Galeri</h4>
                  </div>
                </Link>
              </div>
            </div>

            {/* 3) CTA BUTTONS (Mobile: Order 3, Desktop: Left Column below text) */}
            <div className="lg:col-span-6 xl:col-span-5 z-20 w-full lg:row-start-2 lg:col-start-1 lg:-mt-24">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/pendaftaran?cabang=Basket" id="cta-daftar-basket" className="btn-accent group relative text-sm px-8 py-4 w-full sm:w-auto text-center justify-center flex-1 sm:flex-none">
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <span className="text-lg">🏀</span>
                    <span>Daftar Basket</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </Link>
                <Link href="/pendaftaran?cabang=Renang" id="cta-daftar-renang" className="btn-primary group relative text-sm px-8 py-4 w-full sm:w-auto text-center justify-center flex-1 sm:flex-none">
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <span className="text-lg">🏊</span>
                    <span>Daftar Renang</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </Link>
              </div>
            </div>

          </div>

          {/* Scoreboard Stats — counter animation */}
          <div className="mt-20 lg:mt-32">
            <CounterStats stats={counterStats} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DUAL DIVIDER — Signature element
      ════════════════════════════════════════════════════ */}
      <div className="divider-dual" />

      {/* ═══════════════════════════════════════════════════
          CABANG OLAHRAGA
      ════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden bg-arena-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section header */}
          <div className="mb-20">
            <p className="text-basket text-[10px] font-bold uppercase tracking-[0.35em] mb-4 font-sans">
              Pilih Cabang
            </p>
            <h2
              className="font-display text-neutral-light uppercase leading-none"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
            >
              <span className="jersey-section-title">
                Cabang{' '}
                <span className="jersey-ghost">Olahraga</span>
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Basket Card */}
            <div className="group relative overflow-hidden bg-arena-800 cursor-pointer transition-all duration-500 hover:-translate-y-1">
              {/* Left accent bar */}
              <div className="absolute inset-y-0 left-0 w-[3px] bg-basket" />
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-basket/60 to-transparent" />
              {/* Parquet texture */}
              <div className="absolute inset-0 texture-parquet opacity-5 group-hover:opacity-12 transition-opacity duration-500" />
              {/* Basket glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-basket/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 p-10 lg:p-12 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-basket-dark dark:text-basket text-[10px] font-bold uppercase tracking-[0.35em] mb-3 font-sans">Court</p>
                    <h3
                      className="font-display text-neutral-light uppercase leading-none"
                      style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, letterSpacing: '0.02em' }}
                    >
                      Basket
                    </h3>
                  </div>
                  <div className="w-28 md:w-36 bg-white rounded-xl shadow-xl shadow-basket/10 border border-white/20 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-[0_12px_40px_rgba(255,107,0,0.25)] transition-all duration-500 px-4 py-3 flex items-center justify-center">
                    <Image src={basketLogo} alt="Logo Basket" className="w-full h-auto object-contain" />
                  </div>
                </div>

                <p className="text-muted text-base leading-relaxed flex-grow mb-10 max-w-sm">
                  Program latihan intensif dan komprehensif dari level pemula hingga profesional di lapangan indoor standar nasional.
                </p>

                <Link
                  href="/pendaftaran?cabang=Basket"
                  id="card-daftar-basket"
                  className="btn-accent self-start text-base uppercase tracking-widest font-bold rounded-none px-8 py-4"
                >
                  Daftar Basket
                </Link>
              </div>
            </div>

            {/* Renang Card */}
            <div className="group relative overflow-hidden bg-arena-800 cursor-pointer transition-all duration-500 hover:-translate-y-1">
              {/* Left accent bar */}
              <div className="absolute inset-y-0 left-0 w-[3px] bg-renang" />
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-renang/60 to-transparent" />
              {/* Water texture */}
              <div className="absolute inset-0 texture-water opacity-5 group-hover:opacity-12 transition-opacity duration-500" />
              {/* Renang glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-renang/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 p-10 lg:p-12 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-renang-dark dark:text-renang text-[10px] font-bold uppercase tracking-[0.35em] mb-3 font-sans">Pool</p>
                    <h3
                      className="font-display text-neutral-light uppercase leading-none"
                      style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, letterSpacing: '0.02em' }}
                    >
                      Renang
                    </h3>
                  </div>
                  <div className="w-28 md:w-36 bg-white rounded-xl shadow-xl shadow-renang/10 border border-white/20 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-[0_12px_40px_rgba(0,194,203,0.25)] transition-all duration-500 px-4 py-3 flex items-center justify-center">
                    <Image src={swimLogo} alt="Logo Renang" className="w-full h-auto object-contain" />
                  </div>
                </div>

                <p className="text-muted text-base leading-relaxed flex-grow mb-10 max-w-sm">
                  Fasilitas kolam renang modern dengan pelatih bersertifikat. Fokus pada teknik, stamina, dan pencapaian waktu terbaik.
                </p>

                <Link
                  href="/pendaftaran?cabang=Renang"
                  id="card-daftar-renang"
                  className="btn-primary self-start text-base uppercase tracking-widest font-bold rounded-none px-8 py-4"
                >
                  Daftar Renang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DUAL DIVIDER
      ════════════════════════════════════════════════════ */}
      <div className="divider-dual" />

      {/* ═══════════════════════════════════════════════════
          GALERI DOKUMENTASI — Momen di Lapangan
      ════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden bg-arena-900" id="galeri">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-renang text-[10px] font-bold uppercase tracking-[0.35em] mb-4 font-sans">
                Dokumentasi
              </p>
              <h2
                className="font-display text-neutral-light uppercase leading-none"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
              >
                <span className="jersey-section-title">
                  Momen{' '}
                  <span className="jersey-ghost">di Lapangan</span>
                </span>
              </h2>
            </div>
            <p className="text-muted text-sm max-w-xs leading-relaxed">
              Latihan, kompetisi, dan sesi renang — captured live dari lapangan.
            </p>
          </div>

          <GallerySection items={galeriItems} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DUAL DIVIDER
      ════════════════════════════════════════════════════ */}
      <div className="divider-dual" />

      {/* ═══════════════════════════════════════════════════
          PRESTASI TERBARU
      ════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden bg-arena-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-[0.25em] font-sans">Hall of Fame</span>
              </div>
              <h2
                className="font-display text-neutral-light uppercase leading-none"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
              >
                <span className="jersey-section-title">
                  Prestasi{' '}
                  <span className="jersey-ghost">Terbaru</span>
                </span>
              </h2>
            </div>
            <Link href="/prestasi" id="link-semua-prestasi" className="btn-secondary group shrink-0">
              Lihat Semua Prestasi
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {featuredPrestasi.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredPrestasi.map((p) => (
                <div key={p.id} className="group bg-arena-800 border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-400 hover:-translate-y-1">
                  {/* Photo */}
                  <div className="relative h-48 overflow-hidden bg-arena-700">
                    <Image
                      src={p.foto_url}
                      alt={p.judul_prestasi}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-arena-900/95 via-arena-900/20 to-transparent" />

                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {p.is_featured && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white">
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ${p.kategori === 'Basket' ? 'bg-basket' : 'bg-renang'}`}>
                        {p.kategori}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 relative">
                    {/* Level badge */}
                    <div className="mb-3">
                      <span className={`inline-block px-2.5 py-1 type-label border ${
                        p.tingkat === 'kota' ? 'text-neutral-light/50 border-white/10' :
                        p.tingkat === 'provinsi' ? 'text-blue-400 border-blue-500/30' :
                        p.tingkat === 'nasional' ? 'text-basket border-basket/30' :
                        'text-amber-400 border-amber-500/30'
                      }`}>
                        Tingkat {p.tingkat}
                      </span>
                    </div>

                    <h3 className="type-card-title text-white mb-2 line-clamp-2 group-hover:text-basket transition-colors">
                      {p.judul_prestasi}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-medium text-muted truncate pr-2 font-sans">
                        {p.nama_atlet}
                      </p>
                      <span className="scoreboard-value text-sm text-muted shrink-0">
                        {p.tahun}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-arena-800 border border-white/5">
              <Trophy className="w-10 h-10 text-neutral-light/15 mb-3" />
              <p className="text-muted text-sm">Belum ada data prestasi yang dapat ditampilkan.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DUAL DIVIDER
      ════════════════════════════════════════════════════ */}
      <div className="divider-dual" />

      {/* ═══════════════════════════════════════════════════
          KEUNGGULAN — Numbered editorial style
      ════════════════════════════════════════════════════ */}
      <section className="py-28 bg-arena-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <p className="text-basket text-[10px] font-bold uppercase tracking-[0.35em] mb-4 font-sans">
              Mengapa Kami?
            </p>
            <h2
              className="font-display text-neutral-light uppercase leading-none"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
            >
              <span className="jersey-section-title">
                Keunggulan{' '}
                <span className="jersey-ghost">Barqignite</span>
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {[
              { icon: Shield, title: 'Pelatih Ahli', desc: 'Dilatih langsung oleh profesional bersertifikat resmi.', color: 'text-basket', num: '01' },
              { icon: Target, title: 'Standar Nasional', desc: 'Fasilitas lapangan & kolam renang berstandar kompetisi.', color: 'text-renang', num: '02' },
              { icon: Flame, title: 'DNA Kompetitif', desc: 'Rutin berkompetisi di liga dan kejuaraan regional.', color: 'text-basket', num: '03' },
              { icon: Zap, title: 'Sistem Terpadu', desc: 'Manajemen digital untuk memantau absensi & performa.', color: 'text-renang', num: '04' },
            ].map((f) => (
              <div key={f.num} className="group">
                {/* Number */}
                <div className="mb-6">
                  <span
                    className={`font-display font-black ${f.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                    style={{ fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-0.02em', fontWeight: 900 }}
                  >
                    {f.num}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-arena-900 border border-neutral-light/5 dark:border-white/5 mb-5 group-hover:border-white/15 transition-all duration-300`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>

                <h3 className="type-card-title text-neutral-light mb-3">
                  {f.title}
                </h3>
                <p className="text-muted text-[15px] leading-relaxed font-sans">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DUAL DIVIDER
      ════════════════════════════════════════════════════ */}
      <div className="divider-dual" />

      {/* ═══════════════════════════════════════════════════
          KONTAK & SOSIAL MEDIA
      ════════════════════════════════════════════════════ */}
      <section className="py-28 bg-arena-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-renang text-[10px] font-bold uppercase tracking-[0.35em] mb-4 font-sans">
              Kontak
            </p>
            <h2
              className="font-display text-neutral-light uppercase leading-none"
              style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}
            >
              <span className="jersey-section-title">
                Hubungi{' '}
                <span className="jersey-ghost">Kami</span>
              </span>
            </h2>
            <p className="text-muted mt-4 text-base font-sans max-w-lg leading-relaxed">
              Punya pertanyaan atau butuh bantuan pendaftaran? Tim admin kami siap membantu.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* WhatsApp */}
            <a href={waLink} target="_blank" rel="noreferrer" id="kontak-whatsapp" className="group bg-arena-800 border border-neutral-light/5 dark:border-white/5 p-8 flex flex-col items-center text-center hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/15 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/15 flex items-center justify-center mb-5 transition-all duration-300">
                <Phone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-neutral-light mb-1.5 font-sans">WhatsApp / CP</h3>
              <p className="text-muted text-sm font-sans">{noWa || 'Belum ada nomor'}</p>
            </a>

            {/* Instagram */}
            <a href={igLink} target="_blank" rel="noreferrer" id="kontak-instagram" className="group bg-arena-800 border border-neutral-light/5 dark:border-white/5 p-8 flex flex-col items-center text-center hover:border-pink-500/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/15 group-hover:border-pink-500/40 group-hover:bg-pink-500/15 flex items-center justify-center mb-5 transition-all duration-300">
                <Instagram className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-base font-bold text-neutral-light mb-1.5 font-sans">Instagram</h3>
              <p className="text-muted text-sm font-sans">{instagram ? `@${instagram.replace('@', '')}` : 'Belum ada IG'}</p>
            </a>

            {/* Email */}
            <a href={email ? `mailto:${email}` : '#'} id="kontak-email" className="group bg-arena-800 border border-neutral-light/5 dark:border-white/5 p-8 flex flex-col items-center text-center hover:border-basket/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-basket/10 border border-basket/20 group-hover:border-basket/40 group-hover:bg-basket/20 flex items-center justify-center mb-5 transition-all duration-300">
                <Mail className="w-6 h-6 text-basket-dark dark:text-basket" />
              </div>
              <h3 className="text-base font-bold text-neutral-light mb-1.5 font-sans">Email</h3>
              <p className="text-muted text-sm font-sans">{email || 'Belum ada email'}</p>
            </a>

            {/* Alamat */}
            <div className="group bg-arena-800 border border-neutral-light/5 dark:border-white/5 p-8 flex flex-col items-center text-center hover:border-renang/30 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-renang/10 border border-renang/20 group-hover:border-renang/40 group-hover:bg-renang/20 flex items-center justify-center mb-5 transition-all duration-300">
                <MapPin className="w-6 h-6 text-renang-dark dark:text-renang" />
              </div>
              <h3 className="text-base font-bold text-neutral-light mb-1.5 font-sans">Alamat</h3>
              <p className="text-muted text-sm font-sans">{alamat || 'Belum ada alamat'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING WHATSAPP */}
      {noWa && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          id="floating-whatsapp"
          className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-110 animate-fade-in"
          title="Hubungi Kami via WhatsApp"
        >
          <Phone className="w-6 h-6" />
        </a>
      )}
    </>
  );
}
