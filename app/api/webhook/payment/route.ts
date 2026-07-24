import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import {
  verifyMidtransSignature, parseMidtransStatus, parseMidtransPaymentMethod,
} from '@/lib/midtrans';
import type { LogTransaksiGateway } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Webhook Midtrans] Payload diterima:', JSON.stringify(body).slice(0, 300));

    // ===== 1. VERIFIKASI SIGNATURE =====
    const isValid = verifyMidtransSignature({
      order_id: body.order_id,
      status_code: body.status_code,
      gross_amount: body.gross_amount,
      server_key: process.env.MIDTRANS_SERVER_KEY!,
      signature_key: body.signature_key,
    });

    if (!isValid) {
      console.error('[Webhook] Signature tidak valid!');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 });
    }

    // ===== 2. PARSE STATUS =====
    const gatewayStatus = parseMidtransStatus(
      body.transaction_status,
      body.fraud_status
    );
    const paymentMethod = parseMidtransPaymentMethod(body.payment_type);

    // ===== 3. LOG TRANSAKSI =====
    const logEntry: LogTransaksiGateway = {
      id: generateId('LOG'),
      order_id: body.order_id,
      id_anggota: body.order_id.split('-')[2] || '',
      nominal: body.gross_amount,
      metode: paymentMethod === 'VA Bank' ? 'VA Bank' : 'QRIS',
      status: gatewayStatus,
      waktu_transaksi: body.transaction_time || new Date().toISOString(),
      raw_payload_ringkas: JSON.stringify({
        order_id: body.order_id,
        transaction_status: body.transaction_status,
        payment_type: body.payment_type,
        gross_amount: body.gross_amount,
      }),
    };

    await supabase.from('log_transaksi_gateway').insert([logEntry]);

    // ===== 4. UPDATE PEMBAYARAN SPP JIKA SUKSES =====
    if (gatewayStatus === 'Success') {
      const { data: sppData, error: sppError } = await supabase
        .from('pembayaran_spp')
        .select('*')
        .eq('payment_gateway_id', body.order_id)
        .single();

      if (sppData && !sppError) {
        await supabase
          .from('pembayaran_spp')
          .update({
            status_bayar: 'Lunas',
            tanggal_bayar: new Date().toLocaleDateString('id-ID'),
            metode_bayar: paymentMethod,
            status_gateway: 'Success',
          })
          .eq('id', sppData.id);

        // ===== 5. CATAT KAS MASUK OTOMATIS =====
        const { data: allKas } = await supabase
          .from('kas')
          .select('saldo_berjalan')
          .order('created_at', { ascending: false })
          .limit(1);

        const lastSaldo = (allKas && allKas.length > 0)
          ? parseFloat(allKas[0].saldo_berjalan || '0')
          : 0;
        const nominal = parseFloat(sppData.nominal || '0');
        const newSaldo = lastSaldo + nominal;

        await supabase.from('kas').insert([{
          id: generateId('KAS'),
          tanggal: new Date().toLocaleDateString('id-ID'),
          cabang_olahraga: sppData.cabang_olahraga,
          jenis: 'Masuk',
          sumber: 'Gateway',
          kategori: 'SPP',
          keterangan: `Pembayaran SPP ${sppData.nama_anggota} — ${sppData.bulan}/${sppData.tahun} via ${paymentMethod}`,
          nominal: String(nominal),
          saldo_berjalan: String(newSaldo),
        }]);

        console.log(`[Webhook] SPP ${sppData.id_anggota} bulan ${sppData.bulan}/${sppData.tahun} → Lunas`);
      } else {
        console.warn(`[Webhook] Order ID ${body.order_id} tidak ditemukan di tabel SPP`);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
