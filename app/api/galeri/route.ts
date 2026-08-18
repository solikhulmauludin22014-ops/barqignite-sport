import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get('kategori');
    const limit = parseInt(searchParams.get('limit') || '24');

    let query = supabase
      .from('galeri_dokumentasi')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (kategori && kategori !== 'Semua') {
      query = query.eq('kategori', kategori);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API /galeri] Supabase error:', error.message);
      return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('[API /galeri] Unexpected error:', err);
    return NextResponse.json({ data: [], error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, kategori, foto_url, tanggal, is_featured, urutan } = body;

    if (!judul || !kategori || !foto_url) {
      return NextResponse.json({ error: 'judul, kategori, dan foto_url wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('galeri_dokumentasi')
      .insert([{ judul, kategori, foto_url, tanggal, is_featured: is_featured || false, urutan: urutan || 0 }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('[API /galeri POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
