'use client';

/**
 * ImageCropModal — Komponen crop foto reusable untuk seluruh aplikasi.
 *
 * Cara pakai:
 *   <ImageCropModal
 *     imageSrc="blob:..." | "data:..."
 *     aspect={3/4}
 *     onComplete={(blob) => { ... upload blob ke server ... }}
 *     onClose={() => setShowCrop(false)}
 *   />
 *
 * Props:
 *   imageSrc    : URL sumber gambar (blob URL atau data URL dari FileReader)
 *   aspect      : Rasio crop — misal 3/4 (pelatih/owner), 4/5 (galeri), 1 (logo/square)
 *   onComplete  : Callback menerima Blob hasil crop (siap di-upload)
 *   onClose     : Callback saat user menutup/membatalkan modal
 *   onPickNew   : (opsional) Callback saat user klik "Ganti Foto" — biarkan parent buka file picker
 *   outputSize  : (opsional) Resolusi output panjang sisi terbesar dalam px. Default: 1200
 *   quality     : (opsional) Kualitas JPEG/WebP 0–1. Default: 0.85
 */

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { ZoomIn, ZoomOut, Check, RefreshCw, X } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  aspect: number;
  onComplete: (blob: Blob) => void;
  onClose: () => void;
  onPickNew?: () => void;
  outputSize?: number;
  quality?: number;
  title?: string;
}

/** Crop piksel aktual dari canvas dan kembalikan sebagai Blob */
async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number,
  quality: number,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia');

  // Tentukan ukuran output berdasarkan outputSize (sisi terpanjang)
  const cropWidth = pixelCrop.width;
  const cropHeight = pixelCrop.height;
  const scale = outputSize / Math.max(cropWidth, cropHeight);
  canvas.width = Math.round(cropWidth * scale);
  canvas.height = Math.round(cropHeight * scale);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Gagal menghasilkan blob dari canvas')); return; }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

export default function ImageCropModal({
  imageSrc,
  aspect,
  onComplete,
  onClose,
  onPickNew,
  outputSize = 1200,
  quality = 0.85,
  title = 'Atur Posisi Foto',
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, outputSize, quality);
      onComplete(blob);
    } catch (err) {
      console.error('Crop error:', err);
      alert('Gagal memproses foto. Coba pilih foto lain.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-arena-800 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-ui font-semibold text-neutral-light text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-light/40 hover:text-neutral-light hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative bg-black" style={{ height: 360 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid rgba(139, 92, 246, 0.8)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              },
            }}
          />
        </div>

        {/* Zoom Slider */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              className="p-2 rounded-lg text-neutral-light/50 hover:text-neutral-light hover:bg-white/10 transition-colors shrink-0"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="p-2 rounded-lg text-neutral-light/50 hover:text-neutral-light hover:bg-white/10 transition-colors shrink-0"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-neutral-light/30 mt-1">
            Drag foto untuk mengatur posisi · Scroll / slider untuk zoom
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          {onPickNew && (
            <button
              type="button"
              onClick={onPickNew}
              className="btn-secondary flex-1 justify-center gap-2 py-2.5"
            >
              <RefreshCw className="w-4 h-4" />
              Ganti Foto
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            disabled={processing || !croppedAreaPixels}
            className="btn-primary flex-1 justify-center gap-2 py-2.5"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Terapkan Crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
