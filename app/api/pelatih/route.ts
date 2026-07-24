import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Pelatih } from '@/types';

function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cabang = searchParams.get('cabang');

    let query = supabase.from('pelatih').select('*');
    if (cabang) query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await query.order('urutan', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Pelatih GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pelatih' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPelatih: Pelatih = {
      id: generateId('PLT'),
      nama: body.nama,
      cabang_olahraga: body.cabang_olahraga,
      foto_url: body.foto_url || '',
      spesialisasi: body.spesialisasi,
      sertifikasi: body.sertifikasi || '',
      pengalaman: body.pengalaman,
      urutan: body.urutan || 99,
    };

    const { data, error } = await supabase
      .from('pelatih')
      .insert([newPelatih])
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Pelatih berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Pelatih POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan pelatih' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    const { error } = await supabase
      .from('pelatih')
      .update({
        nama: body.nama,
        cabang_olahraga: body.cabang_olahraga,
        foto_url: body.foto_url || '',
        spesialisasi: body.spesialisasi,
        sertifikasi: body.sertifikasi || '',
        pengalaman: body.pengalaman,
        urutan: body.urutan || 99,
      })
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Pelatih berhasil diperbarui' });
  } catch (error) {
    console.error('Pelatih PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui pelatih' },
      { status: 500 }
    );
  }
}
