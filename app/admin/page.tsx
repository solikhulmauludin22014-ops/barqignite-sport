'use client';

import useSWR from 'swr';
import Link from 'next/link';
import {
  Users, UserPlus, Wallet, AlertTriangle, ArrowRight, CheckCircle, Zap,
} from 'lucide-react';
import { formatCurrency, getMonthName } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminDashboard() {
  const bulanIni = new Date().getMonth() + 1;
  const tahunIni = new Date().getFullYear();

  // SWR dengan polling 10 detik untuk data real-time
  const { data: anggotaBasket } = useSWR('/api/anggota?status=Aktif&cabang=Basket', fetcher, { refreshInterval: 10000 });
  const { data: anggotaRenang } = useSWR('/api/anggota?status=Aktif&cabang=Renang', fetcher, { refreshInterval: 10000 });
  const { data: pendaftarRes } = useSWR('/api/pendaftar?status=Pending', fetcher, { refreshInterval: 10000 });
  const { data: kasRes } = useSWR('/api/kas', fetcher, { refreshInterval: 10000 });
  const { data: pembayaranRes } = useSWR(`/api/pembayaran?bulan=${bulanIni}&tahun=${tahunIni}`, fetcher, { refreshInterval: 5000 }); // 5 detik untuk realtime

  const basketAktif = anggotaBasket?.data?.length || 0;
  const renangAktif = anggotaRenang?.data?.length || 0;
  const pendaftarBaru = pendaftarRes?.data?.length || 0;

  const kasData = kasRes?.data || [];
  const saldoKas = kasData.length > 0 ? parseFloat(kasData[kasData.length - 1].saldo_berjalan || '0') : 0;

  const pembayaranData = pembayaranRes?.data || [];
  const tunggakanBulanIni = pembayaranData.filter((p: { status_bayar: string }) => p.status_bayar !== 'Lunas').length;

  // Transaksi terbaru (sukses via gateway)
  const recentPayments = pembayaranData
    .filter((p: { status_bayar: string; metode_bayar: string }) => p.status_bayar === 'Lunas')
    .sort((a: { tanggal_bayar: string }, b: { tanggal_bayar: string }) =>
      new Date(b.tanggal_bayar).getTime() - new Date(a.tanggal_bayar).getTime()
    )
    .slice(0, 5);

  const cabangStats = [
    { cabang: 'Basket', emoji: '🏀', anggota: basketAktif, color: 'text-basket', glow: 'scoreboard-glow-basket' },
    { cabang: 'Renang', emoji: '🏊', anggota: renangAktif, color: 'text-renang', glow: 'scoreboard-glow-renang' },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title text-neutral-light">Dashboard</h1>
          <p className="text-neutral-light/50 mt-1 flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
            <Zap className="w-3.5 h-3.5 text-status-success" />
            <span className="text-status-success">Auto-refresh (5s)</span>
            <span className="text-neutral-light/30">·</span>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Per Cabang - Scoreboard Style */}
      <div className="grid md:grid-cols-2 gap-6">
        {cabangStats.map((c) => (
          <div key={c.cabang} className="scoreboard-card group relative">
            <div className={c.glow} />
            <div className="relative z-10 flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{c.emoji}</span>
                <div>
                  <h3 className="type-scoreboard-label text-neutral-light">{c.cabang}</h3>
                  <p className="text-neutral-light/40 text-xs font-bold uppercase tracking-widest">Bulan {getMonthName(bulanIni)}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 relative z-10">
              <div className="bg-arena-800/50 rounded-xl p-3 border border-arena-600/30 dark:border-white/5">
                <p className="text-neutral-light/40 text-[10px] font-bold uppercase tracking-widest mb-1">Anggota</p>
                <p className={`scoreboard-value text-2xl ${c.color}`}>{c.anggota}</p>
              </div>
              <div className="bg-arena-800/50 rounded-xl p-3 border border-arena-600/30 dark:border-white/5">
                <p className="text-neutral-light/40 text-[10px] font-bold uppercase tracking-widest mb-1">Lunas SPP</p>
                <p className="scoreboard-value text-2xl text-status-success">
                  {pembayaranData.filter((p: { cabang_olahraga: string; status_bayar: string }) => p.cabang_olahraga === c.cabang && p.status_bayar === 'Lunas').length}
                </p>
              </div>
              <div className="bg-arena-800/50 rounded-xl p-3 border border-arena-600/30 dark:border-white/5">
                <p className="text-neutral-light/40 text-[10px] font-bold uppercase tracking-widest mb-1">Tunggakan</p>
                <p className="scoreboard-value text-2xl text-status-danger">
                  {pembayaranData.filter((p: { cabang_olahraga: string; status_bayar: string }) => p.cabang_olahraga === c.cabang && p.status_bayar !== 'Lunas').length}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Anggota', value: basketAktif + renangAktif, icon: Users, color: 'text-neutral-light', border: 'border-arena-600/50 dark:border-white/20' },
          { label: 'Pendaftar Baru', value: pendaftarBaru, icon: UserPlus, color: pendaftarBaru > 0 ? 'text-status-warning' : 'text-neutral-light/40', border: pendaftarBaru > 0 ? 'border-status-warning/40' : 'border-arena-600/30 dark:border-white/10' },
          { label: 'Saldo Kas', value: formatCurrency(saldoKas), icon: Wallet, color: 'text-status-success', border: 'border-status-success/40' },
          { label: 'Tunggakan SPP', value: tunggakanBulanIni, icon: AlertTriangle, color: tunggakanBulanIni > 0 ? 'text-status-danger' : 'text-neutral-light/40', border: tunggakanBulanIni > 0 ? 'border-status-danger/40' : 'border-arena-600/30 dark:border-white/10' },
        ].map((card) => (
          <div key={card.label} className={`glass-card border ${card.border} p-5 hover:bg-arena-800/80 transition-all duration-300`}>
            <div className="flex items-start justify-between mb-4">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className={`font-mono text-2xl font-bold mb-1 ${card.color}`}>{card.value}</div>
            <div className="text-neutral-light/50 font-bold text-[10px] uppercase tracking-widest">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Real-time Feed */}
        <div className="glass-card border rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-arena-600/30 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="type-section-heading text-neutral-light">Pembayaran Terbaru</h2>
              <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" title="Real-time" />
            </div>
            <Link href="/admin/pembayaran" className="text-neutral-light/40 hover:text-neutral-light text-xs font-bold uppercase tracking-widest">Semua <ArrowRight className="inline w-3 h-3 ml-1"/></Link>
          </div>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-neutral-light/30 text-sm text-center py-6 font-bold uppercase tracking-widest">Belum ada pembayaran bulan ini</p>
            ) : recentPayments.map((p: { nama_anggota: string; cabang_olahraga: string; nominal: string; metode_bayar: string; tanggal_bayar: string }, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-arena-900 border border-arena-600/30 dark:border-white/5 hover:border-arena-600/50 dark:hover:border-white/10 transition-colors">
                <CheckCircle className="w-5 h-5 text-status-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-light text-sm font-bold truncate">{p.nama_anggota}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${p.cabang_olahraga === 'Basket' ? 'text-basket border-basket/30' : 'text-renang border-renang/30'}`}>{p.cabang_olahraga}</span>
                    <span className="text-neutral-light/40 text-[10px] font-bold uppercase tracking-widest border border-arena-600/50 dark:border-white/10 rounded px-2 py-0.5">{p.metode_bayar || 'Manual'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-status-success font-mono font-bold">{formatCurrency(p.nominal)}</p>
                  <p className="text-neutral-light/30 text-[10px] font-bold uppercase tracking-widest mt-1">{p.tanggal_bayar}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card border rounded-2xl p-6">
          <h2 className="type-section-heading text-neutral-light mb-6 border-b border-arena-600/30 dark:border-white/5 pb-4">Aksi Cepat</h2>
          <div className="grid gap-3">
            {[
              { href: '/admin/presensi', emoji: '📋', label: 'Input Presensi', desc: 'Catat kehadiran hari ini' },
              { href: '/admin/pendaftar', emoji: '👥', label: 'Review Pendaftar', desc: `${pendaftarBaru} menunggu approval` },
              { href: '/admin/pembayaran', emoji: '💳', label: 'Kelola SPP', desc: `${tunggakanBulanIni} belum bayar bulan ini` },
              { href: '/admin/kas', emoji: '💰', label: 'Catat Transaksi Kas', desc: 'Tambah pemasukan/pengeluaran' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center justify-between p-4 rounded-xl bg-arena-900 border border-arena-600/30 dark:border-white/5 hover:border-arena-600 dark:hover:border-white/20 transition-all group">
                <div className="flex items-center gap-4">
                  <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">{link.emoji}</span>
                  <div>
                    <p className="text-neutral-light font-bold text-sm uppercase tracking-wide group-hover:text-renang transition-colors">{link.label}</p>
                    <p className="text-neutral-light/40 text-xs mt-0.5">{link.desc}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-arena-600/10 dark:bg-white/5 flex items-center justify-center group-hover:bg-renang/10 transition-colors">
                  <ArrowRight className="w-4 h-4 text-neutral-light/30 group-hover:text-renang" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
