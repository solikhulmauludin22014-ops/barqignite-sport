import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { BrandingConfig } from '@/types';

export async function GET() {
  try {
    const { data: rows, error } = await supabase.from('branding').select('*');
    if (error) throw error;

    const config: Record<string, string> = {};
    if (rows) {
      rows.forEach((row) => {
        if (row.key) config[row.key] = row.value || '';
      });
    }
    
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Branding GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data branding' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: Partial<BrandingConfig> = await request.json();

    const upsertData = Object.entries(body).map(([key, value]) => ({
      key,
      value: value as string,
    }));

    if (upsertData.length > 0) {
      const { error } = await supabase
        .from('branding')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Branding berhasil diperbarui' });
  } catch (error) {
    console.error('Branding PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui branding' },
      { status: 500 }
    );
  }
}
