import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt, isTokenExpired } from '@/lib/jwt';

// Roles definition
const HR_ROLES = ['HR_ADMIN', 'HR_USER', 'HR'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ALWAYS allow public auth routes without interference
  // CRITICAL REQUIREMENT: /login must ALWAYS remain publicly accessible.
  // Middleware must NEVER redirect /login to /hr or /employee.
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next();
  }

  // 2. Read token and role cookies
  const token = request.cookies.get('fcs_token')?.value;
  const roleCookie = request.cookies.get('fcs_role')?.value;

  const isExpired = isTokenExpired(token);
  const isAuthenticated = Boolean(token && !isExpired);

  // Extract role if authenticated
  let userRole: string | null = null;
  if (isAuthenticated && token) {
    const payload = decodeJwt(token);
    userRole = payload?.role || roleCookie || null;
  }

  // Debug logging (comment out in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware]', {
      pathname,
      hasToken: Boolean(token),
      isExpired,
      isAuthenticated,
      userRole,
    });
  }

  // 3. Root route ("/") behavior
  if (pathname === '/') {
    if (!isAuthenticated || !userRole) {
      // Unauthenticated -> redirect to /login
      const response = NextResponse.redirect(new URL('/login', request.url));
      if (token && isExpired) {
        response.cookies.delete('fcs_token');
        response.cookies.delete('fcs_role');
      }
      return response;
    }

    // Authenticated -> redirect strictly according to role
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (HR_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/hr', request.url));
    }
    if (userRole === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }

    // Unknown role -> fallback to /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Protected Route: /hr and /hr/*
  if (pathname.startsWith('/hr')) {
    if (!isAuthenticated || !userRole) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      if (token && isExpired) {
        response.cookies.delete('fcs_token');
        response.cookies.delete('fcs_role');
      }
      return response;
    }

    if (HR_ROLES.includes(userRole)) {
      return NextResponse.next();
    }

    // Role mismatch -> redirect to actual dashboard
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (userRole === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Protected Route: /employee and /employee/*
  if (pathname.startsWith('/employee')) {
    if (!isAuthenticated || !userRole) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      if (token && isExpired) {
        response.cookies.delete('fcs_token');
        response.cookies.delete('fcs_role');
      }
      return response;
    }

    if (userRole === 'EMPLOYEE') {
      return NextResponse.next();
    }

    // Role mismatch -> redirect to actual dashboard
    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (HR_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/hr', request.url));
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 6. Protected Route: /super-admin and /admin
  if (pathname.startsWith('/super-admin') || pathname.startsWith('/admin')) {
    if (!isAuthenticated || !userRole) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      if (token && isExpired) {
        response.cookies.delete('fcs_token');
        response.cookies.delete('fcs_role');
      }
      return response;
    }

    if (userRole === 'SUPER_ADMIN') {
      return NextResponse.next();
    }

    // Role mismatch -> redirect to actual dashboard
    if (HR_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL('/hr', request.url));
    }
    if (userRole === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/employee', request.url));
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 7. Protected Route: /change-password
  if (pathname === '/change-password') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets with file extensions (.svg, .png, .jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
