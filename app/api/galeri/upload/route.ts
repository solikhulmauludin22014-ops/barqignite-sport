import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { KATEGORI, type KategoriType } from '@/lib/constants';
import { formatErrorMessage, withTimeout } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BUCKET = 'galeri-dokumentasi';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
// Gunakan KATEGORI constants — single source of truth
const ALLOWED_KATEGORI: KategoriType[] = [KATEGORI.BASKET, KATEGORI.RENANG];
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const judul = formData.get('judul') as string | null;
    const kategori = formData.get('kategori') as string | null;
    const tanggal = formData.get('tanggal') as string | null;
    const is_featured = formData.get('is_featured') === 'true';
    const urutan = parseInt(formData.get('urutan') as string || '0', 10);

    // ─── Validasi input ────────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { error: 'File foto wajib disertakan.' },
        { status: 400 }
      );
    }

    if (!judul?.trim()) {
      return NextResponse.json(
        { error: 'Judul foto wajib diisi.' },
        { status: 400 }
      );
    }

    if (!kategori || !(ALLOWED_KATEGORI as string[]).includes(kategori)) {
      console.error(`[API /galeri/upload] Kategori tidak valid: "${kategori}". Harus salah satu dari: ${ALLOWED_KATEGORI.join(', ')}`);
      return NextResponse.json(
        { error: `Kategori tidak valid: "${kategori}". Harus "${KATEGORI.BASKET}" atau "${KATEGORI.RENANG}" (huruf kapital di awal, tanpa spasi).` },
        { status: 400 }
      );
    }

    // Log request masuk untuk debugging
    console.log(`[API /galeri/upload] Request: kategori="${kategori}" | judul="${judul?.trim()}"`);

    // Validasi ukuran file
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        { error: `Ukuran file (${sizeMB} MB) melebihi batas maksimum 10 MB.` },
        { status: 400 }
      );
    }

    // Validasi MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Format file tidak didukung (${file.type}). Gunakan JPEG, PNG, atau WebP.` },
        { status: 400 }
      );
    }

    // ─── Upload ke Supabase Storage ───────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await withTimeout(
      supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        }),
      15000 // 15 detik timeout untuk upload file
    );

    if (uploadError) {
      console.error('[API /galeri/upload] Storage error:', uploadError);

      // Pesan error yang spesifik
      if (uploadError.message.toLowerCase().includes('bucket not found')) {
        return NextResponse.json(
          {
            error:
              'Storage bucket "galeri-dokumentasi" belum dibuat. ' +
              'Jalankan script SQL di supabase/migrations/20260819_storage_bucket_fix.sql ' +
              'di Supabase SQL Editor terlebih dahulu.',
          },
          { status: 503 }
        );
      }

      if (uploadError.message.toLowerCase().includes('duplicate') || uploadError.message.toLowerCase().includes('already exists')) {
        return NextResponse.json(
          { error: 'File dengan nama yang sama sudah ada. Coba upload ulang.' },
          { status: 409 }
        );
      }

      if (uploadError.message.toLowerCase().includes('policy') || uploadError.message.toLowerCase().includes('permission')) {
        return NextResponse.json(
          { error: 'Tidak ada izin untuk upload. Pastikan SUPABASE_SERVICE_ROLE_KEY sudah diset di env.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Upload gagal: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ─── Ambil public URL ──────────────────────────────────────────
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    const foto_url = urlData.publicUrl;

    // ─── Insert record ke database ─────────────────────────────────
    const { data: record, error: dbError } = await withTimeout(
      supabase
        .from('galeri_dokumentasi')
        .insert([
          {
            judul: judul.trim(),
            kategori,
            foto_url,
            tanggal: tanggal || null,
            is_featured,
            urutan: isNaN(urutan) ? 0 : urutan,
          },
        ])
        .select()
        .single()
    );

    if (dbError) {
      console.error('[API /galeri/upload] DB error:', dbError);
      // File sudah terupload tapi DB gagal — hapus file untuk konsistensi
      await supabase.storage.from(BUCKET).remove([uploadData.path]);
      return NextResponse.json(
        { error: `Gagal menyimpan data ke database: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log(`[API /galeri/upload] ✅ Berhasil disimpan: id=${record?.id} | kategori="${record?.kategori}" | judul="${record?.judul}"`);
    return NextResponse.json({ data: record, foto_url }, { status: 201 });
  } catch (err) {
    const msg = formatErrorMessage(err, 'Terjadi kesalahan saat upload galeri');
    console.error('[API /galeri/upload] Unexpected error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
