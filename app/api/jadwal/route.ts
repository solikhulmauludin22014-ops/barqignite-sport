import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Jadwal } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get('jenis');
    const kategori = searchParams.get('kategori');
    const cabang = searchParams.get('cabang');

    let query = supabase.from('jadwal').select('*');

    if (jenis) query = query.eq('jenis', jenis);
    if (kategori) query = query.eq('kategori', kategori);
    if (cabang) query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await query;

    if (error) throw error;

    const hariOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    data.sort((a, b) => hariOrder.indexOf(a.hari) - hariOrder.indexOf(b.hari));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Jadwal GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil jadwal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const newJadwal: Jadwal = {
      id: generateId('JDW'),
      cabang_olahraga: body.cabang_olahraga,
      hari: body.hari,
      jam_mulai: body.jam_mulai,
      jam_selesai: body.jam_selesai,
      kategori: body.kategori,
      lokasi: body.lokasi,
      jenis: body.jenis,
      tanggal: body.tanggal || '',
      keterangan: body.keterangan || '',
    };

    const { data, error } = await supabase
      .from('jadwal')
      .insert([newJadwal])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0], message: 'Jadwal berhasil ditambahkan' });
  } catch (error) {
    console.error('Jadwal POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan jadwal' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { error } = await supabase
      .from('jadwal')
      .update({
        cabang_olahraga: body.cabang_olahraga,
        hari: body.hari,
        jam_mulai: body.jam_mulai,
        jam_selesai: body.jam_selesai,
        kategori: body.kategori,
        lokasi: body.lokasi,
        jenis: body.jenis,
        tanggal: body.tanggal || '',
        keterangan: body.keterangan || '',
      })
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Jadwal berhasil diperbarui' });
  } catch (error) {
    console.error('Jadwal PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui jadwal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const { error } = await supabase.from('jadwal').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data jadwal berhasil dihapus' });
  } catch (error) {
    console.error('Jadwal DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus jadwal' }, { status: 500 });
  }
}
