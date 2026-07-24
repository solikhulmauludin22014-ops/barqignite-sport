import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Trophy, Users, Target, Waves, Calendar, Shield, Flame, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Beranda — Barqignite Private Sport Sidoarjo',
  description: 'Club olahraga Basket & Renang terbaik di Sidoarjo. Bergabunglah dan raih prestasi bersama Barqignite Private Sport.',
};

async function getBranding() {
  try {
    const { data, error } = await supabase.from('branding').select('*').single();
    if (error) return null;
    return data;
  } catch { return null; }
}

async function getStats() {
  try {
    const { count: basket } = await supabase.from('anggota').select('*', { count: 'exact', head: true }).eq('status', 'Aktif').eq('cabang_olahraga', 'Basket');
    const { count: renang } = await supabase.from('anggota').select('*', { count: 'exact', head: true }).eq('status', 'Aktif').eq('cabang_olahraga', 'Renang');
    return { basket: basket || 0, renang: renang || 0, total: (basket || 0) + (renang || 0) };
  } catch { return { basket: 0, renang: 0, total: 0 }; }
}

export default async function BerandaPage() {
  const [branding, stats] = await Promise.all([getBranding(), getStats()]);

  const tagline = branding?.tagline || 'Membentuk Atlet Basket & Renang Berprestasi';
  const jumlahPrestasi = branding?.jumlah_prestasi || '30+';

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
          <div className="text-center animate-slide-up mt-10">
            <h1 className="font-display text-[4rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] font-normal leading-[0.95] text-neutral-light tracking-widest uppercase mb-6 mix-blend-difference">
              <span className="text-basket">Barqignite</span>
              <br />
              <span className="text-renang">Private Sport</span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-light/70 max-w-2xl mx-auto tracking-wide mb-12 uppercase font-bold text-sm">
              {tagline}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/pendaftaran?cabang=Basket" className="btn-accent text-lg px-10 py-5">
                Gabung Basket
              </Link>
              <Link href="/pendaftaran?cabang=Renang" className="btn-primary text-lg px-10 py-5">
                Gabung Renang
              </Link>
            </div>
          </div>

          {/* Stats: Scoreboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 animate-fade-in relative z-20">
            <div className="scoreboard-card text-center group">
              <div className="scoreboard-glow-basket opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Total Anggota</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-basket animate-count-up">{stats.total > 0 ? stats.total : '200'}</div>
            </div>
            <div className="scoreboard-card text-center group">
              <div className="scoreboard-glow-renang opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Prestasi Club</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-renang animate-count-up">{jumlahPrestasi}</div>
            </div>
            <div className="scoreboard-card text-center group">
              <div className="scoreboard-glow-basket opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Atlet Basket</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-basket animate-count-up">{stats.basket > 0 ? stats.basket : '120'}</div>
            </div>
            <div className="scoreboard-card text-center group">
              <div className="scoreboard-glow-renang opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="text-neutral-light/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Atlet Renang</div>
              <div className="scoreboard-value text-5xl md:text-6xl text-renang animate-count-up">{stats.renang > 0 ? stats.renang : '80'}</div>
            </div>
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
                <p className="text-basket text-[11px] font-bold uppercase tracking-[0.2em] mb-2">COURT</p>
                <h3 className="font-display text-5xl text-neutral-light mb-6 uppercase tracking-wider">Basket</h3>
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
                <p className="text-renang text-[11px] font-bold uppercase tracking-[0.2em] mb-2">POOL</p>
                <h3 className="font-display text-5xl text-neutral-light mb-6 uppercase tracking-wider">Renang</h3>
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
    </>
  );
}
