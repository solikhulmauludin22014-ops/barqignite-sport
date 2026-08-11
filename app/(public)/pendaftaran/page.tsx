'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Loader2, UserPlus, AlertCircle, CreditCard } from 'lucide-react';
import type { CabangOlahraga } from '@/types';

const schema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  cabang_olahraga: z.enum(['Basket', 'Renang'], { required_error: 'Pilih cabang olahraga' }),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], { required_error: 'Pilih jenis kelamin' }),
  alamat: z.string().min(10, 'Alamat minimal 10 karakter'),
  no_hp: z.string().min(9, 'Nomor HP tidak valid').max(15),
  email: z.string().email('Format email tidak valid').or(z.literal('')),
  nama_wali: z.string().optional(),
  asal_sekolah: z.string().min(2, 'Asal Sekolah wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  kategori: z.string().min(1, 'Pilih kategori'),
});

type FormData = z.infer<typeof schema>;

const kategoriOptions: Record<CabangOlahraga, string[]> = {
  Basket: ['Mini (5-8 tahun)', 'Pemula (9-12 tahun)', 'Junior (13-17 tahun)', 'Senior (18+ tahun)'],
  Renang: ['Beginner (5-8 tahun)', 'Intermediate (9-13 tahun)', 'Advanced (14-18 tahun)', 'Dewasa (18+ tahun)'],
};

