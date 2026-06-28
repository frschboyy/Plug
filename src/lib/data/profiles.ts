import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { Profile } from '@/lib/types';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { formatPhone } from '@/lib/utils';

export type Client = SupabaseClient<Database>;

export async function fetchProfileById(client: Client, id: string): Promise<Profile | null> {
  const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Profile;
}

export async function uploadAvatar(client: Client, userId: string, file: File): Promise<string> {
  const path = `${userId}/avatar.jpg`;
  const { error } = await client.storage
    .from(STORAGE_BUCKETS.avatars)
    .upload(path, file, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = client.storage.from(STORAGE_BUCKETS.avatars).getPublicUrl(path);
  return publicUrl;
}

export interface ProfileUpdateValues {
  name: string;
  bio?: string;
  whatsapp_number?: string;
  hostel?: string;
}

export async function upsertProfile(
  client: Client,
  userId: string,
  values: ProfileUpdateValues,
  avatarFile?: File | null
): Promise<void> {
  let avatarUrl: string | undefined;
  if (avatarFile) {
    avatarUrl = await uploadAvatar(client, userId, avatarFile);
  }

  const { error } = await client
    .from('profiles')
    .update({
      name:            values.name.trim(),
      bio:             values.bio?.trim() || null,
      whatsapp_number: values.whatsapp_number ? formatPhone(values.whatsapp_number) : null,
      hostel:          values.hostel?.trim() || null,
      ...(avatarUrl != null && { avatar_url: avatarUrl }),
      last_active:     new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function markAsSeller(client: Client, userId: string): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ is_seller: true, last_active: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}
