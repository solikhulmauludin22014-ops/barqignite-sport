import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BUCKET = 'pelatih-photos';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('foto') as File | null;
    const oldPath = formData.get('old_path') as string | null; // opsional: hapus foto lama

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'File foto wajib diisi' }, { status: 400 });
    }

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.',
      }, { status: 400 });
    }

    // Validasi ukuran
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({
        success: false,
        error: 'Ukuran file maksimal 10MB.',
      }, { status: 400 });
    }

    // Generate nama file unik
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `pelatih-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload ke Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Cek apakah bucket tidak ditemukan
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
        return NextResponse.json({
          success: false,
          error: `Bucket storage "${BUCKET}" tidak ditemukan. Silakan buat bucket di Supabase Dashboard > Storage terlebih dahulu.`,
        }, { status: 500 });
      }
      return NextResponse.json({ success: false, error: `Gagal upload: ${uploadError.message}` }, { status: 500 });
    }

    // Ambil public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Hapus foto lama jika ada (best-effort, tidak gagalkan proses)
    if (oldPath) {
      try {
        // Ekstrak nama file dari URL lama
        const oldFileName = oldPath.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from(BUCKET).remove([oldFileName]);
        }
      } catch (e) {
        console.warn('Gagal hapus foto lama (diabaikan):', e);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path,
    });
  } catch (err) {
    console.error('Upload foto pelatih error:', err);
    return NextResponse.json({ success: false, error: 'Gagal upload foto' }, { status: 500 });
  }
}
