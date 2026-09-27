import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/keepalive
 *
 * Endpoint keep-alive untuk mencegah Supabase free-tier auto-pause.
 * Supabase akan pause project yang tidak ada aktivitas API selama ±7 hari.
 * Endpoint ini melakukan query ringan (SELECT 1 row dari tabel kecil) untuk
 * menjaga proyek tetap aktif.
 *
 * Dijadwalkan otomatis via Vercel Cron Job setiap 3 hari (lihat vercel.json).
 * Bisa juga dipanggil manual untuk health check.
 */
export async function GET() {
  const startedAt = new Date().toISOString();

  try {
    // Query ringan — ambil 1 row dari tabel `anggota` hanya untuk membuktikan
    // koneksi database masih hidup tanpa overhead besar.
    const { data, error } = await supabase
      .from('anggota')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Keep-alive] Supabase error:', error.message);
      return NextResponse.json(
        {
          ok: false,
          checkedAt: startedAt,
          error: error.message,
          hint: 'Database mungkin sedang resume dari pause — coba lagi dalam 1-2 menit.',
        },
        { status: 503 }
      );
    }

    console.log(`[Keep-alive] ✅ Supabase aktif — ${startedAt}`);
    return NextResponse.json({
      ok: true,
      checkedAt: startedAt,
      message: 'Supabase aktif. Keep-alive berhasil.',
      rowsFound: data?.length ?? 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Keep-alive] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, checkedAt: startedAt, error: msg },
      { status: 500 }
    );
  }
}
