import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset!');
}

// Client untuk browser / public pages (terbatas oleh RLS)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Client untuk API Routes server-side. Semua route API bergantung pada service
// role agar tetap dapat bekerja setelah RLS diaktifkan.
const serverKey = supabaseServiceKey || supabaseAnonKey;
const serverClient = createClient(
  supabaseUrl,
  serverKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Jangan biarkan konfigurasi yang salah terlihat seperti bug database biasa.
// Proxy ini mencegah query server berjalan menggunakan anon key dan gagal
// belakangan dengan pesan RLS yang kurang membantu.
export const supabase = new Proxy(serverClient, {
  get(target, property, receiver) {
    if (!supabaseServiceKey && (property === 'from' || property === 'storage')) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi. API admin membutuhkan service role key agar dapat melewati RLS.'
      );
    }
    return Reflect.get(target, property, receiver);
  },
});

if (!supabaseServiceKey && typeof window === 'undefined') {
  console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. Semua API server akan ditolak.');
}
