'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Download, Filter, UserCheck, RefreshCw, Trash2 } from 'lucide-react';
import type { Anggota } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AdminAnggotaPage() {
  const [data, setData] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/anggota`);
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived unique categories
  const kategoriOptions = [...new Set(data.map((item) => item.kategori))];

  // Filter data
  const filteredData = data.filter((item) => {
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.no_hp.includes(searchQuery) || 
                        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCabang = filterCabang ? item.cabang_olahraga === filterCabang : true;
    const matchKategori = filterKategori ? item.kategori === filterKategori : true;
    return matchSearch && matchCabang && matchKategori;
  });

  // Export to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    // Headers
    const headers = ['ID', 'Nama Lengkap', 'Cabang Olahraga', 'Kategori', 'Tanggal Lahir', 'Jenis Kelamin', 'No HP/WA', 'Email', 'Alamat', 'Tanggal Gabung', 'Status'];
    
    // Rows
    const rows = filteredData.map(item => [
      item.id,
      `"${item.nama}"`,
      item.cabang_olahraga,
      `"${item.kategori}"`,
      formatDate(item.tanggal_lahir),
      item.jenis_kelamin,
      `'${item.no_hp}`, // Escape phone number to prevent scientific notation in excel
      item.email || '',
      `"${item.alamat}"`,
      formatDate(item.tanggal_gabung),
      item.status
    ]);

    // CSV Content
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Anggota_Barqignite_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data anggota ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/anggota?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.error || 'Gagal menghapus anggota');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus anggota');
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-light">Data Anggota</h1>
          <p className="text-neutral-light/50 mt-1">Kelola seluruh data anggota aktif dan non-aktif</p>
        </div>
        <button onClick={exportToCSV} disabled={filteredData.length === 0} className="btn-success h-10 px-4">
          <Download className="w-4 h-4 mr-2" />
          Export ke Excel (CSV)
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card border rounded-2xl p-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Cari Anggota</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-light/40" />
              <input 
                type="text" 
                placeholder="Cari nama, no hp, atau email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10" 
              />
            </div>
          </div>
          <div>
            <label className="form-label">Filter Cabang</label>
            <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)} className="form-select">
              <option value="">Semua Cabang</option>
              <option value="Basket">Basket</option>
              <option value="Renang">Renang</option>
            </select>
          </div>
          <div>
            <label className="form-label">Filter Kategori</label>
            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="form-select">
              <option value="">Semua Kategori</option>
              {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
          <p className="text-neutral-light/40">Memuat data anggota...</p>
        </div>
      ) : (
        <div className="glass-card border rounded-2xl overflow-hidden">
          {/* Scrollable container like Excel */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
              <thead>
                <tr className="bg-arena-900/80 border-b border-arena-600/30 text-neutral-light/60 font-medium">
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Nama Lengkap</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Cabang</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Kategori</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">No HP/WA</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Tanggal Lahir</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">L/P</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Email</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Alamat</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Tgl Gabung</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena-600/20">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-arena-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-light">{row.nama}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border', 
                        row.cabang_olahraga === 'Basket' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      )}>
                        {row.cabang_olahraga}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-light/70">{row.kategori}</td>
                    <td className="px-4 py-3 text-neutral-light/70">{row.no_hp}</td>
                    <td className="px-4 py-3 text-neutral-light/50">{formatDate(row.tanggal_lahir)}</td>
                    <td className="px-4 py-3 text-neutral-light/50">{row.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                    <td className="px-4 py-3 text-neutral-light/50">{row.email || '-'}</td>
                    <td className="px-4 py-3 text-neutral-light/50 max-w-[200px] truncate" title={row.alamat}>{row.alamat}</td>
                    <td className="px-4 py-3 text-neutral-light/50">{formatDate(row.tanggal_gabung)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest', 
                        row.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(row.id!)} className="btn-secondary text-xs py-1 px-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/30">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-neutral-light/40">
                      <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Tidak ada data anggota ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-arena-600/30 dark:border-white/5 bg-arena-900/50 flex items-center justify-between">
            <span className="text-neutral-light/40 text-xs font-medium">
              Menampilkan {filteredData.length} dari {data.length} anggota
            </span>
            <button onClick={loadData} className="btn-secondary h-8 px-3 text-xs">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
