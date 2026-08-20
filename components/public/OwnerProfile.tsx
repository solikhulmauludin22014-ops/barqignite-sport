import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Play, Instagram, Phone } from 'lucide-react';
import type { Jadwal } from '@/types';

async function getNextSchedule(): Promise<Jadwal | null> {
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

export default async function OwnerProfile() {
  const nextSchedule = await getNextSchedule();

  return (
    <section className="relative w-full overflow-hidden bg-white dark:bg-arena-900 flex items-center justify-center py-20 min-h-[800px] md:min-h-[700px]">
      {/* 
        ========================================================================
        BACKGROUND TYPOGRAPHY (GIANT TEXT)
        ========================================================================
      */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <h2 
          className="font-display font-black text-neutral-light/5 text-center leading-[0.8] tracking-tighter"
          style={{ fontSize: 'clamp(150px, 25vw, 400px)' }}
        >
          COACH<br />NAFIS
        </h2>
      </div>

      {/* 
        ========================================================================
        GIANT OUTLINE NUMBER
        ========================================================================
      */}
      <div className="absolute top-10 right-4 md:right-20 z-0 pointer-events-none opacity-20">
        <span 
          className="font-display font-black text-transparent text-neutral-light"
          style={{ 
            fontSize: 'clamp(100px, 15vw, 200px)',
            WebkitTextStrokeWidth: '2px',
            WebkitTextStrokeColor: 'currentColor',
            lineHeight: 1
          }}
        >
          24
        </span>
      </div>

      {/* 
        ========================================================================
        MINI NAVBAR (HEADER)
        ========================================================================
      */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-10 z-30 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-neutral-light/10 backdrop-blur-md flex items-center justify-center border border-neutral-light/20">
            <span className="font-display font-black text-neutral-light text-xl">B</span>
          </div>
          <div>
            <h3 className="type-card-title text-neutral-light leading-none">Barqiyyah Nafis</h3>
            <p className="text-basket text-[10px] font-bold uppercase tracking-widest mt-1">Founder & Head Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="https://instagram.com/barqignite" target="_blank" className="w-10 h-10 rounded-full bg-neutral-light/5 border border-neutral-light/10 flex items-center justify-center text-neutral-light hover:bg-basket hover:border-basket hover:text-white transition-colors">
            <Instagram className="w-4 h-4" />
          </Link>
          <Link href="#" className="w-10 h-10 rounded-full bg-neutral-light/5 border border-neutral-light/10 flex items-center justify-center text-neutral-light hover:bg-renang hover:border-renang hover:text-white transition-colors">
            <Phone className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-20 h-full flex flex-col md:flex-row items-center justify-center mt-24 md:mt-0">
        
        {/* 
          ========================================================================
          QUOTE (LEFT SIDE)
          ========================================================================
        */}
        <div className="md:absolute md:left-10 md:top-1/4 w-full max-w-sm mb-10 md:mb-0 z-30 text-center md:text-left">
          <div className="text-6xl text-basket/30 font-display leading-none mb-2 md:-ml-4">"</div>
          <p className="text-lg md:text-xl text-neutral-light/90 font-medium leading-relaxed font-sans mb-4">
            Membentuk karakter pemenang tidak hanya di lapangan, tapi dalam setiap aspek kehidupan. Dedikasi adalah kuncinya.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-8 h-[2px] bg-basket"></div>
            <span className="type-label text-basket">Coach Nafis</span>
          </div>
        </div>

        {/* 
          ========================================================================
          CENTER CUTOUT IMAGE
          ========================================================================
        */}
        <div className="relative w-full max-w-lg md:max-w-2xl h-[500px] md:h-[700px] z-20 flex justify-center items-end">
          {/* Fallback gradient behind image if cutout is not perfect */}
          <div className="absolute bottom-0 w-3/4 h-1/2 bg-gradient-to-t from-arena-900 to-transparent z-10 pointer-events-none blur-xl"></div>
          
          <div className="absolute inset-0 z-20" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
            <Image 
              src="/fd0532d7-593a-43e9-a3e4-d7060080119c.png" 
              alt="Coach Barqiyyah Nafis"
              fill
              className="object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
              priority
            />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-basket to-transparent blur-[2px] opacity-70 z-20"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-basket/50 to-transparent z-20"></div>
        </div>

        {/* 
          ========================================================================
          BOTTOM CARDS (MOBILE: STACKED, DESKTOP: ABSOLUTE SIDES)
          ========================================================================
        */}
        <div className="w-full flex flex-col sm:flex-row justify-between gap-4 mt-10 md:mt-0 md:absolute md:bottom-10 md:left-10 md:right-10 z-30">
          
          {/* Gallery Thumbnail (Left Bottom) */}
          <Link href="/#galeri" className="glass-card-hover border border-neutral-light/10 bg-white/80 dark:bg-arena-800/80 backdrop-blur-xl p-3 rounded-2xl flex items-center gap-4 w-full sm:w-auto md:max-w-xs group cursor-pointer shadow-xl">
            <div className="w-16 h-16 rounded-xl bg-neutral-light/5 flex items-center justify-center shrink-0 border border-neutral-light/10 group-hover:border-basket transition-colors">
              <Play className="w-6 h-6 text-basket/70 group-hover:text-basket" />
            </div>
            <div>
              <p className="type-label text-basket mb-1">Dokumentasi</p>
              <h4 className="font-bold text-neutral-light text-sm leading-tight group-hover:text-basket transition-colors">Lihat Galeri Latihan & Event</h4>
            </div>
          </Link>

          {/* Next Schedule (Right Bottom) */}
          {nextSchedule ? (
            <Link href="/jadwal" className="glass-card-hover border border-neutral-light/10 bg-white/80 dark:bg-arena-800/80 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 w-full sm:w-auto md:max-w-xs group cursor-pointer shadow-xl">
              <div className="w-12 h-12 rounded-full bg-neutral-light/5 flex items-center justify-center shrink-0 border border-neutral-light/10 group-hover:border-renang transition-colors">
                <Calendar className="w-5 h-5 text-neutral-light" />
              </div>
              <div>
                <p className="type-label text-renang mb-1">Latihan Berikutnya</p>
                <h4 className="font-bold text-neutral-light text-sm leading-tight group-hover:text-renang transition-colors">
                  {nextSchedule.cabang_olahraga} — {nextSchedule.hari} {nextSchedule.jam_mulai}
                </h4>
              </div>
            </Link>
          ) : (
            <Link href="/jadwal" className="glass-card-hover border border-neutral-light/10 bg-white/80 dark:bg-arena-800/80 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 w-full sm:w-auto md:max-w-xs group cursor-pointer shadow-xl">
              <div className="w-12 h-12 rounded-full bg-neutral-light/5 flex items-center justify-center shrink-0 border border-neutral-light/10 group-hover:border-renang transition-colors">
                <Calendar className="w-5 h-5 text-neutral-light" />
              </div>
              <div>
                <p className="type-label text-renang mb-1">Jadwal Terkini</p>
                <h4 className="font-bold text-neutral-light text-sm leading-tight group-hover:text-renang transition-colors">
                  Cek Jadwal Latihan Club
                </h4>
              </div>
            </Link>
          )}

        </div>
      </div>
    </section>
  );
}
