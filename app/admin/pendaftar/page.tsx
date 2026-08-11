'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, CheckCircle, XCircle, Eye, Loader2, Filter, RefreshCw, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Pendaftar } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminPendaftarPage() {
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Pendaftar | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pendaftar${filter ? `?status=${filter}` : ''}`);
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const res = await fetch('/api/pendaftar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (json.success) {
        setSelected(null);
        loadData();
      }
    } finally { setProcessing(null); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data pendaftar ini?')) return;
    try {
      const res = await fetch(`/api/pendaftar?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSelected(null);
        loadData();
      } else {
        alert(json.error || 'Gagal menghapus pendaftar');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus pendaftar');
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    const dataToExport = data.map((item, index) => ({
      'No': index + 1,
      'Nama Pendaftar': item.nama,
      'Tanggal Lahir': formatDate(item.tanggal_lahir),
      'Jenis Kelamin': item.jenis_kelamin,
      'Kategori': item.kategori,
      'No HP/WA': item.no_hp,
      'Email': item.email || '-',
      'Nama Wali': item.nama_wali || '-',
      'Asal Sekolah': item.asal_sekolah || '-',
      'Kelas': item.kelas || '-',
      'Alamat': item.alamat,
      'Tanggal Daftar': formatDate(item.tanggal_daftar),
      'Status Pendaftaran': item.status_pendaftaran
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftar Baru');
    XLSX.writeFile(workbook, `Data_Pendaftar_Barqignite_${filter || 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const statusConfig: Record<string, { class: string; label: string }> = {
    Pending: { class: 'badge-warning', label: 'Menunggu' },
    Diterima: { class: 'badge-success', label: 'Diterima' },
    Ditolak: { class: 'badge-danger', label: 'Ditolak' },
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-neutral-light">Pendaftar Baru</h1>
        <p className="text-neutral-light/50 mt-1">Review dan kelola pendaftar anggota baru</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'Pending', label: 'Menunggu' }, { key: 'Diterima', label: 'Diterima' }, { key: 'Ditolak', label: 'Ditolak' }, { key: '', label: 'Semua' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-neutral-light/50 hover:text-neutral-light hover:bg-neutral-light/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={exportToExcel} disabled={data.length === 0} className="btn-success text-sm px-4">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={loadData} className="text-neutral-light/40 hover:text-neutral-light p-2 rounded-xl hover:bg-neutral-light/10 transition-colors">
            <RefreshCw className="w-4 h-4" />
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
                  <th>Nama</th>
                  <th>Sekolah / Kelas</th>
                  <th>Kategori</th>
                  <th>No HP</th>
                  <th>Tgl Daftar</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <p className="font-medium text-neutral-light">{row.nama}</p>
                        {row.nama_wali && <p className="text-xs text-neutral-light/40">Wali: {row.nama_wali}</p>}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-neutral-light">{row.asal_sekolah || '-'}</p>
                        {row.kelas && <p className="text-xs text-neutral-light/40">Kelas: {row.kelas}</p>}
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{row.kategori}</span></td>
                    <td className="text-neutral-light/70">{row.no_hp}</td>
                    <td className="text-neutral-light/50 text-sm">{formatDate(row.tanggal_daftar)}</td>
                    <td>
                      <span className={`badge ${statusConfig[row.status_pendaftaran]?.class || 'badge-neutral'}`}>
                        {statusConfig[row.status_pendaftaran]?.label || row.status_pendaftaran}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(row)} className="btn-secondary text-xs py-1 px-2">
                          <Eye className="w-3 h-3" /> Detail
                        </button>
                        {row.status_pendaftaran === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleAction(row.id, 'approve')}
                              disabled={processing === row.id}
                              className="btn-success"
                            >
                              {processing === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Terima
                            </button>
                            <button
                              onClick={() => handleAction(row.id, 'reject')}
                              disabled={processing === row.id}
                              className="btn-danger"
                            >
                              <XCircle className="w-3 h-3" /> Tolak
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(row.id!)} className="btn-secondary text-xs py-1 px-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/30">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-neutral-light/40 py-12">
                      <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Tidak ada pendaftar {filter === 'Pending' ? 'yang menunggu' : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-8 w-full max-w-lg animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-neutral-light">{selected.nama}</h3>
                <span className={`badge mt-1 ${statusConfig[selected.status_pendaftaran]?.class}`}>
                  {statusConfig[selected.status_pendaftaran]?.label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Tanggal Lahir', value: formatDate(selected.tanggal_lahir) },
                { label: 'Jenis Kelamin', value: selected.jenis_kelamin },
                { label: 'Kategori', value: selected.kategori },
                { label: 'No HP/WA', value: selected.no_hp },
                { label: 'Email', value: selected.email || '—' },
                { label: 'Nama Wali', value: selected.nama_wali || '—' },
                { label: 'Asal Sekolah', value: selected.asal_sekolah || '—' },
                { label: 'Kelas', value: selected.kelas || '—' },
                { label: 'Tanggal Daftar', value: formatDate(selected.tanggal_daftar) },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-neutral-light/40 text-xs">{f.label}</p>
                  <p className="text-neutral-light font-medium mt-0.5">{f.value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-neutral-light/40 text-xs">Alamat</p>
                <p className="text-neutral-light font-medium mt-0.5">{selected.alamat}</p>
              </div>
            </div>

            {selected.status_pendaftaran === 'Pending' && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleAction(selected.id, 'reject')}
                  disabled={!!processing}
                  className="btn-danger flex-1 justify-center text-sm"
                >
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
                <button
                  onClick={() => handleAction(selected.id, 'approve')}
                  disabled={!!processing}
                  className="btn-success flex-1 justify-center text-sm"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Terima & Jadikan Anggota
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
