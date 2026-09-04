'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Pencil, Loader2, UserCheck, X, CheckCircle, Trash2,
  Download, Upload, ImageIcon, AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import type { Pelatih } from '@/types';
import ImageCropModal from '@/components/ImageCropModal';

const emptyForm = {
  nama: '',
  foto_url: '',
  spesialisasi: '',
  sertifikasi: '',
  pengalaman: '',
  urutan: '1',
};

// ─── Komponen Upload Foto (didefinisikan di luar agar tidak remount) ───────────
interface FotoUploaderProps {
  currentUrl: string;
  oldUrl: string;
  onUploaded: (url: string) => void;
  onError: (msg: string) => void;
}

function FotoUploader({ currentUrl, oldUrl, onUploaded, onError }: FotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl || '');
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null); // gambar mentah untuk di-crop
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync preview ketika form di-reset (edit beda pelatih)
  useEffect(() => { setPreview(currentUrl || ''); }, [currentUrl]);

  const validateAndOpenCrop = (file: File) => {
    onError('');

    // Validasi tipe
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      onError('Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.');
      return;
    }

    // Validasi ukuran (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('Ukuran file maksimal 10MB. Silakan kompres foto terlebih dahulu.');
      return;
    }

    // Buka crop modal dengan data URL gambar
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setCropSrc(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropSrc(null); // tutup crop modal

    // Preview lokal langsung
    const objectUrl = URL.createObjectURL(blob);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      // Blob hasil crop dikirim sebagai file dengan ekstensi .jpg
      fd.append('foto', blob, 'foto-pelatih.jpg');
      if (oldUrl) fd.append('old_path', oldUrl);

      const res = await fetch('/api/pelatih/upload', { method: 'POST', body: fd });
      const json = await res.json();

      if (!json.success) {
        onError(json.error || 'Gagal upload foto');
        setPreview(currentUrl || '');
        return;
      }

      onUploaded(json.url);
    } catch {
      onError('Terjadi kesalahan saat upload foto');
      setPreview(currentUrl || '');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndOpenCrop(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndOpenCrop(file);
  };

  return (
    <div className="col-span-2">
      <label className="form-label">Foto Pelatih</label>

      {/* Area Upload / Preview */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative mt-1 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden
          ${dragOver ? 'border-primary-400 bg-primary-500/10' : 'border-arena-500/50 hover:border-primary-500/50 hover:bg-primary-500/5'}
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {preview ? (
          /* Preview foto */
          <div className="relative h-48 w-full">
            <Image
              src={preview}
              alt="Preview foto"
              fill
              className="object-cover"
              unoptimized={preview.startsWith('blob:')}
            />
            {/* Overlay hover untuk ganti foto */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-sm font-medium">Klik atau drag untuk ganti foto</span>
                </div>
              </div>
            )}
            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <span className="text-sm">Mengupload foto...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Placeholder drag & drop */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary-400 animate-spin mb-3" />
                <p className="text-neutral-light/60 text-sm">Mengupload foto...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
                  <ImageIcon className="w-7 h-7 text-primary-400" />
                </div>
                <p className="text-neutral-light/70 font-medium text-sm mb-1">
                  {dragOver ? 'Lepaskan foto di sini' : 'Klik atau drag foto ke sini'}
                </p>
                <p className="text-neutral-light/30 text-xs">JPG, JPEG, PNG — Maks. 10 MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={3 / 4}
          title="Atur Posisi Foto Pelatih"
          onComplete={handleCropComplete}
          onClose={() => setCropSrc(null)}
          onPickNew={() => { setCropSrc(null); inputRef.current?.click(); }}
        />
      )}
    </div>
  );
}

