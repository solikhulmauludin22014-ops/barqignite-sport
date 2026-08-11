import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const { data, error } = await supabase.from('pengaturan_pembayaran').select('*').eq('id', 'SETTING-001').single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    return NextResponse.json({ success: true, data: data || {} });
  } catch (error) {
    console.error('pengaturan_pembayaran GET error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data pengaturan' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, updated_at, ...updateFields } = body;
    
    // Check if exists first
    const { data: existing } = await supabase.from('pengaturan_pembayaran').select('id').eq('id', 'SETTING-001').single();
    
    let error;
    if (existing) {
      const { error: updateError } = await supabase.from('pengaturan_pembayaran').update({ ...updateFields, updated_at: new Date().toISOString() }).eq('id', 'SETTING-001');
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('pengaturan_pembayaran').insert([{ id: 'SETTING-001', ...updateFields }]);
      error = insertError;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (error) {
    console.error('pengaturan_pembayaran PUT error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui pengaturan' }, { status: 500 });
  }
}
