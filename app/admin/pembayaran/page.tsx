'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  CheckCircle, AlertTriangle, Loader2, Filter, Download,
  Plus, Trash2, Printer, X, Save, ChevronDown, Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { PembayaranSPP, Anggota, SppKategori } from '@/types';
import { formatCurrency, getMonthName, cn } from '@/lib/utils';
import Link from 'next/link';
import { printKwitansi } from '@/components/admin/KwitansiPrint';


const BULAN_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1));
const TAHUN_LIST = ['2024', '2025', '2026', '2027'];
const METODE_LIST = ['Cash', 'Transfer', 'QRIS'];

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Form state untuk input manual
interface FormPembayaran {
  id_anggota: string;
  nama_anggota: string;
  cabang_olahraga: 'Basket' | 'Renang' | '';
  bulan: string;
  tahun: string;
  nominal: string;
  tanggal_bayar: string;
  metode_bayar: string;
  catatan: string;
}

const formDefault: FormPembayaran = {
  id_anggota: '',
  nama_anggota: '',
  cabang_olahraga: '',
  bulan: String(new Date().getMonth() + 1),
  tahun: String(new Date().getFullYear()),
  nominal: '',
  tanggal_bayar: new Date().toISOString().split('T')[0],
  metode_bayar: 'Cash',
  catatan: '',
};