function PendaftaranContent() {
  const searchParams = useSearchParams();
  const defaultCabang = (searchParams.get('cabang') as CabangOlahraga) || 'Basket';

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register, handleSubmit, watch, formState: { errors, isSubmitting }, reset, setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cabang_olahraga: defaultCabang },
  });

  const selectedCabang = watch('cabang_olahraga') as CabangOlahraga;

  useEffect(() => {
    setValue('cabang_olahraga', defaultCabang);
  }, [defaultCabang, setValue]);

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/pendaftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) { setSubmitted(true); reset(); }
      else setServerError(json.details || json.error || 'Terjadi kesalahan. Coba lagi.');
    } catch { setServerError('Koneksi bermasalah. Periksa internet Anda.'); }
  };

  const cabangColor = selectedCabang === 'Basket'
    ? { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', btn: 'btn-accent', emoji: '🏀' }
    : { text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', btn: 'btn-primary', emoji: '🏊' };

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="glass-card border border-emerald-500/30 bg-emerald-500/5 rounded-3xl p-12 max-w-md w-full text-center animate-slide-up">
          <div className="text-5xl mb-4">{cabangColor.emoji}</div>
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-neutral-light mb-3">Pendaftaran Berhasil!</h2>
          <p className="text-neutral-light/60 mb-8">
            Pendaftaran cabang <strong className={cabangColor.text}>{selectedCabang}</strong> Anda telah kami terima.
            Admin akan menghubungi Anda segera untuk konfirmasi dan informasi selanjutnya.
          </p>
          <button onClick={() => setSubmitted(false)} className="btn-primary w-full justify-center">
            Daftar Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className={`absolute inset-0 ${selectedCabang === 'Basket' ? 'bg-gradient-to-b from-orange-900/10' : 'bg-gradient-to-b from-blue-900/10'} to-transparent pointer-events-none`} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className={`inline-flex items-center gap-2 ${cabangColor.bg} border rounded-full px-4 py-2 text-sm ${cabangColor.text} font-medium mb-6`}>
            <UserPlus className="w-4 h-4" />
            <span>Bergabung dengan Barqignite</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-neutral-light mb-4">
            Daftar <span className={cabangColor.text}>{selectedCabang === 'Basket' ? '🏀 Basket' : '🏊 Renang'}</span>
          </h1>
          <p className="text-neutral-light/50 text-lg">
            Isi formulir pendaftaran anggota baru Barqignite Private Sport Sidoarjo
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card border rounded-3xl p-8 space-y-5">
            {serverError && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {serverError}
              </div>
            )}

            {/* Pilih Cabang */}
            <div>
              <label className="form-label">Cabang Olahraga *</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Basket', 'Renang'] as CabangOlahraga[]).map((c) => (
                  <label key={c} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedCabang === c
                      ? (c === 'Basket' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400')
                      : 'bg-neutral-light/5 border-neutral-light/10 text-neutral-light/60 hover:bg-neutral-light/10'
                  }`}>
                    <input {...register('cabang_olahraga')} type="radio" value={c} className="hidden" />
                    <span className="text-2xl">{c === 'Basket' ? '🏀' : '🏊'}</span>
                    <span className="font-semibold">{c}</span>
                  </label>
                ))}
              </div>
              {errors.cabang_olahraga && <p className="form-error">{errors.cabang_olahraga.message}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Nama */}
              <div className="sm:col-span-2">
                <label className="form-label">Nama Lengkap *</label>
                <input {...register('nama')} id="nama" placeholder="Masukkan nama lengkap" className="form-input" />
                {errors.nama && <p className="form-error">{errors.nama.message}</p>}
              </div>

              <div>
                <label className="form-label">Tanggal Lahir *</label>
                <input {...register('tanggal_lahir')} type="date" className="form-input" />
                {errors.tanggal_lahir && <p className="form-error">{errors.tanggal_lahir.message}</p>}
              </div>

              <div>
                <label className="form-label">Jenis Kelamin *</label>
                <select {...register('jenis_kelamin')} className="form-select">
                  <option value="">-- Pilih --</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                {errors.jenis_kelamin && <p className="form-error">{errors.jenis_kelamin.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Alamat Lengkap *</label>
                <textarea {...register('alamat')} rows={3} placeholder="Masukkan alamat lengkap" className="form-input resize-none" />
                {errors.alamat && <p className="form-error">{errors.alamat.message}</p>}
              </div>

              <div>
                <label className="form-label">No. HP / WhatsApp *</label>
                <input {...register('no_hp')} type="tel" placeholder="08xxxxxxxxxx" className="form-input" />
                {errors.no_hp && <p className="form-error">{errors.no_hp.message}</p>}
              </div>

              <div>
                <label className="form-label">Email</label>
                <input {...register('email')} type="email" placeholder="email@contoh.com (opsional)" className="form-input" />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Nama Orang Tua / Wali <span className="text-neutral-light/30">(untuk peserta di bawah 17 tahun)</span></label>
                <input {...register('nama_wali')} placeholder="Nama orang tua atau wali" className="form-input" />
              </div>

              <div>
                <label className="form-label">Asal Sekolah *</label>
                <input {...register('asal_sekolah')} placeholder="Masukkan nama sekolah" className="form-input" />
                {errors.asal_sekolah && <p className="form-error">{errors.asal_sekolah.message}</p>}
              </div>

              <div>
                <label className="form-label">Kelas *</label>
                <input {...register('kelas')} placeholder="Contoh: 5 SD / VIII SMP / XI SMA" className="form-input" />
                {errors.kelas && <p className="form-error">{errors.kelas.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Kategori Usia *</label>
                <select {...register('kategori')} className="form-select">
                  <option value="">-- Pilih Kategori --</option>
                  {(kategoriOptions[selectedCabang as CabangOlahraga] || kategoriOptions.Basket).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                {errors.kategori && <p className="form-error">{errors.kategori.message}</p>}
              </div>
            </div>

            <button type="submit" id="submit-pendaftaran" disabled={isSubmitting} className={`${cabangColor.btn} w-full justify-center py-4 text-base mt-2`}>
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</>
                : <><UserPlus className="w-4 h-4" />Kirim Pendaftaran {selectedCabang === 'Basket' ? '🏀' : '🏊'}</>
              }
            </button>

            <p className="text-neutral-light/30 text-xs text-center">
              Dengan mendaftar, Anda menyetujui penggunaan data untuk keperluan administrasi Barqignite Private Sport Sidoarjo.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function PendaftaranPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center text-neutral-light"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <PendaftaranContent />
    </Suspense>
  );
}
