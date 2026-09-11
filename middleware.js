import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from './lib/auth';
import { canAccessPage } from './lib/rbac';

const PUBLIC_PATHS = ['/login'];
const DASHBOARD_PAGES = ['dashboard', 'fuel', 'approvals', 'customers', 'reports', 'access'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!session && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (session) {
    const pageKey = DASHBOARD_PAGES.find(page => pathname === `/${page}` || pathname.startsWith(`/${page}/`));
    if (pageKey && !canAccessPage(session.role, pageKey)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
