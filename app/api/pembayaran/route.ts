import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Helper: surface Supabase error detail ──────────────────────────────────
function supabaseErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as Record<string, unknown>;
  // Supabase errors have .message, .details, .hint, .code
  const parts: string[] = [];
  if (e.code)    parts.push(`[${e.code}]`);
  if (e.message) parts.push(String(e.message));
  if (e.details) parts.push(`Detail: ${e.details}`);
  if (e.hint)    parts.push(`Hint: ${e.hint}`);
  return parts.join(' — ') || JSON.stringify(err);
}

// ─── Helper: generate nomor kwitansi berurut (KW-YYYY-NNNN) ─────────────────
async function generateNomorKwitansi(): Promise<{ nomor: string; error?: string }> {
  const tahun = new Date().getFullYear();

  const { data: setting, error: fetchErr } = await supabase
    .from('pengaturan_pembayaran')
    .select('nomor_kwitansi_terakhir')
    .eq('id', 'SETTING-001')
    .single();

  if (fetchErr && fetchErr.code !== 'PGRST116') {
    // Kolom mungkin belum ada (migration belum dijalankan) — fallback ke timestamp
    const fallback = `KW-${tahun}-${Date.now().toString().slice(-4)}`;
    return { nomor: fallback, error: `Counter tidak tersedia, pakai fallback: ${supabaseErrorMessage(fetchErr)}` };
  }

  const nomorTerakhir = ((setting?.nomor_kwitansi_terakhir as number) || 0) + 1;

  const { error: updateErr } = await supabase
    .from('pengaturan_pembayaran')
    .update({ nomor_kwitansi_terakhir: nomorTerakhir })
    .eq('id', 'SETTING-001');

  if (updateErr) {
    const fallback = `KW-${tahun}-${Date.now().toString().slice(-4)}`;
    return { nomor: fallback, error: `Gagal update counter: ${supabaseErrorMessage(updateErr)}` };
  }

  return { nomor: `KW-${tahun}-${String(nomorTerakhir).padStart(4, '0')}` };
}

// ─── GET: ambil data pembayaran (admin only) ─────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Hanya admin yang bisa akses.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bulan     = searchParams.get('bulan');
    const tahun     = searchParams.get('tahun');
    const id_anggota = searchParams.get('id_anggota');
    const status    = searchParams.get('status');
    const cabang    = searchParams.get('cabang');

    let query = supabase
      .from('pembayaran_spp')
      .select('*')
      .order('tanggal_bayar', { ascending: false })
      .order('created_at',   { ascending: false });

    if (bulan)      query = query.eq('bulan', bulan);
    if (tahun)      query = query.eq('tahun', tahun);
    if (id_anggota) query = query.eq('id_anggota', id_anggota);
    if (status)     query = query.eq('status_bayar', status);
    if (cabang)     query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const msg = supabaseErrorMessage(err);
    console.error('Pembayaran GET error:', msg);
    return NextResponse.json({ success: false, error: `Gagal mengambil data: ${msg}` }, { status: 500 });
  }
}

// ─── POST: tambah pembayaran manual (admin only) ─────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validasi field wajib
    if (!body.id_anggota)     return NextResponse.json({ success: false, error: 'id_anggota wajib diisi' }, { status: 400 });
    if (!body.nama_anggota)   return NextResponse.json({ success: false, error: 'nama_anggota wajib diisi' }, { status: 400 });
    if (!body.cabang_olahraga) return NextResponse.json({ success: false, error: 'cabang_olahraga wajib diisi' }, { status: 400 });
    if (!body.bulan)          return NextResponse.json({ success: false, error: 'bulan wajib diisi' }, { status: 400 });
    if (!body.tahun)          return NextResponse.json({ success: false, error: 'tahun wajib diisi' }, { status: 400 });
    if (!body.nominal)        return NextResponse.json({ success: false, error: 'nominal wajib diisi' }, { status: 400 });

    // Generate nomor kwitansi
    let nomor_kwitansi = '';
    let kwitansiWarning = '';
    if ((body.status_bayar || 'Lunas') === 'Lunas') {
      const { nomor, error: kwErr } = await generateNomorKwitansi();
      nomor_kwitansi = nomor;
      if (kwErr) kwitansiWarning = kwErr;
    }

    // Insert — sertakan semua kolom termasuk legacy gateway fields (bisa kosong)
    const { data: inserted, error: insertErr } = await supabase
      .from('pembayaran_spp')
      .insert([{
        id:                 generateId('SPP'),
        id_anggota:         body.id_anggota,
        nama_anggota:       body.nama_anggota,
        cabang_olahraga:    body.cabang_olahraga,
        bulan:              String(body.bulan),
        tahun:              String(body.tahun),
        nominal:            String(body.nominal),
        status_bayar:       body.status_bayar || 'Lunas',
        tanggal_bayar:      body.tanggal_bayar || new Date().toISOString().split('T')[0],
        metode_bayar:       body.metode_bayar || 'Cash',
        nomor_kwitansi,
        catatan:            body.catatan || '',
        // Legacy gateway columns — kosong untuk entry manual
        payment_gateway_id: '',
        status_gateway:     '',
      }])
      .select()
      .single();

    if (insertErr) {
      const detail = supabaseErrorMessage(insertErr);
      console.error('Pembayaran POST insert error:', detail);
      return NextResponse.json({
        success: false,
        error: `Gagal menyimpan pembayaran: ${detail}`,
      }, { status: 500 });
    }

    // Catat ke Kas otomatis saat status Lunas
    const statusBayar = body.status_bayar || 'Lunas';
    if (statusBayar === 'Lunas') {
      const { data: allKas } = await supabase
        .from('kas')
        .select('saldo_berjalan')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSaldo = (allKas && allKas.length > 0) ? parseFloat(String(allKas[0].saldo_berjalan || '0')) : 0;
      const nominal   = parseFloat(String(body.nominal || '0'));

      const { error: kasErr } = await supabase.from('kas').insert([{
        id:             generateId('KAS'),
        tanggal:        body.tanggal_bayar || new Date().toISOString().split('T')[0],
        cabang_olahraga: body.cabang_olahraga,
        jenis:          'Masuk',
        sumber:         'Manual',
        kategori:       'SPP',
        keterangan:     `SPP ${body.nama_anggota} ${body.bulan}/${body.tahun}${nomor_kwitansi ? ` (${nomor_kwitansi})` : ''}`,
        nominal:        String(nominal),
        saldo_berjalan: String(lastSaldo + nominal),
      }]);

      if (kasErr) {
        // Kas gagal bukan critical — pembayaran sudah tersimpan, cukup log
        console.error('Kas insert warning:', supabaseErrorMessage(kasErr));
      }
    }

    return NextResponse.json({
      success: true,
      data: inserted,
      message: `Pembayaran berhasil dicatat.${nomor_kwitansi ? ` No. Kwitansi: ${nomor_kwitansi}` : ''}`,
      ...(kwitansiWarning && { warning: kwitansiWarning }),
    });
  } catch (err) {
    const msg = supabaseErrorMessage(err);
    console.error('Pembayaran POST error:', msg);
    return NextResponse.json({ success: false, error: `Gagal menambahkan pembayaran: ${msg}` }, { status: 500 });
  }
}

