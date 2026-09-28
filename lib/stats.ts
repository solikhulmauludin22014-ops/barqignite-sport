import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/utils';

export interface MemberStats {
  total: number;
  basket: number;
  renang: number;
}

// Anggota resmi adalah baris `anggota` yang berstatus Aktif.
export async function getMemberStats(): Promise<MemberStats> {
  const [totalResult, basketResult, renangResult] = await Promise.all([
    withTimeout(supabase.from('anggota').select('id', { count: 'exact', head: true }).eq('status', 'Aktif')),
    withTimeout(supabase.from('anggota').select('id', { count: 'exact', head: true }).eq('status', 'Aktif').eq('cabang_olahraga', 'Basket')),
    withTimeout(supabase.from('anggota').select('id', { count: 'exact', head: true }).eq('status', 'Aktif').eq('cabang_olahraga', 'Renang')),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (basketResult.error) throw basketResult.error;
  if (renangResult.error) throw renangResult.error;

  return {
    total: totalResult.count || 0,
    basket: basketResult.count || 0,
    renang: renangResult.count || 0,
  };
}

export async function getPrestasiCount(): Promise<number> {
  const { count, error } = await withTimeout(
    supabase.from('prestasi').select('id', { count: 'exact', head: true })
  );

  if (error) throw error;
  return count || 0;
}

export async function getPublicStats(): Promise<MemberStats & { prestasi: number }> {
  const [members, prestasi] = await Promise.all([getMemberStats(), getPrestasiCount()]);
  return { ...members, prestasi };
}