export default function AdminPembayaranPage() {
  const [filter, setFilter] = useState({
    bulan: '',
    tahun: String(new Date().getFullYear()),
    status: '',
    cabang: '',
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormPembayaran>(formDefault);
  const [anggotaSearch, setAnggotaSearch] = useState('');
  const [showAnggotaDropdown, setShowAnggotaDropdown] = useState(false);

  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filter).filter(([, v]) => v))
  );

  const { data, mutate } = useSWR(`/api/pembayaran?${params.toString()}`, fetcher);
  const { data: anggotaRes } = useSWR('/api/anggota?status=Aktif', fetcher);
  const { data: sppRes } = useSWR('/api/spp_kategori?is_active=true', fetcher);
  const { data: brandingRes } = useSWR('/api/branding', fetcher);

  const pembayaranData: PembayaranSPP[] = data?.data || [];
  const anggotaList: Anggota[] = anggotaRes?.data || [];
  const sppList: SppKategori[] = sppRes?.data || [];
  const namaClub: string = brandingRes?.data?.nama_club || 'BARQIGNITE PRIVATE SPORT';
  const logoUrl: string = brandingRes?.data?.logo_url || '';

  // Filter anggota sesuai search
  const filteredAnggota = anggotaList.filter(a =>
    a.nama.toLowerCase().includes(anggotaSearch.toLowerCase()) ||
    a.id.toLowerCase().includes(anggotaSearch.toLowerCase())
  ).slice(0, 10);

  // Pilih anggota dari dropdown
  const selectAnggota = (a: Anggota) => {
    setForm(prev => ({
      ...prev,
      id_anggota: a.id,
      nama_anggota: a.nama,
      cabang_olahraga: a.cabang_olahraga,
    }));
    setAnggotaSearch(a.nama);
    setShowAnggotaDropdown(false);

    // Auto-set nominal dari kategori SPP jika ada
    const sppMatch = sppList.find(s =>
      s.cabang === a.cabang_olahraga && s.is_active
    );
    if (sppMatch) {
      setForm(prev => ({ ...prev, nominal: String(sppMatch.nominal) }));
    }
  };

  const handleSimpan = async () => {
    if (!form.id_anggota || !form.nominal || !form.bulan || !form.tahun) {
      alert('Harap lengkapi: Anggota, Nominal, Bulan, dan Tahun.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status_bayar: 'Lunas' }),
      });
      const json = await res.json();
      if (json.success) {
        setForm(formDefault);
        setAnggotaSearch('');
        setShowForm(false);
        mutate();
      } else {
        alert(json.error || 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin hapus data pembayaran ini?')) return;
    const res = await fetch(`/api/pembayaran?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) mutate();
    else alert(json.error || 'Gagal menghapus');
  };

  const handleCetakKwitansi = useCallback((row: PembayaranSPP) => {
    printKwitansi({ pembayaran: row, namaClub, logoUrl });
  }, [namaClub, logoUrl]);

  const exportToExcel = () => {
    if (pembayaranData.length === 0) return;
    const dataToExport = pembayaranData.map((item, index) => ({
      'No': index + 1,
      'No. Kwitansi': item.nomor_kwitansi || '-',
      'Nama Anggota': item.nama_anggota,
      'Cabang Olahraga': item.cabang_olahraga,
      'Periode (Bulan/Tahun)': `${getMonthName(item.bulan)} ${item.tahun}`,
      'Nominal (Rp)': item.nominal,
      'Status Bayar': item.status_bayar,
      'Metode Bayar': item.metode_bayar || '-',
      'Tanggal Bayar': item.tanggal_bayar || '-',
      'Catatan': item.catatan || '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pembayaran SPP');
    const filterLabel = [filter.bulan && getMonthName(filter.bulan), filter.tahun].filter(Boolean).join('_');
    XLSX.writeFile(workbook, `Data_Pembayaran_SPP${filterLabel ? '_' + filterLabel : ''}.xlsx`);
  };

  const lunas = pembayaranData.filter(d => d.status_bayar === 'Lunas').length;
  const belum = pembayaranData.filter(d => d.status_bayar !== 'Lunas').length;
  const totalNominal = pembayaranData
    .filter(d => d.status_bayar === 'Lunas')
    .reduce((acc, d) => acc + parseFloat(d.nominal || '0'), 0);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title text-neutral-light">Pembayaran SPP</h1>
          <p className="text-neutral-light/50 mt-1 text-sm">Catat pembayaran manual (cash / transfer / QRIS langsung ke admin)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowForm(!showForm); setForm(formDefault); setAnggotaSearch(''); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Catat Pembayaran
          </button>
          <Link href="/admin/pembayaran/settings" className="btn-secondary">
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan SPP &amp; Metode
          </Link>
        </div>
      </div>

      {/* Form Input Manual */}
      {showForm && (
        <div className="glass-card border border-primary-500/20 bg-primary-500/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-neutral-light flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary-400" />
              Input Pembayaran Manual
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 text-neutral-light/40 hover:text-neutral-light rounded-lg hover:bg-neutral-light/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pilih Anggota */}
            <div className="sm:col-span-2 lg:col-span-3 relative">
              <label className="form-label">Pilih Anggota <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  value={anggotaSearch}
                  onChange={(e) => { setAnggotaSearch(e.target.value); setShowAnggotaDropdown(true); if (!e.target.value) setForm(prev => ({ ...prev, id_anggota: '', nama_anggota: '', cabang_olahraga: '' })); }}
                  onFocus={() => setShowAnggotaDropdown(true)}
                  placeholder="Ketik nama atau ID anggota..."
                  className="form-input w-full pr-10"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-light/40" />
              </div>
              {showAnggotaDropdown && anggotaSearch && filteredAnggota.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full glass-card border rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
                  {filteredAnggota.map(a => (
                    <button
                      key={a.id}
                      onMouseDown={() => selectAnggota(a)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-light/10 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-neutral-light text-sm">{a.nama}</div>
                        <div className="text-xs text-neutral-light/50">{a.id}</div>
                      </div>
                      <span className={`badge text-xs ${a.cabang_olahraga === 'Basket' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
                        {a.cabang_olahraga === 'Basket' ? '🏀' : '🏊'} {a.cabang_olahraga}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {form.id_anggota && (
                <p className="text-xs text-emerald-400 mt-1">✓ {form.id_anggota} — {form.cabang_olahraga}</p>
              )}
            </div>

            {/* Bulan */}
            <div>
              <label className="form-label">Bulan Pembayaran <span className="text-red-400">*</span></label>
              <select value={form.bulan} onChange={e => setForm({ ...form, bulan: e.target.value })} className="form-select">
                {BULAN_LIST.map(b => <option key={b} value={b}>{getMonthName(b)}</option>)}
              </select>
            </div>

            {/* Tahun */}
            <div>
              <label className="form-label">Tahun <span className="text-red-400">*</span></label>
              <select value={form.tahun} onChange={e => setForm({ ...form, tahun: e.target.value })} className="form-select">
                {TAHUN_LIST.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Nominal */}
            <div>
              <label className="form-label">Nominal (Rp) <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={form.nominal}
                onChange={e => setForm({ ...form, nominal: e.target.value })}
                placeholder="Contoh: 300000"
                className="form-input"
                min={0}
              />
              {form.nominal && <p className="text-xs text-neutral-light/40 mt-1">{formatCurrency(parseFloat(form.nominal) || 0)}</p>}
            </div>

            {/* Tanggal Bayar */}
            <div>
              <label className="form-label">Tanggal Bayar <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={form.tanggal_bayar}
                onChange={e => setForm({ ...form, tanggal_bayar: e.target.value })}
                className="form-input"
              />
            </div>

            {/* Metode */}
            <div>
              <label className="form-label">Metode Pembayaran</label>
              <select value={form.metode_bayar} onChange={e => setForm({ ...form, metode_bayar: e.target.value })} className="form-select">
                {METODE_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Catatan */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="form-label">Catatan (opsional)</label>
              <input
                type="text"
                value={form.catatan}
                onChange={e => setForm({ ...form, catatan: e.target.value })}
                placeholder="Misal: Titip via kakak"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setForm(formDefault); setAnggotaSearch(''); }} className="btn-secondary">
              Batal
            </button>
            <button onClick={handleSimpan} disabled={saving} className="btn-success px-8">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan &amp; Cetak Kwitansi
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card border rounded-2xl p-5">
        <div className="grid sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <select value={filter.cabang} onChange={e => setFilter({ ...filter, cabang: e.target.value })} className="form-select">
            <option value="">🏀🏊 Semua Cabang</option>
            <option value="Basket">🏀 Basket</option>
            <option value="Renang">🏊 Renang</option>
          </select>
          <select value={filter.bulan} onChange={e => setFilter({ ...filter, bulan: e.target.value })} className="form-select">
            <option value="">Semua Bulan</option>
            {BULAN_LIST.map(b => <option key={b} value={b}>{getMonthName(b)}</option>)}
          </select>
          <select value={filter.tahun} onChange={e => setFilter({ ...filter, tahun: e.target.value })} className="form-select">
            {TAHUN_LIST.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="form-select">
            <option value="">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum">Belum Bayar</option>
          </select>
          <button className="btn-primary justify-center">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </button>
          <button onClick={exportToExcel} disabled={pembayaranData.length === 0} className="btn-success justify-center">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card border border-emerald-500/20 bg-emerald-500/5 p-5 text-center rounded-2xl">
          <div className="font-mono text-2xl font-bold text-emerald-400">{lunas}</div>
          <div className="text-neutral-light/50 text-sm mt-1">Lunas</div>
        </div>
        <div className="glass-card border border-amber-500/20 bg-amber-500/5 p-5 text-center rounded-2xl">
          <div className="font-mono text-2xl font-bold text-amber-400">{belum}</div>
          <div className="text-neutral-light/50 text-sm mt-1">Belum Bayar</div>
        </div>
        <div className="glass-card border border-primary-500/20 bg-primary-500/5 p-5 text-center rounded-2xl">
          <div className="font-mono text-base font-bold text-primary-400">{formatCurrency(totalNominal)}</div>
          <div className="text-neutral-light/50 text-sm mt-1">Total Terkumpul</div>
        </div>
      </div>

      {/* Table Riwayat */}
      <div className="glass-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Kwitansi</th>
                <th>Nama Anggota</th>
                <th>Cabang</th>
                <th>Bulan/Tahun</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Metode</th>
                <th>Tgl Bayar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!data && (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-400 mx-auto" />
                  </td>
                </tr>
              )}
              {data && pembayaranData.map((row) => (
                <tr key={row.id} className={row.status_bayar !== 'Lunas' ? 'bg-amber-500/[0.03]' : ''}>
                  <td className="font-mono text-xs text-neutral-light/60">
                    {row.nomor_kwitansi || <span className="text-neutral-light/30 italic">—</span>}
                  </td>
                  <td className="font-medium text-neutral-light">{row.nama_anggota}</td>
                  <td>
                    <span className={cn(
                      'badge',
                      row.cabang_olahraga === 'Basket'
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                        : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    )}>
                      {row.cabang_olahraga === 'Basket' ? '🏀' : '🏊'} {row.cabang_olahraga}
                    </span>
                  </td>
                  <td>{getMonthName(row.bulan)} {row.tahun}</td>
                  <td className="font-medium">{formatCurrency(row.nominal)}</td>
                  <td>
                    <span className={cn('badge', row.status_bayar === 'Lunas' ? 'badge-success' : row.status_bayar === 'Terlambat' ? 'badge-danger' : 'badge-warning')}>
                      {row.status_bayar === 'Lunas'
                        ? <><CheckCircle className="w-3 h-3 mr-1 inline" />Lunas</>
                        : <><AlertTriangle className="w-3 h-3 mr-1 inline" />{row.status_bayar}</>
                      }
                    </span>
                  </td>
                  <td className="text-neutral-light/60 text-sm">{row.metode_bayar || '—'}</td>
                  <td className="text-neutral-light/60 text-sm">
                    {row.tanggal_bayar
                      ? new Date(row.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    }
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      {/* Cetak Kwitansi — tersedia untuk semua baris */}
                      <button
                        onClick={() => handleCetakKwitansi(row)}
                        className="btn-secondary text-xs py-1 px-2.5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        title={`Cetak Kwitansi${row.nomor_kwitansi ? ' ' + row.nomor_kwitansi : ''}`}
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                      {/* Hapus */}
                      <button
                        onClick={() => handleDelete(row.id!)}
                        className="btn-secondary text-xs py-1 px-2.5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                        title="Hapus Pembayaran"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && pembayaranData.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-neutral-light/40 py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-light/5 rounded-full flex items-center justify-center">
                        <Filter className="w-5 h-5 text-neutral-light/30" />
                      </div>
                      <p>Belum ada data pembayaran</p>
                      <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-1">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Catat Pembayaran Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
