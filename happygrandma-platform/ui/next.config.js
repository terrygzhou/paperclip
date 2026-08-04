const nextEnv = require('./.next/paths');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@happygrandma/db'],
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
