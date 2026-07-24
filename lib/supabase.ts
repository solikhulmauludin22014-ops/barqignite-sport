import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset!');
}

// Client untuk browser / public pages (terbatas oleh RLS)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Client untuk API Routes server-side (bypass RLS dengan service role key)
// Jika service role key tidak ada, fallback ke anon key (akan terbatas oleh RLS)
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

if (!supabaseServiceKey && typeof window === 'undefined') {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. API Routes mungkin gagal karena RLS.');
}
