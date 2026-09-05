import Link from 'next/link';
import { Instagram, Youtube, MapPin, Phone, Mail, MessageCircle, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
async function getBranding() {
  try {
    const { data, error } = await supabase.from('branding').select('*').eq('id', 'BRAND-001').single();
    if (error) return null;
    return data;
  } catch { return null; }
}

export default async function Footer() {
  const branding = await getBranding();

  const namaClub   = branding?.nama_club    || 'Barqignite Private Sport';
  const noWa       = branding?.no_wa_admin  || '';
  const instagram  = branding?.instagram    || '';
  const youtube    = branding?.youtube      || '';
  const email      = branding?.email_club   || '';
  const alamat     = branding?.alamat_club  || 'Sidoarjo, Jawa Timur';

  const waUrl      = noWa ? `https://wa.me/${noWa.replace(/\D/g, '')}` : '#';
  const igUrl      = instagram ? (instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`) : '#';
  const ytUrl      = youtube   ? (youtube.startsWith('http')   ? youtube   : `https://youtube.com/@${youtube.replace('@', '')}`)   : '#';

  return (
    <footer className="bg-arena-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative bg-white rounded-xl p-3 shadow-lg shadow-white/5 flex items-center justify-center">
                <img 
                  src="/logo-barqignite.png" 
                  alt="Barqignite Logo" 
                  className="w-20 md:w-24 h-auto object-contain relative z-10"
                />
              </div>
            </div>
            <p className="text-neutral-light/50 text-sm leading-relaxed mb-6 max-w-xs">
              Membentuk atlet berprestasi di cabang Basket &amp; Renang dengan semangat, disiplin, dan kerja keras bersama.
            </p>

            {/* Sosial Media */}
            <div className="flex gap-3 flex-wrap">
              {noWa && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg transition-all duration-200 group"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs font-medium">WhatsApp</span>
                </a>
              )}
              {instagram && (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 hover:border-pink-500/40 rounded-lg transition-all duration-200 group"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span className="text-pink-400 text-xs font-medium">Instagram</span>
                </a>
              )}
              {youtube && (
                <a
                  href={ytUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-200 group"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-xs font-medium">YouTube</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-neutral-light mb-4 uppercase text-xs tracking-wider">Menu</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/',            label: 'Beranda' },
                { href: '/profile',     label: 'Profil Club' },
                { href: '/pelatih',     label: 'Pelatih' },
                { href: '/jadwal',      label: 'Jadwal Latihan' },
                { href: '/pendaftaran', label: 'Daftar Anggota' },
                { href: '/presensi',    label: 'Presensi' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-light/50 hover:text-basket text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-semibold text-neutral-light mb-4 uppercase text-xs tracking-wider">Hubungi Kami</h4>
            <ul className="space-y-3">
              {alamat && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-basket mt-0.5 shrink-0" />
                  <span className="text-neutral-light/50 text-sm leading-relaxed">{alamat}</span>
                </li>
              )}
              {noWa && (
                <li>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                  >
                    <MessageCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-neutral-light/50 group-hover:text-green-400 text-sm transition-colors">
                      {noWa}
                    </span>
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <Mail className="w-4 h-4 text-renang shrink-0" />
                    <span className="text-neutral-light/50 group-hover:text-renang text-sm transition-colors">
                      {email}
                    </span>
                  </a>
                </li>
              )}
              {instagram && (
                <li>
                  <a
                    href={igUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                  >
                    <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="text-neutral-light/50 group-hover:text-pink-400 text-sm transition-colors">
                      {instagram.startsWith('@') ? instagram : `@${instagram}`}
                    </span>
                  </a>
                </li>
              )}
              {youtube && (
                <li>
                  <a
                    href={ytUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                  >
                    <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-neutral-light/50 group-hover:text-red-400 text-sm transition-colors">
                      {youtube.startsWith('@') ? youtube : `@${youtube}`}
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-light/30 text-xs">
            © {new Date().getFullYear()} {namaClub}. Hak cipta dilindungi.
          </p>
          <Link
            href="/admin"
            className="text-neutral-light/20 hover:text-neutral-light/50 text-xs transition-colors"
          >
            Panel Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
