'use client';

import { useState } from 'react';
import {
  CreditCard, Calendar, Loader2, QrCode, Building2, Copy, CheckCheck,
  Banknote, AlertCircle, CheckCircle2, ArrowDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import useSWR from 'swr';
import type { CabangOlahraga, SppKategori, PengaturanPembayaran, MetodePembayaran } from '@/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PembayaranPage() {
  const [cabangFilter, setCabangFilter] = useState<CabangOlahraga>('Basket');
  const [copied, setCopied] = useState<string | null>(null);

  // Status Pembayaran States
  const [namaCek, setNamaCek] = useState('');
  const [tglLahirCek, setTglLahirCek] = useState('');

  // Bulan & Tahun default ke bulan/tahun berjalan
  const now = new Date();
  const [bulanCek, setBulanCek] = useState<number>(now.getMonth() + 1);
  const [tahunCek, setTahunCek] = useState<number>(now.getFullYear());

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  type PaymentRecord = {
    id: string;
    bulan: string;
    tahun: string;
    status_bayar: string;
    tanggal_bayar: string | null;
    nominal: string | null;
    metode_bayar: string | null;
    nomor_kwitansi: string | null;
  };
  const [statusData, setStatusData] = useState<{
    nama: string;
    bulan: number;
    tahun: number;
    record: PaymentRecord | null;
  } | null>(null);

  // Fetch Data
  const { data: sppRes } = useSWR('/api/spp_kategori?is_active=true', fetcher);
  const { data: pengRes } = useSWR('/api/pengaturan_pembayaran', fetcher);
  const { data: metodeRes } = useSWR('/api/metode_pembayaran?is_active=true', fetcher);

  const sppList: SppKategori[] = sppRes?.data || [];
  const pengaturan: PengaturanPembayaran = pengRes?.data || {
    tanggal_jatuh_tempo: 'Tanggal 10 setiap bulan',
    catatan_keterlambatan: 'Keterlambatan pembayaran mempengaruhi status keaktifan anggota',
  };
  const metodeList: MetodePembayaran[] = metodeRes?.data || [];

  const jatuhTempo = pengaturan.tanggal_jatuh_tempo || 'Tanggal 10 setiap bulan';
  const catatan = pengaturan.catatan_keterlambatan || 'Keterlambatan pembayaran mempengaruhi status keaktifan anggota';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const BULAN_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const handleCekStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaCek.trim() || !tglLahirCek) {
      setStatusError('Nama dan Tanggal Lahir wajib diisi.');
      return;
    }

    setStatusLoading(true);
    setStatusError('');
    setStatusData(null);

    try {
      const res = await fetch('/api/pembayaran/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: namaCek,
          tanggal_lahir: tglLahirCek,
          bulan: bulanCek,
          tahun: tahunCek,
        }),
      });
      const json = await res.json();
      
      if (json.success) {
        setStatusData(json.data);
      } else {
        setStatusError(json.error || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch {
      setStatusError('Koneksi bermasalah. Periksa internet Anda.');
    } finally {
      setStatusLoading(false);
    }
  };

  const cabangConfig = {
    Basket: {
      emoji: '🏀',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      headerBg: 'bg-orange-500/10 border-orange-500/20',
    },
    Renang: {
      emoji: '🏊',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      headerBg: 'bg-blue-500/10 border-blue-500/20',
    },
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
            Pembayaran SPP dilakukan secara langsung kepada admin melalui transfer bank atau tunai.
            Simpan bukti transfer dan konfirmasikan ke admin.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Tab Cabang */}
          <div className="flex gap-3 justify-center">
            {(['Basket', 'Renang'] as CabangOlahraga[]).map((c) => {
              const cfg = cabangConfig[c];
              return (
                <button
                  key={c}
                  onClick={() => setCabangFilter(c)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    cabangFilter === c
                      ? `${cfg.bg} border ${cfg.color}`
                      : 'text-neutral-light/50 hover:text-neutral-light hover:bg-neutral-light/10 border border-transparent'
                  }`}
                >
                  {cfg.emoji} {c}
                </button>
              );
            })}
          </div>

          {/* Daftar Harga SPP */}
          <div className="glass-card border rounded-2xl overflow-hidden">
            <div className={`${cabangConfig[cabangFilter].headerBg} border-b border-arena-600/30 px-6 py-4 flex items-center gap-3`}>
              <span className="text-2xl">{cabangConfig[cabangFilter].emoji}</span>
              <h2 className="type-section-heading text-neutral-light">Biaya SPP Cabang {cabangFilter}</h2>
            </div>
            <div className="divide-y divide-arena-600/30">
              {!sppRes ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                </div>
              ) : sppList.filter(s => s.cabang === cabangFilter).length === 0 ? (
                <div className="p-8 text-center text-neutral-light/40 text-sm">
                  Belum ada data tarif SPP untuk cabang ini. Hubungi admin untuk informasi lebih lanjut.
                </div>
              ) : (
                sppList.filter(s => s.cabang === cabangFilter).map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-light/5 transition-colors">
                    <div>
                      <span className="text-neutral-light font-medium">{item.nama_kategori}</span>
                      {(item.usia_min !== null && item.usia_min !== undefined) || (item.usia_max !== null && item.usia_max !== undefined) ? (
                        <span className="text-neutral-light/40 text-sm ml-2">
                          ({item.usia_min || 0}–{item.usia_max || '+'} tahun)
                        </span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-xl tracking-tight ${cabangConfig[cabangFilter].color}`}>
                        {formatCurrency(item.nominal)}
                      </span>
                      <span className="text-sm font-normal text-neutral-light/40 ml-1">/bulan</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cek Status Pembayaran */}
          <div id="cek-status">
            <h2 className="type-section-heading text-neutral-light mb-4">Cek Status Pembayaran SPP</h2>
            <div className="glass-card border border-arena-600/30 rounded-2xl p-6 md:p-8">
              <form onSubmit={handleCekStatus} className="grid sm:grid-cols-2 gap-4 mb-6">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                    Nama Lengkap *
                  </label>
                  <input
                    id="cek-nama"
                    type="text"
                    value={namaCek}
                    onChange={(e) => setNamaCek(e.target.value)}
                    placeholder="Masukkan nama sesuai pendaftaran"
                    className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl px-4 py-3 text-neutral-light outline-none transition-all"
                    required
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    id="cek-tgl-lahir"
                    type="date"
                    value={tglLahirCek}
                    onChange={(e) => setTglLahirCek(e.target.value)}
                    className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl px-4 py-3 text-neutral-light outline-none transition-all"
                    required
                  />
                </div>

                {/* Bulan */}
                <div>
                  <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                    Bulan
                  </label>
                  <select
                    id="cek-bulan"
                    value={bulanCek}
                    onChange={(e) => setBulanCek(Number(e.target.value))}
                    className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl px-4 py-3 text-neutral-light outline-none transition-all appearance-none cursor-pointer"
                  >
                    {BULAN_NAMES.slice(1).map((nama, idx) => (
                      <option key={idx + 1} value={idx + 1} className="bg-arena-900 text-neutral-light">
                        {nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tahun */}
                <div>
                  <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                    Tahun
                  </label>
                  <select
                    id="cek-tahun"
                    value={tahunCek}
                    onChange={(e) => setTahunCek(Number(e.target.value))}
                    className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl px-4 py-3 text-neutral-light outline-none transition-all appearance-none cursor-pointer"
                  >
                    {Array.from({ length: now.getFullYear() - 2024 + 1 }, (_, i) => 2025 + i).map((y) => (
                      <option key={y} value={y} className="bg-arena-900 text-neutral-light">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="w-full bg-neutral-light text-arena-900 font-bold py-3 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {statusLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Memeriksa...</>
                    ) : (
                      'Cek Status SPP'
                    )}
                  </button>
                </div>
              </form>

              {/* Error */}
              {statusError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{statusError}</p>
                </div>
              )}

              {/* Hasil Cek Status */}
              {statusData && (
                <div className="mt-6 animate-fade-in">
                  {/* Header identitas */}
                  <div className="mb-5 pb-4 border-b border-neutral-light/10">
                    <p className="text-neutral-light/50 text-xs uppercase tracking-widest font-bold mb-1">Hasil pengecekan untuk:</p>
                    <p className="text-neutral-light font-bold text-lg">{statusData.nama}</p>
                    <p className="text-neutral-light/40 text-sm">
                      {BULAN_NAMES[statusData.bulan]} {statusData.tahun}
                    </p>
                  </div>

                  {statusData.record && statusData.record.status_bayar === 'Lunas' ? (
                    /* ── LUNAS ──────────────────────────────── */
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-emerald-300 font-bold text-base">Pembayaran Lunas ✓</p>
                          <p className="text-emerald-300/60 text-xs">
                            SPP {BULAN_NAMES[statusData.bulan]} {statusData.tahun} telah tercatat
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {statusData.record.tanggal_bayar && (
                          <div className="bg-emerald-500/10 rounded-xl p-3">
                            <p className="text-emerald-300/50 text-xs mb-0.5 uppercase tracking-wider">Tanggal Bayar</p>
                            <p className="text-emerald-200 font-semibold">
                              {new Date(statusData.record.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                        {statusData.record.nominal && (
                          <div className="bg-emerald-500/10 rounded-xl p-3">
                            <p className="text-emerald-300/50 text-xs mb-0.5 uppercase tracking-wider">Nominal</p>
                            <p className="text-emerald-200 font-semibold">{formatCurrency(parseFloat(statusData.record.nominal))}</p>
                          </div>
                        )}
                        {statusData.record.metode_bayar && (
                          <div className="bg-emerald-500/10 rounded-xl p-3">
                            <p className="text-emerald-300/50 text-xs mb-0.5 uppercase tracking-wider">Metode</p>
                            <p className="text-emerald-200 font-semibold">{statusData.record.metode_bayar}</p>
                          </div>
                        )}
                        {statusData.record.nomor_kwitansi && (
                          <div className="bg-emerald-500/10 rounded-xl p-3">
                            <p className="text-emerald-300/50 text-xs mb-0.5 uppercase tracking-wider">No. Kwitansi</p>
                            <p className="text-emerald-200 font-semibold font-mono">{statusData.record.nomor_kwitansi}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── BELUM BAYAR ───────────────────────── */
                    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-amber-300 font-bold text-base">Belum Ada Catatan Pembayaran</p>
                          <p className="text-amber-300/60 text-xs">Status SPP bulan ini belum tercatat</p>
                        </div>
                      </div>
                      <p className="text-amber-200/80 text-sm leading-relaxed mb-5">
                        Anda belum melakukan pembayaran SPP untuk bulan{' '}
                        <strong className="text-amber-200">
                          {BULAN_NAMES[statusData.bulan]} {statusData.tahun}
                        </strong>.
                        Segera lakukan pembayaran untuk menjaga status keaktifan keanggotaan Anda.
                      </p>
                      <a
                        href="#info-pembayaran"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('info-pembayaran')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
                      >
                        <ArrowDown className="w-4 h-4" />
                        Lihat Cara & Info Pembayaran
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Rekening & Cara Bayar — id anchor untuk CTA dari hasil cek status */}
          <div id="info-pembayaran" />
          {/* Info Rekening & Cara Bayar */}
          {(!metodeRes || metodeList.length > 0) && (
            <div>
              <h2 className="type-section-heading text-neutral-light mb-4">Cara &amp; Info Pembayaran</h2>
              {!metodeRes ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {metodeList.map((metode) => {
                    const isQris = metode.nama.toLowerCase().includes('qris');
                    const isTransfer = metode.nama.toLowerCase().includes('transfer') || metode.nama.toLowerCase().includes('bank');

                    return (
                      <div
                        key={metode.id}
                        className={`glass-card border rounded-2xl p-6 transition-all hover:border-neutral-light/20 ${
                          metode.is_recommended ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-arena-600/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 shrink-0 border rounded-xl flex items-center justify-center ${
                            isQris
                              ? 'bg-violet-500/20 border-violet-500/30'
                              : isTransfer
                              ? 'bg-blue-500/20 border-blue-500/30'
                              : 'bg-emerald-500/20 border-emerald-500/30'
                          }`}>
                            {isQris
                              ? <QrCode className="w-5 h-5 text-violet-400" />
                              : isTransfer
                              ? <Building2 className="w-5 h-5 text-blue-400" />
                              : <Banknote className="w-5 h-5 text-emerald-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-neutral-light">{metode.nama}</h3>
                              {metode.is_recommended && (
                                <span className="badge badge-success shrink-0 text-xs">⭐ Disarankan</span>
                              )}
                            </div>
                            {metode.deskripsi && (
                              <p className="text-neutral-light/55 text-sm leading-relaxed mb-3">{metode.deskripsi}</p>
                            )}

                            {/* Nomor Rekening */}
                            {metode.nomor_rekening && (
                              <div className="mt-2 space-y-1.5">
                                {metode.nama_bank && (
                                  <div className="text-xs text-neutral-light/50">
                                    Bank: <span className="text-neutral-light font-medium">{metode.nama_bank}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 p-3 bg-neutral-light/5 rounded-xl">
                                  <span className="text-neutral-light/50 text-xs shrink-0">No. Rek:</span>
                                  <span className="text-neutral-light font-mono font-semibold tracking-wider flex-1">{metode.nomor_rekening}</span>
                                  <button
                                    onClick={() => handleCopy(metode.nomor_rekening!, `rek-${metode.id}`)}
                                    className="shrink-0 p-1.5 text-neutral-light/40 hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-500/10"
                                    title="Salin nomor rekening"
                                  >
                                    {copied === `rek-${metode.id}` ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                {metode.atas_nama && (
                                  <div className="text-xs text-neutral-light/50 px-1">
                                    a.n. <span className="text-neutral-light font-medium">{metode.atas_nama}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* QRIS Image */}
                            {isQris && metode.qris_image_url && (
                              <div className="mt-3 flex justify-center">
                                <div className="p-3 bg-white rounded-xl">
                                  <img
                                    src={metode.qris_image_url}
                                    alt="Kode QRIS"
                                    className="w-36 h-36 object-contain"
                                  />
                                </div>
                                <div className="text-xs text-neutral-light/40 text-center mt-2">Scan QRIS untuk bayar</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Jadwal Jatuh Tempo */}
          <div className="glass-card border border-amber-500/20 bg-amber-500/5 rounded-2xl p-6 flex items-start gap-4">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-neutral-light mb-1">Jadwal Jatuh Tempo Pembayaran</h3>
              <p className="text-neutral-light/70">{jatuhTempo}</p>
              <p className="text-amber-400 text-sm mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {catatan}
              </p>
            </div>
          </div>

          {/* Catatan Konfirmasi */}
          <div className="glass-card border border-neutral-light/10 rounded-2xl p-6 text-center">
            <p className="text-neutral-light/60 text-sm leading-relaxed">
              Setelah melakukan pembayaran, <strong className="text-neutral-light">harap konfirmasi ke admin</strong> dengan mengirimkan bukti transfer beserta nama lengkap dan cabang olahraga Anda.
              Admin akan mencatat pembayaran dan menerbitkan kwitansi.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
