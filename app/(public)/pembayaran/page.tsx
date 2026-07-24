'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard, Smartphone, Banknote, AlertCircle, CheckCircle,
  Calendar, Loader2, QrCode, Building2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { CabangOlahraga } from '@/types';

export default function PembayaranPage() {
  const [cabangFilter, setCabangFilter] = useState<CabangOlahraga>('Basket');
  const [branding, setBranding] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<{ token: string; url: string } | null>(null);

  // Cek Status Pembayaran
  const [checkId, setCheckId] = useState('');
  const [checkData, setCheckData] = useState<{ nama_anggota: string; status_bayar: string; bulan: string; tahun: string; metode_bayar: string }[] | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch('/api/branding').then(r => r.json()).then(j => { if (j.success) setBranding(j.data || {}); });
  }, []);

  const sppData = {
    Basket: [
      { kategori: 'Mini (5-8 tahun)', nominal: '200000' },
      { kategori: 'Pemula (9-12 tahun)', nominal: '225000' },
      { kategori: 'Junior (13-17 tahun)', nominal: '250000' },
      { kategori: 'Senior (18+ tahun)', nominal: '275000' },
    ],
    Renang: [
      { kategori: 'Beginner (5-8 tahun)', nominal: '250000' },
      { kategori: 'Intermediate (9-13 tahun)', nominal: '275000' },
      { kategori: 'Advanced (14-18 tahun)', nominal: '300000' },
      { kategori: 'Dewasa (18+ tahun)', nominal: '325000' },
    ],
  };

  const jatuhTempo = branding?.jatuh_tempo_spp || 'Tanggal 10 setiap bulan';

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
          <h1 className="font-display text-4xl md:text-5xl font-black text-neutral-light mb-4">
            Info <span className="text-gradient">Pembayaran</span>
          </h1>
          <p className="text-neutral-light/50 text-lg">
            Bayar SPP langsung via <strong className="text-emerald-400">QRIS atau Virtual Account</strong> — status otomatis tercatat!
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
              <h2 className="font-display text-xl font-bold text-neutral-light">SPP Cabang {cabangFilter}</h2>
            </div>
            <div className="divide-y divide-arena-600/30">
              {sppData[cabangFilter].map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-light/5 transition-colors">
                  <span className="text-neutral-light/70 font-medium">{item.kategori}</span>
                  <span className={`font-bold text-xl tracking-tight ${cabangConfig[cabangFilter].color}`}>
                    {formatCurrency(item.nominal)}<span className="text-sm font-normal text-neutral-light/40 ml-1">/bln</span>
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
              <p className="text-amber-400 text-sm mt-2">⚠️ Keterlambatan pembayaran mempengaruhi status keaktifan anggota</p>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-light mb-6">Metode Pembayaran</h2>

            {/* Online Payment Highlight */}
            <div className="glass-card border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-light">Bayar Online — Otomatis Tercatat ✨</h3>
                  <p className="text-neutral-light/50 text-sm">QRIS · Virtual Account BCA/BNI/BRI/Mandiri</p>
                </div>
                <span className="ml-auto badge badge-success">Rekomendasi</span>
              </div>
              <p className="text-neutral-light/60 text-sm mb-4">
                Bayar SPP langsung dari website via QRIS atau Virtual Account bank pilihan Anda.
                Begitu pembayaran selesai, status otomatis tercatat di sistem — tidak perlu konfirmasi manual!
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-neutral-light/40">
                <span className="badge badge-neutral">🏦 BCA VA</span>
                <span className="badge badge-neutral">🏦 BNI VA</span>
                <span className="badge badge-neutral">🏦 BRI VA</span>
                <span className="badge badge-neutral">🏦 Mandiri VA</span>
                <span className="badge badge-neutral">📱 QRIS</span>
                <span className="badge badge-neutral">💚 GoPay</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Transfer Bank Manual */}
              {branding?.rek_bank_nomor && (
                <div className="glass-card-hover border rounded-2xl p-6">
                  <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-light mb-3">Transfer Bank Manual</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-neutral-light/50">Bank</span><span className="text-neutral-light font-medium">{branding.rek_bank_nama}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-light/50">Rekening</span><span className="text-neutral-light font-mono font-medium">{branding.rek_bank_nomor}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-light/50">Atas Nama</span><span className="text-neutral-light font-medium">{branding.rek_bank_atas_nama}</span></div>
                  </div>
                  <p className="text-amber-400 text-xs mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Konfirmasi ke admin setelah transfer</p>
                </div>
              )}

              {/* Tunai */}
              <div className="glass-card-hover border rounded-2xl p-6">
                <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center mb-4">
                  <Banknote className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-neutral-light mb-3">Pembayaran Tunai</h3>
                <p className="text-neutral-light/60 text-sm leading-relaxed">
                  Pembayaran tunai dapat dilakukan langsung kepada pelatih atau admin saat jadwal latihan berlangsung.
                </p>
                <p className="text-amber-400 text-xs mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Minta kuitansi bukti pembayaran</p>
              </div>
            </div>
          </div>

          {/* Cek Status Pembayaran */}
          <div className="glass-card border rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-neutral-light mb-4">Cek Status Pembayaran Mandiri</h2>
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
