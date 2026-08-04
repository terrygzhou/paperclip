/**
 * HappyGrandma Platform — UI Middleware
 * URL-based language routing: /zh/ and /en/
 * Auto-detects from browser locale, cookie, or default
 *
 * Routing logic:
 * - /zh/... → Chinese
 * - /en/... → English
 * - /... → auto-detect → redirect to /zh/ or /en/
 * - /_next/... → skip (static assets)
 * - /api/... → skip (API routes)
 */
import { NextRequest, NextResponse } from 'next/server';

// Languages we support
const SUPPORTED_LOCALES = ['zh', 'en'];
const DEFAULT_LOCALE = 'zh';

// Pages that should not be redirected (they handle their own locale routing)
const SKIP_PATHS = ['/_next', '/favicon.ico', '/api'];

function detectLocale(request: NextRequest): string {
  // 1. Check cookie first (persistent preference)
  const localeCookie = request.cookies.get('happygrandma_locale');
  if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // 2. Check Accept-Language header from browser
  const acceptLanguage = request.headers.get('accept-language') || '';
  if (acceptLanguage.includes('en')) {
    return 'en';
  }
  if (acceptLanguage.includes('zh')) {
    return 'zh';
  }

  // 3. Default
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and Next.js internals
  for (const skipPath of SKIP_PATHS) {
    if (pathname.startsWith(skipPath)) {
      return NextResponse.next();
    }
  }

  // Check if already has locale prefix
  const hasZhPrefix = pathname.startsWith('/zh/') || pathname === '/zh';
  const hasEnPrefix = pathname.startsWith('/en/') || pathname === '/en';

  if (hasZhPrefix || hasEnPrefix) {
    // Already has locale — set cookie and continue
    const locale = hasZhPrefix ? 'zh' : 'en';
    const response = NextResponse.next();
    response.cookies.set('happygrandma_locale', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
    return response;
  }

  // No locale prefix — detect and redirect
  const locale = detectLocale(request);
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${locale}${pathname}`;
  
  // Set the cookie in the redirect response
  const response = NextResponse.redirect(newUrl);
  response.cookies.set('happygrandma_locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return response;
}

export const config = {
  // Run middleware on all paths
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
