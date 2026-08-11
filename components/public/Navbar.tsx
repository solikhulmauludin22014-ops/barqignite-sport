'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import Image from 'next/image';
import mainLogo from '@/LOGO BARQIGNITE NEW.png';
const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/profile', label: 'Profil' },
  { href: '/prestasi', label: 'Prestasi' },
  { href: '/pelatih', label: 'Pelatih' },
  { href: '/jadwal', label: 'Jadwal' },
  { href: '/presensi', label: 'Presensi' },
  { href: '/pembayaran', label: 'Info Pembayaran' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
      scrolled ? 'bg-arena-900/95 backdrop-blur-xl border-white/10 shadow-xl' : 'bg-transparent border-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group mr-6 lg:mr-10">
            <div className="relative bg-white/95 rounded-lg p-1.5 shadow-md flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
              <Image 
                src={mainLogo} 
                alt="Barqignite Logo" 
                className="h-8 sm:h-10 w-auto object-contain relative z-10"
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 relative group overflow-hidden',
                    active ? 'text-neutral-light' : 'text-neutral-light/60 hover:text-neutral-light'
                  )}>
                  <span className="relative z-10">{link.label}</span>
                  <div className={cn(
                    'absolute inset-0 bg-neutral-light/5 rounded-lg transform origin-left transition-transform duration-300 ease-out',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          <div className="hidden xl:flex items-center gap-2">
              <Link
                href="/pendaftaran?cabang=Basket"
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-basket/10 hover:bg-basket text-basket hover:text-white border border-basket/30 hover:border-basket text-[11px] font-semibold tracking-wide transition-all duration-200 hover:-translate-y-px"
              >
                <span>🏀</span>
                <span>Daftar Basket</span>
              </Link>
              <Link
                href="/pendaftaran?cabang=Renang"
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-renang/10 hover:bg-renang text-renang hover:text-white border border-renang/30 hover:border-renang text-[11px] font-semibold tracking-wide transition-all duration-200 hover:-translate-y-px"
              >
                <span>🏊</span>
                <span>Daftar Renang</span>
              </Link>
              <Link href="/admin/login" className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-neutral-light/50 hover:text-neutral-light border border-neutral-light/10 hover:border-neutral-light/20 transition-all duration-200 tracking-wide">
                Admin
              </Link>
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-neutral-light/70 hover:text-neutral-light rounded-lg hover:bg-neutral-light/10 transition-colors">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn('lg:hidden overflow-hidden transition-all duration-300', mobileOpen ? 'max-h-screen' : 'max-h-0')}>
        <div className="bg-arena-900/95 backdrop-blur-xl border-t border-arena-700 dark:border-white/10 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors',
                pathname === link.href ? 'bg-neutral-light/10 text-neutral-light' : 'text-neutral-light/70 hover:text-neutral-light hover:bg-neutral-light/5'
              )}>
              {link.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-arena-700 dark:border-white/10">
            <Link href="/pendaftaran?cabang=Basket" onClick={() => setMobileOpen(false)} className="btn-accent justify-center text-xs py-2.5">Basket</Link>
            <Link href="/pendaftaran?cabang=Renang" onClick={() => setMobileOpen(false)} className="btn-primary justify-center text-xs py-2.5">Renang</Link>
            <Link href="/admin/login" onClick={() => setMobileOpen(false)} className="btn-secondary justify-center text-xs py-2.5 col-span-2">Login Admin</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
