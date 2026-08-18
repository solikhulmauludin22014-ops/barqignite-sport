'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';

interface GaleriItem {
  id: string;
  judul: string;
  kategori: 'Basket' | 'Renang';
  foto_url: string;
  tanggal?: string;
  is_featured?: boolean;
  urutan?: number;
}

interface GallerySectionProps {
  items: GaleriItem[];
}

type FilterTab = 'Semua' | 'Basket' | 'Renang';

const tabs: FilterTab[] = ['Semua', 'Basket', 'Renang'];

export default function GallerySection({ items }: GallerySectionProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filtered = activeTab === 'Semua' ? items : items.filter(i => i.kategori === activeTab);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-arena-700 border border-white/5 flex items-center justify-center">
          <Camera className="w-7 h-7 text-neutral-light/20" />
        </div>
        <p className="text-neutral-light/30 text-sm font-medium tracking-wide">
          Foto kegiatan belum diunggah
        </p>
        <p className="text-neutral-light/20 text-xs">
          Admin dapat menambahkan foto di Panel Admin → Galeri
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-10 p-1 bg-arena-800 rounded-xl w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const colorClass =
            tab === 'Basket' ? (isActive ? 'bg-basket text-white shadow-[0_0_20px_rgba(255,107,0,0.4)]' : 'text-basket/70 hover:text-basket')
            : tab === 'Renang' ? (isActive ? 'bg-renang text-white shadow-[0_0_20px_rgba(0,194,203,0.4)]' : 'text-renang/70 hover:text-renang')
            : (isActive ? 'bg-arena-600 text-neutral-light' : 'text-neutral-light/50 hover:text-neutral-light');

          return (
            <button
              key={tab}
              id={`gallery-tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${colorClass}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Masonry Grid */}
      <div
        key={activeTab}
        className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
        style={{ transition: 'opacity 0.3s ease', opacity: visible ? 1 : 0 }}
      >
        {filtered.map((item, index) => {
          // Variasi ukuran: setiap foto ke-3 di setiap baris jadi "tall"
          const isFeatured = item.is_featured;
          const aspectClass = isFeatured
            ? 'aspect-[3/4]'
            : index % 5 === 0
            ? 'aspect-[4/5]'
            : index % 5 === 3
            ? 'aspect-[3/4]'
            : 'aspect-[4/3]';

          const categoryColor = item.kategori === 'Basket' ? 'bg-basket' : 'bg-renang';

          return (
            <div
              key={item.id}
              className="gallery-item group break-inside-avoid mb-4"
            >
              <div className={`relative w-full ${aspectClass} bg-arena-700`}>
                <Image
                  src={item.foto_url}
                  alt={item.judul}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />

                {/* Hover Overlay */}
                <div className="gallery-overlay">
                  <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white mb-2 ${categoryColor}`}>
                      {item.kategori}
                    </span>
                    <p className="text-white text-sm font-semibold leading-snug">
                      {item.judul}
                    </p>
                    {item.tanggal && (
                      <p className="text-neutral-light/60 text-[11px] mt-1 font-mono">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Featured pin */}
                {isFeatured && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-basket text-white text-[9px] font-bold uppercase tracking-wider rounded">
                    Unggulan
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
