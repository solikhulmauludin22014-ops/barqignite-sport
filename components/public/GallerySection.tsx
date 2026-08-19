'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';

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
const CAROUSEL_INTERVAL = 4500;

// ─── Featured Carousel ────────────────────────────────────────────────────────

function FeaturedCarousel({ items }: { items: GaleriItem[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev' = 'next') => {
      if (isAnimating) return;
      setDirection(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent((index + items.length) % items.length);
        setIsAnimating(false);
      }, 400);
    },
    [isAnimating, items.length]
  );

  const goNext = useCallback(() => goTo(current + 1, 'next'), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1, 'prev'), [current, goTo]);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    timerRef.current = setInterval(goNext, CAROUSEL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, goNext, items.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  if (items.length === 0) return null;

  const item = items[current];
  const slideClass = isAnimating
    ? direction === 'next'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0';

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-12 group/carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main image */}
      <div className="relative aspect-[16/7] sm:aspect-[21/9] bg-arena-700">
        <div
          className={`absolute inset-0 transition-all duration-400 ease-out ${slideClass}`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <Image
            src={item.foto_url}
            alt={item.judul}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-arena-900/90 via-arena-900/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-arena-900/40 to-transparent pointer-events-none" />

        {/* Caption */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 sm:p-8 transition-all duration-400 ease-out ${slideClass}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-basket text-white text-[9px] font-bold uppercase tracking-wider rounded">
              Unggulan
            </span>
            <span className={`px-2.5 py-1 text-white text-[9px] font-bold uppercase tracking-wider rounded ${item.kategori === 'Basket' ? 'bg-basket/70' : 'bg-renang/70'}`}>
              {item.kategori === 'Basket' ? '🏀' : '🏊'} {item.kategori}
            </span>
          </div>
          <p className="text-white font-display font-bold text-xl sm:text-2xl leading-snug max-w-lg">
            {item.judul}
          </p>
          {item.tanggal && (
            <p className="text-neutral-light/50 text-xs font-mono mt-2">
              {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Prev / Next buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={goPrev}
            id="carousel-prev"
            aria-label="Foto sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 hover:border-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            id="carousel-next"
            aria-label="Foto berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 hover:border-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              id={`carousel-dot-${i}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-5 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-play progress bar */}
      {items.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
          <div
            key={`${current}-progress`}
            className="h-full bg-basket/70"
            style={{
              animation: `slideProgress ${CAROUSEL_INTERVAL}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  startIndex,
  onClose,
}: {
  items: GaleriItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev') => {
      if (isAnimating) return;
      setSlideDir(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent((index + items.length) % items.length);
        setIsAnimating(false);
      }, 350);
    },
    [isAnimating, items.length]
  );

  const goNext = useCallback(() => goTo(current + 1, 'next'), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1, 'prev'), [current, goTo]);

  // Keyboard & close handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, goNext, goPrev]);

  // Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      delta > 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
  };

  const item = items[current];
  const imgClass = isAnimating
    ? slideDir === 'next'
      ? 'opacity-0 translate-x-6'
      : 'opacity-0 -translate-x-6'
    : 'opacity-100 translate-x-0';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Foto galeri"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/92 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Close button */}
        <button
          id="lightbox-close"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute -top-12 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image container */}
        <div className="relative w-full max-h-[70vh] flex items-center justify-center">
          <div
            className={`relative w-full transition-all duration-350 ease-out ${imgClass}`}
            style={{ transitionProperty: 'opacity, transform', maxHeight: '70vh' }}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ maxHeight: '70vh' }}>
              <Image
                src={item.foto_url}
                alt={item.judul}
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, 900px"
                priority
              />
            </div>
          </div>

          {/* Prev / Next buttons */}
          {items.length > 1 && (
            <>
              <button
                id="lightbox-prev"
                onClick={goPrev}
                aria-label="Foto sebelumnya"
                className="absolute -left-2 sm:-left-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                id="lightbox-next"
                onClick={goNext}
                aria-label="Foto berikutnya"
                className="absolute -right-2 sm:-right-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Caption */}
        <div className="mt-5 text-center max-w-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            {item.is_featured && (
              <span className="px-2 py-0.5 bg-basket text-white text-[9px] font-bold uppercase tracking-wider rounded">
                Unggulan
              </span>
            )}
            <span className={`px-2 py-0.5 text-white text-[9px] font-bold uppercase tracking-wider rounded ${item.kategori === 'Basket' ? 'bg-basket/70' : 'bg-renang/70'}`}>
              {item.kategori}
            </span>
          </div>
          <p className="text-white font-semibold text-base leading-snug">{item.judul}</p>
          {item.tanggal && (
            <p className="text-white/40 text-xs font-mono mt-1">
              {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {items.length > 1 && (
            <p className="text-white/25 text-xs mt-2 font-mono">
              {current + 1} / {items.length}
            </p>
          )}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && items.length <= 12 && (
          <div className="flex items-center gap-1.5 mt-4">
            {items.map((_, i) => (
              <button
                key={i}
                id={`lightbox-dot-${i}`}
                aria-label={`Foto ${i + 1}`}
                onClick={() => goTo(i, i > current ? 'next' : 'prev')}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main GallerySection ──────────────────────────────────────────────────────

export default function GallerySection({ items }: GallerySectionProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filtered = activeTab === 'Semua' ? items : items.filter(i => i.kategori === activeTab);
  const featuredItems = filtered.filter(i => i.is_featured);
  const gridItems = filtered; // Show all in grid (featured also appear with badge)

  const openLightbox = (indexInFiltered: number) => setLightboxIndex(indexInFiltered);
  const closeLightbox = () => setLightboxIndex(null);

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
            tab === 'Basket'
              ? isActive
                ? 'bg-basket text-white shadow-[0_0_20px_rgba(255,107,0,0.4)]'
                : 'text-basket/70 hover:text-basket'
              : tab === 'Renang'
              ? isActive
                ? 'bg-renang text-white shadow-[0_0_20px_rgba(0,194,203,0.4)]'
                : 'text-renang/70 hover:text-renang'
              : isActive
              ? 'bg-arena-600 text-neutral-light'
              : 'text-neutral-light/50 hover:text-neutral-light';

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

      {/* Featured Carousel — tampil jika ada foto unggulan */}
      {featuredItems.length > 0 && (
        <FeaturedCarousel items={featuredItems} />
      )}

      {/* Grid */}
      <div
        key={activeTab}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4"
        style={{ transition: 'opacity 0.3s ease', opacity: visible ? 1 : 0 }}
      >
        {gridItems.map((item, index) => {
          const categoryColor = item.kategori === 'Basket' ? 'bg-basket' : 'bg-renang';
          return (
            <div
              key={item.id}
              id={`gallery-item-${item.id}`}
              className="gallery-item group cursor-pointer"
              onClick={() => openLightbox(index)}
              role="button"
              tabIndex={0}
              aria-label={`Buka foto: ${item.judul}`}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox(index)}
            >
              {/* Uniform 4:5 aspect ratio */}
              <div className="relative w-full aspect-[4/5] bg-arena-700 rounded-xl overflow-hidden">
                <Image
                  src={item.foto_url}
                  alt={item.judul}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
                  loading="lazy"
                />

                {/* Hover overlay with caption */}
                <div className="gallery-overlay">
                  <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {item.is_featured && (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white bg-basket">
                          Unggulan
                        </span>
                      )}
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white ${categoryColor}`}>
                        {item.kategori}
                      </span>
                    </div>
                    <p className="text-white text-sm font-semibold leading-snug line-clamp-2">
                      {item.judul}
                    </p>
                    {item.tanggal && (
                      <p className="text-neutral-light/60 text-[11px] mt-1 font-mono">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges (always visible) */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                  {item.is_featured && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white bg-basket/80 backdrop-blur-sm">
                      ⭐
                    </span>
                  )}
                </div>
                <div className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-sm ${categoryColor}/80`}>
                  {item.kategori === 'Basket' ? '🏀' : '🏊'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={gridItems}
          startIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
