import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Presensi } from '@/types';
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
    const tanggal = searchParams.get('tanggal');
    const id_anggota = searchParams.get('id_anggota');
    const kategori = searchParams.get('kategori');
    const cabang = searchParams.get('cabang');
    const status = searchParams.get('status');   // 'Menunggu Konfirmasi' | 'Hadir' | dll
    const sesi = searchParams.get('sesi');

    let query = supabase
      .from('presensi')
      .select('*')
      .order('waktu_submit', { ascending: false });

    if (id_anggota) {
      // Validasi apakah anggota tersebut terdaftar dan aktif
      const { data: anggota, error: errAnggota } = await supabase
        .from('anggota')
        .select('id, status')
        .eq('id', id_anggota)
        .single();

      if (errAnggota || !anggota || anggota.status !== 'Aktif') {
        return NextResponse.json({ 
          success: false, 
          error: 'ID Anggota tidak terdaftar atau tidak aktif.' 
        }, { status: 404 });
      }
      
      query = query.eq('id_anggota', id_anggota);
    }
    
    if (tanggal) query = query.eq('tanggal', tanggal);
    if (kategori) query = query.eq('kategori', kategori);
    if (cabang) query = query.eq('cabang_olahraga', cabang);
    if (status) query = query.eq('status_hadir', status);
    if (sesi) query = query.eq('sesi', sesi);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Presensi GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data presensi' }, { status: 500 });
  }
}

// POST: Admin input presensi manual (langsung Hadir, untuk yang lupa submit sendiri)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tanggal, sesi, items } = body;

    const now = new Date().toISOString();

    const presensiData = items.map((item: any) => ({
      id: generateId('PRE'),
      tanggal,
      cabang_olahraga: item.cabang_olahraga || '',
      id_anggota: item.id_anggota,
      nama_anggota: item.nama_anggota,
      kategori: item.kategori,
      status_hadir: item.status_hadir,
      sesi,
      waktu_submit: now,
    }));

    const { error } = await supabase
      .from('presensi')
      .insert(presensiData);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `${items.length} presensi berhasil disimpan` });
  } catch (error) {
    console.error('Presensi POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan presensi' }, { status: 500 });
  }
}

// PUT: Admin konfirmasi / update status presensi (ACC atau Tolak)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Bulk update (admin ACC / Tolak banyak sekaligus)
    if (body.ids && Array.isArray(body.ids) && body.status_hadir) {
      const { error } = await supabase
        .from('presensi')
        .update({ status_hadir: body.status_hadir })
        .in('id', body.ids);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `${body.ids.length} presensi berhasil diperbarui` });
    }

    // Single update
    const { error } = await supabase
      .from('presensi')
      .update({
        tanggal: body.tanggal,
        cabang_olahraga: body.cabang_olahraga,
        id_anggota: body.id_anggota,
        nama_anggota: body.nama_anggota,
        kategori: body.kategori,
        status_hadir: body.status_hadir,
        sesi: body.sesi,
      })
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Presensi berhasil diperbarui' });
  } catch (error) {
    console.error('Presensi PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui presensi' }, { status: 500 });
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

    const { error } = await supabase.from('presensi').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data presensi berhasil dihapus' });
  } catch (error) {
    console.error('Presensi DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus presensi' }, { status: 500 });
  }
}
