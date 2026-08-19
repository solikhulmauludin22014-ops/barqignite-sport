'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard, AlertCircle, CheckCircle,
  Calendar, Loader2, QrCode, Building2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import useSWR from 'swr';
import type { CabangOlahraga, SppKategori, PengaturanPembayaran, MetodePembayaran } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PembayaranPage() {
  const [cabangFilter, setCabangFilter] = useState<CabangOlahraga>('Basket');
  const [branding, setBranding] = useState<Record<string, string>>({});

  // Fetch Data
  const { data: sppRes } = useSWR('/api/spp_kategori?is_active=true', fetcher);
  const { data: pengRes } = useSWR('/api/pengaturan_pembayaran', fetcher);
  const { data: metodeRes } = useSWR('/api/metode_pembayaran?is_active=true', fetcher);

  const sppList: SppKategori[] = sppRes?.data || [];
  const pengaturan: PengaturanPembayaran = pengRes?.data || { tanggal_jatuh_tempo: 'Tanggal 10 setiap bulan', catatan_keterlambatan: 'Keterlambatan pembayaran mempengaruhi status keaktifan anggota' };
  const metodeList: MetodePembayaran[] = metodeRes?.data || [];

  // Cek Status Pembayaran
  const [checkId, setCheckId] = useState('');
  const [checkData, setCheckData] = useState<{ nama_anggota: string; status_bayar: string; bulan: string; tahun: string; metode_bayar: string }[] | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch('/api/branding').then(r => r.json()).then(j => { if (j.success) setBranding(j.data || {}); });
  }, []);

  // SppData will be filtered in JSX
  const jatuhTempo = pengaturan.tanggal_jatuh_tempo || branding?.jatuh_tempo_spp || 'Tanggal 10 setiap bulan';
  const catatan = pengaturan.catatan_keterlambatan || 'Keterlambatan pembayaran mempengaruhi status keaktifan anggota';

  const handleCekStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkId.trim()) return;
    setChecking(true);
    try {
      const bulanIni = String(new Date().getMonth() + 1);
      const tahunIni = String(new Date().getFullYear());
      const res = await fetch(`/api/pembayaran?id_anggota=${checkId.trim()}&tahun=${tahunIni}`);
      const json = await res.json();
      setCheckData(json.success ? json.data : []);
    } finally { setChecking(false); }
  };

  const cabangConfig = {
    Basket: { emoji: '🏀', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    Renang: { emoji: '🏊', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-emerald-400 font-medium mb-6">
            <CreditCard className="w-4 h-4" />
            <span>Informasi Pembayaran SPP</span>
          </div>
          <h1 className="type-page-title text-neutral-light mb-4">
            Info <span className="text-primary-400">Pembayaran</span>
          </h1>
          <p className="text-neutral-light/50 text-lg">
            Gunakan panduan berikut untuk melunasi iuran Anda. Hubungi admin untuk mendapatkan <strong className="text-emerald-400">Link Pembayaran QRIS/VA Otomatis</strong>!
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Cabang Filter */}
          <div className="flex gap-3 justify-center">
            {(['Basket', 'Renang'] as CabangOlahraga[]).map((c) => {
              const cfg = cabangConfig[c];
              return (
                <button key={c} onClick={() => setCabangFilter(c)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    cabangFilter === c ? `${cfg.bg} border ${cfg.color}` : 'text-neutral-light/50 hover:text-neutral-light hover:bg-neutral-light/10 border border-transparent'
                  }`}>
                  {cfg.emoji} {c}
                </button>
              );
            })}
          </div>

          {/* SPP Tabel */}
          <div className="glass-card border rounded-2xl overflow-hidden">
            <div className={`${cabangConfig[cabangFilter].bg} border-b border-arena-600/30 px-6 py-4 flex items-center gap-3`}>
              <span className="text-2xl">{cabangConfig[cabangFilter].emoji}</span>
              <h2 className="type-section-heading text-neutral-light">SPP Cabang {cabangFilter}</h2>
            </div>
            <div className="divide-y divide-arena-600/30">
              {!sppRes ? (
                <div className="p-6 text-center text-neutral-light/50 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : sppList.filter(s => s.cabang === cabangFilter).length === 0 ? (
                <div className="p-6 text-center text-neutral-light/50">
                  Informasi SPP untuk cabang ini belum tersedia, silakan hubungi admin.
                </div>
              ) : sppList.filter(s => s.cabang === cabangFilter).map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-light/5 transition-colors">
                  <span className="text-neutral-light/70 font-medium">{item.nama_kategori} {item.usia_min !== null || item.usia_max !== null ? `(${item.usia_min || 0}-${item.usia_max || '+'} tahun)` : ''}</span>
                  <span className={`font-bold text-xl tracking-tight ${cabangConfig[cabangFilter].color}`}>
                    {formatCurrency(item.nominal.toString())}<span className="text-sm font-normal text-neutral-light/40 ml-1">/bln</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Jatuh Tempo */}
          <div className="glass-card border border-amber-500/20 bg-amber-500/5 rounded-2xl p-6 flex items-start gap-4">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-neutral-light mb-1">Jadwal Jatuh Tempo</h3>
              <p className="text-neutral-light/60">{jatuhTempo}</p>
              <p className="text-amber-400 text-sm mt-2">⚠️ {catatan}</p>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <h2 className="type-section-heading text-neutral-light mb-6">Metode Pembayaran</h2>

            {!metodeRes ? (
               <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {metodeList.map((metode) => (
                  <div key={metode.id} className={`glass-card-hover border rounded-2xl p-6 ${metode.is_recommended ? 'border-emerald-500/30 bg-emerald-500/5 md:col-span-2' : ''}`}>
                    <div className="flex items-start gap-4 mb-3">
                      <div className={`w-10 h-10 shrink-0 border rounded-xl flex items-center justify-center ${metode.is_recommended ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                        {metode.is_recommended ? <QrCode className="w-5 h-5 text-emerald-400" /> : <Building2 className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-neutral-light">{metode.nama}</h3>
                          {metode.is_recommended && <span className="badge badge-success shrink-0">Rekomendasi</span>}
                        </div>
                        {metode.deskripsi && <p className="text-neutral-light/60 text-sm leading-relaxed mt-1">{metode.deskripsi}</p>}
                        
                        {/* Jika metode memiliki nomor rekening/VA */}
                        {metode.nomor_rekening && (
                          <div className="mt-3 p-3 bg-neutral-light/5 rounded-lg flex justify-between items-center">
                            <span className="text-neutral-light/50 text-sm">Info / Rekening</span>
                            <span className="text-neutral-light font-mono font-medium">{metode.nomor_rekening}</span>
                          </div>
                        )}
                        
                        {/* Jika admin payment link via WA dianjurkan */}
                        {metode.is_recommended && (
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <p className="text-emerald-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />Otomatis Tercatat jika menggunakan Link Pembayaran dari Admin.</p>
                            {branding?.no_wa_admin && (
                               <a href={`https://wa.me/${branding.no_wa_admin}?text=Halo%20Admin,%20saya%20ingin%20meminta%20link%20pembayaran%20SPP.`} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-1.5 px-3">
                                 Hubungi Admin
                               </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cek Status Pembayaran */}
          <div className="glass-card border rounded-2xl p-6">
            <h2 className="type-section-heading text-neutral-light mb-4">Cek Status Pembayaran Mandiri</h2>
            <form onSubmit={handleCekStatus} className="flex gap-3 mb-4">
              <input value={checkId} onChange={(e) => setCheckId(e.target.value)}
                placeholder="Masukkan ID Anggota (contoh: AGT-xxxxx)"
                className="form-input flex-1" />
              <button type="submit" disabled={checking} className="btn-primary px-5">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Cek
              </button>
            </form>
            {checkData !== null && (
              <div className="space-y-2">
                {checkData.length === 0 ? (
                  <p className="text-neutral-light/40 text-sm text-center py-4">Tidak ada data pembayaran untuk ID tersebut</p>
                ) : (
                  checkData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-light/5 rounded-xl text-sm">
                      <span className="text-neutral-light font-medium">{d.nama_anggota} — {d.bulan}/{d.tahun}</span>
                      <span className={`badge ${d.status_bayar === 'Lunas' ? 'badge-success' : d.status_bayar === 'Terlambat' ? 'badge-danger' : 'badge-warning'}`}>
                        {d.status_bayar}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
