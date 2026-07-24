'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Calendar, Clock, MapPin, Trophy, X, CheckCircle } from 'lucide-react';
import type { Jadwal } from '@/types';

const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
const KATEGORI = ['Mini','Pemula','Junior','Senior','Semua'];

const emptyForm = { hari: 'Senin', jam_mulai: '16:00', jam_selesai: '18:00', kategori: 'Junior', lokasi: '', jenis: 'Latihan' as 'Latihan'|'Pertandingan', tanggal: '', keterangan: '' };

export default function AdminJadwalPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Jadwal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterJenis, setFilterJenis] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterJenis ? `/api/jadwal?jenis=${filterJenis}` : '/api/jadwal';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json.data || []);
    } finally { setLoading(false); }
  }, [filterJenis]);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (j: Jadwal) => { setEditing(j); setForm({ hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, kategori: j.kategori, lokasi: j.lokasi, jenis: j.jenis, tanggal: j.tanggal||'', keterangan: j.keterangan||'' }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/jadwal', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); setShowForm(false); loadData(); }
    } finally { setSaving(false); }
  };

  const hariColors: Record<string, string> = {
    Senin: 'badge-info', Selasa: 'badge-success', Rabu: 'badge-warning',
    Kamis: 'badge-danger', Jumat: 'badge-neutral', Sabtu: 'badge-warning', Minggu: 'badge-danger',
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Kelola Jadwal</h1>
          <p className="text-white/50 mt-1">Jadwal latihan dan pertandingan</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Tambah Jadwal</button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[{ key: '', label: 'Semua' }, { key: 'Latihan', label: 'Latihan' }, { key: 'Pertandingan', label: 'Pertandingan' }].map((f) => (
          <button key={f.key} onClick={() => setFilterJenis(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterJenis === f.key ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center"><Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" /></div>
      ) : (
        <div className="glass-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Hari/Tanggal</th><th>Waktu</th><th>Kategori</th><th>Lokasi</th><th>Jenis</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`badge ${hariColors[row.hari] || 'badge-neutral'}`}>{row.hari}</span>
                      {row.tanggal && <p className="text-xs text-white/40 mt-1">{row.tanggal}</p>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-white/70"><Clock className="w-3.5 h-3.5 text-primary-400" />{row.jam_mulai}–{row.jam_selesai}</div>
                    </td>
                    <td><span className="badge badge-neutral">{row.kategori}</span></td>
                    <td>
                      <div className="flex items-center gap-1 text-white/70"><MapPin className="w-3.5 h-3.5 text-accent-400" />{row.lokasi}</div>
                    </td>
                    <td>
                      <span className={`badge ${row.jenis === 'Latihan' ? 'badge-info' : 'badge-warning'}`}>
                        {row.jenis === 'Pertandingan' && <Trophy className="w-3 h-3 mr-1" />}{row.jenis}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="btn-secondary text-xs py-1 px-2"><Pencil className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={6} className="text-center text-white/40 py-8">Belum ada jadwal</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-8 w-full max-w-lg animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-white">{editing ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Jenis</label>
                  <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as 'Latihan'|'Pertandingan' })} className="form-select">
                    <option value="Latihan">Latihan</option>
                    <option value="Pertandingan">Pertandingan</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Hari</label>
                  <select value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })} className="form-select">
                    {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Jam Mulai</label>
                  <input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Jam Selesai</label>
                  <input type="time" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Kategori</label>
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="form-select">
                    {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tanggal (opsional)</label>
                  <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="form-input" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Lokasi / Lapangan</label>
                  <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Lapangan Utama" className="form-input" required />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Keterangan</label>
                  <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan..." className="form-input" />
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
