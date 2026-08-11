import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { User, Award, Calendar, MapPin, Activity, GraduationCap, Trophy } from 'lucide-react';
import type { Anggota, Prestasi } from '@/types';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Atlet',
  description: 'Daftar atlet yang tergabung dalam club kami.',
};

export const revalidate = 0;

export default async function AtletPage({
  searchParams,
}: {
  searchParams: Promise<{ cabang?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cabang = resolvedSearchParams.cabang;
  const filter = resolvedSearchParams.filter;

  let athletes: Anggota[] = [];
  let achievements: Prestasi[] = [];
  let hasError = false;

  try {
    if (filter === 'prestasi') {
      let query = supabase.from('prestasi').select('*');
      if (cabang) {
        query = query.eq('kategori', cabang);
      }
      const { data, error } = await query.order('urutan', { ascending: true });
      if (error) throw error;
      achievements = data || [];
    } else {
      let query = supabase.from('anggota').select('*').eq('status', 'Aktif');
      if (cabang) {
        query = query.eq('cabang_olahraga', cabang);
      }
      const { data, error } = await query;
      if (error) throw error;
      athletes = data || [];
    }
  } catch (e) {
    console.error('Error fetching data for atlet page:', e);
    hasError = true;
  }

  return (
    <div className="min-h-screen pt-20">
      <section className="relative py-20 overflow-hidden bg-arena-900">
        <div className="absolute inset-0 bg-gradient-to-b from-arena-600/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-black text-neutral-light mb-4 uppercase tracking-wide">
            Data <span className={cabang === 'Basket' ? 'text-basket' : cabang === 'Renang' ? 'text-renang' : 'text-gradient'}>Atlet</span>
            {cabang && ` ${cabang}`}
            {filter === 'prestasi' && ' Berprestasi'}
          </h1>
          <p className="text-neutral-light/60 text-lg mb-8 max-w-2xl mx-auto">
            {filter === 'prestasi' 
              ? 'Mengenal lebih dekat para atlet berprestasi kami yang telah mengharumkan nama club.'
              : 'Mengenal lebih dekat para atlet kami yang berdedikasi tinggi dan penuh semangat.'}
          </p>
          
          <div className="flex justify-center gap-4">
            <Link href="/atlet" className={`px-4 py-2 text-sm font-medium border border-neutral-light/20 rounded-full transition-colors ${!cabang && !filter ? 'bg-neutral-light text-arena-900' : 'text-neutral-light hover:bg-neutral-light/10'}`}>
              Semua Atlet
            </Link>
            <Link href="/atlet?cabang=Basket" className={`px-4 py-2 text-sm font-medium border border-basket/20 rounded-full transition-colors ${cabang === 'Basket' && !filter ? 'bg-basket text-white' : 'text-basket hover:bg-basket/10'}`}>
              Basket
            </Link>
            <Link href="/atlet?cabang=Renang" className={`px-4 py-2 text-sm font-medium border border-renang/20 rounded-full transition-colors ${cabang === 'Renang' && !filter ? 'bg-renang text-white' : 'text-renang hover:bg-renang/10'}`}>
              Renang
            </Link>
            <Link href="/atlet?filter=prestasi" className={`px-4 py-2 text-sm font-medium border border-primary-500/20 rounded-full transition-colors ${filter === 'prestasi' && !cabang ? 'bg-primary-500 text-white' : 'text-primary-400 hover:bg-primary-500/10'}`}>
              Berprestasi
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-arena-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {hasError ? (
            <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-lg">Gagal memuat data atlet.</div>
          ) : filter === 'prestasi' ? (
            achievements.length === 0 ? (
              <div className="text-center text-neutral-light/50 py-12">Belum ada data atlet berprestasi{cabang ? ` untuk cabang ${cabang}` : ''}.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {achievements.map((prestasi) => (
                  <div key={prestasi.id} className="glass-card border border-neutral-light/10 hover:border-neutral-light/30 transition-all duration-300 rounded-2xl overflow-hidden group">
                    <div className="relative h-48 bg-arena-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={prestasi.foto_url} 
                        alt={prestasi.judul_prestasi}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-arena-900 via-transparent to-transparent opacity-90" />
                      
                      <div className="absolute top-4 right-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${prestasi.kategori === 'Basket' ? 'bg-basket text-white' : 'bg-renang text-white'}`}>
                          {prestasi.kategori}
                        </span>
                      </div>
                      
                      {prestasi.is_featured && (
                        <div className="absolute top-4 left-4 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <Trophy className="w-3 h-3" /> Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="relative pt-6 pb-6 px-6 bg-arena-800 -mt-8 rounded-t-3xl z-10">
                      <h3 className="font-display text-xl font-bold text-neutral-light mb-1">{prestasi.nama_atlet}</h3>
                      <div className="flex items-center gap-2 text-sm text-primary-400 font-medium mb-4">
                        <Trophy className="w-4 h-4 text-primary-400" />
                        <span>{prestasi.judul_prestasi} ({prestasi.tahun})</span>
                      </div>

                      <div className="bg-arena-900/50 rounded-xl p-4 border border-white/5">
                        <h4 className="text-xs font-bold uppercase text-neutral-light/50 mb-2 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          Tingkat {prestasi.tingkat}
                        </h4>
                        <p className="text-sm text-neutral-light/70 leading-relaxed">
                          {prestasi.deskripsi || `Meraih prestasi tingkat ${prestasi.tingkat} pada cabang olahraga ${prestasi.kategori}.`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            athletes.length === 0 ? (
              <div className="text-center text-neutral-light/50 py-12">Belum ada data atlet{cabang ? ` untuk cabang ${cabang}` : ''}.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-arena-900/50">
                <table className="w-full text-left text-sm text-neutral-light/70">
                  <thead className="bg-arena-800 text-xs uppercase text-neutral-light/50 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-bold">No</th>
                      <th className="px-6 py-4 font-bold">Nama Atlet</th>
                      <th className="px-6 py-4 font-bold">Cabang Olahraga</th>
                      <th className="px-6 py-4 font-bold">Kategori</th>
                      <th className="px-6 py-4 font-bold">Asal Sekolah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athletes.map((atlet, index) => (
                      <tr key={atlet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-neutral-light">{atlet.nama}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${atlet.cabang_olahraga === 'Basket' ? 'bg-basket/10 text-basket' : 'bg-renang/10 text-renang'}`}>
                            {atlet.cabang_olahraga}
                          </span>
                        </td>
                        <td className="px-6 py-4">{atlet.kategori}</td>
                        <td className="px-6 py-4">{(atlet as any).asal_sekolah || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
