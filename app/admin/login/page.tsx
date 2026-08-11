'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, Loader2, AlertCircle, Trophy, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import mainLogo from '@/LOGO BARQIGNITE NEW.png';

function AdminLoginContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Username atau password salah');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-neutral-light/50 hover:text-neutral-light transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 relative flex items-center justify-center mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-basket/30 to-renang/30 opacity-70 blur-2xl rounded-full" />
            <Image src={mainLogo} alt="Logo" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="font-display text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-neutral-light to-neutral-light/60 uppercase tracking-widest">Panel Admin</h1>
          <p className="text-basket text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Sistem Manajemen Club</p>
        </div>

        {/* Form */}
        <div className="glass-card border rounded-3xl p-8">
          <h2 className="font-display text-xl font-bold text-neutral-light mb-6">Masuk ke Akun</h2>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="form-label">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-light/30" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="form-input pl-10"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-light/30" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="form-input pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-light/30 hover:text-neutral-light/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-light/20 text-xs mt-6">
          Halaman ini hanya untuk administrator club
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-hero flex items-center justify-center text-neutral-light"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
