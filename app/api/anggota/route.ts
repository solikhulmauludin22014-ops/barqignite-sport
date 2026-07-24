import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Anggota } from '@/types';

function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const kategori = searchParams.get('kategori');
    const cabang = searchParams.get('cabang');

    let query = supabase.from('anggota').select('*');

    if (status) query = query.eq('status', status);
    if (kategori) query = query.eq('kategori', kategori);
    if (cabang) query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Anggota GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data anggota' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAnggota: Anggota = {
      id: generateId('AGT'),
      nama: body.nama,
      cabang_olahraga: body.cabang_olahraga,
      tanggal_lahir: body.tanggal_lahir,
      jenis_kelamin: body.jenis_kelamin,
      alamat: body.alamat,
      no_hp: body.no_hp,
      email: body.email || '',
      kategori: body.kategori,
      status: 'Aktif',
      tanggal_gabung: new Date().toLocaleDateString('id-ID'),
    };

    const { data, error } = await supabase
      .from('anggota')
      .insert([newAnggota])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0], message: 'Anggota berhasil ditambahkan' });
  } catch (error) {
    console.error('Anggota POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan anggota' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    const { error } = await supabase
      .from('anggota')
      .update({
        nama: body.nama,
        cabang_olahraga: body.cabang_olahraga,
        tanggal_lahir: body.tanggal_lahir,
        jenis_kelamin: body.jenis_kelamin,
        alamat: body.alamat,
        no_hp: body.no_hp,
        email: body.email,
        kategori: body.kategori,
        status: body.status,
      })
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Anggota berhasil diperbarui' });
  } catch (error) {
    console.error('Anggota PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui anggota' }, { status: 500 });
  }
}