// ─── Halaman Utama ──────────────────────────────────────────────────────────────
export default function AdminPelatihPage() {
  const [data, setData] = useState<Pelatih[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pelatih | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pelatih');
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setUploadError('');
    setShowForm(true);
  };

  const openEdit = (p: Pelatih) => {
    setEditing(p);
    setForm({
      nama: p.nama,
      foto_url: p.foto_url || '',
      spesialisasi: p.spesialisasi,
      sertifikasi: p.sertifikasi || '',
      pengalaman: p.pengalaman,
      urutan: String(p.urutan),
    });
    setUploadError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = { ...form, urutan: parseInt(form.urutan), ...(editing ? { id: editing.id } : {}) };
      const res = await fetch('/api/pelatih', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setShowForm(false);
        loadData();
      } else {
        setUploadError(json.error || 'Gagal menyimpan data');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data pelatih ini?')) return;
    try {
      const res = await fetch(`/api/pelatih?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { loadData(); }
      else { alert(json.error || 'Gagal menghapus pelatih'); }
    } catch { alert('Terjadi kesalahan saat menghapus pelatih'); }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;
    const rows = data.map((item, i) => ({
      'No': i + 1,
      'Nama Pelatih': item.nama,
      'Spesialisasi': item.spesialisasi,
      'Sertifikasi': item.sertifikasi || '-',
      'Pengalaman': item.pengalaman,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pelatih');
    XLSX.writeFile(wb, `Data_Pelatih_Barqignite_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const setField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title text-neutral-light">Kelola Pelatih</h1>
          <p className="text-neutral-light/50 mt-1">Tambah, edit data pelatih club</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} disabled={data.length === 0} className="btn-success h-10 px-4">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={openAdd} className="btn-primary h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> Tambah Pelatih
          </button>
        </div>
      </div>

      {/* Grid Pelatih */}
      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((pelatih) => (
            <div key={pelatih.id} className="glass-card-hover border rounded-2xl p-6 group">
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                  {pelatih.foto_url ? (
                    <Image
                      src={pelatih.foto_url}
                      alt={pelatih.nama}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-neutral-light text-xl font-bold">{pelatih.nama.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-ui font-semibold text-neutral-light truncate text-base">{pelatih.nama}</h3>
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
          <div className="glass-card border rounded-3xl p-8 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="type-section-heading text-neutral-light">{editing ? 'Edit Pelatih' : 'Tambah Pelatih'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Nama */}
                <div className="col-span-2">
                  <label className="form-label">Nama Pelatih *</label>
                  <input value={form.nama} onChange={setField('nama')} placeholder="Nama lengkap" className="form-input" required />
                </div>

                {/* Spesialisasi & Sertifikasi */}
                <div>
                  <label className="form-label">Spesialisasi *</label>
                  <input value={form.spesialisasi} onChange={setField('spesialisasi')} placeholder="Teknik Dasar" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Sertifikasi</label>
                  <input value={form.sertifikasi} onChange={setField('sertifikasi')} placeholder="Lisensi D" className="form-input" />
                </div>

                {/* Urutan */}
                <div>
                  <label className="form-label">Urutan Tampil</label>
                  <input type="number" value={form.urutan} onChange={setField('urutan')} min="1" className="form-input" />
                </div>
                <div /> {/* spacer */}

                {/* Upload Foto */}
                <FotoUploader
                  currentUrl={form.foto_url}
                  oldUrl={editing?.foto_url || ''}
                  onUploaded={(url) => { setForm((prev) => ({ ...prev, foto_url: url })); setUploadError(''); }}
                  onError={setUploadError}
                />

                {/* Error Upload */}
                {uploadError && (
                  <div className="col-span-2 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Pengalaman */}
                <div className="col-span-2">
                  <label className="form-label">Pengalaman</label>
                  <textarea
                    value={form.pengalaman}
                    onChange={setField('pengalaman')}
                    rows={3}
                    placeholder="Deskripsi pengalaman melatih..."
                    className="form-input resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Simpan...</>
                    : saved ? <><CheckCircle className="w-4 h-4" />Tersimpan!</>
                    : <><Plus className="w-4 h-4" />Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
