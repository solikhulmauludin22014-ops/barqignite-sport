'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2, Plus, Filter, UserPlus, Trash2, Download, ClipboardCheck, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Anggota, Presensi } from '@/types';
import { cn } from '@/lib/utils';

const statusOptions = ['Hadir', 'Izin', 'Sakit', 'Alpa'] as const;
type StatusHadir = typeof statusOptions[number];

const statusStyles: Record<StatusHadir, string> = {
  Hadir: 'bg-emerald-500 border-emerald-400 text-white',
  Izin: 'bg-amber-500 border-amber-400 text-white',
  Sakit: 'bg-blue-500 border-blue-400 text-white',
  Alpa: 'bg-red-500 border-red-400 text-white',
};

const statusDefault: Record<StatusHadir, string> = {
  Hadir: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white',
  Izin: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white',
  Sakit: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white',
  Alpa: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white',
};

interface PresensiItem {
  id_anggota: string;
  nama_anggota: string;
  kategori: string;
  status_hadir: StatusHadir;
}

// Format badge status (termasuk Menunggu Konfirmasi)
function StatusBadge({ status }: { status: string }) {
  if (status === 'Menunggu Konfirmasi') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <Clock className="w-3 h-3" />
        Menunggu Konfirmasi
      </span>
    );
  }
  const map: Record<string, string> = {
    Hadir: 'badge-success',
    Izin: 'badge-warning',
    Sakit: 'badge-info',
    Alpa: 'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
}

// Format waktu submit ke jam WIB
function formatWaktuSubmit(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  } catch {
    return iso;
  }
}

