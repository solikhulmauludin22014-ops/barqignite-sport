import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Ambil konfigurasi branding (single row)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('branding')
      .select('*')
      .eq('id', 'BRAND-001')
      .single();

    if (error) {
      // Jika belum ada data, kembalikan default kosong
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: true, data: {} });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: data || {} });
  } catch (error) {
    console.error('Branding GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data branding' },
      { status: 500 }
    );
  }
}

// PUT: Update konfigurasi branding
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Hapus field yang tidak perlu di-update
    const { id, created_at, ...updateFields } = body;

    const { error } = await supabase
      .from('branding')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', 'BRAND-001');

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Branding berhasil diperbarui' });
  } catch (error) {
    console.error('Branding PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui branding' },
      { status: 500 }
    );
  }
}
