export const common = {
  appName: 'HappyGrandma',
  appNameEn: 'HappyGrandma',
  appTaglineZh: '快乐退休，精彩生活',
  appTaglineEn: 'Happy Retirement, Wonderful Life',
  timezone: 'Australia/Sydney',
  defaultLanguage: 'zh',
  supportedLanguages: ['zh', 'en'] as const,
  pageSize: {
    default: 20,
    max: 100,
  },
};

export const routes = {
  health: '/api/health',
  users: '/api/users',
  content: '/api/content',
  subscriptions: '/api/subscriptions',
  family: '/api/family',
  comments: '/api/comments',
  newsletter: '/api/newsletter',
  analytics: '/api/analytics',
};

export const db = {
  poolSize: 20,
  connectionTimeout: 5000,
  idleTimeout: 30000,
};
