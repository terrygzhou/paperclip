/**
 * HappyGrandma Platform — UI Middleware
 * Detects language from cookies or Accept-Language header, sets locale cookie
 */
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for locale cookie
  const localeCookie = request.cookies.get('happygrandma_locale');
  let locale = localeCookie?.value || 'zh';

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  if (acceptLanguage.includes('en')) {
    locale = 'en';
  } else if (acceptLanguage.includes('zh')) {
    locale = 'zh';
  }

  // Create response
  const response = NextResponse.next();

  // Set locale cookie
  response.cookies.set('happygrandma_locale', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return response;
}

export const config = {
  // Run middleware on all paths except static files, API routes, and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
