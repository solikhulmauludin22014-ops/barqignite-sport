import { NextResponse } from 'next/server';

/**
 * Webhook payment endpoint — DINONAKTIFKAN
 * 
 * Sistem pembayaran telah dialihkan ke pencatatan manual (cash/transfer
 * langsung ke admin). Payment gateway (Midtrans) tidak lagi digunakan.
 * 
 * Endpoint ini dipertahankan sebagai stub supaya tidak ada 404 error
 * jika ada request lama yang masih masuk ke sini.
 */

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Payment gateway tidak digunakan. Sistem pembayaran sekarang manual.' },
    { status: 410 } // 410 Gone — sengaja dihentikan
  );
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint dinonaktifkan — sistem manual.' });
}
