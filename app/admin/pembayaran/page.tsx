'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  CheckCircle, AlertTriangle, Loader2, Filter, DollarSign,
  QrCode, Building2, RefreshCw, Zap, X,
} from 'lucide-react';
import type { PembayaranSPP } from '@/types';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { cn } from '@/lib/utils';

const BULAN_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1));

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPembayaranPage() {
  const [filter, setFilter] = useState({
    bulan: String(new Date().getMonth() + 1),
    tahun: String(new Date().getFullYear()),
    status: '',
    cabang: '',
  });
  const [paying, setPaying] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{ id: string; nama: string; metode: string; tanggal: string; nominal: string; cabang: string } | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);

  const params = new URLSearchParams(Object.fromEntries(Object.entries(filter).filter(([,v]) => v)));
  
  // SWR polling 5 detik — real-time update saat webhook masuk
  const { data, mutate } = useSWR(`/api/pembayaran?${params.toString()}`, fetcher, {
    refreshInterval: 5000,
  });
  const { data: anggotaRes } = useSWR('/api/anggota?status=Aktif', fetcher);

  const pembayaranData: PembayaranSPP[] = data?.data || [];
  const anggota = anggotaRes?.data || [];

  const generateMonthEntries = async () => {
    const existing = new Set(pembayaranData.map((d) => `${d.id_anggota}-${d.bulan}-${d.tahun}`));
    const filtered = anggota.filter((a: { id: string; cabang_olahraga: string }) =>
      !filter.cabang || a.cabang_olahraga === filter.cabang
    );
    for (const a of filtered) {
      const key = `${a.id}-${filter.bulan}-${filter.tahun}`;
      if (!existing.has(key)) {
        await fetch('/api/pembayaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_anggota: a.id, nama_anggota: a.nama,
            cabang_olahraga: a.cabang_olahraga,
            bulan: filter.bulan, tahun: filter.tahun,
            nominal: '0', status_bayar: 'Belum',
          }),
        });
      }
    }
    mutate();
  };

  const markLunas = async () => {
    if (!modalData) return;
    setPaying(modalData.id);
    const item = pembayaranData.find((d) => d.id === modalData.id)!;
    await fetch('/api/pembayaran', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status_bayar: 'Lunas', metode_bayar: modalData.metode, tanggal_bayar: modalData.tanggal }),
    });
    setPaying(null);
    setModalData(null);
    mutate();
  };

  const generatePaymentLink = async (spp: PembayaranSPP) => {
    setGeneratingLink(spp.id);
    try {
      const angRes = await fetch(`/api/anggota?id=${spp.id_anggota}`);
      const angData = await angRes.json();
      const ang = angData.data?.[0];

      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_payment',
          id_anggota: spp.id_anggota,
          nama_anggota: spp.nama_anggota,
          email: ang?.email || '',
          no_hp: ang?.no_hp || '',
          cabang_olahraga: spp.cabang_olahraga,
          bulan: spp.bulan,
          tahun: spp.tahun,
          nominal: spp.nominal,
          payment_type: 'all',
        }),
      });
      const json = await res.json();
      if (json.success && json.data.snap_token) {
        setSnapToken(json.data.snap_token);
        // Load Midtrans Snap
        const script = document.createElement('script');
        script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
        document.head.appendChild(script);
        script.onload = () => {
          (window as Window & { snap?: { pay: (token: string, opts: object) => void } }).snap?.pay(json.data.snap_token, {
            onSuccess: () => { mutate(); setSnapToken(null); },
            onPending: () => { mutate(); setSnapToken(null); },
            onError: () => { setSnapToken(null); },
            onClose: () => { setSnapToken(null); },
          });
        };
      }
    } finally { setGeneratingLink(null); }
  };

  const lunas = pembayaranData.filter((d) => d.status_bayar === 'Lunas').length;
  const belum = pembayaranData.filter((d) => d.status_bayar !== 'Lunas').length;
  const totalNominal = pembayaranData
    .filter((d) => d.status_bayar === 'Lunas')
    .reduce((acc, d) => acc + parseFloat(d.nominal || '0'), 0);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Pembayaran SPP</h1>
          <p className="text-white/50 mt-1 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs">Auto-refresh setiap 5 detik</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card border rounded-2xl p-5">
        <div className="grid sm:grid-cols-5 gap-3">
          <select value={filter.cabang} onChange={(e) => setFilter({ ...filter, cabang: e.target.value })} className="form-select">
            <option value="">🏀🏊 Semua Cabang</option>
            <option value="Basket">🏀 Basket</option>
            <option value="Renang">🏊 Renang</option>
          </select>
          <select value={filter.bulan} onChange={(e) => setFilter({ ...filter, bulan: e.target.value })} className="form-select">
            {BULAN_LIST.map((b) => <option key={b} value={b}>{getMonthName(b)}</option>)}
          </select>
          <select value={filter.tahun} onChange={(e) => setFilter({ ...filter, tahun: e.target.value })} className="form-select">
            {['2024','2025','2026','2027'].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="form-select">
            <option value="">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum">Belum Bayar</option>
          </select>
          <button onClick={generateMonthEntries} className="btn-secondary justify-center" title="Buat entri SPP untuk semua anggota bulan ini">
            <RefreshCw className="w-4 h-4" /> Generate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
          <div className="font-display text-2xl font-black text-emerald-400">{lunas}</div>
          <div className="text-white/50 text-sm">Lunas</div>
        </div>
        <div className="glass-card border border-red-500/20 bg-red-500/5 p-5 text-center">
          <div className="font-display text-2xl font-black text-red-400">{belum}</div>
          <div className="text-white/50 text-sm">Belum Bayar</div>
        </div>
        <div className="glass-card border border-primary-500/20 bg-primary-500/5 p-5 text-center">
          <div className="font-display text-lg font-black text-primary-400">{formatCurrency(totalNominal)}</div>
          <div className="text-white/50 text-sm">Total Terkumpul</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Anggota</th>
                <th>Cabang</th>
                <th>Bulan/Tahun</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Tgl Bayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pembayaranData.map((row) => (
                <tr key={row.id} className={row.status_bayar !== 'Lunas' ? 'bg-red-500/[0.03]' : ''}>
                  <td className="font-medium text-white">{row.nama_anggota}</td>
                  <td>
                    <span className={`badge ${row.cabang_olahraga === 'Basket' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
                      {row.cabang_olahraga === 'Basket' ? '🏀' : '🏊'} {row.cabang_olahraga}
                    </span>
                  </td>
                  <td>{getMonthName(row.bulan)} {row.tahun}</td>
                  <td>{formatCurrency(row.nominal)}</td>
                  <td>
                    <span className={`badge ${row.status_bayar === 'Lunas' ? 'badge-success' : row.status_bayar === 'Terlambat' ? 'badge-danger' : 'badge-warning'}`}>
                      {row.status_bayar === 'Lunas' ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                      {row.status_bayar}
                    </span>
                  </td>
                  <td className="text-white/50 text-sm">{row.metode_bayar || '—'}</td>
                  <td className="text-white/50 text-sm">{row.tanggal_bayar || '—'}</td>
                  <td>
                    {row.status_bayar !== 'Lunas' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModalData({ id: row.id, nama: row.nama_anggota, metode: 'Tunai', tanggal: new Date().toISOString().split('T')[0], nominal: row.nominal, cabang: row.cabang_olahraga })}
                          className="btn-success text-xs py-1 px-2"
                          title="Tandai Lunas Manual"
                        >
                          <DollarSign className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => generatePaymentLink(row)}
                          className="btn-primary text-xs py-1 px-2"
                          title="Generate Link Pembayaran Online"
                          disabled={generatingLink === row.id}
                        >
                          {generatingLink === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                    {row.status_gateway === 'Pending' && <span className="badge badge-warning text-xs">Pending Gateway</span>}
                  </td>
                </tr>
              ))}
              {pembayaranData.length === 0 && (
                <tr><td colSpan={8} className="text-center text-white/40 py-8">Belum ada data pembayaran — klik Generate untuk membuat entri</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lunas Manual */}
      {modalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-8 w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-white">Tandai Lunas Manual</h3>
              <button onClick={() => setModalData(null)} className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-white/60 mb-6">SPP <strong className="text-white">{modalData.nama}</strong> — {formatCurrency(modalData.nominal)}</p>
            <div className="space-y-4">
              <div><label className="form-label">Tanggal Bayar</label>
                <input type="date" value={modalData.tanggal} onChange={(e) => setModalData({ ...modalData, tanggal: e.target.value })} className="form-input" /></div>
              <div><label className="form-label">Metode Pembayaran</label>
                <select value={modalData.metode} onChange={(e) => setModalData({ ...modalData, metode: e.target.value })} className="form-select">
                  {['Tunai', 'Transfer', 'VA Bank', 'QRIS'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalData(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={markLunas} disabled={!!paying} className="btn-success flex-1 justify-center">
                <CheckCircle className="w-4 h-4" /> Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
