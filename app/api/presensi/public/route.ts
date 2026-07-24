import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Presensi } from '@/types';

function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, sesi, status_hadir } = body;

    if (!email || !sesi || !status_hadir) {
      return NextResponse.json(
        { success: false, error: 'Email, sesi, dan status kehadiran wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Cari anggota berdasarkan email
    const { data: anggota, error: errAnggota } = await supabase
      .from('anggota')
      .select('*')
      .ilike('email', email.trim())
      .single();

    if (errAnggota || !anggota) {
      return NextResponse.json(
        { success: false, error: 'Email tidak terdaftar di sistem kami.' },
        { status: 404 }
      );
    }

    if (anggota.status !== 'Aktif') {
      return NextResponse.json(
        { success: false, error: 'Status keanggotaan Anda saat ini tidak aktif.' },
        { status: 403 }
      );
    }

    // 2. Cek apakah sudah presensi hari ini
    const today = new Date().toLocaleDateString('id-ID'); // Format: DD/MM/YYYY or similar depending on server locale.
    // To ensure consistent date format matching what might be in DB, we'll use a standard format, or let's use the local date format they likely use.
    // Actually, looking at the previous code: new Date().toLocaleDateString('id-ID') is what they use.

    const { data: existing, error: errExisting } = await supabase
      .from('presensi')
      .select('id')
      .eq('id_anggota', anggota.id)
      .eq('tanggal', today)
      .eq('sesi', sesi)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Anda sudah melakukan presensi untuk sesi ini.' },
        { status: 400 }
      );
    }

    // 3. Insert Presensi
    const presensiData = {
      id: generateId('PRE'),
      tanggal: today,
      cabang_olahraga: anggota.cabang_olahraga,
      id_anggota: anggota.id,
      nama_anggota: anggota.nama,
      kategori: anggota.kategori,
      status_hadir,
      sesi,
    };

    const { error: insertError } = await supabase
      .from('presensi')
      .insert([presensiData]);

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      message: 'Presensi berhasil dicatat!',
      data: { nama: anggota.nama, cabang: anggota.cabang_olahraga }
    });

  } catch (error) {
    console.error('Presensi Public POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
