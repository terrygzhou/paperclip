import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC } from 'next/font/google';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import './globals.css';

// Fonts optimized for seniors: large, readable
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sc',
  weight: ['300', '400', '500', '600', '700'],
});

// Supported locales
const locales = ['zh', 'en'] as const;
type Locale = (typeof locales)[number];

// Translation maps for SEO metadata
const seoMetadata: Record<Locale, Metadata> = {
  zh: {
    title: '快乐退休，精彩生活 | HappyGrandma',
    description: '为即将迈入老年或者已经退休的老人提供养老生活的积极思想、创意和活动。',
    keywords: '退休生活, 养老, 华人, 澳大利亚, 老年活动, 创意',
  },
  en: {
    title: 'HappyGrandma — Happy Retirement, Wonderful Life',
    description: 'Positive ideas, creativity and activities for seniors in Australia',
    keywords: 'retirement, seniors, elderly, activities, Australian Chinese seniors',
  },
};

// Props passed to every locale page
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export function generateMetadata({ params }: LocaleLayoutProps): Metadata {
  const { locale } = params;
  const meta = seoMetadata[locale as Locale] || seoMetadata.zh;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `/`,
      languages: {
        'zh': '/zh/',
        'en': '/en/',
      } as Record<string, string>,
    },
    openGraph: {
      locale: locale === 'zh' ? 'zh_CN' : 'en_AU',
      type: 'website',
    },
  };
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;
  
  // Only allow supported locales
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const lang = locale === 'en' ? 'en' : 'zh-CN';
  const fontFamily = locale === 'zh' ? notoSC.variable : inter.variable;

  return (
    <html lang={lang} className={fontFamily}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={seoMetadata[locale as Locale]?.description || ''} />
        {/* Accessibility: large default font for seniors */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root { --font-size-base: 1.25rem; }
            body { font-size: var(--font-size-base); }
          `
        }} />
      </head>
      <body>
        {/* Language switcher - always visible */}
        <nav className="hg-nav-bar" aria-label="Language switcher">
          <div className="hg-nav-inner">
            <span className="hg-nav-label">语言：</span>
            <Link href="/zh/" className={locale === 'zh' ? 'hg-nav-active' : 'hg-nav-link'}>
              中文
            </Link>
            <span className="hg-nav-separator">|</span>
            <Link href="/en/" className={locale === 'en' ? 'hg-nav-active' : 'hg-nav-link'}>
              English
            </Link>
          </div>
        </nav>
        
        <Suspense fallback={<div className="hg-loading">Loading...</div>}>
          {children}
        </Suspense>
        
        <footer className="hg-footer">
          <p>HappyGrandma &copy; {new Date().getFullYear()}</p>
        </footer>
      </body>
    </html>
  );
}
