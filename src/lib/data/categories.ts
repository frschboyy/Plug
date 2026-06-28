import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { Category } from '@/lib/types';

export type Client = SupabaseClient<Database>;

export async function fetchCategories(client: Client): Promise<Category[]> {
  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, icon')
    .neq('slug', 'all')
    .order('id');
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}
