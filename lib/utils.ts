import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return dateStr; }
}

export function getMonthName(month: string | number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const m = typeof month === 'string' ? parseInt(month) : month;
  return months[m - 1] || month.toString();
}

export function calculateAge(tanggalLahir: string): number {
  if (!tanggalLahir) return 0;
  const birth = new Date(tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function generateOrderId(prefix: string = 'BARQ'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// Konversi angka ke teks terbilang (Bahasa Indonesia)
export function terbilang(angka: number): string {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

  function konversi(n: number): string {
    if (n < 20) return satuan[n];
    if (n < 100) {
      const puluhan = Math.floor(n / 10);
      const sisa = n % 10;
      return (puluhan === 1 ? 'sepuluh' : satuan[puluhan] + ' puluh') + (sisa ? ' ' + satuan[sisa] : '');
    }
    if (n < 1000) {
      const ratusan = Math.floor(n / 100);
      const sisa = n % 100;
      return (ratusan === 1 ? 'seratus' : satuan[ratusan] + ' ratus') + (sisa ? ' ' + konversi(sisa) : '');
    }
    if (n < 1000000) {
      const ribuan = Math.floor(n / 1000);
      const sisa = n % 1000;
      return (ribuan === 1 ? 'seribu' : konversi(ribuan) + ' ribu') + (sisa ? ' ' + konversi(sisa) : '');
    }
    if (n < 1000000000) {
      const jutaan = Math.floor(n / 1000000);
      const sisa = n % 1000000;
      return konversi(jutaan) + ' juta' + (sisa ? ' ' + konversi(sisa) : '');
    }
    const milyaran = Math.floor(n / 1000000000);
    const sisa = n % 1000000000;
    return konversi(milyaran) + ' miliar' + (sisa ? ' ' + konversi(sisa) : '');
  }

  if (angka === 0) return 'nol rupiah';
  const hasil = konversi(Math.floor(Math.abs(angka)));
  return hasil.charAt(0).toUpperCase() + hasil.slice(1) + ' rupiah';
}
