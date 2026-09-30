import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'));
}

// Also handle GET for simple link-based signout
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/login`);
}
