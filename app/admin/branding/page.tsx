'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Paintbrush, CheckCircle, AlertCircle } from 'lucide-react';

interface BrandingForm {
  nama_club: string;
  tagline: string;
  logo_url: string;
  foto_hero_url: string;
  warna_primer: string;
  tahun_berdiri: string;
  jumlah_prestasi: string;
  sejarah: string;
  visi: string;
  misi: string;
  org_ketua: string;
  org_sekretaris: string;
  org_bendahara: string;
  org_pelatih_kepala: string;
  no_wa_admin: string;
  alamat_club: string;
  email_club: string;
  instagram: string;
  rek_bank_nama: string;
  rek_bank_nomor: string;
  rek_bank_atas_nama: string;
  spp_mini: string;
  spp_pemula: string;
  spp_junior: string;
  spp_senior: string;
  jatuh_tempo_spp: string;
  galeri_1: string;
  galeri_2: string;
  galeri_3: string;
  galeri_4: string;
  galeri_5: string;
  galeri_6: string;
}

const defaultForm: BrandingForm = {
  nama_club: '', tagline: '', logo_url: '', foto_hero_url: '', warna_primer: '#0ea5e9',
  tahun_berdiri: '2010', jumlah_prestasi: '50+', sejarah: '', visi: '', misi: '',
  org_ketua: '', org_sekretaris: '', org_bendahara: '', org_pelatih_kepala: '',
  no_wa_admin: '', alamat_club: '', email_club: '', instagram: '',
  rek_bank_nama: '', rek_bank_nomor: '', rek_bank_atas_nama: '',
  spp_mini: '150000', spp_pemula: '175000', spp_junior: '200000', spp_senior: '225000',
  jatuh_tempo_spp: 'Tanggal 10 setiap bulan',
  galeri_1: '', galeri_2: '', galeri_3: '', galeri_4: '', galeri_5: '', galeri_6: '',
};

