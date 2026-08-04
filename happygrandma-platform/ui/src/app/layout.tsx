import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HappyGrandma — 快乐退休，精彩生活',
  description: '为即将迈入老年或者已经退休的老人提供养老生活的积极思想、创意和活动。',
  keywords: '退休生活, 养老, 华人, 澳大利亚, 老年活动, 创意',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
