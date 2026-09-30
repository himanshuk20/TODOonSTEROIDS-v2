import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /auth/callback — Supabase redirects here after Google OAuth
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  let redirectUrl = new URL('/home', origin);

  // Only honor local paths. Resolving against the current origin and checking
  // the result prevents values such as `@attacker.example` from changing host.
  if (next && !next.startsWith('//') && !next.includes('\\')) {
    try {
      const candidate = new URL(next, origin);
      if (candidate.origin === origin) redirectUrl = candidate;
    } catch {
      // Keep the safe /home fallback for malformed destinations.
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
