import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatErrorMessage, withTimeout } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Next.js 15: params adalah Promise
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Ambil foto_url untuk hapus dari Storage juga
    const { data: item } = await withTimeout(
      supabase
        .from('galeri_dokumentasi')
        .select('foto_url')
        .eq('id', id)
        .single()
    );

    // Hapus row dari database
    const { error } = await withTimeout(
      supabase
        .from('galeri_dokumentasi')
        .delete()
        .eq('id', id)
    );

    if (error) {
      return NextResponse.json({ error: formatErrorMessage(error, 'Gagal menghapus foto') }, { status: 500 });
    }

    // Hapus file dari Supabase Storage jika ada
    if (item?.foto_url) {
      const url = item.foto_url as string;
      const storagePrefix = '/storage/v1/object/public/galeri-dokumentasi/';
      const pathIndex = url.indexOf(storagePrefix);
      if (pathIndex !== -1) {
        const filePath = url.substring(pathIndex + storagePrefix.length);
        await supabase.storage.from('galeri-dokumentasi').remove([filePath]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = formatErrorMessage(err, 'Gagal menghapus foto');
    console.error('[API /galeri/[id] DELETE]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { data, error } = await withTimeout(
      supabase
        .from('galeri_dokumentasi')
        .update(body)
        .eq('id', id)
        .select()
        .single()
    );

    if (error) {
      return NextResponse.json({ error: formatErrorMessage(error, 'Gagal memperbarui foto') }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    const msg = formatErrorMessage(err, 'Gagal memperbarui foto');
    console.error('[API /galeri/[id] PATCH]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
