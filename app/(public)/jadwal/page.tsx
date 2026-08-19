import type { Metadata } from 'next';
import { Calendar, Clock, MapPin, Trophy, Filter, Target, Waves } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Jadwal } from '@/types';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Jadwal Latihan',
  description: 'Jadwal latihan mingguan dan pertandingan/event mendatang.',
};

async function getJadwal(): Promise<Jadwal[]> {
  try {
    const { data, error } = await supabase.from('jadwal').select('*');
    if (error) return [];
    return data || [];
  } catch { return []; }
}

const hariColors: Record<string, string> = {
  Senin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Selasa: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Rabu: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Kamis: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Jumat: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Sabtu: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Minggu: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default async function JadwalPage(props: { searchParams: Promise<{ cabang?: string }> }) {
  const searchParams = await props.searchParams;
  const filterCabang = searchParams?.cabang;

  const jadwalData = await getJadwal();
  
  let rawData = jadwalData;
  
  if (filterCabang && (filterCabang === 'Basket' || filterCabang === 'Renang')) {
    rawData = rawData.filter(j => j.cabang_olahraga === filterCabang);
  }

  const jadwalLatihan = rawData.filter((j) => j.jenis === 'Latihan');
  const jadwalTanding = rawData.filter((j) => j.jenis === 'Pertandingan');

  // Urutkan hari
  const orderHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  jadwalLatihan.sort((a, b) => orderHari.indexOf(a.hari) - orderHari.indexOf(b.hari));

  const filterColor = filterCabang === 'Basket' ? 'basket' : filterCabang === 'Renang' ? 'renang' : 'white';

  return (
    <div className="min-h-screen pt-20 pb-20 relative">
      {/* Texture Background */}
      <div className={`absolute inset-0 opacity-5 pointer-events-none ${filterCabang === 'Basket' ? 'texture-parquet' : filterCabang === 'Renang' ? 'texture-water' : 'texture-parquet'}`} />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center gap-2 bg-${filterColor}/10 border border-${filterColor}/20 rounded-full px-4 py-2 text-sm text-${filterColor} font-bold tracking-widest uppercase mb-6`}>
            <Calendar className="w-4 h-4" />
            <span>Jadwal Kegiatan</span>
          </div>
          <h1 className="type-page-title text-neutral-light mb-6">
            Jadwal <span className={`text-${filterColor}`}>{filterCabang ? filterCabang : 'Latihan'}</span>
          </h1>
          
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/jadwal" className={`px-6 py-2 rounded-xl font-bold uppercase tracking-widest border transition-all ${!filterCabang ? 'bg-neutral-light/10 border-neutral-light/20 text-neutral-light' : 'border-transparent text-neutral-light/50 hover:text-neutral-light'}`}>
              Semua
            </Link>
            <Link href="/jadwal?cabang=Basket" className={`px-6 py-2 rounded-xl font-bold uppercase tracking-widest border transition-all ${filterCabang === 'Basket' ? 'bg-basket/20 border-basket/40 text-basket' : 'border-transparent text-neutral-light/50 hover:text-neutral-light'}`}>
              🏀 Basket
            </Link>
            <Link href="/jadwal?cabang=Renang" className={`px-6 py-2 rounded-xl font-bold uppercase tracking-widest border transition-all ${filterCabang === 'Renang' ? 'bg-renang/20 border-renang/40 text-renang' : 'border-transparent text-neutral-light/50 hover:text-neutral-light'}`}>
              🏊 Renang
            </Link>
          </div>
        </div>
      </section>

      {/* Jadwal Latihan */}
      <section className="py-12 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10 border-b border-neutral-light/10 pb-4">
            <h2 className="type-section-heading text-neutral-light">Latihan Mingguan</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jadwalLatihan.length === 0 ? (
              <p className="text-neutral-light/50 col-span-3 text-center py-10">Tidak ada jadwal latihan.</p>
            ) : (
              jadwalLatihan.map((j) => (
                <div key={j.id} className={`matchday-card ${j.cabang_olahraga === 'Basket' ? 'border-basket' : 'border-renang'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`badge border ${hariColors[j.hari] || 'badge-neutral'} mb-2`}>{j.hari}</span>
                      <h3 className="type-card-title text-neutral-light">{j.kategori}</h3>
                    </div>
                    <div className="text-3xl opacity-20">{j.cabang_olahraga === 'Basket' ? '🏀' : '🏊'}</div>
                  </div>
                  
                  <div className="space-y-3 mt-6 border-t border-neutral-light/10 pt-4">
                    <div className="flex items-center gap-3 text-neutral-light/80">
                      <div className="w-8 h-8 rounded-full bg-neutral-light/5 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-neutral-light/50" />
                      </div>
                      <span className="font-mono text-lg font-bold">{j.jam_mulai} <span className="text-neutral-light/30 text-sm font-sans mx-1">s/d</span> {j.jam_selesai}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-light/80">
                      <div className="w-8 h-8 rounded-full bg-neutral-light/5 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-neutral-light/50" />
                      </div>
                      <span className="font-medium">{j.lokasi}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Jadwal Pertandingan */}
      <section className="py-12 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="divider-court" />
          <div className="flex items-center gap-3 mb-10 border-b border-neutral-light/10 pb-4">
            <h2 className="type-section-heading text-neutral-light">Pertandingan &amp; Event</h2>
          </div>

          {jadwalTanding.length === 0 ? (
            <div className="glass-card border border-neutral-light/10 rounded-2xl p-12 text-center max-w-3xl mx-auto">
              <Trophy className="w-16 h-16 text-neutral-light/20 mx-auto mb-4" />
              <p className="text-neutral-light/40 font-bold uppercase tracking-widest">Belum ada jadwal pertandingan / event</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {jadwalTanding.map((j) => (
                <div key={j.id} className="scoreboard-card group">
                  {j.cabang_olahraga === 'Basket' ? <div className="scoreboard-glow-basket" /> : <div className="scoreboard-glow-renang" />}
                  
                  <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <span className="badge badge-warning">🏆 Tanding</span>
                        <span className={`badge border ${j.cabang_olahraga === 'Basket' ? 'bg-basket/20 text-basket border-basket/30' : 'bg-renang/20 text-renang border-renang/30'}`}>
                          {j.cabang_olahraga}
                        </span>
                      </div>
                      <h3 className="type-section-heading text-neutral-light mb-1">{j.keterangan || 'Matchday'}</h3>
                      <p className="text-neutral-light/50 font-bold tracking-widest uppercase text-sm mb-6">{j.kategori}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-neutral-light/80">
                          <MapPin className={`w-4 h-4 ${j.cabang_olahraga === 'Basket' ? 'text-basket' : 'text-renang'}`} />
                          {j.lokasi}
                        </div>
                        {j.tanggal && (
                          <div className="flex items-center gap-3 text-sm text-neutral-light/80">
                            <Calendar className={`w-4 h-4 ${j.cabang_olahraga === 'Basket' ? 'text-basket' : 'text-renang'}`} />
                            {j.tanggal}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:w-48 bg-arena-800 rounded-xl border border-neutral-light/10 p-4 flex flex-col justify-center items-center text-center">
                      <div className="text-neutral-light/40 text-xs font-bold uppercase tracking-widest mb-2">Kick Off</div>
                      <div className="font-mono text-3xl font-bold text-neutral-light mb-1">{j.jam_mulai}</div>
                      <div className="text-neutral-light/50 text-xs">WIB</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