export default function AdminBrandingPage() {
  const [form, setForm] = useState<BrandingForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('umum');

  useEffect(() => {
    fetch('/api/branding').then(r => r.json()).then(j => {
      if (j.success && j.data) {
        setForm((prev) => ({ ...prev, ...j.data }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.error || 'Gagal menyimpan');
      }
    } catch {
      setError('Koneksi bermasalah');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof BrandingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const tabs = [
    { key: 'umum', label: 'Umum' },
    { key: 'konten', label: 'Konten' },
    { key: 'organisasi', label: 'Organisasi' },
    { key: 'pembayaran', label: 'Pembayaran' },
    { key: 'galeri', label: 'Galeri' },
    { key: 'kontak', label: 'Kontak' },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-neutral-light">Branding & Konten</h1>
        <p className="text-neutral-light/50 mt-1">Edit identitas, konten, dan informasi club</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-neutral-light/50 hover:text-neutral-light hover:bg-neutral-light/10'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
      {saved && <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm"><CheckCircle className="w-4 h-4" />Branding berhasil disimpan!</div>}

      <form onSubmit={handleSave} className="glass-card border rounded-2xl p-6">
        {activeTab === 'umum' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-light mb-4">Identitas Club</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="form-label">Nama Club *</label><input value={form.nama_club} onChange={set('nama_club')} placeholder="Club Olahraga Sidoarjo" className="form-input" /></div>
              <div><label className="form-label">Tagline</label><input value={form.tagline} onChange={set('tagline')} placeholder="Membentuk Atlet Berprestasi" className="form-input" /></div>
              <div><label className="form-label">Tahun Berdiri</label><input value={form.tahun_berdiri} onChange={set('tahun_berdiri')} placeholder="2010" className="form-input" /></div>
              <div><label className="form-label">Jumlah Prestasi</label><input value={form.jumlah_prestasi} onChange={set('jumlah_prestasi')} placeholder="50+" className="form-input" /></div>
              <div className="sm:col-span-2"><label className="form-label">URL Logo</label><input value={form.logo_url} onChange={set('logo_url')} placeholder="https://..." className="form-input" /></div>
              <div className="sm:col-span-2"><label className="form-label">URL Foto Hero (Beranda)</label><input value={form.foto_hero_url} onChange={set('foto_hero_url')} placeholder="https://..." className="form-input" /></div>
            </div>
          </div>
        )}

        {activeTab === 'konten' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-light mb-4">Konten Profil</h2>
            <div><label className="form-label">Sejarah Club</label><textarea value={form.sejarah} onChange={set('sejarah')} rows={5} placeholder="Ceritakan sejarah berdirinya club..." className="form-input resize-none" /></div>
            <div><label className="form-label">Visi</label><textarea value={form.visi} onChange={set('visi')} rows={3} placeholder="Visi club..." className="form-input resize-none" /></div>
            <div><label className="form-label">Misi</label><textarea value={form.misi} onChange={set('misi')} rows={4} placeholder="Misi club..." className="form-input resize-none" /></div>
          </div>
        )}

        {activeTab === 'organisasi' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-light mb-4">Struktur Kepengurusan</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(['org_ketua','org_sekretaris','org_bendahara','org_pelatih_kepala'] as const).map((key) => (
                <div key={key}>
                  <label className="form-label">{key.replace('org_','').replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                  <input value={form[key]} onChange={set(key)} placeholder="Nama..." className="form-input" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pembayaran' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-light mb-4">Informasi Pembayaran</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="form-label">SPP Mini (Rp)</label><input type="number" value={form.spp_mini} onChange={set('spp_mini')} className="form-input" /></div>
              <div><label className="form-label">SPP Pemula (Rp)</label><input type="number" value={form.spp_pemula} onChange={set('spp_pemula')} className="form-input" /></div>
              <div><label className="form-label">SPP Junior (Rp)</label><input type="number" value={form.spp_junior} onChange={set('spp_junior')} className="form-input" /></div>
              <div><label className="form-label">SPP Senior (Rp)</label><input type="number" value={form.spp_senior} onChange={set('spp_senior')} className="form-input" /></div>
              <div className="sm:col-span-2"><label className="form-label">Jatuh Tempo SPP</label><input value={form.jatuh_tempo_spp} onChange={set('jatuh_tempo_spp')} placeholder="Tanggal 10 setiap bulan" className="form-input" /></div>
              <div><label className="form-label">Nama Bank</label><input value={form.rek_bank_nama} onChange={set('rek_bank_nama')} placeholder="BCA" className="form-input" /></div>
              <div><label className="form-label">No. Rekening</label><input value={form.rek_bank_nomor} onChange={set('rek_bank_nomor')} placeholder="1234567890" className="form-input" /></div>
              <div className="sm:col-span-2"><label className="form-label">Atas Nama</label><input value={form.rek_bank_atas_nama} onChange={set('rek_bank_atas_nama')} placeholder="Club Olahraga" className="form-input" /></div>
            </div>
          </div>
        )}

        {activeTab === 'galeri' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-light mb-4">URL Foto Galeri</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(['galeri_1','galeri_2','galeri_3','galeri_4','galeri_5','galeri_6'] as const).map((key, i) => (
                <div key={key}>
                  <label className="form-label">Foto Galeri {i+1}</label>
                  <input value={form[key]} onChange={set(key)} placeholder="https://..." className="form-input" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'kontak' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-neutral-light mb-4">Kontak & Sosial Media</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="form-label">No WhatsApp Admin</label><input value={form.no_wa_admin} onChange={set('no_wa_admin')} placeholder="628xxx" className="form-input" /></div>
              <div><label className="form-label">Email Club</label><input value={form.email_club} onChange={set('email_club')} placeholder="info@club.com" className="form-input" /></div>
              <div><label className="form-label">Instagram</label><input value={form.instagram} onChange={set('instagram')} placeholder="@clubolahraga" className="form-input" /></div>
              <div className="sm:col-span-2"><label className="form-label">Alamat Club</label><textarea value={form.alamat_club} onChange={set('alamat_club')} rows={2} placeholder="Jl. ..." className="form-input resize-none" /></div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-6 border-t border-neutral-light/10">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : saved ? <><CheckCircle className="w-4 h-4" />Tersimpan!</> : <><Save className="w-4 h-4" />Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  );
}
