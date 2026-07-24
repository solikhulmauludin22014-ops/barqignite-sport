import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Kas } from '@/types';

function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const jenis = searchParams.get('jenis');
    const cabang = searchParams.get('cabang');

    let query = supabase.from('kas').select('*').order('created_at', { ascending: true });

    if (jenis) query = query.eq('jenis', jenis);
    if (cabang) query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await query;

    if (error) throw error;

    let filteredData = data;
    if (bulan) filteredData = filteredData.filter((k) => new Date(k.tanggal).getMonth() + 1 === parseInt(bulan));
    if (tahun) filteredData = filteredData.filter((k) => new Date(k.tanggal).getFullYear() === parseInt(tahun));

    return NextResponse.json({ success: true, data: filteredData });
  } catch (error) {
    console.error('Kas GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data kas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data: allKas, error: kasError } = await supabase
      .from('kas')
      .select('saldo_berjalan')
      .order('created_at', { ascending: false })
      .limit(1);

    if (kasError) throw kasError;

    const lastSaldo = (allKas && allKas.length > 0) ? parseFloat(allKas[0].saldo_berjalan || '0') : 0;
    const nominal = parseFloat(body.nominal);
    const newSaldo = body.jenis === 'Masuk' ? lastSaldo + nominal : lastSaldo - nominal;

    const newKas: Kas = {
      id: generateId('KAS'),
      tanggal: body.tanggal,
      cabang_olahraga: body.cabang_olahraga || '',
      jenis: body.jenis,
      sumber: body.sumber || 'Manual',
      kategori: body.kategori,
      keterangan: body.keterangan,
      nominal: String(nominal),
      saldo_berjalan: String(newSaldo),
    };

    const { error: insertError } = await supabase
      .from('kas')
      .insert([newKas]);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, data: newKas, message: 'Transaksi kas berhasil dicatat' });
  } catch (error) {
    console.error('Kas POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mencatat transaksi kas' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    const { error: updateError } = await supabase
      .from('kas')
      .update({
        tanggal: body.tanggal,
        cabang_olahraga: body.cabang_olahraga || '',
        jenis: body.jenis,
        sumber: body.sumber || 'Manual',
        kategori: body.kategori,
        keterangan: body.keterangan,
        nominal: body.nominal,
        saldo_berjalan: body.saldo_berjalan,
      })
      .eq('id', body.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Transaksi berhasil diperbarui' });
  } catch (error) {
    console.error('Kas PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui transaksi' }, { status: 500 });
  }
}
