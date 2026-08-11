import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cabang = searchParams.get('cabang');
    const is_active = searchParams.get('is_active');

    let query = supabase.from('spp_kategori').select('*').order('urutan', { ascending: true });
    
    if (cabang) query = query.eq('cabang', cabang);
    if (is_active !== null) query = query.eq('is_active', is_active === 'true');

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('spp_kategori GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { error } = await supabase.from('spp_kategori').insert([body]);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('spp_kategori POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    
    const { error } = await supabase.from('spp_kategori').update(updateData).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (error) {
    console.error('spp_kategori PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

    const { error } = await supabase.from('spp_kategori').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('spp_kategori DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus data' }, { status: 500 });
  }
}
