import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Next.js 15: params adalah Promise
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ambil foto_url untuk hapus dari Storage juga
    const { data: item } = await supabase
      .from('galeri_dokumentasi')
      .select('foto_url')
      .eq('id', id)
      .single();

    // Hapus row dari database
    const { error } = await supabase
      .from('galeri_dokumentasi')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    console.error('[API /galeri/[id] DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase
      .from('galeri_dokumentasi')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[API /galeri/[id] PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
