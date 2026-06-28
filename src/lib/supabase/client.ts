import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY);
}
