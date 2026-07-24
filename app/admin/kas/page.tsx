'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, Loader2, Filter, X } from 'lucide-react';
import { formatCurrency, getMonthName } from '@/lib/utils';
import type { Kas } from '@/types';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';

const KATEGORI_MASUK = ['SPP', 'Donasi', 'Sponsor', 'Turnamen', 'Lainnya'];
const KATEGORI_KELUAR = ['Perlengkapan', 'Transport', 'Konsumsi', 'Sewa Lapangan', 'Administrasi', 'Lainnya'];

export default function AdminKasPage() {
  const [data, setData] = useState<Kas[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({
    bulan: String(new Date().getMonth() + 1),
    tahun: String(new Date().getFullYear()),
  });
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'Masuk' as 'Masuk' | 'Keluar',
    kategori: '',
    keterangan: '',
    nominal: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bulan: filter.bulan, tahun: filter.tahun });
      const res = await fetch(`/api/kas?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/kas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nominal: parseFloat(form.nominal) }),
      });
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        setForm({ tanggal: new Date().toISOString().split('T')[0], jenis: 'Masuk', kategori: '', keterangan: '', nominal: '' });
        loadData();
      }
    } finally { setSaving(false); }
  };

  const totalMasuk = data.filter((d) => d.jenis === 'Masuk').reduce((acc, d) => acc + parseFloat(d.nominal || '0'), 0);
  const totalKeluar = data.filter((d) => d.jenis === 'Keluar').reduce((acc, d) => acc + parseFloat(d.nominal || '0'), 0);
  const saldo = data.length > 0 ? parseFloat(data[data.length - 1].saldo_berjalan || '0') : 0;

  // Chart data - group by date
  const chartData = data.reduce<Record<string, { tanggal: string; masuk: number; keluar: number }>>((acc, d) => {
    if (!acc[d.tanggal]) acc[d.tanggal] = { tanggal: d.tanggal.slice(0, 5), masuk: 0, keluar: 0 };
    if (d.jenis === 'Masuk') acc[d.tanggal].masuk += parseFloat(d.nominal || '0');
    else acc[d.tanggal].keluar += parseFloat(d.nominal || '0');
    return acc;
  }, {});
  const chart = Object.values(chartData).slice(-15);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Kas Club</h1>
          <p className="text-white/50 mt-1">Pemasukan, pengeluaran, dan saldo berjalan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-white/50 text-sm">Total Masuk</span>
          </div>
          <div className="font-display text-2xl font-black text-emerald-400">{formatCurrency(totalMasuk)}</div>
        </div>
        <div className="glass-card border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-white/50 text-sm">Total Keluar</span>
          </div>
          <div className="font-display text-2xl font-black text-red-400">{formatCurrency(totalKeluar)}</div>
        </div>
        <div className="glass-card border border-primary-500/20 bg-primary-500/5 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary-400" />
            <span className="text-white/50 text-sm">Saldo Kas</span>
          </div>
          <div className="font-display text-2xl font-black text-primary-400">{formatCurrency(saldo)}</div>
        </div>
      </div>

      {/* Chart */}
      {chart.length > 1 && (
        <div className="glass-card border rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Grafik Transaksi</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="tanggal" tick={{ fill: '#ffffff50', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff50', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend wrapperStyle={{ color: '#ffffff60', fontSize: 12 }} />
                <Bar dataKey="masuk" name="Masuk" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="keluar" name="Keluar" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="glass-card border rounded-2xl p-4">
        <div className="flex gap-3 flex-wrap">
          <select value={filter.bulan} onChange={(e) => setFilter({ ...filter, bulan: e.target.value })} className="form-select w-auto">
            {Array.from({length:12},(_,i)=>i+1).map((b) => <option key={b} value={String(b)}>{getMonthName(b)}</option>)}
          </select>
          <select value={filter.tahun} onChange={(e) => setFilter({ ...filter, tahun: e.target.value })} className="form-select w-auto">
            {['2024','2025','2026','2027'].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={loadData} className="btn-primary text-sm px-4">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="glass-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th>Nominal</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-sm">{row.tanggal}</td>
                    <td>
                      <span className={`badge ${row.jenis === 'Masuk' ? 'badge-success' : 'badge-danger'}`}>
                        {row.jenis === 'Masuk' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {row.jenis}
                      </span>
                    </td>
                    <td>{row.kategori}</td>
                    <td className="max-w-xs truncate">{row.keterangan}</td>
                    <td className={`font-semibold ${row.jenis === 'Masuk' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.jenis === 'Masuk' ? '+' : '-'}{formatCurrency(row.nominal)}
                    </td>
                    <td className="font-mono text-sm text-white/70">{formatCurrency(row.saldo_berjalan)}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-white/40 py-8">Belum ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-8 w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-white">Tambah Transaksi</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tanggal</label>
                  <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Jenis</label>
                  <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as 'Masuk'|'Keluar', kategori: '' })} className="form-select">
                    <option value="Masuk">Masuk</option>
                    <option value="Keluar">Keluar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="form-select" required>
                  <option value="">-- Pilih --</option>
                  {(form.jenis === 'Masuk' ? KATEGORI_MASUK : KATEGORI_KELUAR).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Keterangan</label>
                <input type="text" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Deskripsi transaksi" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Nominal (Rp)</label>
                <input type="number" value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} placeholder="0" min="0" className="form-input" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Simpan...</> : <><Plus className="w-4 h-4" />Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
