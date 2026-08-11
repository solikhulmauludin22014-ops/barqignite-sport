import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Trophy, Users, Target, Waves, Calendar, Shield, Flame, Zap, Phone, Instagram, Mail, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import basketLogo from '@/LOGO BARQIGNITE BASKETBALL.jpeg';
import swimLogo from '@/LOGO BARQIGNITE SWIM.png';

export const metadata: Metadata = {
  title: 'Beranda — Barqignite Private Sport Sidoarjo',
  description: 'Club olahraga Basket & Renang terbaik di Sidoarjo. Bergabunglah dan raih prestasi bersama Barqignite Private Sport.',
};

export const revalidate = 60;

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

export default async function BerandaPage() {
  const [branding, stats, prestasiCount, featuredPrestasi] = await Promise.all([getBranding(), getStats(), getPrestasiCount(), getFeaturedPrestasi()]);

  const tagline = branding?.tagline || 'Membentuk Atlet Basket & Renang Berprestasi';

  // Gunakan data dari database, jika masih kosong gunakan default yang Anda tulis
  const noWa = branding?.no_wa_admin || '6285606900934';
  const instagram = branding?.instagram || 'barqignite.sportsda';
  const email = branding?.email_club || '';
  const alamat = branding?.alamat_club || '';

  // Membersihkan spasi/tanda hubung dari nomor WA
  const cleanWa = noWa.replace(/\D/g, '');
  // Mengubah prefix '0' menjadi '62' agar valid untuk standar wa.me
  const finalWa = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa;
  const waLink = `https://wa.me/${finalWa}`;

  // Membersihkan tanda '@' jika ada dari username IG, lalu tambahkan param yang Anda mau
  const cleanIg = instagram.replace('@', '');
  const igLink = `https://www.instagram.com/${cleanIg}?igsh=MWI0bGhtMGc3Z25pOA==`;

  return (
    <>
      {/* ===== HERO: SPLIT DIAGONAL ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-arena-900">
        {/* Split Backgrounds */}
        <div className="absolute inset-0 flex">
          {/* Left: Basket (Diagonal Clip) */}
          <div
            className="w-1/2 h-full bg-basket/10 relative overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 20vw) 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 texture-parquet opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-arena-900/80 via-transparent to-transparent" />
          </div>

          {/* Right: Renang (Diagonal Clip) */}
          <div
            className="absolute right-0 w-[60%] h-full bg-renang/5"
            style={{ clipPath: 'polygon(20vw 0, 100% 0, 100% 100%, 0 100%)', zIndex: 0 }}
          >
            <div className="absolute inset-0 texture-water opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-l from-arena-900/80 via-transparent to-transparent" />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
          <div className="text-left animate-slide-up mt-4 max-w-5xl">

            {/* Label pill */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="block w-8 h-px bg-basket" />
              <span className="text-basket text-[11px] font-bold uppercase tracking-[0.3em]">Private Sport · Sidoarjo</span>
            </div>

            {/* Main Heading - Stacked sporty typography */}
            <h1 className="font-display leading-none uppercase mb-4 select-none">
              {/* BARQIGNITE - giant, basket orange */}
              <span
                className="block text-basket"
                style={{
                  fontSize: 'clamp(4rem, 10vw, 9rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 0.92,
                  textShadow: '0 0 60px rgba(255,107,0,0.25)',
                }}
              >
                Barqignite
              </span>

              {/* PRIVATE SPORT - slightly smaller, renang cyan */}
              <span
                className="block text-renang"
                style={{
                  fontSize: 'clamp(3rem, 7.5vw, 6.5rem)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.0,
                  textShadow: '0 0 60px rgba(0,194,203,0.25)',
                }}
              >
                Private Sport
              </span>

              {/* SIDOARJO - smaller, clean white ghost */}
              <span
                className="block"
                style={{
                  fontSize: 'clamp(1.6rem, 3.5vw, 3rem)',
                  letterSpacing: '0.4em',
                  lineHeight: 1.4,
                  color: 'rgba(244,246,248,0.35)',
                  WebkitTextStroke: '1px rgba(244,246,248,0.4)',
                  fontWeight: 300,
                }}
              >
                Sidoarjo
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-neutral-light/60 text-sm md:text-base max-w-xl mt-6 mb-10 uppercase font-semibold tracking-[0.15em]">
              {tagline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/pendaftaran?cabang=Basket"
                className="btn-accent group relative text-sm px-8 py-4"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">🏀</span>
                  <span>Daftar Basket</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </Link>
              <Link
                href="/pendaftaran?cabang=Renang"
                className="btn-primary group relative text-sm px-8 py-4"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  <span className="text-lg">🏊</span>
                  <span>Daftar Renang</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Stats: Scoreboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 animate-fade-in relative z-20">
            <Link href="/atlet" className="scoreboard-card text-center group block cursor-pointer">
              <div className="scoreboard-glow-basket opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Total Anggota</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-basket animate-count-up">{stats.total}</div>
            </Link>
            <Link href="/prestasi" className="scoreboard-card text-center group block cursor-pointer">
              <div className="scoreboard-glow-renang opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Prestasi Club</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-renang animate-count-up">{prestasiCount > 0 ? `${prestasiCount}+` : '0'}</div>
            </Link>
            <Link href="/atlet?cabang=Basket" className="scoreboard-card text-center group block cursor-pointer">
              <div className="scoreboard-glow-basket opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Atlet Basket</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-basket animate-count-up">{stats.basket}</div>
            </Link>
            <Link href="/atlet?cabang=Renang" className="scoreboard-card text-center group block cursor-pointer">
              <div className="scoreboard-glow-renang opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Atlet Renang</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-renang animate-count-up">{stats.renang}</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CABANG OLAHRAGA ===== */}
      <section className="py-32 relative overflow-hidden bg-arena-900">
        <div className="divider-court mb-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <p className="text-basket text-[11px] font-bold uppercase tracking-[0.2em] mb-4">PILIH CABANG</p>
            <h2 className="font-display text-5xl md:text-6xl text-neutral-light tracking-wide uppercase">Cabang <span className="text-neutral-light/30">Olahraga</span></h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Basket Card */}
            <div className="glass-card-hover border-transparent bg-arena-800 group relative overflow-hidden rounded-none cursor-pointer p-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <div className="absolute inset-0 texture-parquet opacity-5 group-hover:opacity-15 transition-opacity duration-500 mix-blend-overlay" />
              <div className="absolute inset-y-0 left-0 w-1 bg-basket" />

              <div className="relative z-10 flex flex-col h-full transform group-hover:translate-z-10 group-hover:scale-[1.02] transition-transform duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-basket text-[11px] font-bold uppercase tracking-[0.2em] mb-2">COURT</p>
                    <h3 className="font-display text-5xl text-neutral-light uppercase tracking-wider">Basket</h3>
                  </div>
                  <div className="w-32 md:w-40 relative rounded-2xl shadow-xl shadow-basket/10 border border-white/20 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-[0_10px_30px_rgba(255,107,0,0.3)] transition-all duration-500 bg-white px-4 py-3 flex items-center justify-center">
                    <Image src={basketLogo} alt="Logo Basket" className="w-full h-auto object-contain drop-shadow-sm" />
                  </div>
                </div>
                <p className="text-neutral-light/70 mb-12 text-lg leading-relaxed flex-grow">
                  Program latihan intensif dan komprehensif dari level pemula hingga profesional di lapangan indoor standar nasional.
                </p>
                <div className="flex gap-4 mt-auto">
                  <Link href="/pendaftaran?cabang=Basket" className="btn-accent flex-1 justify-center text-lg uppercase tracking-widest font-bold rounded-none">Daftar Basket</Link>
                </div>
              </div>
            </div>

            {/* Renang Card */}
            <div className="glass-card-hover border-transparent bg-arena-800 group relative overflow-hidden rounded-none cursor-pointer p-12 transition-all duration-500" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <div className="absolute inset-0 texture-water opacity-5 group-hover:opacity-15 transition-opacity duration-500 mix-blend-overlay" />
              <div className="absolute inset-y-0 left-0 w-1 bg-renang" />

              <div className="relative z-10 flex flex-col h-full transform group-hover:translate-z-10 group-hover:scale-[1.02] transition-transform duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-renang text-[11px] font-bold uppercase tracking-[0.2em] mb-2">POOL</p>
                    <h3 className="font-display text-5xl text-neutral-light uppercase tracking-wider">Renang</h3>
                  </div>
                  <div className="w-32 md:w-40 relative rounded-2xl shadow-xl shadow-renang/10 border border-white/20 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-[0_10px_30px_rgba(0,194,203,0.3)] transition-all duration-500 bg-white px-4 py-3 flex items-center justify-center">
                    <Image src={swimLogo} alt="Logo Renang" className="w-full h-auto object-contain drop-shadow-sm" />
                  </div>
                </div>
                <p className="text-neutral-light/70 mb-12 text-lg leading-relaxed flex-grow">
                  Fasilitas kolam renang modern dengan pelatih bersertifikat. Fokus pada teknik, stamina, dan pencapaian waktu terbaik.
                </p>
                <div className="flex gap-4 mt-auto">
                  <Link href="/pendaftaran?cabang=Renang" className="btn-primary flex-1 justify-center text-lg uppercase tracking-widest font-bold rounded-none">Daftar Renang</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="divider-lane mt-32" />
      </section>

      {/* ===== PRESTASI TERBARU ===== */}
      <section className="py-24 relative overflow-hidden bg-arena-900 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
                <Trophy className="w-4 h-4 text-primary-400" />
                <span className="text-primary-400 text-xs font-bold uppercase tracking-wider">Hall of Fame</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-neutral-light tracking-wide uppercase">Prestasi <span className="text-primary-400">Terbaru</span></h2>
            </div>
            <Link href="/prestasi" className="btn-secondary group">
              Lihat Semua Prestasi 
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {featuredPrestasi.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPrestasi.map((p, i) => (
                <div key={p.id} className="group glass-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden bg-arena-800">
                    <Image 
                      src={p.foto_url} 
                      alt={p.judul_prestasi}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-arena-900/90 to-transparent opacity-80" />
                    
                    <div className="absolute top-3 right-3 flex gap-1">
                      {p.is_featured && (
                        <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-lg">
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${p.kategori === 'Basket' ? 'bg-basket/90 text-white' : 'bg-renang/90 text-white'}`}>
                        {p.kategori}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 relative">
                    <div className="absolute -top-5 left-5">
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-lg backdrop-blur-md bg-opacity-90 ${
                        p.tingkat === 'kota' ? 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30' :
                        p.tingkat === 'provinsi' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        p.tingkat === 'nasional' ? 'bg-basket/20 text-basket border-basket/30' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        Tingkat {p.tingkat}
                      </div>
                    </div>
                    
                    <h3 className="font-display font-bold text-lg text-white mt-3 mb-1 leading-snug line-clamp-2 group-hover:text-primary-400 transition-colors">
                      {p.judul_prestasi}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-medium text-neutral-light/80 truncate pr-2">
                        {p.nama_atlet}
                      </p>
                      <span className="text-xs font-bold text-primary-500/70 shrink-0">
                        {p.tahun}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 glass-card rounded-2xl border border-white/5">
              <Trophy className="w-12 h-12 text-neutral-light/20 mx-auto mb-3" />
              <p className="text-neutral-light/50">Belum ada data prestasi yang dapat ditampilkan.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== KEUNGGULAN ===== */}
      <section className="py-24 bg-arena-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-5xl text-neutral-light tracking-wide uppercase">Mengapa <span className="text-neutral-light/30">Barqignite?</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {[
              { icon: Shield, title: 'Pelatih Ahli', desc: 'Dilatih langsung oleh profesional bersertifikat resmi.', color: 'text-basket' },
              { icon: Target, title: 'Standar Nasional', desc: 'Fasilitas lapangan & kolam renang berstandar kompetisi.', color: 'text-renang' },
              { icon: Flame, title: 'DNA Kompetitif', desc: 'Rutin berkompetisi di liga dan kejuaraan regional.', color: 'text-basket' },
              { icon: Zap, title: 'Sistem Terpadu', desc: 'Manajemen digital untuk memantau absensi & performa.', color: 'text-renang' },
            ].map((f, i) => (
              <div key={i} className="group text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-arena-900 border border-neutral-light/5 mb-6 group-hover:scale-110 transition-transform duration-500">
                  <f.icon className={`w-8 h-8 ${f.color}`} />
                </div>
                <h3 className="font-display text-2xl text-neutral-light mb-4 uppercase tracking-wide">{f.title}</h3>
                <p className="text-neutral-light/60 text-[15px] leading-[1.6] max-w-[250px] mx-auto">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KONTAK & SOSIAL MEDIA ===== */}
      <section className="py-24 bg-arena-900 border-t border-neutral-light/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-neutral-light tracking-wide uppercase">
              Hubungi <span className="text-neutral-light/30">Kami</span>
            </h2>
            <p className="text-neutral-light/60 mt-4 max-w-2xl mx-auto">
              Punya pertanyaan lebih lanjut atau butuh bantuan pendaftaran? Tim admin kami siap membantu Anda!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* WhatsApp */}
            <a href={waLink} target="_blank" rel="noreferrer" className="glass-card-hover bg-arena-800 p-8 flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-light mb-2">WhatsApp / CP</h3>
              <p className="text-neutral-light/60 text-sm">{noWa || 'Belum ada nomor'}</p>
            </a>

            {/* Instagram */}
            <a href={igLink} target="_blank" rel="noreferrer" className="glass-card-hover bg-arena-800 p-8 flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Instagram className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-light mb-2">Instagram</h3>
              <p className="text-neutral-light/60 text-sm">{instagram || 'Belum ada IG'}</p>
            </a>

            {/* Email */}
            <a href={`mailto:${email}`} className="glass-card-hover bg-arena-800 p-8 flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-light mb-2">Email</h3>
              <p className="text-neutral-light/60 text-sm">{email || 'Belum ada email'}</p>
            </a>

            {/* Alamat */}
            <div className="glass-card-hover bg-arena-800 p-8 flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-light mb-2">Alamat</h3>
              <p className="text-neutral-light/60 text-sm">{alamat || 'Belum ada alamat'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING WHATSAPP BUTTON */}
      {noWa && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110 animate-fade-in"
          title="Hubungi Kami via WhatsApp"
        >
          <Phone className="w-6 h-6" />
        </a>
      )}
    </>
  );
}
