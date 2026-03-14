import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is trying to access protected routes
  const pathname = req.nextUrl.pathname;

  const isAccessingProtectedRoute =
    pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  // If accessing protected route and not logged in, redirect to login
  if (isAccessingProtectedRoute && !session) {
    const redirectUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If already logged in and trying to access login page, redirect to dashboard
  if (session && pathname === '/admin/login') {
    const redirectUrl = new URL('/admin/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};