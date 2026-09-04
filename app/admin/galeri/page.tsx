'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Upload, Trash2, Star, StarOff, ArrowUp, ArrowDown, X, Loader2, Plus } from 'lucide-react';
import { KATEGORI, KATEGORI_LIST, type KategoriType } from '@/lib/constants';
import ImageCropModal from '@/components/ImageCropModal';

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
  const [filterTab, setFilterTab] = useState<'Semua' | KategoriType>('Semua');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null); // gambar mentah untuk di-crop
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    judul: '',
    // ⚠️ FIX: selalu default ke KATEGORI.BASKET — akan di-override saat buka modal
    kategori: KATEGORI.BASKET as KategoriType,
    tanggal: '',
    is_featured: false,
    preview: '',
    file: null as File | null,
  });

  /** Derivasi kategori awal form dari filterTab aktif */
  const defaultKategori = (): KategoriType =>
    filterTab === 'Semua' ? KATEGORI.BASKET : filterTab;

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

    // Validasi ukuran file (maks 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setError(`Ukuran file (${sizeMB} MB) melebihi batas maksimum 10 MB. Pilih file yang lebih kecil.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validasi format
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError(`Format file tidak didukung (${file.type}). Gunakan JPEG, PNG, atau WebP.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    // Buka crop modal — tampilkan gambar sebagai data URL
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setCropSrc(ev.target.result as string); };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Dipanggil setelah crop selesai — simpan blob hasil crop ke form state */
  const handleGaleriCropComplete = (blob: Blob) => {
    setCropSrc(null);
    const objectUrl = URL.createObjectURL(blob);
    setForm(f => ({ ...f, file: blob as unknown as File, preview: objectUrl }));
  };

  const resetForm = (keepKategori?: KategoriType) => {
    setForm({
      judul: '',
      // Pertahankan kategori dari filterTab aktif supaya konsisten
      kategori: keepKategori ?? defaultKategori(),
      tanggal: '',
      is_featured: false,
      preview: '',
      file: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) {
      setError('Foto wajib dipilih terlebih dahulu.');
      return;
    }
    if (!form.judul.trim()) {
      setError('Judul foto wajib diisi.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Upload via server-side API route (pakai service role key — bypass RLS)
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('judul', form.judul.trim());
      formData.append('kategori', form.kategori); // harus 'Basket' atau 'Renang'
      formData.append('tanggal', form.tanggal || '');
      formData.append('is_featured', String(form.is_featured));
      formData.append('urutan', String(items.length + 1));

      // Debug log — konfirmasi kategori yang benar-benar dikirim
      console.log('[Upload] Mengirim kategori:', form.kategori, '| judul:', form.judul.trim());

      const res = await fetch('/api/galeri/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Upload gagal (HTTP ${res.status}). Silakan coba lagi.`);
      }

      const savedKategori = json.data?.kategori as KategoriType | undefined;
      console.log('[Upload] Kategori tersimpan di DB:', savedKategori);
      setSuccess(`✅ Foto "${json.data?.judul}" berhasil diunggah ke kategori ${savedKategori || form.kategori}!`);
      // Reset form tapi pertahankan kategori yang baru saja dipakai
      resetForm(savedKategori ?? form.kategori);
      setShowUploadForm(false);
      fetchItems();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus foto ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const res = await fetch(`/api/galeri/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus foto.');
      }
      setSuccess('Foto berhasil dihapus.');
      fetchItems();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleFeatured = async (item: GaleriItem) => {
    try {
      const res = await fetch(`/api/galeri/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !item.is_featured }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status unggulan.');
      fetchItems();
    } catch {
      setError('Gagal mengubah status unggulan.');
    }
  };

  const handleMoveOrder = async (item: GaleriItem, direction: 'up' | 'down') => {
    const newUrutan = direction === 'up' ? Math.max(0, item.urutan - 1) : item.urutan + 1;
    try {
      const res = await fetch(`/api/galeri/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urutan: newUrutan }),
      });
      if (!res.ok) throw new Error('Gagal mengubah urutan.');
      fetchItems();
    } catch {
      setError('Gagal mengubah urutan foto.');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const filtered = filterTab === 'Semua' ? items : items.filter(i => i.kategori === filterTab);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-page-title text-neutral-light">
            Galeri Dokumentasi
          </h1>
          <p className="text-neutral-light/40 mt-1 text-sm font-bold uppercase tracking-widest">
            Kelola foto kegiatan latihan &amp; kompetisi
          </p>
        </div>
        <button
          id="btn-tambah-foto"
          onClick={() => {
            setError('');
            setSuccess('');
            // ✅ FIX: Pre-select kategori berdasarkan tab yang sedang aktif
            // Kalau user di tab Renang → form buka dengan Renang ter-pilih
            setForm(f => ({ ...f, kategori: defaultKategori() }));
            setShowUploadForm(true);
          }}
          className="btn-accent flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Foto
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-status-danger/10 border border-status-danger/30 rounded-xl text-status-danger text-sm">
          <span className="flex-1 leading-relaxed">{error}</span>
          <button onClick={() => setError('')} className="shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
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
              <div>
                <h2 className="type-section-heading text-neutral-light">Upload Foto</h2>
                {/* Hint kategori yang sedang aktif */}
                <p className="text-[11px] text-neutral-light/30 mt-0.5 font-mono">
                  Kategori aktif: <span className={form.kategori === KATEGORI.BASKET ? 'text-basket' : 'text-renang'}>{form.kategori}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowUploadForm(false); resetForm(); setError(''); }}
                className="p-1.5 text-neutral-light/40 hover:text-neutral-light rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Error in modal */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-status-danger/10 border border-status-danger/30 rounded-lg text-status-danger text-xs leading-relaxed">
                  <span>{error}</span>
                </div>
              )}

              {/* File drop area */}
              <div
                className="border-2 border-dashed border-white/10 hover:border-basket/40 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.preview ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden">
                    <Image src={form.preview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-neutral-light/20" />
                    <p className="text-neutral-light/40 text-sm text-center">
                      Klik untuk pilih foto<br />
                      <span className="text-[11px]">JPEG, PNG, WebP — maks. 10MB</span>
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Crop Modal — muncul setelah foto dipilih */}
              {cropSrc && (
                <ImageCropModal
                  imageSrc={cropSrc}
                  aspect={4 / 5}
                  title="Atur Posisi Foto Galeri"
                  onComplete={handleGaleriCropComplete}
                  onClose={() => setCropSrc(null)}
                  onPickNew={() => { setCropSrc(null); fileInputRef.current?.click(); }}
                />
              )}

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
                  {KATEGORI_LIST.map(k => (
                    <button
                      key={k}
                      type="button"
                      id={`kategori-${k.toLowerCase()}`}
                      onClick={() => setForm(f => ({ ...f, kategori: k }))}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 ${
                        form.kategori === k
                          ? k === KATEGORI.BASKET
                            ? 'bg-basket text-white border-basket shadow-[0_0_12px_rgba(255,107,0,0.4)]'
                            : 'bg-renang text-white border-renang shadow-[0_0_12px_rgba(0,194,203,0.4)]'
                          : 'text-neutral-light/50 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {k === KATEGORI.BASKET ? '🏀' : '🏊'} {k}
                      {form.kategori === k && <span className="ml-1.5 text-[9px] opacity-70">✓ dipilih</span>}
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
                  <p className="text-xs text-neutral-light/40">Akan ditampilkan di carousel showcase utama</p>
                </div>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUploadForm(false); resetForm(); setError(''); }}
                  className="btn-secondary flex-1 justify-center"
                >
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
        {(['Semua', ...KATEGORI_LIST] as const).map(tab => {
          const isActive = filterTab === tab;
          const color =
            tab === KATEGORI.BASKET
              ? isActive ? 'bg-basket text-white' : 'text-basket/70'
              : tab === KATEGORI.RENANG
              ? isActive ? 'bg-renang text-white' : 'text-renang/70'
              : isActive ? 'bg-arena-600 text-neutral-light' : 'text-neutral-light/50';
          const count = tab !== 'Semua' ? items.filter(i => i.kategori === tab).length : null;
          return (
            <button
              key={tab}
              id={`admin-filter-${tab.toLowerCase()}`}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${color}`}
            >
              {tab}
              {count !== null && (
                <span className="ml-1 opacity-60">({count})</span>
              )}
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
            <div key={i} className="skeleton-pulse aspect-[4/5]" />
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
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={item.foto_url}
                  alt={item.judul}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-arena-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Featured badge */}
                {item.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-basket text-white text-[9px] font-bold uppercase tracking-wider rounded">
                    Unggulan
                  </div>
                )}

                {/* Category badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 text-white text-[9px] font-bold uppercase tracking-wider rounded ${item.kategori === 'Basket' ? 'bg-basket' : 'bg-renang'}`}>
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
