import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Pelatih } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatErrorMessage, withTimeout } from '@/lib/utils';


function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cabang = searchParams.get('cabang');

    let query = supabase.from('pelatih').select('*');
    if (cabang) query = query.eq('cabang_olahraga', cabang);

    const { data, error } = await withTimeout(
      query.order('urutan', { ascending: true })
    );

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gagal mengambil data pelatih';
    console.error('Pelatih GET error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validasi field wajib — berikan pesan spesifik
    if (!body.nama?.trim()) {
      return NextResponse.json({ success: false, error: 'Nama pelatih wajib diisi.' }, { status: 400 });
    }
    if (!body.spesialisasi?.trim()) {
      return NextResponse.json({ success: false, error: 'Spesialisasi wajib diisi.' }, { status: 400 });
    }
    if (!body.cabang_olahraga) {
      return NextResponse.json({ success: false, error: 'Cabang olahraga wajib dipilih (Basket atau Renang).' }, { status: 400 });
    }

    const newPelatih: Pelatih = {
      id: generateId('PLT'),
      nama: body.nama.trim(),
      cabang_olahraga: body.cabang_olahraga,
      foto_url: body.foto_url || '',
      spesialisasi: body.spesialisasi.trim(),
      sertifikasi: body.sertifikasi?.trim() || '',
      pengalaman: body.pengalaman?.trim() || '',
      urutan: typeof body.urutan === 'number' ? body.urutan : (parseInt(body.urutan) || 99),
    };

    const { data, error } = await withTimeout(
      supabase.from('pelatih').insert([newPelatih]).select()
    );

    if (error) {
      // Log detail lengkap error Supabase untuk diagnosa
      console.error('Pelatih POST Supabase error:', {
        message: error.message,
        code: (error as unknown as Record<string, unknown>).code,
        details: (error as unknown as Record<string, unknown>).details,
        hint: (error as unknown as Record<string, unknown>).hint,
      });
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Pelatih berhasil ditambahkan',
    });
  } catch (error) {
    const msg = formatErrorMessage(error, 'Gagal menambahkan pelatih');
    console.error('Pelatih POST error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID wajib disertakan untuk update.' }, { status: 400 });
    }
    if (!body.cabang_olahraga) {
      return NextResponse.json({ success: false, error: 'Cabang olahraga wajib dipilih.' }, { status: 400 });
    }

    const { data, error } = await withTimeout(
      supabase
        .from('pelatih')
        .update({
          nama: body.nama?.trim(),
          cabang_olahraga: body.cabang_olahraga,
          foto_url: body.foto_url || '',
          spesialisasi: body.spesialisasi?.trim(),
          sertifikasi: body.sertifikasi?.trim() || '',
          pengalaman: body.pengalaman?.trim() || '',
          urutan: typeof body.urutan === 'number' ? body.urutan : (parseInt(body.urutan) || 99),
        })
        .eq('id', body.id)
        .select()
    );

    if (error) {
      console.error('Pelatih PUT Supabase error:', {
        message: error.message,
        code: (error as unknown as Record<string, unknown>).code,
        details: (error as unknown as Record<string, unknown>).details,
        hint: (error as unknown as Record<string, unknown>).hint,
      });
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Pelatih berhasil diperbarui', data: data?.[0] });
  } catch (error) {
    const msg = formatErrorMessage(error, 'Gagal memperbarui pelatih');
    console.error('Pelatih PUT error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
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
    const fotoUrlParam = searchParams.get('foto_url');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    // Ambil foto_url dari database jika tidak dikirim dari client
    let photoPath: string | null = fotoUrlParam;
    if (!photoPath) {
      const { data: existing } = await supabase
        .from('pelatih')
        .select('foto_url')
        .eq('id', id)
        .single();
      photoPath = existing?.foto_url || null;
    }

    // Hapus row dari database
    const { error } = await withTimeout(supabase.from('pelatih').delete().eq('id', id));
    if (error) {
      console.error('Pelatih DELETE Supabase error:', error);
      throw error;
    }

    // Hapus foto dari Storage (best-effort — tidak gagalkan response utama)
    if (photoPath) {
      try {
        const BUCKET = 'pelatih-photos';
        const storagePrefix = `/storage/v1/object/public/${BUCKET}/`;
        const pathIdx = photoPath.indexOf(storagePrefix);
        const fileName = pathIdx !== -1
          ? photoPath.substring(pathIdx + storagePrefix.length)
          : photoPath.split('/').pop();
        if (fileName) {
          const { error: storageErr } = await supabase.storage.from(BUCKET).remove([fileName]);
          if (storageErr) console.warn('Pelatih DELETE: gagal hapus foto Storage (diabaikan):', storageErr.message);
        }
      } catch (e) {
        console.warn('Pelatih DELETE: exception hapus foto (diabaikan):', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Data pelatih berhasil dihapus' });
  } catch (error) {
    const msg = formatErrorMessage(error, 'Gagal menghapus pelatih');
    console.error('Pelatih DELETE error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
