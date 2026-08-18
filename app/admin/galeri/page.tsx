'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Upload, Trash2, Star, StarOff, ArrowUp, ArrowDown, X, Loader2, Plus } from 'lucide-react';
import { supabasePublic } from '@/lib/supabase';

interface GaleriItem {
  id: string;
  judul: string;
  kategori: 'Basket' | 'Renang';
  foto_url: string;
  tanggal?: string;
  is_featured: boolean;
  urutan: number;
  created_at: string;
}

export default function AdminGaleriPage() {
  const [items, setItems] = useState<GaleriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterTab, setFilterTab] = useState<'Semua' | 'Basket' | 'Renang'>('Semua');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    judul: '',
    kategori: 'Basket' as 'Basket' | 'Renang',
    tanggal: '',
    is_featured: false,
    preview: '',
    file: null as File | null,
  });

  // ─── Fetch ────────────────────────────────────────────────────────────────────

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/galeri?limit=50');
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      setError('Gagal memuat data galeri.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, file, preview: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file || !form.judul) {
      setError('Judul dan foto wajib diisi.');
      return;
    }
    setUploading(true);
    setError('');

    try {
      // 1. Upload ke Supabase Storage
      const ext = form.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabasePublic.storage
        .from('galeri-dokumentasi')
        .upload(fileName, form.file, { contentType: form.file.type, upsert: false });

      if (uploadError) throw new Error(`Upload gagal: ${uploadError.message}`);

      // 2. Ambil public URL
      const { data: urlData } = supabasePublic.storage
        .from('galeri-dokumentasi')
        .getPublicUrl(uploadData.path);

      const foto_url = urlData.publicUrl;

      // 3. Simpan ke database via API
      const res = await fetch('/api/galeri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: form.judul,
          kategori: form.kategori,
          foto_url,
          tanggal: form.tanggal || null,
          is_featured: form.is_featured,
          urutan: items.length + 1,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data.');

      setSuccess('Foto berhasil diunggah!');
      setForm({ judul: '', kategori: 'Basket', tanggal: '', is_featured: false, preview: '', file: null });
      setShowUploadForm(false);
      fetchItems();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      const res = await fetch(`/api/galeri/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus.');
      setSuccess('Foto dihapus.');
      fetchItems();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleFeatured = async (item: GaleriItem) => {
    try {
      await fetch(`/api/galeri/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !item.is_featured }),
      });
      fetchItems();
    } catch {
      setError('Gagal mengubah status unggulan.');
    }
  };

  const handleMoveOrder = async (item: GaleriItem, direction: 'up' | 'down') => {
    const newUrutan = direction === 'up' ? Math.max(0, item.urutan - 1) : item.urutan + 1;
    try {
      await fetch(`/api/galeri/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urutan: newUrutan }),
      });
      fetchItems();
    } catch {
      setError('Gagal mengubah urutan.');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const filtered = filterTab === 'Semua' ? items : items.filter(i => i.kategori === filterTab);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black text-neutral-light uppercase tracking-wider">
            Galeri Dokumentasi
          </h1>
          <p className="text-neutral-light/40 mt-1 text-sm font-bold uppercase tracking-widest">
            Kelola foto kegiatan latihan & kompetisi
          </p>
        </div>
        <button
          id="btn-tambah-foto"
          onClick={() => setShowUploadForm(true)}
          className="btn-accent flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Foto
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-status-danger/10 border border-status-danger/30 rounded-xl text-status-danger text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 bg-status-success/10 border border-status-success/30 rounded-xl text-emerald-400 text-sm">
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-arena-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-black text-neutral-light uppercase tracking-wider">Upload Foto</h2>
              <button onClick={() => setShowUploadForm(false)} className="p-1.5 text-neutral-light/40 hover:text-neutral-light rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File drop area */}
              <div
                className="border-2 border-dashed border-white/10 hover:border-basket/40 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.preview ? (
                  <Image src={form.preview} alt="Preview" width={200} height={120} className="rounded-lg object-cover w-full h-32" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-neutral-light/20" />
                    <p className="text-neutral-light/40 text-sm text-center">Klik untuk pilih foto<br /><span className="text-[11px]">JPEG, PNG, WebP — maks. 10MB</span></p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Judul */}
              <div>
                <label className="form-label">Judul / Keterangan Foto</label>
                <input
                  id="input-judul-foto"
                  type="text"
                  placeholder="Misal: Latihan Basket — Sesi Dribbling"
                  className="form-input"
                  value={form.judul}
                  onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                  required
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="form-label">Kategori</label>
                <div className="flex gap-2">
                  {(['Basket', 'Renang'] as const).map(k => (
                    <button
                      key={k}
                      type="button"
                      id={`kategori-${k.toLowerCase()}`}
                      onClick={() => setForm(f => ({ ...f, kategori: k }))}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 ${
                        form.kategori === k
                          ? k === 'Basket' ? 'bg-basket text-white border-basket' : 'bg-renang text-white border-renang'
                          : 'text-neutral-light/50 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {k === 'Basket' ? '🏀' : '🏊'} {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="form-label">Tanggal Kegiatan (opsional)</label>
                <input
                  id="input-tanggal-foto"
                  type="date"
                  className="form-input"
                  value={form.tanggal}
                  onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                />
              </div>

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-arena-800 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <input
                  id="toggle-featured"
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-basket"
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-light">Foto Unggulan</p>
                  <p className="text-xs text-neutral-light/40">Akan ditampilkan pertama dan lebih besar</p>
                </div>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUploadForm(false)} className="btn-secondary flex-1 justify-center">
                  Batal
                </button>
                <button type="submit" disabled={uploading} className="btn-accent flex-1 justify-center gap-2">
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Mengupload...</>
                  ) : (
                    <><Upload className="w-4 h-4" />Upload Foto</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-arena-900 rounded-xl w-fit">
        {(['Semua', 'Basket', 'Renang'] as const).map(tab => {
          const isActive = filterTab === tab;
          const color = tab === 'Basket' ? (isActive ? 'bg-basket text-white' : 'text-basket/70') : tab === 'Renang' ? (isActive ? 'bg-renang text-white' : 'text-renang/70') : (isActive ? 'bg-arena-600 text-neutral-light' : 'text-neutral-light/50');
          return (
            <button
              key={tab}
              id={`admin-filter-${tab.toLowerCase()}`}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${color}`}
            >
              {tab} {tab !== 'Semua' && <span className="ml-1 opacity-60">({items.filter(i => i.kategori === tab).length})</span>}
            </button>
          );
        })}
        <span className="ml-2 text-neutral-light/30 text-xs font-mono">
          {filtered.length} foto
        </span>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-pulse aspect-[4/3]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-arena-900 border border-white/5 rounded-2xl gap-4">
          <Camera className="w-12 h-12 text-neutral-light/15" />
          <p className="text-neutral-light/40 text-sm font-medium">Belum ada foto di kategori ini</p>
          <button onClick={() => setShowUploadForm(true)} className="btn-accent text-xs px-6 py-2.5 gap-2">
            <Plus className="w-4 h-4" />
            Upload Foto Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="group relative bg-arena-900 border border-white/5 overflow-hidden rounded-xl hover:border-white/15 transition-all duration-300">
              {/* Photo */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.foto_url}
                  alt={item.judul}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-arena-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Featured badge */}
                {item.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-basket text-white text-[9px] font-bold uppercase tracking-wider">
                    Unggulan
                  </div>
                )}

                {/* Category badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 text-white text-[9px] font-bold uppercase tracking-wider ${item.kategori === 'Basket' ? 'bg-basket' : 'bg-renang'}`}>
                  {item.kategori}
                </div>

                {/* Action buttons on hover */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1">
                  <div className="flex gap-1">
                    <button
                      id={`btn-order-up-${item.id}`}
                      onClick={() => handleMoveOrder(item, 'up')}
                      className="p-1.5 bg-arena-700/90 rounded-lg text-neutral-light/60 hover:text-neutral-light hover:bg-arena-600 transition-colors"
                      title="Geser ke atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-order-down-${item.id}`}
                      onClick={() => handleMoveOrder(item, 'down')}
                      className="p-1.5 bg-arena-700/90 rounded-lg text-neutral-light/60 hover:text-neutral-light hover:bg-arena-600 transition-colors"
                      title="Geser ke bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      id={`btn-featured-${item.id}`}
                      onClick={() => handleToggleFeatured(item)}
                      className={`p-1.5 rounded-lg transition-colors ${item.is_featured ? 'bg-basket text-white' : 'bg-arena-700/90 text-neutral-light/60 hover:text-basket hover:bg-arena-600'}`}
                      title={item.is_featured ? 'Batalkan unggulan' : 'Jadikan unggulan'}
                    >
                      {item.is_featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      id={`btn-delete-${item.id}`}
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 bg-arena-700/90 rounded-lg text-neutral-light/60 hover:text-status-danger hover:bg-status-danger/20 transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-neutral-light text-sm font-semibold line-clamp-1">{item.judul}</p>
                {item.tanggal && (
                  <p className="text-neutral-light/40 text-[11px] font-mono mt-0.5">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
