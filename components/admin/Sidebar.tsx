'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, ClipboardList, CreditCard, Wallet, UserPlus,
  Paintbrush, Calendar, UserCheck, Menu, X, LogOut, Trophy, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/presensi', label: 'Presensi', icon: ClipboardList },
  { href: '/admin/pembayaran', label: 'Pembayaran SPP', icon: CreditCard },
  { href: '/admin/kas', label: 'Kas Club', icon: Wallet },
  { href: '/admin/anggota', label: 'Data Anggota', icon: UserCheck },
  { href: '/admin/pendaftar', label: 'Pendaftar Baru', icon: UserPlus },
  { href: '/admin/jadwal', label: 'Jadwal', icon: Calendar },
  { href: '/admin/pelatih', label: 'Pelatih', icon: ClipboardList },
  { href: '/admin/prestasi', label: 'Prestasi Atlet', icon: Trophy },
];

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/admin/login';
    }
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-arena-800 border border-arena-600/50 dark:border-white/10 rounded-xl text-neutral-light shadow-lg"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-64 bg-arena-900 border-r border-arena-600/30 dark:border-white/5 flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-arena-600/30 dark:border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-basket/5 to-renang/5 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-basket to-renang rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display font-black tracking-widest uppercase text-neutral-light text-sm">Barqignite</p>
                <p className="text-neutral-light/40 text-[10px] font-bold uppercase tracking-widest">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-neutral-light/40 hover:text-neutral-light rounded-lg hover:bg-arena-600/20 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 group',
                  active
                    ? 'bg-renang/10 text-renang border border-renang/20'
                    : 'text-neutral-light/50 hover:text-neutral-light hover:bg-arena-600/10 dark:hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-renang' : 'text-neutral-light/30 group-hover:text-neutral-light/50')} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-renang" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-arena-600/50 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between mb-2 px-3">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-light/40">Tema Tema</span>
            <ThemeToggle />
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-light/60 hover:text-neutral-light hover:bg-arena-600/20 dark:hover:bg-white/10 transition-all"
          >
            <Trophy className="w-4 h-4 text-neutral-light/40" />
            Lihat Website
          </Link>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="glass-card border rounded-3xl p-6 w-full max-w-sm animate-slide-up text-center shadow-xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-neutral-light mb-2">Konfirmasi Keluar</h3>
            <p className="text-neutral-light/60 text-sm mb-6">Apakah Anda yakin ingin keluar dari panel admin?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary flex-1 justify-center">Tidak</button>
              <button onClick={handleLogout} className="flex-1 justify-center bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all py-2.5 px-4 shadow-md shadow-red-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
