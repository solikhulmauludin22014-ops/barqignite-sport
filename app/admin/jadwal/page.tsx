'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, Calendar, Clock, MapPin, Trophy, X, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Jadwal, CabangOlahraga } from '@/types';
import { fetchWithTimeout, formatErrorMessage } from '@/lib/utils';

const CABANG_LIST: CabangOlahraga[] = ['Basket', 'Renang'];
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const KATEGORI = ['Mini', 'Pemula', 'Junior', 'Senior', 'Semua'];

const emptyForm = {
  cabang_olahraga: 'Basket' as CabangOlahraga,
  hari: 'Senin',
  jam_mulai: '16:00',
  jam_selesai: '18:00',
  kategori: 'Junior',
  lokasi: '',
  jenis: 'Latihan' as 'Latihan' | 'Pertandingan',
  tanggal: '',
  keterangan: '',
};

export default function AdminJadwalPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Jadwal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterJenis, setFilterJenis] = useState('');
  const [filterCabang, setFilterCabang] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterJenis) params.set('jenis', filterJenis);
      if (filterCabang) params.set('cabang', filterCabang);
      const url = params.toString() ? `/api/jadwal?${params.toString()}` : '/api/jadwal';

      const res = await fetchWithTimeout(url, {}, 12000);
      const json = await res.json();
      if (json.success) setData(json.data || []);
      else console.error('Gagal memuat jadwal:', json.error);
    } catch (err) {
      console.error('Jadwal load error:', formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filterJenis, filterCabang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      cabang_olahraga: (filterCabang as CabangOlahraga) || 'Basket',
    });
    setShowForm(true);
  };

  const openEdit = (j: Jadwal) => {
    setEditing(j);
    setForm({
      cabang_olahraga: j.cabang_olahraga || 'Basket',
      hari: j.hari,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      kategori: j.kategori,
      lokasi: j.lokasi,
      jenis: j.jenis,
      tanggal: j.tanggal || '',
      keterangan: j.keterangan || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetchWithTimeout(
        '/api/jadwal',
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        12000
      );
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setShowForm(false);
        loadData();
      } else {
        alert(`Gagal menyimpan jadwal: ${json.error || 'Terjadi kesalahan pada database'}`);
      }
    } catch (err) {
      alert(formatErrorMessage(err, 'Gagal terhubung ke server — coba lagi.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    try {
      const res = await fetchWithTimeout(`/api/jadwal?id=${id}`, { method: 'DELETE' }, 12000);
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(`Gagal menghapus jadwal: ${json.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: unknown) {
      alert(formatErrorMessage(err, 'Terjadi kesalahan saat menghapus jadwal'));
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    const dataToExport = data.map((item) => ({
      'Cabang Olahraga': item.cabang_olahraga,
      'Hari': item.hari,
      'Tanggal': item.tanggal || '-',
      'Waktu': `${item.jam_mulai} - ${item.jam_selesai}`,
      'Kategori': item.kategori,
      'Lokasi': item.lokasi,
      'Jenis': item.jenis,
      'Keterangan': item.keterangan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal');
    XLSX.writeFile(workbook, `Data_Jadwal_Barqignite_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const hariColors: Record<string, string> = {
    Senin: 'badge-info',
    Selasa: 'badge-success',
    Rabu: 'badge-warning',
    Kamis: 'badge-danger',
    Jumat: 'badge-neutral',
    Sabtu: 'badge-warning',
    Minggu: 'badge-danger',
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title text-neutral-light">Kelola Jadwal</h1>
          <p className="text-neutral-light/50 mt-1">Jadwal latihan dan pertandingan klub</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} disabled={data.length === 0} className="btn-success h-10 px-4">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={openAdd} className="btn-primary h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Filter Cabang & Jenis */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Cabang */}
        <div className="flex gap-1.5 p-1 bg-arena-800/40 border border-arena-600/30 rounded-xl">
          <button
            onClick={() => setFilterCabang('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCabang === '' ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-light/50 hover:text-neutral-light'}`}
          >
            Semua Cabang
          </button>
          {CABANG_LIST.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCabang(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCabang === c ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-light/50 hover:text-neutral-light'}`}
            >
              {c === 'Basket' ? '🏀 Basket' : '🏊 Renang'}
            </button>
          ))}
        </div>

        {/* Filter Jenis */}
        <div className="flex gap-1.5 p-1 bg-arena-800/40 border border-arena-600/30 rounded-xl">
          {[{ key: '', label: 'Semua Jenis' }, { key: 'Latihan', label: 'Latihan' }, { key: 'Pertandingan', label: 'Pertandingan' }].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterJenis(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterJenis === f.key ? 'bg-accent-500 text-white shadow-sm' : 'text-neutral-light/50 hover:text-neutral-light'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-card border rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="glass-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cabang</th>
                  <th>Hari/Tanggal</th>
                  <th>Waktu</th>
                  <th>Kategori</th>
                  <th>Lokasi</th>
                  <th>Jenis</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${row.cabang_olahraga === 'Renang' ? 'bg-renang/15 text-renang border border-renang/30' : 'bg-basket/15 text-basket border border-basket/30'}`}>
                        {row.cabang_olahraga === 'Renang' ? '🏊 Renang' : '🏀 Basket'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${hariColors[row.hari] || 'badge-neutral'}`}>{row.hari}</span>
                      {row.tanggal && <p className="text-xs text-neutral-light/40 mt-1">{row.tanggal}</p>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-neutral-light/70 font-mono text-xs">
                        <Clock className="w-3.5 h-3.5 text-primary-400" />
                        {row.jam_mulai}–{row.jam_selesai}
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{row.kategori}</span></td>
                    <td>
                      <div className="flex items-center gap-1 text-neutral-light/70">
                        <MapPin className="w-3.5 h-3.5 text-accent-400" />
                        {row.lokasi}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${row.jenis === 'Latihan' ? 'badge-info' : 'badge-warning'}`}>
                        {row.jenis === 'Pertandingan' && <Trophy className="w-3 h-3 mr-1" />}{row.jenis}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="btn-secondary text-xs py-1 px-2" title="Edit">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(row.id!)} className="btn-secondary text-xs py-1 px-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/30" title="Hapus">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-neutral-light/40 py-8">
                      Belum ada jadwal
                    </td>
                  </tr>
                )}
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
              <h3 className="type-section-heading text-neutral-light">{editing ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-light/40 hover:text-neutral-light rounded-xl hover:bg-neutral-light/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Cabang Olahraga</label>
                  <select
                    value={form.cabang_olahraga}
                    onChange={(e) => setForm({ ...form, cabang_olahraga: e.target.value as CabangOlahraga })}
                    className="form-select"
                    required
                  >
                    <option value="Basket">🏀 Basket</option>
                    <option value="Renang">🏊 Renang</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Jenis</label>
                  <select
                    value={form.jenis}
                    onChange={(e) => setForm({ ...form, jenis: e.target.value as 'Latihan' | 'Pertandingan' })}
                    className="form-select"
                  >
                    <option value="Latihan">Latihan</option>
                    <option value="Pertandingan">Pertandingan</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Hari</label>
                  <select
                    value={form.hari}
                    onChange={(e) => setForm({ ...form, hari: e.target.value })}
                    className="form-select"
                  >
                    {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="form-select"
                  >
                    {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Jam Mulai</label>
                  <input
                    type="time"
                    value={form.jam_mulai}
                    onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Jam Selesai</label>
                  <input
                    type="time"
                    value={form.jam_selesai}
                    onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Tanggal (opsional, khusus kegiatan/pertandingan)</label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Lokasi / Lapangan</label>
                  <input
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    placeholder="Contoh: GOR Sidoarjo / Kolam Renang Delta"
                    className="form-input"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Keterangan (opsional)</label>
                  <input
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Keterangan tambahan..."
                    className="form-input"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Menyimpan...</>
                  ) : saved ? (
                    <><CheckCircle className="w-4 h-4 mr-2" />Tersimpan!</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Simpan</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
