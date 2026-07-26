'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Download, Filter, UserCheck, RefreshCw, Trash2, Pencil, X, CheckCircle, Plus } from 'lucide-react';
import type { Anggota } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AdminAnggotaPage() {
  const [data, setData] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const emptyForm = {
    nama: '',
    cabang_olahraga: 'Basket',
    kategori: '',
    tanggal_lahir: '',
    jenis_kelamin: 'Laki-laki',
    alamat: '',
    no_hp: '',
    email: '',
    status: 'Aktif',
  };
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Anggota | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const openEdit = (a: Anggota) => {
    setEditing(a);
    setForm({
      nama: a.nama,
      cabang_olahraga: a.cabang_olahraga,
      kategori: a.kategori,
      tanggal_lahir: a.tanggal_lahir,
      jenis_kelamin: a.jenis_kelamin,
      alamat: a.alamat,
      no_hp: a.no_hp,
      email: a.email || '',
      status: a.status,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/anggota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editing.id }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setShowForm(false);
        loadData();
      } else {
        alert(json.error || 'Gagal menyimpan');
      }
    } finally { setSaving(false); }
  };

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
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="btn-secondary text-xs py-1 px-2">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(row.id!)} className="btn-secondary text-xs py-1 px-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/30">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
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

      {/* Form Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-8 w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-neutral-light">Edit Data Anggota</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nama Lengkap</label>
                  <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">No HP/WA</label>
                  <input type="text" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Cabang Olahraga</label>
                  <select value={form.cabang_olahraga} onChange={(e) => setForm({ ...form, cabang_olahraga: e.target.value })} className="form-select" required>
                    <option value="Basket">Basket</option>
                    <option value="Renang">Renang</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Kategori</label>
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="form-select" required>
                    <option value="">Pilih Kategori</option>
                    {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tanggal Lahir</label>
                  <input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Jenis Kelamin</label>
                  <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="form-select" required>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Aktif' | 'Non-aktif' })} className="form-select" required>
                    <option value="Aktif">Aktif</option>
                    <option value="Non-aktif">Non-aktif</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Alamat Lengkap</label>
                  <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={3} className="form-input resize-none" required />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : saved ? <><CheckCircle className="w-4 h-4" />Tersimpan!</> : <><Plus className="w-4 h-4" />Simpan Perubahan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
