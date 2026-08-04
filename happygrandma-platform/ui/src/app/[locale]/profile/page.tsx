'use client';

import { useState, useEffect } from 'react';
import apiClient from '../../services/api';

interface ProfileData {
  id: string;
  email: string;
  name?: string;
  language?: string;
  font_size?: number;
  high_contrast?: boolean;
  reduced_motion?: boolean;
  role?: string;
}

interface ProfileProfileData {
  age?: number;
  gender?: string;
  location?: string;
  languages?: string[];
  interests?: unknown[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  medicalNotes?: string;
}

export default function ProfilePage({ params }: { params: { locale: string } }) {
  const locale = params.locale as 'zh' | 'en';
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [data, setData] = useState<ProfileProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('hg_token') : null;
  const userId = profile?.id;

  useEffect(() => {
    if (!token || !userId) return;
    fetchProfile();
  }, [token, userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/users/${userId}`);
      setProfile(res.data.user);
      setData(res.data.profile);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Save user settings
      await apiClient.patch(`/api/users/${userId}`, {
        name: profile?.name,
        language: profile?.language,
        font_size: profile?.font_size,
        high_contrast: profile?.high_contrast,
        reduced_motion: profile?.reduced_motion,
      });

      // Save profile data
      if (data) {
        await apiClient.patch(`/api/users/${userId}/profile`, data);
      }

      setSuccess(locale === 'en' ? 'Profile saved successfully!' : '个人资料保存成功！');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="hg-main"><p className="hg-loading">{locale === 'en' ? 'Loading...' : '加载中...'}</p></main>;
  }

  if (!profile) {
    return (
      <main className="hg-main">
        <div className="hg-auth-card">
          <p>{locale === 'en' ? 'Please log in to view your profile.' : '请登录以查看个人资料。'}</p>
          <a href={`/${locale}/login`} className="hg-btn-primary">
            {locale === 'en' ? 'Sign In' : '登录'}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="hg-main">
      <div className="hg-page-header">
        <h1>{locale === 'en' ? 'My Profile' : '我的个人资料'}</h1>
      </div>

      {error && (
        <div className="hg-alert hg-alert-error" role="alert">{error}</div>
      )}
      {success && (
        <div className="hg-alert hg-alert-success" role="alert">{success}</div>
      )}

      <form onSubmit={handleSave} className="hg-profile-form">
        {/* Personal Info */}
        <fieldset className="hg-form-section">
          <legend>{locale === 'en' ? 'Personal Information' : '个人信息'}</legend>
          
          <div className="hg-form-group">
            <label htmlFor="name">{locale === 'en' ? 'Name' : '姓名'}</label>
            <input
              id="name"
              type="text"
              value={profile.name || ''}
              onChange={e => setProfile(p => p ? { ...p, name: e.target.value } : null)}
              className="hg-input"
            />
          </div>

          <div className="hg-form-group">
            <label htmlFor="email">{locale === 'en' ? 'Email' : '邮箱'}</label>
            <input id="email" type="email" value={profile.email} disabled className="hg-input hg-input-disabled" />
          </div>

          <div className="hg-form-group">
            <label htmlFor="location">{locale === 'en' ? 'Location' : '所在地区'}</label>
            <input
              id="location"
              type="text"
              value={data?.location || ''}
              onChange={e => setData(d => d ? { ...d, location: e.target.value } : null)}
              placeholder={locale === 'en' ? 'City, State' : '城市，州'}
              className="hg-input"
            />
          </div>
        </fieldset>

        {/* Accessibility */}
        <fieldset className="hg-form-section">
          <legend>{locale === 'en' ? 'Accessibility Settings' : '辅助功能设置'}</legend>
          
          <div className="hg-form-group">
            <label htmlFor="font_size">{locale === 'en' ? 'Font Size' : '字体大小'}</label>
            <select
              id="font_size"
              value={profile.font_size || 18}
              onChange={e => setProfile(p => p ? { ...p, font_size: parseInt(e.target.value) } : null)}
              className="hg-input"
            >
              <option value={14}>{locale === 'en' ? 'Small (14px)' : '小 (14px)'}</option>
              <option value={18}>{locale === 'en' ? 'Medium (18px)' : '中 (18px)'}</option>
              <option value={22}>{locale === 'en' ? 'Large (22px)' : '大 (22px)'}</option>
              <option value={28}>{locale === 'en' ? 'Extra Large (28px)' : '特大 (28px)'}</option>
            </select>
          </div>

          <div className="hg-form-group hg-checkbox-group">
            <input
              id="high_contrast"
              type="checkbox"
              checked={profile.high_contrast || false}
              onChange={e => setProfile(p => p ? { ...p, high_contrast: e.target.checked } : null)}
            />
            <label htmlFor="high_contrast">
              {locale === 'en' ? 'High Contrast Mode' : '高对比度模式'}
            </label>
          </div>

          <div className="hg-form-group hg-checkbox-group">
            <input
              id="reduced_motion"
              type="checkbox"
              checked={profile.reduced_motion || false}
              onChange={e => setProfile(p => p ? { ...p, reduced_motion: e.target.checked } : null)}
            />
            <label htmlFor="reduced_motion">
              {locale === 'en' ? 'Reduce Motion' : '减少动画'}
            </label>
          </div>
        </fieldset>

        {/* Emergency Contact */}
        <fieldset className="hg-form-section">
          <legend>{locale === 'en' ? 'Emergency Contact' : '紧急联系人'}</legend>
          
          <div className="hg-form-row">
            <div className="hg-form-group">
              <label htmlFor="emergencyContactName">{locale === 'en' ? 'Name' : '姓名'}</label>
              <input
                id="emergencyContactName"
                type="text"
                value={data?.emergencyContactName || ''}
                onChange={e => setData(d => d ? { ...d, emergencyContactName: e.target.value } : null)}
                className="hg-input"
              />
            </div>

            <div className="hg-form-group">
              <label htmlFor="emergencyContactPhone">{locale === 'en' ? 'Phone' : '电话'}</label>
              <input
                id="emergencyContactPhone"
                type="tel"
                value={data?.emergencyContactPhone || ''}
                onChange={e => setData(d => d ? { ...d, emergencyContactPhone: e.target.value } : null)}
                className="hg-input"
              />
            </div>
          </div>

          <div className="hg-form-group">
            <label htmlFor="emergencyContactRelation">{locale === 'en' ? 'Relationship' : '关系'}</label>
            <input
              id="emergencyContactRelation"
              type="text"
              value={data?.emergencyContactRelation || ''}
              onChange={e => setData(d => d ? { ...d, emergencyContactRelation: e.target.value } : null)}
              className="hg-input"
            />
          </div>

          <div className="hg-form-group">
            <label htmlFor="medicalNotes">{locale === 'en' ? 'Medical Notes' : '医疗备注'}</label>
            <textarea
              id="medicalNotes"
              value={data?.medicalNotes || ''}
              onChange={e => setData(d => d ? { ...d, medicalNotes: e.target.value } : null)}
              rows={3}
              className="hg-input"
              placeholder={locale === 'en' ? 'Any allergies, medications...' : '任何过敏、药物...'}
            />
          </div>
        </fieldset>

        <button type="submit" className="hg-btn-primary" disabled={saving}>
          {saving
            ? (locale === 'en' ? 'Saving...' : '保存中...')
            : (locale === 'en' ? 'Save Profile' : '保存个人资料')}
        </button>
      </form>
    </main>
  );
}
