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

  let role: string | null = null;
  if (session?.user?.id) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (!roleError && roleData) role = roleData.role;
  }

  if (pathname === '/admin/login' && (role === 'admin' || role === 'frontdesk')) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  if (isAccessingProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    if (role === 'admin') return res;

    if (role === 'frontdesk') {
      if (pathname === '/admin/dashboard') return res;
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    // Unknown or missing roles have no admin-area access.
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
