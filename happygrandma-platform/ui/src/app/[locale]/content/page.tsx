'use client';

import { useState, useEffect } from 'react';
import apiClient from '../../services/api';

interface ContentItem {
  id: string;
  titleZn: string;
  titleEn: string;
  excerptZn?: string;
  excerptEn?: string;
  type: string;
  imageUrl?: string;
  language: string;
  publishedAt?: string;
  featured?: boolean;
}

export default function ContentPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as 'zh' | 'en';
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContent = async (search?: string) => {
    try {
      setLoading(true);
      const params: Record<string, string> = { language: locale, limit: '20' };
      if (search) params.q = search;
      
      const res = await apiClient.get('/api/content', { params });
      setContent(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [locale]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchContent(searchQuery);
    } else {
      fetchContent();
    }
  };

  const title = locale === 'en' ? 'All Content' : '所有内容';
  const searchPlaceholder = locale === 'en' ? 'Search articles, activities...' : '搜索文章、活动...';
  const noResults = locale === 'en' ? 'No content found.' : '没有找到内容。';
  const noContent = locale === 'en' ? 'No content available yet.' : '暂无内容。';

  return (
    <main className="hg-main">
      <div className="hg-page-header">
        <h1>{title}</h1>
        
        <form onSubmit={handleSearch} className="hg-search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="hg-input hg-search-input"
          />
          <button type="submit" className="hg-btn-primary hg-search-btn">
            {locale === 'en' ? 'Search' : '搜索'}
          </button>
        </form>
      </div>

      {error && (
        <div className="hg-alert hg-alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="hg-loading">{locale === 'en' ? 'Loading...' : '加载中...'}</p>
      ) : content.length === 0 ? (
        <p className="hg-empty">{noContent}</p>
      ) : (
        <div className="hg-content-grid">
          {content.map(item => (
            <article key={item.id} className="hg-content-card">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={locale === 'en' ? item.titleEn : item.titleZn}
                  className="hg-card-image"
                  loading="lazy"
                />
              )}
              <div className="hg-card-body">
                <span className="hg-card-type">{item.type}</span>
                <h3>{locale === 'en' ? item.titleEn : item.titleZn}</h3>
                <p className="hg-card-excerpt">
                  {locale === 'en' ? (item.excerptEn || '') : (item.excerptZn || '')}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
