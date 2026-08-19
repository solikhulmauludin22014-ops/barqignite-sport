import type { Metadata } from 'next';
import { UserCheck, Award, Briefcase, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Pelatih } from '@/types';

export const metadata: Metadata = {
  title: 'Profil Pelatih',
  description: 'Pelatih profesional Barqignite Private Sport Sidoarjo — Basket dan Renang.',
};

async function getPelatih(): Promise<Pelatih[]> {
  try {
    const { data, error } = await supabase.from('pelatih').select('*').order('urutan', { ascending: true });
    if (error) return [];
    return data || [];
  } catch { return []; }
}

const cabangConfig = {
  Basket: { emoji: '🏀', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', badge: 'bg-orange-500/20 border-orange-500/30 text-orange-400' },
  Renang: { emoji: '🏊', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', badge: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
};

export const revalidate = 60;

export default async function PelatihPage() {
  const pelatihList = await getPelatih();

  const basketPelatih = pelatihList.filter((p) => p.cabang_olahraga === 'Basket');
  const renangPelatih = pelatihList.filter((p) => p.cabang_olahraga === 'Renang');

  const PelatihCard = ({ pelatih }: { pelatih: Pelatih }) => {
    const cfg = cabangConfig[pelatih.cabang_olahraga as keyof typeof cabangConfig] || cabangConfig.Basket;
    return (
      <div className="glass-card-hover border rounded-2xl overflow-hidden group">
        <div className={`relative h-44 ${cfg.bg} border-0 overflow-hidden`}>
          {pelatih.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pelatih.foto_url} alt={pelatih.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-20 h-20 rounded-2xl ${cfg.bg} border flex items-center justify-center`}>
                <span className="font-ui font-bold text-3xl text-neutral-light">{pelatih.nama.charAt(0)}</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-arena-800 via-transparent to-transparent" />
          <div className="absolute top-3 right-3">
            <span className={`badge border ${cfg.badge}`}>
              {cfg.emoji} {pelatih.cabang_olahraga}
            </span>
          </div>
          {pelatih.sertifikasi && (
            <div className="absolute top-3 left-3">
              <span className="badge badge-warning"><Award className="w-3 h-3 mr-1 shrink-0" />{pelatih.sertifikasi}</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="type-card-title text-neutral-light mb-1">{pelatih.nama}</h3>
          <p className={`text-sm font-medium ${cfg.color} mb-3`}>{pelatih.spesialisasi}</p>
          <div className="flex items-start gap-2 text-neutral-light/50 text-sm">
            <Briefcase className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
            <span className="line-clamp-2">{pelatih.pengalaman}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2 text-sm text-primary-400 font-medium mb-6">
            <UserCheck className="w-4 h-4" />
            <span>Tim Pelatih Barqignite</span>
          </div>
          <h1 className="type-page-title text-neutral-light mb-4">
            Profil <span className="text-primary-400">Pelatih</span>
          </h1>
          <p className="text-neutral-light/60 text-lg max-w-2xl mx-auto">
            Dilatih oleh pelatih profesional bersertifikat — cabang <span className="text-orange-400 font-medium">Basket 🏀</span> dan <span className="text-blue-400 font-medium">Renang 🏊</span>
          </p>
        </div>
      </section>

      {/* Basket Coaches */}
      {basketPelatih.length > 0 && (
        <section className="pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center text-xl">🏀</div>
              <h2 className="type-section-heading text-neutral-light">Pelatih <span className="text-orange-400">Basket</span></h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {basketPelatih.map((p) => <PelatihCard key={p.id} pelatih={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Renang Coaches */}
      {renangPelatih.length > 0 && (
        <section className="pb-16 bg-slate-900/30 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl">🏊</div>
              <h2 className="type-section-heading text-neutral-light">Pelatih <span className="text-blue-400">Renang</span></h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {renangPelatih.map((p) => <PelatihCard key={p.id} pelatih={p} />)}
            </div>
          </div>
        </section>
      )}

      {pelatihList.length === 0 && (
        <div className="py-20 text-center">
          <UserCheck className="w-16 h-16 text-neutral-light/20 mx-auto mb-4" />
          <p className="text-neutral-light/40">Data pelatih belum tersedia</p>
        </div>
      )}
    </div>
  );
}