// ─── PUT: update pembayaran (admin only) ─────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'id record wajib diisi untuk update' }, { status: 400 });

    // Ambil record lama untuk perbandingan status (cegah double-insert kas)
    const { data: existing, error: fetchErr } = await supabase
      .from('pembayaran_spp')
      .select('status_bayar, nomor_kwitansi')
      .eq('id', body.id)
      .single();

    if (fetchErr) {
      return NextResponse.json({ success: false, error: `Record tidak ditemukan: ${supabaseErrorMessage(fetchErr)}` }, { status: 404 });
    }

    // Pertahankan nomor kwitansi lama jika sudah ada, atau generate baru jika baru Lunas
    let nomor_kwitansi = (existing?.nomor_kwitansi as string) || body.nomor_kwitansi || '';
    if (body.status_bayar === 'Lunas' && !nomor_kwitansi) {
      const { nomor } = await generateNomorKwitansi();
      nomor_kwitansi = nomor;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('pembayaran_spp')
      .update({
        id_anggota:      body.id_anggota,
        nama_anggota:    body.nama_anggota,
        cabang_olahraga: body.cabang_olahraga,
        bulan:           String(body.bulan),
        tahun:           String(body.tahun),
        nominal:         String(body.nominal),
        status_bayar:    body.status_bayar,
        tanggal_bayar:   body.tanggal_bayar || new Date().toISOString().split('T')[0],
        metode_bayar:    body.metode_bayar || 'Cash',
        nomor_kwitansi,
        catatan:         body.catatan || '',
      })
      .eq('id', body.id)
      .select()
      .single();

    if (updateErr) {
      const detail = supabaseErrorMessage(updateErr);
      console.error('Pembayaran PUT update error:', detail);
      return NextResponse.json({ success: false, error: `Gagal update pembayaran: ${detail}` }, { status: 500 });
    }

    // Hanya catat ke Kas jika SEBELUMNYA BELUM Lunas dan sekarang jadi Lunas
    const wasLunas = existing?.status_bayar === 'Lunas';
    const nowLunas = body.status_bayar === 'Lunas';
    if (!wasLunas && nowLunas) {
      const { data: allKas } = await supabase
        .from('kas')
        .select('saldo_berjalan')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastSaldo = (allKas && allKas.length > 0) ? parseFloat(String(allKas[0].saldo_berjalan || '0')) : 0;
      const nominal   = parseFloat(String(body.nominal || '0'));

      await supabase.from('kas').insert([{
        id:             generateId('KAS'),
        tanggal:        body.tanggal_bayar || new Date().toISOString().split('T')[0],
        cabang_olahraga: body.cabang_olahraga || '',
        jenis:          'Masuk',
        sumber:         'Manual',
        kategori:       'SPP',
        keterangan:     `SPP Edit ${body.nama_anggota} ${body.bulan}/${body.tahun}${nomor_kwitansi ? ` (${nomor_kwitansi})` : ''}`,
        nominal:        String(nominal),
        saldo_berjalan: String(lastSaldo + nominal),
      }]);
    }

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil diperbarui', nomor_kwitansi, data: updated });
  } catch (err) {
    const msg = supabaseErrorMessage(err);
    console.error('Pembayaran PUT error:', msg);
    return NextResponse.json({ success: false, error: `Gagal memperbarui pembayaran: ${msg}` }, { status: 500 });
  }
}

// ─── DELETE: hapus pembayaran (admin only) ───────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Parameter id wajib diisi' }, { status: 400 });

    const { error } = await supabase.from('pembayaran_spp').delete().eq('id', id);
    if (error) {
      const detail = supabaseErrorMessage(error);
      return NextResponse.json({ success: false, error: `Gagal menghapus: ${detail}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Data pembayaran berhasil dihapus' });
  } catch (err) {
    const msg = supabaseErrorMessage(err);
    console.error('Pembayaran DELETE error:', msg);
    return NextResponse.json({ success: false, error: `Gagal menghapus pembayaran: ${msg}` }, { status: 500 });
  }
}
