import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Security headers ──────────────────────────────────────────────────
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; frame-ancestors 'none';"
  );

  // ── Supabase session refresh ──────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          // Re-apply security headers on the new response object
          supabaseResponse.headers.set('X-Frame-Options', 'DENY');
          supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
          supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
          supabaseResponse.headers.set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; frame-ancestors 'none';"
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — IMPORTANT: do not remove this call
  const { data: { user } } = await supabase.auth.getUser();

  // ── Route protection ──────────────────────────────────────────────────
  const { pathname } = request.nextUrl;
  const protectedPaths = ['/home', '/tasks', '/calendar', '/subjects', '/analytics', '/pomodoro', '/get-started'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/home';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
