'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail, Clock, Activity } from 'lucide-react';

export default function PresensiPage() {
  const [email, setEmail] = useState('');
  const [sesi, setSesi] = useState('Latihan Pagi');
  const [statusHadir, setStatusHadir] = useState('Hadir');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState<{ nama: string; cabang: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/presensi/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), sesi, status_hadir: statusHadir }),
      });
      
      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        setMemberData(json.data);
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
      {/* Background with clean minimalistic gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-arena-800 via-arena-900 to-arena-800 dark:from-arena-900 dark:via-[#0a0f1c] dark:to-arena-900 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-basket/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-renang/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-6xl font-black text-neutral-light mb-4 tracking-tight">
            Check-<span className="text-gradient">In</span>
          </h1>
          <p className="text-neutral-light/60 text-lg md:text-xl font-light">
            Konfirmasi kehadiran latihan Anda hari ini.
          </p>
        </div>

        {success ? (
          <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-10 text-center animate-slide-up">
            <div className="w-20 h-20 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-status-success" />
            </div>
            <h2 className="font-display text-3xl font-bold text-neutral-light mb-2">Presensi Berhasil!</h2>
            <p className="text-neutral-light/60 mb-8">
              Terima kasih <strong className="text-neutral-light">{memberData?.nama}</strong>. Kehadiran Anda untuk <strong className="text-neutral-light">{memberData?.cabang}</strong> telah dicatat.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn-secondary w-full"
            >
              Kembali
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl animate-fade-in">
            
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
                    className="w-full bg-arena-800/50 dark:bg-black/20 border border-white/10 focus:border-basket/50 focus:ring-1 focus:ring-basket/50 rounded-2xl pl-12 pr-4 py-4 text-neutral-light font-medium transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Sesi & Status in a grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sesi Latihan */}
                <div>
                  <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                    Sesi Latihan
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-light/30 pointer-events-none" />
                    <select
                      value={sesi}
                      onChange={(e) => setSesi(e.target.value)}
                      className="w-full bg-arena-800/50 dark:bg-black/20 border border-white/10 focus:border-basket/50 focus:ring-1 focus:ring-basket/50 rounded-2xl pl-12 pr-10 py-4 text-neutral-light font-medium transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="Latihan Pagi">Latihan Pagi</option>
                      <option value="Latihan Sore">Latihan Sore</option>
                      <option value="Latihan Malam">Latihan Malam</option>
                      <option value="Pertandingan">Pertandingan</option>
                    </select>
                  </div>
                </div>

                {/* Status Kehadiran */}
                <div>
                  <label className="block text-xs font-bold text-neutral-light/50 uppercase tracking-widest mb-2 ml-1">
                    Status
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-light/30 pointer-events-none" />
                    <select
                      value={statusHadir}
                      onChange={(e) => setStatusHadir(e.target.value)}
                      className="w-full bg-arena-800/50 dark:bg-black/20 border border-white/10 focus:border-basket/50 focus:ring-1 focus:ring-basket/50 rounded-2xl pl-12 pr-10 py-4 text-neutral-light font-medium transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-10 bg-neutral-light dark:bg-white text-arena-900 dark:text-black font-bold py-4 rounded-2xl hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Submit Kehadiran</span>
              )}
            </button>
            
            <p className="text-center text-xs text-neutral-light/40 mt-6 font-medium">
              Hanya email yang sudah terdaftar di sistem yang dapat melakukan presensi.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
