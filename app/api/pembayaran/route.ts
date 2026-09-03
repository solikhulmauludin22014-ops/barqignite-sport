import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import type { PembayaranSPP } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: ambil data pembayaran — hanya untuk admin (session required)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Akses hanya untuk admin.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const id_anggota = searchParams.get('id_anggota');
    const status = searchParams.get('status');
    const cabang = searchParams.get('cabang');

    let query = supabase
      .from('pembayaran_spp')
      .select('*')
      .order('tanggal_bayar', { ascending: false });

    if (bulan) query = query.eq('bulan', bulan);
    if (tahun) query = query.eq('tahun', tahun);
    if (id_anggota) query = query.eq('id_anggota', id_anggota);
    if (status) query = query.eq('status_bayar', status);
    if (cabang) query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Pembayaran GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data pembayaran' }, { status: 500 });
  }
}

// Helper: generate nomor kwitansi berurut (KW-YYYY-NNNN)
async function generateNomorKwitansi(): Promise<string> {
  const tahun = new Date().getFullYear();
  
  // Atomic increment menggunakan Supabase RPC atau fallback manual
  const { data: setting, error } = await supabase
    .from('pengaturan_pembayaran')
    .select('nomor_kwitansi_terakhir')
    .eq('id', 'SETTING-001')
    .single();

  if (error && error.code !== 'PGRST116') {
    // Jika tabel belum ada kolom, fallback ke timestamp
    return `KW-${tahun}-${Date.now().toString().slice(-4)}`;
  }

  const nomorTerakhir = (setting?.nomor_kwitansi_terakhir || 0) + 1;

  // Update counter
  await supabase
    .from('pengaturan_pembayaran')
    .update({ nomor_kwitansi_terakhir: nomorTerakhir })
    .eq('id', 'SETTING-001');

  const nomorFormatted = String(nomorTerakhir).padStart(4, '0');
  return `KW-${tahun}-${nomorFormatted}`;
}

// POST: tambah data pembayaran manual (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Generate nomor kwitansi jika status langsung Lunas
    let nomor_kwitansi = '';
    if (body.status_bayar === 'Lunas') {
      nomor_kwitansi = await generateNomorKwitansi();
    }

    const newSPP: PembayaranSPP = {
      id: generateId('SPP'),
      id_anggota: body.id_anggota,
      nama_anggota: body.nama_anggota,
      cabang_olahraga: body.cabang_olahraga,
      bulan: body.bulan,
      tahun: body.tahun,
      nominal: body.nominal,
      status_bayar: body.status_bayar || 'Lunas',
      tanggal_bayar: body.tanggal_bayar || new Date().toISOString().split('T')[0],
      metode_bayar: body.metode_bayar || 'Cash',
      nomor_kwitansi,
      catatan: body.catatan || '',
    };

    const { error } = await supabase
      .from('pembayaran_spp')
      .insert([newSPP]);

    if (error) throw error;

    // Catat ke Kas otomatis saat status Lunas
    if (newSPP.status_bayar === 'Lunas') {
      const { data: allKas } = await supabase
        .from('kas')
        .select('saldo_berjalan')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSaldo = (allKas && allKas.length > 0) ? parseFloat(allKas[0].saldo_berjalan || '0') : 0;
      const nominal = parseFloat(newSPP.nominal || '0');

      await supabase.from('kas').insert([{
        id: generateId('KAS'),
        tanggal: newSPP.tanggal_bayar,
        cabang_olahraga: newSPP.cabang_olahraga,
        jenis: 'Masuk',
        sumber: 'Manual',
        kategori: 'SPP',
        keterangan: `SPP ${newSPP.nama_anggota} ${newSPP.bulan}/${newSPP.tahun} (${newSPP.nomor_kwitansi})`,
        nominal: String(nominal),
        saldo_berjalan: String(lastSaldo + nominal),
      }]);
    }

    return NextResponse.json({
      success: true,
      data: newSPP,
      message: `Pembayaran berhasil dicatat. ${nomor_kwitansi ? `Nomor kwitansi: ${nomor_kwitansi}` : ''}`,
    });
  } catch (error) {
    console.error('Pembayaran POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan data pembayaran' }, { status: 500 });
  }
}

// PUT: update data pembayaran (admin only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Cek apakah sudah punya nomor kwitansi, jika belum dan status Lunas → generate
    let nomor_kwitansi = body.nomor_kwitansi || '';
    if (body.status_bayar === 'Lunas' && !nomor_kwitansi) {
      nomor_kwitansi = await generateNomorKwitansi();
    }

    const { error: updateError } = await supabase
      .from('pembayaran_spp')
      .update({
        id_anggota: body.id_anggota,
        nama_anggota: body.nama_anggota,
        cabang_olahraga: body.cabang_olahraga,
        bulan: body.bulan,
        tahun: body.tahun,
        nominal: body.nominal,
        status_bayar: body.status_bayar,
        tanggal_bayar: body.tanggal_bayar || new Date().toISOString().split('T')[0],
        metode_bayar: body.metode_bayar || 'Cash',
        nomor_kwitansi,
        catatan: body.catatan || '',
      })
      .eq('id', body.id);

    if (updateError) throw updateError;

    // Jika ditandai Lunas secara manual, catat ke Kas
    if (body.status_bayar === 'Lunas') {
      const { data: allKas } = await supabase
        .from('kas')
        .select('saldo_berjalan')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSaldo = (allKas && allKas.length > 0) ? parseFloat(allKas[0].saldo_berjalan || '0') : 0;
      const nominal = parseFloat(body.nominal || '0');

      await supabase.from('kas').insert([{
        id: generateId('KAS'),
        tanggal: body.tanggal_bayar || new Date().toISOString().split('T')[0],
        cabang_olahraga: body.cabang_olahraga || '',
        jenis: 'Masuk',
        sumber: 'Manual',
        kategori: 'SPP',
        keterangan: `SPP Manual ${body.nama_anggota} ${body.bulan}/${body.tahun} (${nomor_kwitansi || 'KW-LAMA'})`,
        nominal: String(nominal),
        saldo_berjalan: String(lastSaldo + nominal),
      }]);
    }

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil diperbarui', nomor_kwitansi });
  } catch (error) {
    console.error('Pembayaran PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui pembayaran' }, { status: 500 });
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

    const { error } = await supabase.from('pembayaran_spp').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data pembayaran berhasil dihapus' });
  } catch (error) {
    console.error('Pembayaran DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus pembayaran' }, { status: 500 });
  }
}
