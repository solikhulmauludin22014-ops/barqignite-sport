import { NextResponse } from 'next/server';
import { createSnapToken } from '@/lib/midtrans';
import { supabase } from '@/lib/supabase';
import { generateId, generateOrderId } from '@/lib/utils';
import type { PembayaranSPP } from '@/types';

// GET: ambil data pembayaran
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const id_anggota = searchParams.get('id_anggota');
    const status = searchParams.get('status');
    const cabang = searchParams.get('cabang');

    let query = supabase.from('pembayaran_spp').select('*');

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

// POST: buat tagihan baru atau generate link Midtrans
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_payment') {
      const orderId = generateOrderId('BARQ-SPP');
      
      const snapData = await createSnapToken({
        order_id: orderId,
        gross_amount: parseInt(body.nominal),
        customer_name: body.nama_anggota,
        customer_email: body.email || 'noreply@barqignite.com',
        customer_phone: body.no_hp || '08000000000',
        item_name: `SPP ${body.cabang_olahraga} - ${body.nama_anggota} - ${body.bulan}/${body.tahun}`,
        payment_type: body.payment_type || 'all',
      });

      const newSPP: PembayaranSPP = {
        id: generateId('SPP'),
        id_anggota: body.id_anggota,
        nama_anggota: body.nama_anggota,
        cabang_olahraga: body.cabang_olahraga,
        bulan: body.bulan,
        tahun: body.tahun,
        nominal: body.nominal,
        status_bayar: 'Belum',
        tanggal_bayar: '',
        metode_bayar: '',
        payment_gateway_id: orderId,
        status_gateway: 'Pending',
      };

      const { error } = await supabase
        .from('pembayaran_spp')
        .insert([newSPP]);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: { snap_token: snapData.token, redirect_url: snapData.redirect_url, order_id: orderId, spp_id: newSPP.id },
        message: 'Link pembayaran berhasil dibuat',
      });
    }

    // POST normal: tambah SPP manual
    const newSPP: PembayaranSPP = {
      id: generateId('SPP'),
      id_anggota: body.id_anggota,
      nama_anggota: body.nama_anggota,
      cabang_olahraga: body.cabang_olahraga,
      bulan: body.bulan,
      tahun: body.tahun,
      nominal: body.nominal,
      status_bayar: body.status_bayar || 'Belum',
      tanggal_bayar: body.tanggal_bayar || '',
      metode_bayar: body.metode_bayar || '',
      payment_gateway_id: '',
      status_gateway: '',
    };

    const { error } = await supabase
      .from('pembayaran_spp')
      .insert([newSPP]);

    if (error) throw error;

    return NextResponse.json({ success: true, data: newSPP, message: 'Data SPP berhasil ditambahkan' });
  } catch (error) {
    console.error('Pembayaran POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan data pembayaran' }, { status: 500 });
  }
}

// PUT: update status manual
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
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
        tanggal_bayar: body.tanggal_bayar || new Date().toLocaleDateString('id-ID'),
        metode_bayar: body.metode_bayar || 'Tunai',
        payment_gateway_id: body.payment_gateway_id || '',
        status_gateway: body.status_gateway || '',
      })
      .eq('id', body.id);

    if (updateError) throw updateError;

    // Jika ditandai Lunas secara manual, catat ke Kas
    if (body.status_bayar === 'Lunas' && !body.payment_gateway_id) {
      const { data: allKas, error: kasError } = await supabase
        .from('kas')
        .select('saldo_berjalan')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSaldo = (allKas && allKas.length > 0) ? parseFloat(allKas[0].saldo_berjalan || '0') : 0;
      const nominal = parseFloat(body.nominal || '0');
      
      const newKas = {
        id: generateId('KAS'),
        tanggal: new Date().toLocaleDateString('id-ID'),
        cabang_olahraga: body.cabang_olahraga || '',
        jenis: 'Masuk',
        sumber: 'Manual',
        kategori: 'SPP',
        keterangan: `SPP Manual ${body.nama_anggota} ${body.bulan}/${body.tahun}`,
        nominal: String(nominal),
        saldo_berjalan: String(lastSaldo + nominal),
      };

      const { error: insertKasError } = await supabase
        .from('kas')
        .insert([newKas]);
        
      if (insertKasError) throw insertKasError;
    }

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil diperbarui' });
  } catch (error) {
    console.error('Pembayaran PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui pembayaran' }, { status: 500 });
  }
}
