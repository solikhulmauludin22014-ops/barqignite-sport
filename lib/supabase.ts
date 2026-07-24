import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use service role key if available (only works on server), otherwise fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[WARNING] Supabase credentials are not set. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in .env.local');
}

if (typeof window === 'undefined' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[WARNING] SUPABASE_SERVICE_ROLE_KEY is not set. API Routes might fail due to Row Level Security (RLS) if not configured.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
