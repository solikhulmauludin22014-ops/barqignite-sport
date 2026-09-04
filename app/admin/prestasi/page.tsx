'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Loader2, Trophy, X, CheckCircle, Trash2, Download, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Prestasi } from '@/types';
import { formatDate } from '@/lib/utils';
import ImageCropModal from '@/components/ImageCropModal';

const emptyForm = { 
  nama_atlet: '', 
  kategori: 'Basket', 
  judul_prestasi: '', 
  tingkat: 'kota', 
  tahun: new Date().getFullYear(), 
  deskripsi: '', 
  is_featured: false, 
  urutan: 99 
};

export default function AdminPrestasiPage() {
  const [data, setData] = useState<Prestasi[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Prestasi | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [fotoFile, setFotoFile] = useState<File | Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterKategori, setFilterKategori] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/prestasi', window.location.origin);
      if (filterKategori) url.searchParams.append('kategori', filterKategori);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally { setLoading(false); }
  }, [filterKategori]);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setFotoFile(null);
    setFotoPreview('');
    setShowForm(true); 
  };
  
  const openEdit = (p: Prestasi) => {
    setEditing(p);
    setForm({ 
      nama_atlet: p.nama_atlet, 
      kategori: p.kategori, 
      judul_prestasi: p.judul_prestasi, 
      tingkat: p.tingkat, 
      tahun: p.tahun, 
      deskripsi: p.deskripsi || '', 
      is_featured: p.is_featured, 
      urutan: p.urutan 
    });
    setFotoFile(null);
    setFotoPreview(p.foto_url);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        alert('Format tidak didukung. Gunakan JPG, PNG, atau WebP.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      // Buka crop modal
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setCropSrc(ev.target.result as string); };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePrestasisCropComplete = (blob: Blob) => {
    setCropSrc(null);
    const objectUrl = URL.createObjectURL(blob);
    setFotoFile(blob as unknown as File);
    setFotoPreview(objectUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !fotoFile) {
      alert('Foto wajib diupload untuk prestasi baru');
      return;
    }

    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const formData = new FormData();
      
      if (editing) formData.append('id', editing.id);
      formData.append('nama_atlet', form.nama_atlet);
      formData.append('kategori', form.kategori);
      formData.append('judul_prestasi', form.judul_prestasi);
      formData.append('tingkat', form.tingkat);
      formData.append('tahun', String(form.tahun));
      formData.append('deskripsi', form.deskripsi);
      formData.append('is_featured', String(form.is_featured));
      formData.append('urutan', String(form.urutan));
      
      if (fotoFile) formData.append('foto', fotoFile);
      if (editing) formData.append('old_foto_url', editing.foto_url);

      const res = await fetch('/api/prestasi', { 
        method, 
        body: formData 
      });
      
      const json = await res.json();
      if (json.success) { 
        setSaved(true); 
        setTimeout(() => setSaved(false), 2000); 
        setShowForm(false); 
        loadData(); 
      } else {
        alert(json.error || 'Gagal menyimpan data');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan data');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (p: Prestasi) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data prestasi ini?')) return;
    try {
      const url = new URL('/api/prestasi', window.location.origin);
      url.searchParams.append('id', p.id);
      if (p.foto_url) url.searchParams.append('foto_url', p.foto_url);
      
      const res = await fetch(url.toString(), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.error || 'Gagal menghapus prestasi');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus prestasi');
    }
  };

  const handleUrutanChange = async (id: string, newUrutan: number) => {
    // Optimistic update
    setData(prev => prev.map(p => p.id === id ? { ...p, urutan: newUrutan } : p));
    
    // Create minimal form data just for update
    const formData = new FormData();
    const item = data.find(p => p.id === id);
    if (!item) return;

    formData.append('id', id);
    formData.append('nama_atlet', item.nama_atlet);
    formData.append('kategori', item.kategori);
    formData.append('judul_prestasi', item.judul_prestasi);
    formData.append('tingkat', item.tingkat);
    formData.append('tahun', String(item.tahun));
    formData.append('deskripsi', item.deskripsi || '');
    formData.append('is_featured', String(item.is_featured));
    formData.append('urutan', String(newUrutan));
    formData.append('old_foto_url', item.foto_url); // don't change photo

    try {
      await fetch('/api/prestasi', { method: 'PUT', body: formData });
      // We don't necessarily need to reload if optimistic update is enough
    } catch (err) {
      console.error('Failed to update urutan', err);
      loadData(); // revert on fail
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    const dataToExport = data.map((item, index) => ({
      'No': index + 1,
      'Nama Atlet': item.nama_atlet,
      'Kategori': item.kategori,
      'Judul Prestasi': item.judul_prestasi,
      'Tingkat': item.tingkat,
      'Tahun': item.tahun,
      'Featured': item.is_featured ? 'Ya' : 'Tidak',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prestasi');
    XLSX.writeFile(workbook, `Data_Prestasi_Barqignite_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev: any) => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="type-page-title text-neutral-light">Prestasi Atlet</h1>
          <p className="text-neutral-light/50 mt-1">Kelola data pencapaian atlet club</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterKategori} 
            onChange={(e) => setFilterKategori(e.target.value)}
            className="form-input bg-arena-800 border-arena-600/50 h-10 py-0"
          >
            <option value="">Semua Kategori</option>
            <option value="Basket">Basket</option>
            <option value="Renang">Renang</option>
          </select>
          <button onClick={exportToExcel} disabled={data.length === 0} className="btn-success h-10 px-4">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={openAdd} className="btn-primary h-10 px-4"><Plus className="w-4 h-4 mr-2" /> Tambah Prestasi</button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((item) => (
            <div key={item.id} className="glass-card-hover border rounded-2xl p-4 flex flex-col group relative overflow-hidden">
              {item.is_featured && (
                <div className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                  <Trophy className="w-3 h-3" /> Featured
                </div>
              )}
              
              <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-arena-900 group-hover:shadow-lg transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.foto_url} 
                  alt={item.judul_prestasi} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-arena-900 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className={`badge text-[10px] ${item.kategori === 'Basket' ? 'bg-basket/20 text-basket border-basket/30' : 'bg-renang/20 text-renang border-renang/30'}`}>
                    {item.kategori}
                  </span>
                  <span className="badge badge-info text-[10px] uppercase">
                    {item.tingkat}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-ui font-semibold text-neutral-light mb-1 leading-tight text-base">{item.judul_prestasi}</h3>
                <p className="text-primary-400 font-medium text-sm mb-2">{item.nama_atlet} • {item.tahun}</p>
                {item.deskripsi && (
                  <p className="text-neutral-light/50 text-xs line-clamp-2 mb-4">{item.deskripsi}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-light/40">Urutan:</span>
                  <input 
                    type="number" 
                    value={item.urutan} 
                    onChange={(e) => handleUrutanChange(item.id, parseInt(e.target.value) || 99)}
                    className="w-16 h-8 text-xs bg-arena-900 border border-white/10 rounded-lg px-2 text-center" 
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 text-neutral-light/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item)} className="p-2 text-red-400/70 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="md:col-span-3 glass-card border rounded-2xl p-16 text-center">
              <Trophy className="w-12 h-12 text-neutral-light/20 mx-auto mb-3" />
              <p className="text-neutral-light/40">Belum ada data prestasi</p>
              <button onClick={openAdd} className="btn-primary mt-4"><Plus className="w-4 h-4 mr-2" /> Tambah Data</button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
              <h3 className="type-section-heading text-neutral-light flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary-400" />
                {editing ? 'Edit Prestasi' : 'Tambah Prestasi'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="prestasi-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Photo Upload Area */}
                <div className="space-y-2">
                  <label className="form-label">Foto Dokumentasi {editing ? '(Opsional)' : '*'}</label>
                  <div 
                    className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-colors flex flex-col items-center justify-center cursor-pointer group ${fotoPreview ? 'border-primary-500/50 bg-primary-500/5' : 'border-neutral-light/20 bg-arena-900 hover:border-primary-400 hover:bg-arena-800'}`}
                    style={{ minHeight: fotoPreview ? '240px' : '160px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {fotoPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fotoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Pencil className="w-4 h-4" /> Ganti Foto
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-neutral-light/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-all">
                          <ImageIcon className="w-6 h-6 text-neutral-light/40 group-hover:text-primary-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-light">Klik untuk upload gambar</p>
                        <p className="text-xs text-neutral-light/40 mt-1">JPG, PNG, WEBP (Max 10MB)</p>
                      </div>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* Crop Modal */}
                {cropSrc && (
                  <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={1}
                    title="Atur Posisi Foto Prestasi"
                    onComplete={handlePrestasisCropComplete}
                    onClose={() => setCropSrc(null)}
                    onPickNew={() => { setCropSrc(null); fileInputRef.current?.click(); }}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nama Atlet *</label>
                    <input value={form.nama_atlet} onChange={set('nama_atlet')} placeholder="Contoh: Budi Santoso" className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Kategori *</label>
                    <select value={form.kategori} onChange={set('kategori')} className="form-input" required>
                      <option value="Basket">Basket</option>
                      <option value="Renang">Renang</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Judul Prestasi *</label>
                    <input value={form.judul_prestasi} onChange={set('judul_prestasi')} placeholder="Juara 1 Kejurda Jatim" className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Tingkat *</label>
                    <select value={form.tingkat} onChange={set('tingkat')} className="form-input" required>
                      <option value="kota">Tingkat Kota/Kabupaten</option>
                      <option value="provinsi">Tingkat Provinsi</option>
                      <option value="nasional">Tingkat Nasional</option>
                      <option value="internasional">Tingkat Internasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Tahun *</label>
                    <input type="number" value={form.tahun} onChange={set('tahun')} className="form-input" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Deskripsi (Opsional)</label>
                    <textarea value={form.deskripsi} onChange={set('deskripsi')} rows={3} placeholder="Ceritakan sedikit tentang pencapaian ini..." className="form-input resize-none" />
                  </div>
                  
                  <div className="md:col-span-2 bg-arena-900 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-neutral-light">Tampilkan di Beranda (Featured)</p>
                      <p className="text-xs text-neutral-light/50">Highlight prestasi ini di section beranda</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-arena-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-arena-900/50 flex gap-3 shrink-0 rounded-b-3xl">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" form="prestasi-form" disabled={saving} className="btn-primary flex-1 justify-center shadow-lg shadow-primary-500/20">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Menyimpan...</> : saved ? <><CheckCircle className="w-4 h-4 mr-2" />Berhasil!</> : <><Plus className="w-4 h-4 mr-2" />Simpan Data</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
