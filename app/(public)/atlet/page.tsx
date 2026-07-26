import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { User, Award, Calendar, MapPin, Activity, GraduationCap } from 'lucide-react';
import type { Anggota } from '@/types';
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

  let query = supabase.from('anggota').select('*').eq('status', 'Aktif');

  if (cabang) {
    query = query.eq('cabang_olahraga', cabang);
  }

  const { data: anggotaList, error } = await query;

  const athletes = (anggotaList as Anggota[]) || [];

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
            <Link href="/atlet?cabang=Basket" className={`px-4 py-2 text-sm font-medium border border-basket/20 rounded-full transition-colors ${cabang === 'Basket' ? 'bg-basket text-white' : 'text-basket hover:bg-basket/10'}`}>
              Basket
            </Link>
            <Link href="/atlet?cabang=Renang" className={`px-4 py-2 text-sm font-medium border border-renang/20 rounded-full transition-colors ${cabang === 'Renang' ? 'bg-renang text-white' : 'text-renang hover:bg-renang/10'}`}>
              Renang
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-arena-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-lg">Gagal memuat data atlet.</div>
          ) : athletes.length === 0 ? (
            <div className="text-center text-neutral-light/50 py-12">Belum ada data atlet{cabang ? ` untuk cabang ${cabang}` : ''}.</div>
          ) : (
            filter === 'prestasi' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {athletes.map((atlet) => (
                  <div key={atlet.id} className="glass-card border border-neutral-light/10 hover:border-neutral-light/30 transition-all duration-300 rounded-2xl overflow-hidden group">
                    <div className={`h-24 ${atlet.cabang_olahraga === 'Basket' ? 'bg-basket/20' : 'bg-renang/20'} relative`}>
                      <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 bg-arena-700 border-4 border-arena-800 rounded-full flex items-center justify-center overflow-hidden">
                          {/* Placeholder for Photo */}
                          <User className="w-10 h-10 text-neutral-light/50" />
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${atlet.cabang_olahraga === 'Basket' ? 'bg-basket/20 text-basket' : 'bg-renang/20 text-renang'}`}>
                          {atlet.cabang_olahraga}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-14 pb-6 px-6">
                      <h3 className="font-display text-xl font-bold text-neutral-light mb-1 text-center">{atlet.nama}</h3>
                      <div className="flex items-center justify-center gap-2 text-sm text-neutral-light/70 mb-6">
                        <GraduationCap className="w-4 h-4 text-neutral-light/40" />
                        <span>{(atlet as any).asal_sekolah || '-'}</span>
                      </div>

                      <div className="bg-arena-900/50 rounded-xl p-4 border border-white/5">
                        <h4 className="text-xs font-bold uppercase text-neutral-light/50 mb-2 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          Biografi Singkat
                        </h4>
                        <p className="text-sm text-neutral-light/70 italic leading-relaxed">
                          Atlet {atlet.cabang_olahraga} potensial dengan dedikasi tinggi. Terus mengasah kemampuan di kategori {atlet.kategori} untuk meraih prestasi terbaik.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
