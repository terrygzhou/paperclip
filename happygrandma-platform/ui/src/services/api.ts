/**
 * HappyGrandma Platform — API Client
 * Axios-based client for communicating with the HappyGrandma API
 */
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hg_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hg_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ── Typed API Methods ──────────────────────────────────────────────────────

// Users
export const usersApi = {
  list: () => apiClient.get('/api/users'),
  getById: (id: string) => apiClient.get(`/api/users/${id}`),
  create: (data: { email: string; passwordHash: string; name?: string }) =>
    apiClient.post('/api/users', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/users/${id}`),
};

// Content
export const contentApi = {
  list: (params?: { type?: string; category?: string; language?: string; status?: string; featured?: boolean; page?: number; limit?: number }) =>
    apiClient.get('/api/content', { params }),
  getById: (id: string) => apiClient.get(`/api/content/${id}`),
  search: (query: string, language?: string) =>
    apiClient.get('/api/content/search', { params: { q: query, language } }),
  getCategories: () => apiClient.get('/api/content/categories'),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/api/content', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/content/${id}`, data),
  archive: (id: string) =>
    apiClient.delete(`/api/content/${id}`),
};

// Subscriptions
export const subscriptionsApi = {
  getCurrent: () => apiClient.get('/api/subscriptions'),
  getPlans: () => apiClient.get('/api/subscriptions/plans'),
  createCheckout: (planId: string) =>
    apiClient.post('/api/subscriptions/checkout', { planId }),
  cancel: () =>
    apiClient.post('/api/subscriptions/cancel'),
};

// Comments
export const commentsApi = {
  listForContent: (contentItemId: string) =>
    apiClient.get(`/api/comments/${contentItemId}`),
  create: (data: { contentItemId: string; body: string; parentCommentId?: string }) =>
    apiClient.post('/api/comments', data),
  report: (commentId: string) =>
    apiClient.post(`/api/comments/${commentId}/report`),
};

// Newsletter
export const newsletterApi = {
  subscribe: (data: { email: string; frequency?: string; topics?: string[]; language?: string; source?: string }) =>
    apiClient.post('/api/newsletter', data),
  unsubscribe: (email: string) =>
    apiClient.post(`/api/newsletter/${email}/unsubscribe`),
  update: (email: string, data: Record<string, unknown>) =>
    apiClient.patch(`/api/newsletter/${email}`, data),
};

// Analytics
export const analyticsApi = {
  getOverview: () => apiClient.get('/api/analytics/overview'),
  getEngagement: (period?: string) =>
    apiClient.get('/api/analytics/engagement', { params: { period } }),
  logEvent: (data: { type: string; userId?: string; data?: Record<string, unknown>; sessionId?: string }) =>
    apiClient.post('/api/analytics/events', data),
};
