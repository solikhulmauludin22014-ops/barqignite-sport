'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail, Clock, CalendarX } from 'lucide-react';

interface SesiItem {
  id: string;
  label: string;
  jam_mulai: string;
  jam_selesai: string;
  kategori: string;
  jenis: string;
  cabang_olahraga: string;
}

export default function PresensiPage() {
  const [email, setEmail] = useState('');
  const [sesiDipilih, setSesiDipilih] = useState('');

  // State untuk daftar sesi hari ini
  const [sesiList, setSesiList] = useState<SesiItem[]>([]);
  const [hariIni, setHariIni] = useState('');
  const [loadingSesi, setLoadingSesi] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{
    nama: string;
    cabang: string;
    jam_wib: string;
    sesi: string;
  } | null>(null);

  // Ambil sesi latihan hari ini dari server
  useEffect(() => {
    async function fetchSesiHariIni() {
      setLoadingSesi(true);
      try {
        const res = await fetch('/api/presensi/public');
        const json = await res.json();
        if (json.success) {
          setSesiList(json.data || []);
          setHariIni(json.hari || '');
          if (json.data?.length > 0) {
            setSesiDipilih(json.data[0].label);
          }
        }
      } catch {
        // Gagal fetch jadwal — biarkan list kosong
      } finally {
        setLoadingSesi(false);
      }
    }
    fetchSesiHariIni();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }
    if (!sesiDipilih) {
      setError('Silakan pilih sesi latihan.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const sesiObj = sesiList.find((s) => s.label === sesiDipilih);
      const res = await fetch('/api/presensi/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          sesi_id: sesiObj?.id || sesiDipilih,
          sesi_label: sesiDipilih,
        }),
      });
      
      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        setSuccessData(json.data);
        setEmail('');
      } else {
        setError(json.error || 'Gagal menyimpan presensi. Coba lagi.');
      }
    } catch {
      setError('Koneksi bermasalah. Periksa internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 relative flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-arena-800 via-arena-900 to-arena-800 dark:from-arena-900 dark:via-[#0a0f1c] dark:to-arena-900 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-basket/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-renang/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-12">
          <h1 className="type-page-title text-neutral-light mb-4">
            PRE<span className="text-renang">SEN</span>SI
          </h1>
          <p className="text-neutral-light/60 text-lg md:text-xl font-light">
            Konfirmasi kehadiran latihan Anda hari ini.
          </p>
        </div>

        {success ? (
          /* ── SUKSES: Menunggu Konfirmasi ── */
          <div className="glass-card bg-neutral-light/5 border border-neutral-light/10 rounded-3xl p-10 text-center animate-slide-up">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="type-section-heading text-neutral-light mb-2">Laporan Tercatat!</h2>
            <p className="text-neutral-light/60 mb-2">
              Hei <strong className="text-neutral-light">{successData?.nama}</strong>!
            </p>
            <p className="text-neutral-light/60 mb-2">
              Presensi kamu untuk sesi{' '}
              <strong className="text-neutral-light">{successData?.sesi}</strong>{' '}
              sudah tercatat pada{' '}
              <strong className="text-amber-400">pukul {successData?.jam_wib} WIB</strong>.
            </p>
            <div className="mt-5 mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <p className="text-amber-300 text-sm font-medium">
                ⏳ Menunggu konfirmasi dari pelatih / admin di lapangan.
              </p>
              <p className="text-neutral-light/40 text-xs mt-1">
                Status kehadiranmu akan dikonfirmasi langsung oleh admin setelah mengecek kehadiranmu.
              </p>
            </div>
            <button
              onClick={() => { setSuccess(false); setSesiDipilih(sesiList[0]?.label || ''); }}
              className="btn-secondary w-full"
            >
              Kembali
            </button>
          </div>
        ) : (
          /* ── FORM ── */
          <form onSubmit={handleSubmit} className="glass-card bg-neutral-light/5 border border-neutral-light/10 rounded-3xl p-8 md:p-10 shadow-2xl animate-fade-in">
            
            {error && (
              <div className="bg-status-danger/10 border border-status-danger/20 rounded-xl p-4 mb-8 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                <p className="text-sm text-status-danger">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                  Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-light/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda..."
                    className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 focus:border-basket/50 focus:ring-1 focus:ring-basket/50 rounded-2xl pl-12 pr-4 py-4 text-neutral-light font-medium transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Sesi Latihan Hari Ini */}
              <div>
                <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                  Sesi Latihan (Real-time)
                </label>
                {loadingSesi ? (
                  <div className="flex items-center gap-3 bg-arena-800/50 border border-neutral-light/10 rounded-2xl px-5 py-4">
                    <Loader2 className="w-5 h-5 text-neutral-light/30 animate-spin" />
                    <span className="text-neutral-light/40 text-sm">Memuat jadwal hari ini...</span>
                  </div>
                ) : sesiList.length === 0 ? (
                  /* Tidak ada sesi yang sedang berlangsung */
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4">
                    <CalendarX className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 text-sm font-medium">Tidak ada sesi latihan yang sedang berlangsung saat ini</p>
                      <p className="text-neutral-light/40 text-xs mt-0.5">
                        Presensi hanya bisa dilakukan pada saat jam latihan berlangsung.
                      </p>
                    </div>
                  </div>
                ) : sesiList.length === 1 ? (
                  /* Hanya 1 sesi aktif, tampilkan teks readonly */
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-light/30 pointer-events-none" />
                    <input
                      type="text"
                      value={sesiList[0].label}
                      readOnly
                      className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 rounded-2xl pl-12 pr-4 py-4 text-neutral-light font-medium outline-none cursor-not-allowed opacity-80"
                    />
                  </div>
                ) : (
                  /* Lebih dari 1 sesi aktif (jarang tapi mungkin), tampilkan dropdown */
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-light/30 pointer-events-none" />
                    <select
                      value={sesiDipilih}
                      onChange={(e) => setSesiDipilih(e.target.value)}
                      className="w-full bg-arena-800/50 dark:bg-black/20 border border-neutral-light/10 focus:border-basket/50 focus:ring-1 focus:ring-basket/50 rounded-2xl pl-12 pr-10 py-4 text-neutral-light font-medium transition-all outline-none appearance-none cursor-pointer"
                      required
                    >
                      {sesiList.map((s) => (
                        <option key={s.id} value={s.label}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || sesiList.length === 0}
              className="w-full mt-10 bg-neutral-light dark:bg-white text-arena-900 dark:text-black font-bold py-4 rounded-2xl hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Kirim Laporan Kehadiran</span>
              )}
            </button>
            
            <p className="text-center text-xs text-neutral-light/40 mt-6 font-medium">
              Hanya email yang sudah terdaftar di sistem yang dapat melakukan presensi.
              Status kehadiran akan dikonfirmasi oleh admin.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
