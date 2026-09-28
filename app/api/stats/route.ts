import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getPublicStats() });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil statistik' },
      { status: 500 }
    );
  }
}