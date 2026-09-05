import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    // Basic IP detection (works for Vercel and standard proxies)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak percobaan. Silakan coba lagi setelah 1 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { nama, tanggal_lahir } = body;

    if (!nama || !tanggal_lahir) {
      return NextResponse.json(
        { success: false, error: 'Nama dan Tanggal Lahir wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Cari anggota dengan nama (case-insensitive) dan tanggal lahir yang tepat
    const { data: anggota, error: errAnggota } = await supabase
      .from('anggota')
      .select('id, nama')
      .ilike('nama', nama.trim())
      .eq('tanggal_lahir', tanggal_lahir)
      .maybeSingle();

    if (errAnggota || !anggota) {
      return NextResponse.json(
        { success: false, error: 'Data tidak ditemukan. Pastikan nama dan tanggal lahir sesuai dengan data pendaftaran Anda.' },
        { status: 404 }
      );
    }

    // 2. Cari data pembayaran untuk anggota ini pada tahun ini (atau maksimal 12 data terakhir)
    const currentYear = new Date().getFullYear();
    const { data: riwayat, error: errRiwayat } = await supabase
      .from('pembayaran_spp')
      .select('bulan, tahun, status_bayar')
      .eq('id_anggota', anggota.id)
      .eq('tahun', String(currentYear))
      .order('bulan', { ascending: true });

    if (errRiwayat) {
      throw errRiwayat;
    }

    return NextResponse.json({
      success: true,
      data: {
        nama: anggota.nama,
        tahun: currentYear,
        riwayat: riwayat || []
      }
    });

  } catch (error) {
    console.error('Cek Status Pembayaran error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
