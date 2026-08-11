'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Plus, Edit, Trash2, Save, X, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { SppKategori, PengaturanPembayaran, MetodePembayaran, CabangOlahraga } from '@/types';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PengaturanPembayaranPage() {
  const [activeTab, setActiveTab] = useState<'spp' | 'umum' | 'metode'>('spp');
  
  // Data
  const { data: sppRes, mutate: mutateSpp } = useSWR('/api/spp_kategori', fetcher);
  const { data: pengRes, mutate: mutatePeng } = useSWR('/api/pengaturan_pembayaran', fetcher);
  const { data: metodeRes, mutate: mutateMetode } = useSWR('/api/metode_pembayaran', fetcher);

  const sppData: SppKategori[] = sppRes?.data || [];
  const pengaturan: PengaturanPembayaran = pengRes?.data || { tanggal_jatuh_tempo: '', catatan_keterlambatan: '' };
  const metodeData: MetodePembayaran[] = metodeRes?.data || [];

  // Form States
  const [loading, setLoading] = useState(false);
  const [sppForm, setSppForm] = useState<Partial<SppKategori> | null>(null);
  const [metodeForm, setMetodeForm] = useState<Partial<MetodePembayaran> | null>(null);
  const [pengaturanForm, setPengaturanForm] = useState<Partial<PengaturanPembayaran>>({});

  useEffect(() => {
    if (pengaturan.id) setPengaturanForm(pengaturan);
  }, [pengaturan]);

  // Handler SPP
  const saveSpp = async () => {
    if (!sppForm?.cabang || !sppForm?.nama_kategori || !sppForm?.nominal) return alert('Data wajib belum lengkap');
    setLoading(true);
    const method = sppForm.id ? 'PUT' : 'POST';
    await fetch('/api/spp_kategori', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sppForm)
    });
    setSppForm(null);
    mutateSpp();
    setLoading(false);
  };
  const deleteSpp = async (id: string) => {
    if (!confirm('Yakin hapus?')) return;
    await fetch(`/api/spp_kategori?id=${id}`, { method: 'DELETE' });
    mutateSpp();
  };

  // Handler Pengaturan
  const savePengaturan = async () => {
    setLoading(true);
    await fetch('/api/pengaturan_pembayaran', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pengaturanForm)
    });
    mutatePeng();
    alert('Pengaturan disimpan!');
    setLoading(false);
  };

  // Handler Metode
  const saveMetode = async () => {
    if (!metodeForm?.nama) return alert('Nama wajib diisi');
    setLoading(true);
    const method = metodeForm.id ? 'PUT' : 'POST';
    await fetch('/api/metode_pembayaran', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metodeForm)
    });
    setMetodeForm(null);
    mutateMetode();
    setLoading(false);
  };
  const deleteMetode = async (id: string) => {
    if (!confirm('Yakin hapus?')) return;
    await fetch(`/api/metode_pembayaran?id=${id}`, { method: 'DELETE' });
    mutateMetode();
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/pembayaran" className="p-2 bg-neutral-light/5 hover:bg-neutral-light/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-light/70" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-light">Pengaturan Pembayaran</h1>
            <p className="text-neutral-light/50 mt-1">Kelola Kategori SPP, Jatuh Tempo, dan Metode Pembayaran</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-arena-600/30 pb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('spp')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'spp' ? 'bg-primary-500 text-white' : 'text-neutral-light/50 hover:bg-neutral-light/10'}`}>Kategori SPP</button>
        <button onClick={() => setActiveTab('metode')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'metode' ? 'bg-primary-500 text-white' : 'text-neutral-light/50 hover:bg-neutral-light/10'}`}>Metode Pembayaran</button>
        <button onClick={() => setActiveTab('umum')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'umum' ? 'bg-primary-500 text-white' : 'text-neutral-light/50 hover:bg-neutral-light/10'}`}>Pengaturan Umum</button>
      </div>

      {activeTab === 'spp' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-neutral-light">Kategori SPP</h2>
            <button onClick={() => setSppForm({ is_active: true, urutan: 0, cabang: 'Basket' })} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
            </button>
          </div>
          
          {['Basket', 'Renang'].map((cabang) => (
            <div key={cabang} className="glass-card border rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">{cabang}</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Urutan</th><th>Nama Kategori</th><th>Usia (Min-Max)</th><th>Nominal</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {sppData.filter(s => s.cabang === cabang).map(s => (
                      <tr key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                        <td>{s.urutan}</td>
                        <td className="font-medium text-neutral-light">{s.nama_kategori}</td>
                        <td>{s.usia_min || 0} - {s.usia_max || '+'} th</td>
                        <td>{formatCurrency(s.nominal.toString())}</td>
                        <td>{s.is_active ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-neutral">Nonaktif</span>}</td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => setSppForm(s)} className="p-1.5 text-blue-400 bg-blue-400/10 rounded-lg hover:bg-blue-400/20"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => deleteSpp(s.id!)} className="p-1.5 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sppData.filter(s => s.cabang === cabang).length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4 text-neutral-light/50">Belum ada data kategori</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metode' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-neutral-light">Metode Pembayaran</h2>
            <button onClick={() => setMetodeForm({ is_active: true, is_recommended: false, urutan: 0 })} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Tambah Metode
            </button>
          </div>
          <div className="glass-card border rounded-2xl p-6">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Urutan</th><th>Nama Metode</th><th>No. Rek / VA</th><th>Rekomendasi</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {metodeData.map(m => (
                    <tr key={m.id} className={!m.is_active ? 'opacity-50' : ''}>
                      <td>{m.urutan}</td>
                      <td>
                        <div className="font-medium text-neutral-light">{m.nama}</div>
                        <div className="text-xs text-neutral-light/50">{m.deskripsi}</div>
                      </td>
                      <td>{m.nomor_rekening || '-'}</td>
                      <td>{m.is_recommended && <span className="badge badge-success text-xs">⭐ Rekomendasi</span>}</td>
                      <td>{m.is_active ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-neutral">Nonaktif</span>}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => setMetodeForm(m)} className="p-1.5 text-blue-400 bg-blue-400/10 rounded-lg hover:bg-blue-400/20"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => deleteMetode(m.id!)} className="p-1.5 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {metodeData.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-4 text-neutral-light/50">Belum ada metode pembayaran</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'umum' && (
        <div className="glass-card border rounded-2xl p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-neutral-light mb-6">Pengaturan Umum SPP</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Tanggal Jatuh Tempo</label>
              <input type="text" value={pengaturanForm.tanggal_jatuh_tempo || ''} onChange={e => setPengaturanForm({...pengaturanForm, tanggal_jatuh_tempo: e.target.value})} className="form-input" placeholder="Misal: Tanggal 10 setiap bulan" />
            </div>
            <div>
              <label className="form-label">Catatan Keterlambatan</label>
              <textarea value={pengaturanForm.catatan_keterlambatan || ''} onChange={e => setPengaturanForm({...pengaturanForm, catatan_keterlambatan: e.target.value})} className="form-input" rows={3} placeholder="Misal: Keterlambatan pembayaran mempengaruhi status keaktifan anggota..." />
            </div>
            <button onClick={savePengaturan} disabled={loading} className="btn-primary w-full justify-center mt-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* Modal SPP Form */}
      {sppForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-neutral-light">{sppForm.id ? 'Edit Kategori SPP' : 'Tambah Kategori SPP'}</h3>
              <button onClick={() => setSppForm(null)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="form-label">Cabang Olahraga</label>
                <select value={sppForm.cabang || 'Basket'} onChange={e => setSppForm({...sppForm, cabang: e.target.value as CabangOlahraga})} className="form-select">
                  <option value="Basket">Basket</option>
                  <option value="Renang">Renang</option>
                </select></div>
              <div><label className="form-label">Nama Kategori</label>
                <input type="text" value={sppForm.nama_kategori || ''} onChange={e => setSppForm({...sppForm, nama_kategori: e.target.value})} className="form-input" placeholder="Misal: Junior (13-17 tahun)" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Usia Minimal</label>
                  <input type="number" value={sppForm.usia_min || ''} onChange={e => setSppForm({...sppForm, usia_min: Number(e.target.value)})} className="form-input" placeholder="Misal: 13" /></div>
                <div><label className="form-label">Usia Maksimal</label>
                  <input type="number" value={sppForm.usia_max || ''} onChange={e => setSppForm({...sppForm, usia_max: Number(e.target.value)})} className="form-input" placeholder="Misal: 17" /></div>
              </div>
              <div><label className="form-label">Nominal SPP (Rp)</label>
                <input type="number" value={sppForm.nominal || ''} onChange={e => setSppForm({...sppForm, nominal: Number(e.target.value)})} className="form-input" placeholder="250000" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Urutan Tampil</label>
                  <input type="number" value={sppForm.urutan || 0} onChange={e => setSppForm({...sppForm, urutan: Number(e.target.value)})} className="form-input" /></div>
                <div className="flex items-center mt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sppForm.is_active || false} onChange={e => setSppForm({...sppForm, is_active: e.target.checked})} className="form-checkbox" />
                    <span className="text-neutral-light">Kategori Aktif</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSppForm(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={saveSpp} disabled={loading} className="btn-success flex-1 justify-center"><Save className="w-4 h-4 mr-2"/> Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Metode Form */}
      {metodeForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-neutral-light">{metodeForm.id ? 'Edit Metode' : 'Tambah Metode'}</h3>
              <button onClick={() => setMetodeForm(null)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="form-label">Nama Metode</label>
                <input type="text" value={metodeForm.nama || ''} onChange={e => setMetodeForm({...metodeForm, nama: e.target.value})} className="form-input" placeholder="Misal: Transfer Bank Manual" /></div>
              <div><label className="form-label">Deskripsi / Instruksi</label>
                <textarea value={metodeForm.deskripsi || ''} onChange={e => setMetodeForm({...metodeForm, deskripsi: e.target.value})} className="form-input" rows={2} placeholder="Penjelasan singkat" /></div>
              <div><label className="form-label">Nomor Rekening / VA / Link</label>
                <input type="text" value={metodeForm.nomor_rekening || ''} onChange={e => setMetodeForm({...metodeForm, nomor_rekening: e.target.value})} className="form-input" placeholder="Opsional" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Urutan Tampil</label>
                  <input type="number" value={metodeForm.urutan || 0} onChange={e => setMetodeForm({...metodeForm, urutan: Number(e.target.value)})} className="form-input" /></div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={metodeForm.is_active || false} onChange={e => setMetodeForm({...metodeForm, is_active: e.target.checked})} className="form-checkbox" />
                  <span className="text-neutral-light">Tampilkan ke Publik</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={metodeForm.is_recommended || false} onChange={e => setMetodeForm({...metodeForm, is_recommended: e.target.checked})} className="form-checkbox" />
                  <span className="text-emerald-400 font-medium">Beri Badge Rekomendasi</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMetodeForm(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={saveMetode} disabled={loading} className="btn-success flex-1 justify-center"><Save className="w-4 h-4 mr-2"/> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
