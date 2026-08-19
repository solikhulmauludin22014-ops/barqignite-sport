import type { Metadata } from 'next';
import { BookOpen, Eye, Heart, Users, Award, Star, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import OwnerProfile from '@/components/public/OwnerProfile';
export const metadata: Metadata = {
  title: 'Profil Club',
  description: 'Sejarah, visi, misi, dan struktur organisasi club olahraga kami.',
};

export const revalidate = 60;

async function getBranding() {
  try {
    const { data, error } = await supabase.from('branding').select('*').eq('id', 'BRAND-001').single();
    if (error) return null;
    return data;
  } catch { return null; }
}

async function getStats() {
  try {
    const { count } = await supabase.from('pendaftar').select('*', { count: 'exact', head: true }).eq('status_pendaftaran', 'Diterima');
    return count || 0;
  } catch { return 0; }
}

async function getPrestasiCount() {
  try {
    const { count } = await supabase.from('prestasi').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch { return 0; }
}

async function getPelatihCount() {
  try {
    const { count } = await supabase.from('pelatih').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch { return 0; }
}

export default async function ProfilePage() {
  const [branding, anggotaCount, prestasiCount, pelatihCount] = await Promise.all([
    getBranding(),
    getStats(),
    getPrestasiCount(),
    getPelatihCount()
  ]);

  const namaClub = branding?.nama_club || 'Club Olahraga';
  const sejarah = branding?.sejarah || 'Club olahraga ini didirikan dengan semangat membentuk generasi atlet berprestasi. Sejak awal berdirinya, kami telah berkomitmen untuk memberikan pelatihan berkualitas dengan pembinaan yang profesional.';
  const visi = branding?.visi || 'Menjadi club olahraga terbaik yang melahirkan atlet-atlet berprestasi di tingkat regional dan nasional.';
  const misi = branding?.misi || 'Memberikan pelatihan berkualitas, membangun karakter atlet, meningkatkan prestasi, dan menjaga semangat sportivitas.';

  const galeri = [
    branding?.galeri_1, branding?.galeri_2, branding?.galeri_3,
    branding?.galeri_4, branding?.galeri_5, branding?.galeri_6,
  ].filter(Boolean);

  const strukturOrgRaw = [
    { jabatan: 'Ketua', nama: branding?.org_ketua },
    { jabatan: 'Sekretaris', nama: branding?.org_sekretaris },
    { jabatan: 'Bendahara', nama: branding?.org_bendahara },
    { jabatan: 'Pelatih Kepala', nama: branding?.org_pelatih_kepala },
  ];
  
  // Filter out any positions that don't have a name
  const strukturOrg = strukturOrgRaw.filter(org => org.nama && org.nama.trim() !== '');

  const noWa = branding?.no_wa_admin || '';
  const waUrl = noWa ? `https://wa.me/${noWa.replace(/\D/g, '')}` : '#';

  const statsList = [
    { label: 'Anggota Aktif', value: anggotaCount > 0 ? anggotaCount : '0', icon: Users },
    { label: 'Prestasi', value: prestasiCount > 0 ? `${prestasiCount}+` : '0', icon: Trophy },
    { label: 'Pelatih', value: pelatihCount > 0 ? pelatihCount : '0', icon: Star },
    { label: 'Tahun Berdiri', value: branding?.tahun_berdiri || '2010', icon: Award },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-arena-600/20 dark:from-arena-900/50 to-transparent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-basket/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-basket/10 border border-basket/20 rounded-full px-4 py-2 text-sm text-basket font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            <span>Tentang Kami</span>
          </div>
          <h1 className="type-page-title text-neutral-light mb-4">
            Profil <span className="text-primary-400">Club</span>
          </h1>
          <p className="text-neutral-light/60 text-lg mb-8">Kenali kami lebih dekat — sejarah, visi, dan nilai yang kami junjung</p>
          
          {noWa && (
            <a href={waUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>Hubungi Admin via WhatsApp</span>
            </a>
          )}
        </div>
      </section>

      {/* Sejarah */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-renang/10 border border-renang/20 rounded-full px-3 py-1.5 text-xs text-renang font-medium mb-4">
                <Award className="w-3.5 h-3.5" />
                <span>Sejarah</span>
              </div>
              <h2 className="type-section-heading text-neutral-light mb-6">
                Perjalanan <span className="text-primary-400">{namaClub}</span>
              </h2>
              <p className="text-neutral-light/70 leading-relaxed">{sejarah}</p>
            </div>
            <div className="glass-card border border-basket/20 bg-basket/5 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                {statsList.map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon className="w-6 h-6 text-basket mx-auto mb-2" />
                    <div className="font-mono text-2xl font-bold text-neutral-light">{s.value}</div>
                    <div className="text-neutral-light/50 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-16 bg-arena-700/30 dark:bg-arena-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Visi & Misi</h2>
            <p className="section-subtitle mx-auto">Fondasi yang mengarahkan setiap langkah kami</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card border border-blue-500/20 bg-blue-500/5 p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="type-card-title text-neutral-light">Visi</h3>
              </div>
              <p className="text-neutral-light/70 leading-relaxed">{visi}</p>
            </div>
            <div className="glass-card border border-emerald-500/20 bg-emerald-500/5 p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="type-card-title text-neutral-light">Misi</h3>
              </div>
              <p className="text-neutral-light/70 leading-relaxed">{misi}</p>
            </div>
          </div>
        </div>
      </section>
      <OwnerProfile />

      {/* Struktur Organisasi */}
      {strukturOrg.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title mb-3">Struktur Kepengurusan</h2>
              <p className="section-subtitle mx-auto">Tim yang mengelola dan memimpin club</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center">
              {strukturOrg.map((org, i) => (
                <div key={i} className="glass-card-hover border p-6 rounded-2xl text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-basket to-renang rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-basket/20">
                    <span className="font-ui font-bold text-xl text-white">
                      {org.nama!.charAt(0)}
                    </span>
                  </div>
                  <p className="text-basket text-xs font-semibold uppercase tracking-wider mb-1">{org.jabatan}</p>
                  <p className="text-neutral-light font-semibold">{org.nama}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Galeri */}
      {galeri.length > 0 && (
        <section className="py-16 bg-arena-700/20 dark:bg-arena-900/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title mb-3">Galeri Kegiatan</h2>
              <p className="section-subtitle mx-auto">Momen-momen berharga bersama</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galeri.map((url, i) => (
                <div key={i} className="aspect-video bg-arena-600/20 dark:bg-arena-800 rounded-2xl overflow-hidden border border-arena-600/30 dark:border-white/10 hover:border-basket/50 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Missing import
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15C8.686 15 6 12.314 6 9V4h12v5c0 3.314-2.686 6-6 6zm0 0v4m-4 2h8" />
    </svg>
  );
}
