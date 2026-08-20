'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Next.js caught an error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-arena-800 flex items-center justify-center px-4 py-20">
      <div className="bg-arena-900 border border-white/10 rounded-3xl p-8 md:p-12 max-w-xl w-full text-center shadow-2xl relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="font-display text-4xl text-white mb-4">WADUH, ADA YANG SALAH!</h1>
        
        <p className="text-neutral-light/80 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Maaf, terjadi kesalahan tak terduga pada halaman ini. Anda bisa mencoba memuat ulang halaman atau kembali ke beranda.
        </p>
        
        <div className="bg-black/30 rounded-xl p-4 mb-8 border border-white/5 text-left overflow-hidden">
          <p className="text-xs text-red-400 font-mono break-all truncate">
            {error.message || 'Unknown Application Error'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => reset()} 
            className="btn-primary flex-1 sm:flex-none justify-center gap-2 px-8"
          >
            <RefreshCcw className="w-4 h-4" />
            Coba Lagi
          </button>
          
          <button 
            onClick={() => window.location.href = '/'} 
            className="btn-secondary flex-1 sm:flex-none justify-center px-8"
          >
            Ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
