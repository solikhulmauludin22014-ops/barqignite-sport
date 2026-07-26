'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Loader2, UserCheck, X, CheckCircle, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Pelatih } from '@/types';

const emptyForm = { nama: '', foto_url: '', spesialisasi: '', sertifikasi: '', pengalaman: '', urutan: '1' };

export default function AdminPelatihPage() {
  const [data, setData] = useState<Pelatih[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pelatih | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pelatih');
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Pelatih) => {
    setEditing(p);
    setForm({ nama: p.nama, foto_url: p.foto_url, spesialisasi: p.spesialisasi, sertifikasi: p.sertifikasi, pengalaman: p.pengalaman, urutan: String(p.urutan) });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id, urutan: parseInt(form.urutan) } : { ...form, urutan: parseInt(form.urutan) };
      const res = await fetch('/api/pelatih', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); setShowForm(false); loadData(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data pelatih ini?')) return;
    try {
      const res = await fetch(`/api/pelatih?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.error || 'Gagal menghapus pelatih');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus pelatih');
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    const dataToExport = data.map((item, index) => ({
      'No': index + 1,
      'Nama Pelatih': item.nama,
      'Spesialisasi': item.spesialisasi,
      'Sertifikasi': item.sertifikasi || '-',
      'Pengalaman': item.pengalaman,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelatih');
    XLSX.writeFile(workbook, `Data_Pelatih_Barqignite_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-light">Kelola Pelatih</h1>
          <p className="text-neutral-light/50 mt-1">Tambah, edit data pelatih club</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} disabled={data.length === 0} className="btn-success h-10 px-4">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={openAdd} className="btn-primary h-10 px-4"><Plus className="w-4 h-4 mr-2" /> Tambah Pelatih</button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((pelatih) => (
            <div key={pelatih.id} className="glass-card-hover border rounded-2xl p-6 group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  {pelatih.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pelatih.foto_url} alt={pelatih.nama} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-neutral-light text-xl font-bold">{pelatih.nama.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-neutral-light truncate">{pelatih.nama}</h3>
                  <span className="badge badge-info text-xs mt-1">{pelatih.spesialisasi}</span>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(pelatih)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-lg hover:bg-neutral-light/10">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(pelatih.id!)} className="p-2 text-red-400/70 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-neutral-light/50">
                <p><span className="text-neutral-light/30">Sertifikasi:</span> {pelatih.sertifikasi || '—'}</p>
                <p><span className="text-neutral-light/30">Pengalaman:</span> {pelatih.pengalaman}</p>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="md:col-span-3 glass-card border rounded-2xl p-16 text-center">
              <UserCheck className="w-12 h-12 text-neutral-light/20 mx-auto mb-3" />
              <p className="text-neutral-light/40">Belum ada data pelatih</p>
              <button onClick={openAdd} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Tambah Pelatih</button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-8 w-full max-w-lg animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-neutral-light">{editing ? 'Edit Pelatih' : 'Tambah Pelatih'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="form-label">Nama Pelatih *</label>
                  <input value={form.nama} onChange={set('nama')} placeholder="Nama lengkap" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Spesialisasi *</label>
                  <input value={form.spesialisasi} onChange={set('spesialisasi')} placeholder="Teknik Dasar" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Sertifikasi</label>
                  <input value={form.sertifikasi} onChange={set('sertifikasi')} placeholder="Lisensi D" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Urutan Tampil</label>
                  <input type="number" value={form.urutan} onChange={set('urutan')} min="1" className="form-input" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">URL Foto</label>
                  <input value={form.foto_url} onChange={set('foto_url')} placeholder="https://..." className="form-input" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Pengalaman</label>
                  <textarea value={form.pengalaman} onChange={set('pengalaman')} rows={3} placeholder="Deskripsi pengalaman melatih..." className="form-input resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Simpan...</> : saved ? <><CheckCircle className="w-4 h-4" />Tersimpan!</> : <><Plus className="w-4 h-4" />Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
