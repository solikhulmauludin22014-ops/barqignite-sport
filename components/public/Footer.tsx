import Link from 'next/link';
import { Trophy, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Club<span className="text-gradient-primary">Olahraga</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-4 max-w-xs">
              Membentuk atlet berprestasi dengan semangat, disiplin, dan kerja keras bersama.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/30 rounded-lg flex items-center justify-center transition-all duration-200 group"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-white/50 group-hover:text-pink-400" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg flex items-center justify-center transition-all duration-200 group"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4 text-white/50 group-hover:text-red-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Menu</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Beranda' },
                { href: '/profile', label: 'Profil Club' },
                { href: '/pelatih', label: 'Pelatih' },
                { href: '/jadwal', label: 'Jadwal Latihan' },
                { href: '/pendaftaran', label: 'Daftar Anggota' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/50 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                <span className="text-white/50 text-sm">Sidoarjo, Jawa Timur</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                <span className="text-white/50 text-sm">+62 xxx-xxxx-xxxx</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <span className="text-white/50 text-sm">info@clubolahraga.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Club Olahraga. Hak cipta dilindungi.
          </p>
          <Link
            href="/admin"
            className="text-white/20 hover:text-white/50 text-xs transition-colors"
          >
            Panel Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
