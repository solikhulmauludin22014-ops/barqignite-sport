'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2, Plus, Filter, UserPlus, RefreshCw, Trash2, Download } from 'lucide-react';
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

export default function AdminPresensiPage() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [items, setItems] = useState<PresensiItem[]>([]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [sesi, setSesi] = useState('Sesi 1');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'input' | 'rekap'>('input');

  // Rekap state
  const [rekapData, setRekapData] = useState<Presensi[]>([]);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapFilter, setRekapFilter] = useState({ tanggal: '', kategori: '' });

  const kategoriList = [...new Set(anggotaList.map((a) => a.kategori))];

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

  const loadRekap = async () => {
    setRekapLoading(true);
    try {
      const params = new URLSearchParams();
      if (rekapFilter.tanggal) params.set('tanggal', rekapFilter.tanggal);
      if (rekapFilter.kategori) params.set('kategori', rekapFilter.kategori);
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
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus presensi');
    }
  };

  const hadir = items.filter((i) => i.status_hadir === 'Hadir').length;
  const izin = items.filter((i) => i.status_hadir === 'Izin').length;
  const sakit = items.filter((i) => i.status_hadir === 'Sakit').length;
  const alpa = items.filter((i) => i.status_hadir === 'Alpa').length;

  const exportToExcel = () => {
    if (rekapData.length === 0) return;

    const dataToExport = rekapData.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.tanggal,
      'Sesi': item.sesi,
      'Nama Anggota': item.nama_anggota,
      'Cabang Olahraga': item.cabang_olahraga,
      'Kategori': item.kategori,
      'Status Hadir': item.status_hadir
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
        <p className="text-white/50 mt-1">Input dan rekap kehadiran anggota</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: 'input', label: 'Input Presensi' }, { key: 'rekap', label: 'Rekap Presensi' }].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as 'input' | 'rekap'); if (t.key === 'rekap') loadRekap(); }}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === t.key ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'input' ? (
        <>
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
      ) : (
        <>
          {/* Rekap filters */}
          <div className="glass-card border rounded-2xl p-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Filter Tanggal</label>
                <input type="date" value={rekapFilter.tanggal} onChange={(e) => setRekapFilter({ ...rekapFilter, tanggal: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Filter Kategori</label>
                <select value={rekapFilter.kategori} onChange={(e) => setRekapFilter({ ...rekapFilter, kategori: e.target.value })} className="form-select">
                  <option value="">Semua</option>
                  {kategoriList.map((k) => <option key={k} value={k}>{k}</option>)}
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
                        <td>{row.sesi}</td>
                        <td>
                          <span className={`badge ${row.status_hadir === 'Hadir' ? 'badge-success' : row.status_hadir === 'Alpa' ? 'badge-danger' : row.status_hadir === 'Sakit' ? 'badge-info' : 'badge-warning'}`}>
                            {row.status_hadir}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDelete(row.id!)} className="btn-secondary text-xs py-1 px-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/30">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rekapData.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-white/40 py-8">Tidak ada data</td></tr>
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
