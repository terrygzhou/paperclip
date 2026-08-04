'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/api';

export default function LoginPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as 'zh' | 'en';
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiClient.post('/api/auth/login', { email, password });
        if (res.data.accessToken) {
          localStorage.setItem('hg_token', res.data.accessToken);
          localStorage.setItem('hg_refresh', res.data.refreshToken);
          router.push(`/${locale}/`);
        }
      } else {
        const res = await apiClient.post('/api/auth/register', {
          email,
          password,
          name: name || undefined,
          language: locale,
        });
        if (res.data.user) {
          // In dev, the verification token is returned
          if (res.data.verificationToken) {
            setError(`[DEV] Use this token to verify: ${res.data.verificationToken}`);
          } else {
            setError('Registration successful. Please check your email to verify.');
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (locale === 'en') {
    return (
      <main className="hg-main hg-auth-page">
        <div className="hg-auth-card">
          <h1>{isLogin ? 'Sign In' : 'Create Account'}</h1>
          <p className="hg-auth-subtitle">HappyGrandma — Your retirement companion</p>

          <form onSubmit={handleSubmit} className="hg-form">
            {!isLogin && (
              <div className="hg-form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="hg-input"
                />
              </div>
            )}

            <div className="hg-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="hg-input"
              />
            </div>

            <div className="hg-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="hg-input"
              />
            </div>

            {error && (
              <div className="hg-alert hg-alert-info" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="hg-btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="hg-auth-footer">
            {isLogin ? (
              <>
                <Link href={`/${locale}/forgot-password`} className="hg-link">
                  Forgot password?
                </Link>
                <p>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="hg-link hg-link-strong"
                    type="button"
                  >
                    Create one
                  </button>
                </p>
              </>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="hg-link hg-link-strong"
                  type="button"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hg-main hg-auth-page">
      <div className="hg-auth-card">
        <h1>{isLogin ? '登录' : '注册'}</h1>
        <p className="hg-auth-subtitle">HappyGrandma — 您的退休伙伴</p>

        <form onSubmit={handleSubmit} className="hg-form">
          {!isLogin && (
            <div className="hg-form-group">
              <label htmlFor="name">姓名</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="您的姓名"
                className="hg-input"
              />
            </div>
          )}

          <div className="hg-form-group">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="hg-input"
            />
          </div>

          <div className="hg-form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少8个字符"
              required
              minLength={8}
              className="hg-input"
            />
          </div>

          {error && (
            <div className="hg-alert hg-alert-info" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="hg-btn-primary" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="hg-auth-footer">
          {isLogin ? (
            <>
              <Link href={`/${locale}/forgot-password`} className="hg-link">
                忘记密码？
              </Link>
              <p>
                还没有账号？{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="hg-link hg-link-strong"
                  type="button"
                >
                  注册
                </button>
              </p>
            </>
          ) : (
            <p>
              已有账号？{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="hg-link hg-link-strong"
                type="button"
              >
                登录
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
