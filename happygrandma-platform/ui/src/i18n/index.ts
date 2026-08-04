/**
 * HappyGrandma Platform — i18n Configuration
 * Supports English (en) and Chinese Simplified (zh-CN)
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const en = {
  translation: {
    app: {
      name: 'HappyGrandma',
      tagline: 'Happy Retirement, Wonderful Life',
    },
    nav: {
      home: 'Home',
      content: 'Content',
      activities: 'Activities',
      guides: 'Guides',
      about: 'About',
      login: 'Login',
      register: 'Register',
      profile: 'Profile',
      settings: 'Settings',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirm: 'Confirm',
      search: 'Search',
      filter: 'Filter',
      next: 'Next',
      previous: 'Previous',
      viewAll: 'View All',
      noResults: 'No results found',
    },
    content: {
      readMore: 'Read More',
      published: 'Published',
      draft: 'Draft',
      featured: 'Featured',
      views: 'views',
      comments: 'comments',
    },
  },
};

const zh = {
  translation: {
    app: {
      name: '快乐退休',
      tagline: '快乐退休，精彩生活',
    },
    nav: {
      home: '首页',
      content: '内容',
      activities: '活动',
      guides: '指南',
      about: '关于',
      login: '登录',
      register: '注册',
      profile: '个人中心',
      settings: '设置',
    },
    common: {
      loading: '加载中...',
      error: '发生错误',
      success: '成功',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirm: '确认',
      search: '搜索',
      filter: '筛选',
      next: '下一页',
      previous: '上一页',
      viewAll: '查看全部',
      noResults: '没有找到结果',
    },
    content: {
      readMore: '阅读更多',
      published: '已发布',
      draft: '草稿',
      featured: '推荐',
      views: '次浏览',
      comments: '条评论',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      zh: zh,
    },
    fallbackLng: 'zh',
    supportedLngs: ['en', 'zh'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path'],
      caches: ['localStorage'],
    },
  });

export default i18n;
