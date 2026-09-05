import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Pendaftar, Anggota } from '@/types';
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
    const status = searchParams.get('status');

    let query = supabase.from('pendaftar').select('*');

    if (status) query = query.eq('status_pendaftaran', status);

    const { data, error } = await query.order('tanggal_daftar', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Pendaftar GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data pendaftar' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const umur = Number(body.umur) || 0;

    // Hitung kategori otomatis berdasarkan umur dan cabang olahraga
    let calculatedKategori = '';
    if (body.cabang_olahraga === 'Basket') {
      if (umur <= 8) calculatedKategori = 'Mini (5-8 tahun)';
      else if (umur <= 12) calculatedKategori = 'Pemula (9-12 tahun)';
      else if (umur <= 17) calculatedKategori = 'Junior (13-17 tahun)';
      else calculatedKategori = 'Senior (18+ tahun)';
    } else { // Renang
      if (umur <= 8) calculatedKategori = 'Beginner (5-8 tahun)';
      else if (umur <= 13) calculatedKategori = 'Intermediate (9-13 tahun)';
      else if (umur <= 17) calculatedKategori = 'Advanced (14-18 tahun)'; // Note: assuming < 18 is Advanced to avoid overlap
      else calculatedKategori = 'Dewasa (18+ tahun)';
    }

    const newPendaftar: Pendaftar = {
      id: generateId('PDF'),
      nama: body.nama,
      cabang_olahraga: body.cabang_olahraga,
      tanggal_lahir: body.tanggal_lahir,
      jenis_kelamin: body.jenis_kelamin,
      alamat: body.alamat,
      no_hp: body.no_hp,
      email: body.email || '',
      nama_wali: body.nama_wali || '',
      asal_sekolah: body.asal_sekolah || '',
      kelas: body.kelas || '',
      kategori: calculatedKategori,
      status_pendaftaran: 'Pending',
      tanggal_daftar: new Date().toLocaleDateString('id-ID'),
    };

    const { data, error } = await supabase
      .from('pendaftar')
      .insert([newPendaftar])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0], message: 'Pendaftaran berhasil dikirim!' });
  } catch (error) {
    console.error('Pendaftar POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal menyimpan pendaftaran', 
      details: error instanceof Error ? error.message : JSON.stringify(error) 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    const { data: pendaftar, error: getError } = await supabase
      .from('pendaftar')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !pendaftar) {
      return NextResponse.json({ success: false, error: 'Pendaftar tidak ditemukan' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'Diterima' : 'Ditolak';

    const { error: updateError } = await supabase
      .from('pendaftar')
      .update({ status_pendaftaran: newStatus })
      .eq('id', id);

    if (updateError) throw updateError;

    if (action === 'approve') {
      const newAnggota: Anggota = {
        id: generateId('AGT'),
        nama: pendaftar.nama,
        cabang_olahraga: pendaftar.cabang_olahraga,
        tanggal_lahir: pendaftar.tanggal_lahir,
        jenis_kelamin: pendaftar.jenis_kelamin,
        alamat: pendaftar.alamat,
        no_hp: pendaftar.no_hp,
        email: pendaftar.email,
        asal_sekolah: pendaftar.asal_sekolah,
        kelas: pendaftar.kelas,
        kategori: pendaftar.kategori,
        status: 'Aktif',
        tanggal_gabung: new Date().toLocaleDateString('id-ID'),
      };
      const { error: insertError } = await supabase
        .from('anggota')
        .insert([newAnggota]);
      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Pendaftar berhasil diterima dan ditambahkan ke anggota' : 'Pendaftar ditolak',
    });
  } catch (error) {
    console.error('Pendaftar PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui status pendaftar' }, { status: 500 });
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

    const { error } = await supabase.from('pendaftar').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data pendaftar berhasil dihapus' });
  } catch (error) {
    console.error('Pendaftar DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus pendaftar' }, { status: 500 });
  }
}
