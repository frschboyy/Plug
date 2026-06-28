import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Called by a cron job / Supabase scheduled function
// Marks listings as unavailable when they've expired
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .update({ is_available: false })
    .eq('is_available', true)
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    expired: data?.length ?? 0,
  });
}
