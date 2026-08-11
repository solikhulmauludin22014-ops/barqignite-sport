'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Award, Medal, Loader2, Calendar } from 'lucide-react';
import type { Prestasi } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export default function PrestasiPage() {
  const [data, setData] = useState<Prestasi[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<string>('');
  const [filterTingkat, setFilterTingkat] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Kita fetch semua data prestasi sekali, lalu difilter di client agar sangat cepat tanpa reload
      const { data: prestasiData, error } = await supabase
        .from('prestasi')
        .select('*')
        .order('urutan', { ascending: true })
        .order('tahun', { ascending: false });

      if (error) throw error;
      setData(prestasiData || []);
    } catch (error) {
      console.error('Error fetching prestasi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ekstrak tahun unik untuk dropdown
  const availableYears = useMemo(() => {
    const years = new Set(data.map(p => p.tahun));
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  // Filter & Pemisahan data
  const filteredData = useMemo(() => {
    return data.filter(p => {
      const matchKategori = filterKategori ? p.kategori === filterKategori : true;
      const matchTahun = filterTahun ? String(p.tahun) === filterTahun : true;
      const matchTingkat = filterTingkat ? p.tingkat === filterTingkat : true;
      return matchKategori && matchTahun && matchTingkat;
    });
  }, [data, filterKategori, filterTahun, filterTingkat]);

  // Pisahkan Featured dan Reguler
  const featured = filteredData.filter(p => p.is_featured);
  const reguler = filteredData.filter(p => !p.is_featured);

  // Konfigurasi Badge Tingkat
  const getBadgeConfig = (tingkat: string) => {
    switch (tingkat) {
      case 'kota': return { bg: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30', label: 'Tingkat Kota' };
      case 'provinsi': return { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Tingkat Provinsi' };
      case 'nasional': return { bg: 'bg-basket/20 text-basket border-basket/30', label: 'Tingkat Nasional' };
      case 'internasional': return { bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Tingkat Internasional' };
      default: return { bg: 'bg-neutral-light/10 text-neutral-light/70', label: tingkat };
    }
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-arena-900">
        <div className="absolute inset-0 bg-gradient-to-b from-arena-600/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 animate-fade-in">
            <Trophy className="w-4 h-4 text-primary-400" />
            <span className="text-primary-400 text-xs font-bold uppercase tracking-wider">Hall of Fame</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-neutral-light mb-6 uppercase tracking-wide animate-slide-up">
            Prestasi <span className="text-primary-400">Kami</span>
          </h1>
          <p className="text-neutral-light/60 text-lg md:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Jejak kemenangan dan dedikasi atlet Barqignite Private Sport di berbagai tingkat kompetisi.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-arena-800 border-b border-white/5 sticky top-20 z-40 backdrop-blur-xl bg-arena-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Cabang Toggle */}
            <div className="flex p-1 bg-arena-900 rounded-full border border-white/10 overflow-x-auto w-full md:w-auto">
              <button 
                onClick={() => setFilterKategori('')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap ${filterKategori === '' ? 'bg-primary-500 text-white shadow-lg' : 'text-neutral-light/50 hover:text-neutral-light hover:bg-white/5'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setFilterKategori('Basket')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap ${filterKategori === 'Basket' ? 'bg-basket text-white shadow-lg shadow-basket/20' : 'text-basket/50 hover:text-basket hover:bg-basket/10'}`}
              >
                Basket
              </button>
              <button 
                onClick={() => setFilterKategori('Renang')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap ${filterKategori === 'Renang' ? 'bg-renang text-white shadow-lg shadow-renang/20' : 'text-renang/50 hover:text-renang hover:bg-renang/10'}`}
              >
                Renang
              </button>
            </div>

            {/* Dropdowns */}
            <div className="flex gap-3 w-full md:w-auto">
              <select 
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="flex-1 md:w-40 bg-arena-900 border border-white/10 text-neutral-light text-sm rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                <option value="">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select 
                value={filterTingkat}
                onChange={(e) => setFilterTingkat(e.target.value)}
                className="flex-1 md:w-48 bg-arena-900 border border-white/10 text-neutral-light text-sm rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                <option value="">Semua Tingkat</option>
                <option value="kota">Tingkat Kota/Kab</option>
                <option value="provinsi">Tingkat Provinsi</option>
                <option value="nasional">Tingkat Nasional</option>
                <option value="internasional">Tingkat Internasional</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-arena-900 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {loading ? (
            // Skeleton Loader
            <div className="space-y-12">
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-white/5 rounded-lg mb-6"></div>
                <div className="grid md:grid-cols-2 gap-8">
                  {[1, 2].map(i => (
                    <div key={i} className="h-64 bg-white/5 rounded-3xl"></div>
                  ))}
                </div>
              </div>
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-white/5 rounded-lg mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-80 bg-white/5 rounded-3xl"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            // Empty State
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-neutral-light/20" />
              </div>
              <h3 className="font-display text-2xl font-bold text-neutral-light mb-2">Belum Ada Prestasi</h3>
              <p className="text-neutral-light/50 max-w-md mx-auto">
                Belum ada data prestasi yang cocok dengan filter yang Anda pilih. Coba sesuaikan filter kategori atau tahun.
              </p>
              <button 
                onClick={() => { setFilterKategori(''); setFilterTahun(''); setFilterTingkat(''); }}
                className="mt-6 px-6 py-2.5 rounded-full border border-white/10 text-sm font-bold text-neutral-light/70 hover:text-neutral-light hover:bg-white/5 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-20 animate-fade-in">
              
              {/* Highlight / Featured Section */}
              {featured.length > 0 && (
                <div>
                  <h2 className="font-display text-3xl font-bold text-neutral-light mb-8 flex items-center gap-3">
                    <Medal className="w-8 h-8 text-yellow-400" /> Highlight Prestasi
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {featured.map((p, i) => (
                      <div key={p.id} className="group relative rounded-3xl overflow-hidden bg-arena-800 border border-white/5 shadow-2xl animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={p.foto_url} 
                            alt={p.judul_prestasi}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-arena-900 via-arena-900/40 to-transparent" />
                          
                          <div className="absolute top-4 right-4 flex gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.kategori === 'Basket' ? 'bg-basket text-white' : 'bg-renang text-white'}`}>
                              {p.kategori}
                            </span>
                          </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeConfig(p.tingkat).bg}`}>
                              {getBadgeConfig(p.tingkat).label}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full">
                              <Calendar className="w-3.5 h-3.5" /> {p.tahun}
                            </span>
                          </div>
                          
                          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                            {p.judul_prestasi}
                          </h3>
                          <p className="text-neutral-light/80 font-medium text-lg mb-3">
                            Atlet: <span className="text-primary-300">{p.nama_atlet}</span>
                          </p>
                          {p.deskripsi && (
                            <p className="text-neutral-light/50 text-sm line-clamp-2">
                              {p.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {reguler.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-neutral-light mb-8 flex items-center gap-3">
                    <Award className="w-6 h-6 text-primary-400" /> {featured.length > 0 ? 'Prestasi Lainnya' : 'Semua Prestasi'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {reguler.map((p, i) => (
                      <div key={p.id} className="group glass-card border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="relative h-56 overflow-hidden bg-arena-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={p.foto_url} 
                            alt={p.judul_prestasi}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-arena-900/90 to-transparent opacity-80" />
                          
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${p.kategori === 'Basket' ? 'bg-basket/90 text-white' : 'bg-renang/90 text-white'}`}>
                              {p.kategori}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-5 relative">
                          <div className="absolute -top-6 left-5">
                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-lg backdrop-blur-md ${getBadgeConfig(p.tingkat).bg} bg-opacity-90`}>
                              {getBadgeConfig(p.tingkat).label}
                            </div>
                          </div>
                          
                          <h3 className="font-display font-bold text-lg text-white mt-2 mb-1 leading-snug line-clamp-2 group-hover:text-primary-400 transition-colors">
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
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