export default function AdminPresensiPage() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [items, setItems] = useState<PresensiItem[]>([]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [sesi, setSesi] = useState('Sesi 1');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'konfirmasi' | 'input' | 'rekap'>('konfirmasi');

  // ── Tab Konfirmasi ──
  const [konfirmasiData, setKonfirmasiData] = useState<Presensi[]>([]);
  const [konfirmasiLoading, setKonfirmasiLoading] = useState(false);
  const [konfirmasiFilter, setKonfirmasiFilter] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    sesi: '',
    status: 'Menunggu Konfirmasi',
  });
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

  // ── Tab Rekap ──
  const [rekapData, setRekapData] = useState<Presensi[]>([]);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapFilter, setRekapFilter] = useState({ tanggal: '', kategori: '', sesi: '', status: '' });

  const kategoriList = [...new Set(anggotaList.map((a) => a.kategori))];

  // ── Load anggota (tab Input) ──
  const loadAnggota = useCallback(async () => {
    setLoading(true);
    try {
      const url = kategoriFilter ? `/api/anggota?status=Aktif&kategori=${kategoriFilter}` : '/api/anggota?status=Aktif';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        const data: Anggota[] = json.data || [];
        setAnggotaList(data);
        setItems(data.map((a) => ({
          id_anggota: a.id,
          nama_anggota: a.nama,
          kategori: a.kategori,
          status_hadir: 'Hadir',
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [kategoriFilter]);

  useEffect(() => { loadAnggota(); }, [loadAnggota]);

  // ── Load Konfirmasi (pending dari siswa) ──
  const loadKonfirmasi = useCallback(async () => {
    setKonfirmasiLoading(true);
    try {
      const params = new URLSearchParams();
      if (konfirmasiFilter.tanggal) params.set('tanggal', konfirmasiFilter.tanggal);
      if (konfirmasiFilter.sesi) params.set('sesi', konfirmasiFilter.sesi);
      if (konfirmasiFilter.status) params.set('status', konfirmasiFilter.status);
      const res = await fetch(`/api/presensi?${params.toString()}`);
      const json = await res.json();
      if (json.success) setKonfirmasiData(json.data || []);
    } finally {
      setKonfirmasiLoading(false);
    }
  }, [konfirmasiFilter]);

  useEffect(() => {
    if (tab === 'konfirmasi') loadKonfirmasi();
  }, [tab, loadKonfirmasi]);

  // ── Konfirmasi satu entry ──
  const handleKonfirmasi = async (id: string, statusBaru: 'Hadir' | 'Alpa') => {
    setConfirmingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch('/api/presensi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status_hadir: statusBaru }),
      });
      const json = await res.json();
      if (json.success) {
        // Update lokal tanpa re-fetch
        setKonfirmasiData((prev) =>
          prev.map((row) => row.id === id ? { ...row, status_hadir: statusBaru } : row)
        );
      }
    } finally {
      setConfirmingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // ── Batch ACC / Tolak semua yang masih pending ──
  const handleBatchKonfirmasi = async (statusBaru: 'Hadir' | 'Alpa') => {
    const pending = konfirmasiData.filter((r) => r.status_hadir === 'Menunggu Konfirmasi');
    if (pending.length === 0) return;
    const label = statusBaru === 'Hadir' ? 'ACC (Hadir)' : 'Tolak (Tidak Hadir)';
    if (!window.confirm(`Tandai semua ${pending.length} entry pending sebagai "${label}"?`)) return;

    const ids = pending.map((r) => r.id!);
    ids.forEach((id) => setConfirmingIds((prev) => new Set(prev).add(id)));
    try {
      const res = await fetch('/api/presensi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status_hadir: statusBaru }),
      });
      const json = await res.json();
      if (json.success) {
        setKonfirmasiData((prev) =>
          prev.map((row) =>
            row.status_hadir === 'Menunggu Konfirmasi' ? { ...row, status_hadir: statusBaru } : row
          )
        );
      }
    } finally {
      ids.forEach((id) => setConfirmingIds((prev) => { const s = new Set(prev); s.delete(id); return s; }));
    }
  };

  // ── Tab Input: bulk status ──
  const setStatus = (idAnggota: string, status: StatusHadir) => {
    setItems((prev) => prev.map((item) =>
      item.id_anggota === idAnggota ? { ...item, status_hadir: status } : item
    ));
  };

  const setAllStatus = (status: StatusHadir) => {
    setItems((prev) => prev.map((item) => ({ ...item, status_hadir: status })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, sesi, items }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Tab Rekap ──
  const loadRekap = async () => {
    setRekapLoading(true);
    try {
      const params = new URLSearchParams();
      if (rekapFilter.tanggal) params.set('tanggal', rekapFilter.tanggal);
      if (rekapFilter.kategori) params.set('kategori', rekapFilter.kategori);
      if (rekapFilter.sesi) params.set('sesi', rekapFilter.sesi);
      if (rekapFilter.status) params.set('status', rekapFilter.status);
      const res = await fetch(`/api/presensi?${params.toString()}`);
      const json = await res.json();
      if (json.success) setRekapData(json.data || []);
    } finally {
      setRekapLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data presensi ini?')) return;
    try {
      const res = await fetch(`/api/presensi?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadRekap();
      } else {
        alert(json.error || 'Gagal menghapus presensi');
      }
    } catch {
      alert('Terjadi kesalahan saat menghapus presensi');
    }
  };

  const hadir = items.filter((i) => i.status_hadir === 'Hadir').length;
  const izin = items.filter((i) => i.status_hadir === 'Izin').length;
  const sakit = items.filter((i) => i.status_hadir === 'Sakit').length;
  const alpa = items.filter((i) => i.status_hadir === 'Alpa').length;

  const pendingCount = konfirmasiData.filter((r) => r.status_hadir === 'Menunggu Konfirmasi').length;

  const exportToExcel = () => {
    if (rekapData.length === 0) return;

    const dataToExport = rekapData.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.tanggal,
      'Waktu Submit': item.waktu_submit ? formatWaktuSubmit(item.waktu_submit) : '—',
      'Sesi': item.sesi,
      'Nama Anggota': item.nama_anggota,
      'Cabang Olahraga': item.cabang_olahraga,
      'Kategori': item.kategori,
      'Status Hadir': item.status_hadir,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');
    XLSX.writeFile(workbook, `Data_Rekap_Presensi_Barqignite_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="type-page-title text-neutral-light">Kelola Presensi</h1>
        <p className="text-white/50 mt-1">Konfirmasi laporan kedatangan siswa &amp; rekap kehadiran anggota</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'konfirmasi', label: 'Konfirmasi Kehadiran', badge: pendingCount },
          { key: 'input', label: 'Input Manual' },
          { key: 'rekap', label: 'Rekap Presensi' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === 'rekap') loadRekap();
              if (t.key === 'konfirmasi') loadKonfirmasi();
            }}
            className={cn(
              'relative px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === t.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            {t.label}
            {'badge' in t && (t.badge ?? 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB: KONFIRMASI
      ══════════════════════════════════════════════ */}
      {tab === 'konfirmasi' && (
        <>
          {/* Filter */}
          <div className="glass-card border rounded-2xl p-6">
            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Tanggal</label>
                <input
                  type="date"
                  value={konfirmasiFilter.tanggal}
                  onChange={(e) => setKonfirmasiFilter({ ...konfirmasiFilter, tanggal: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Sesi</label>
                <input
                  type="text"
                  placeholder="Semua sesi..."
                  value={konfirmasiFilter.sesi}
                  onChange={(e) => setKonfirmasiFilter({ ...konfirmasiFilter, sesi: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={konfirmasiFilter.status}
                  onChange={(e) => setKonfirmasiFilter({ ...konfirmasiFilter, status: e.target.value })}
                  className="form-select"
                >
                  <option value="">Semua Status</option>
                  <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Alpa">Tidak Hadir (Alpa)</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={loadKonfirmasi} className="btn-primary w-full justify-center">
                  <Filter className="w-4 h-4" /> Filter
                </button>
              </div>
            </div>

            {/* Batch actions */}
            {pendingCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-white/10 items-center">
                <span className="text-white/40 text-sm">
                  {pendingCount} entry menunggu konfirmasi — tandai semua:
                </span>
                <button
                  onClick={() => handleBatchKonfirmasi('Hadir')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> ACC Semua (Hadir)
                </button>
                <button
                  onClick={() => handleBatchKonfirmasi('Alpa')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" /> Tolak Semua
                </button>
              </div>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Menunggu', count: konfirmasiData.filter((r) => r.status_hadir === 'Menunggu Konfirmasi').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
              { label: 'Hadir', count: konfirmasiData.filter((r) => r.status_hadir === 'Hadir').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
              { label: 'Alpa', count: konfirmasiData.filter((r) => r.status_hadir === 'Alpa').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
              { label: 'Lainnya', count: konfirmasiData.filter((r) => ['Izin', 'Sakit'].includes(r.status_hadir)).length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: AlertCircle },
            ].map((s) => (
              <div key={s.label} className={`glass-card border ${s.bg} p-4 text-center`}>
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-white/50 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabel konfirmasi */}
          {konfirmasiLoading ? (
            <div className="glass-card border rounded-2xl p-16 text-center">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
              <p className="text-white/40">Memuat laporan kedatangan...</p>
            </div>
          ) : konfirmasiData.length === 0 ? (
            <div className="glass-card border rounded-2xl p-16 text-center">
              <ClipboardCheck className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Tidak ada laporan kedatangan untuk filter ini</p>
              <p className="text-white/25 text-sm mt-1">Coba ubah filter atau tanggal</p>
            </div>
          ) : (
            <div className="glass-card border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Siswa</th>
                      <th>Kategori</th>
                      <th>Sesi Latihan</th>
                      <th>Waktu Submit</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {konfirmasiData.map((row, i) => {
                      const isConfirming = confirmingIds.has(row.id!);
                      const isPending = row.status_hadir === 'Menunggu Konfirmasi';
                      return (
                        <tr key={row.id} className={isPending ? 'bg-amber-500/5' : ''}>
                          <td className="text-white/40 text-xs">{i + 1}</td>
                          <td className="font-medium text-white">{row.nama_anggota}</td>
                          <td><span className="badge badge-neutral">{row.kategori}</span></td>
                          <td className="text-white/70 text-sm">{row.sesi}</td>
                          <td className="font-mono text-xs text-white/60">{formatWaktuSubmit(row.waktu_submit)}</td>
                          <td><StatusBadge status={row.status_hadir} /></td>
                          <td>
                            {isPending ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleKonfirmasi(row.id!, 'Hadir')}
                                  disabled={isConfirming}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-40"
                                  title="ACC — Tandai Hadir"
                                >
                                  {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  ACC
                                </button>
                                <button
                                  onClick={() => handleKonfirmasi(row.id!, 'Alpa')}
                                  disabled={isConfirming}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
                                  title="Tolak — Tandai Tidak Hadir"
                                >
                                  {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-white/30 text-xs">Sudah dikonfirmasi</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-white/40 text-sm">{konfirmasiData.length} laporan</span>
                <button onClick={loadKonfirmasi} className="btn-secondary text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════
          TAB: INPUT MANUAL
      ══════════════════════════════════════════════ */}
      {tab === 'input' && (
        <>
          {/* Info banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 text-sm font-medium">Input Manual oleh Admin</p>
              <p className="text-white/40 text-xs mt-0.5">
                Gunakan ini untuk anggota yang hadir di lapangan tapi lupa submit sendiri. Status langsung dicatat sesuai pilihan admin.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card border rounded-2xl p-6">
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label">Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Sesi</label>
                <select value={sesi} onChange={(e) => setSesi(e.target.value)} className="form-select">
                  {['Sesi 1', 'Sesi 2', 'Sesi 3', 'Latihan Pagi', 'Latihan Sore'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Filter Kategori</label>
                <select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} className="form-select">
                  <option value="">Semua Kategori</option>
                  {kategoriList.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
              <span className="text-white/40 text-sm self-center">Tandai semua:</span>
              {statusOptions.map((s) => (
                <button key={s} onClick={() => setAllStatus(s)} className={`badge border cursor-pointer ${statusDefault[s]} transition-all`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Hadir', count: hadir, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Izin', count: izin, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { label: 'Sakit', count: sakit, icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Alpa', count: alpa, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            ].map((s) => (
              <div key={s.label} className={`glass-card border ${s.bg} p-4 text-center`}>
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-white/50 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="glass-card border rounded-2xl p-16 text-center">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
              <p className="text-white/40">Memuat data anggota...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card border rounded-2xl p-16 text-center">
              <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Tidak ada anggota aktif</p>
            </div>
          ) : (
            <div className="glass-card border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Anggota</th>
                      <th>Kategori</th>
                      <th>Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id_anggota}>
                        <td className="text-white/40 text-xs">{i + 1}</td>
                        <td className="font-medium text-white">{item.nama_anggota}</td>
                        <td><span className="badge badge-neutral">{item.kategori}</span></td>
                        <td>
                          <div className="flex gap-1.5 flex-wrap">
                            {statusOptions.map((s) => (
                              <button
                                key={s}
                                onClick={() => setStatus(item.id_anggota, s)}
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                                  item.status_hadir === s ? statusStyles[s] : statusDefault[s]
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-white/40 text-sm">{items.length} anggota</span>
                <button onClick={handleSave} disabled={saving || items.length === 0} className="btn-primary">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : saved ? <><CheckCircle className="w-4 h-4" />Tersimpan!</> : <><Plus className="w-4 h-4" />Simpan Presensi</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════
          TAB: REKAP
      ══════════════════════════════════════════════ */}
      {tab === 'rekap' && (
        <>
          {/* Rekap filters */}
          <div className="glass-card border rounded-2xl p-6">
            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Filter Tanggal</label>
                <input type="date" value={rekapFilter.tanggal} onChange={(e) => setRekapFilter({ ...rekapFilter, tanggal: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Filter Sesi</label>
                <input
                  type="text"
                  placeholder="Semua sesi..."
                  value={rekapFilter.sesi}
                  onChange={(e) => setRekapFilter({ ...rekapFilter, sesi: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Filter Status</label>
                <select value={rekapFilter.status} onChange={(e) => setRekapFilter({ ...rekapFilter, status: e.target.value })} className="form-select">
                  <option value="">Semua Status</option>
                  <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Alpa">Alpa</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={loadRekap} className="btn-primary w-full justify-center">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button onClick={exportToExcel} disabled={rekapData.length === 0} className="btn-success w-full justify-center">
                  <Download className="w-4 h-4 mr-1" /> Export
                </button>
              </div>
            </div>
          </div>

          {/* Info: pending tidak dihitung hadir */}
          <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-300/80 text-xs">
              Entry berstatus <strong>"Menunggu Konfirmasi"</strong> belum dihitung sebagai Hadir di rekap bulanan.
              Hanya entry yang sudah di-ACC admin yang masuk ke rekap.
            </p>
          </div>

          {rekapLoading ? (
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
                      <th>Nama Anggota</th>
                      <th>Kategori</th>
                      <th>Sesi</th>
                      <th>Waktu Submit</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((row) => (
                      <tr key={row.id}>
                        <td className="font-mono text-sm">{row.tanggal}</td>
                        <td className="font-medium text-white">{row.nama_anggota}</td>
                        <td><span className="badge badge-neutral">{row.kategori}</span></td>
                        <td className="text-white/70 text-sm">{row.sesi}</td>
                        <td className="font-mono text-xs text-white/60">{formatWaktuSubmit(row.waktu_submit)}</td>
                        <td><StatusBadge status={row.status_hadir} /></td>
                        <td>
                          <button onClick={() => handleDelete(row.id!)} className="btn-secondary text-xs py-1 px-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/30">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rekapData.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-white/40 py-8">Tidak ada data — klik Filter untuk memuat</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
