import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');

    let query = supabase.from('metode_pembayaran').select('*').order('urutan', { ascending: true });
    if (is_active !== null) query = query.eq('is_active', is_active === 'true');

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('metode_pembayaran GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data metode' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { error } = await supabase.from('metode_pembayaran').insert([body]);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Metode berhasil ditambahkan' });
  } catch (error) {
    console.error('metode_pembayaran POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan metode' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updateData } = body;
    
    // Jika is_recommended true, matikan rekom yang lain dulu jika diinginkan hanya ada 1.
    // Tapi karena ini opsional, biarkan saja atau update yang lain jadi false jika butuh unique recommended.
    // Asumsi: bisa lebih dari 1 atau dikelola admin.
    
    const { error } = await supabase.from('metode_pembayaran').update(updateData).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Metode berhasil diperbarui' });
  } catch (error) {
    console.error('metode_pembayaran PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui metode' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

    const { error } = await supabase.from('metode_pembayaran').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Metode berhasil dihapus' });
  } catch (error) {
    console.error('metode_pembayaran DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus metode' }, { status: 500 });
  }
}
