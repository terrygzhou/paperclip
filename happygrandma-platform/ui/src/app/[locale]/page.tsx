import Link from 'next/link';

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale as 'zh' | 'en';

  if (locale === 'en') {
    return (
      <main className="hg-main">
        <section className="hg-hero">
          <h1>Welcome to HappyGrandma</h1>
          <p className="hg-hero-subtitle">Happy Retirement, Wonderful Life</p>
          <p className="hg-hero-desc">
            Positive ideas, creativity, and activities for seniors in Australia.
            Helping you navigate this new chapter with joy and purpose.
          </p>
          <Link href="/en/login" className="hg-btn-primary">
            Get Started
          </Link>
        </section>

        <section className="hg-features">
          <h2>What We Offer</h2>
          <div className="hg-grid">
            <div className="hg-card">
              <h3>Activities</h3>
              <p>Fun and engaging activities designed for seniors.</p>
              <Link href="/en/activities" className="hg-link">View Activities</Link>
            </div>
            <div className="hg-card">
              <h3>Guides</h3>
              <p>Practical guides for retirement life in Australia.</p>
              <Link href="/en/guides" className="hg-link">Read Guides</Link>
            </div>
            <div className="hg-card">
              <h3>Community</h3>
              <p>Connect with fellow seniors and share experiences.</p>
              <Link href="/en/community" className="hg-link">Join Community</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Default: Chinese
  return (
    <main className="hg-main">
      <section className="hg-hero">
        <h1>欢迎来到 HappyGrandma</h1>
        <p className="hg-hero-subtitle">快乐退休，精彩生活</p>
        <p className="hg-hero-desc">
          为即将迈入老年或者已经退休的老人提供养老生活的积极思想、创意和活动。
          帮助您在这个新的人生阶段充满喜悦和目的。
        </p>
        <Link href="/zh/login" className="hg-btn-primary">
          开始使用
        </Link>
      </section>

      <section className="hg-features">
        <h2>我们提供什么</h2>
        <div className="hg-grid">
          <div className="hg-card">
            <h3>活动</h3>
            <p>为老人设计的有趣活动。</p>
            <Link href="/zh/activities" className="hg-link">查看活动</Link>
          </div>
          <div className="hg-card">
            <h3>指南</h3>
            <p>澳大利亚退休生活的实用指南。</p>
            <Link href="/zh/guides" className="hg-link">阅读指南</Link>
          </div>
          <div className="hg-card">
            <h3>社区</h3>
            <p>与其他老人联系，分享经验。</p>
            <Link href="/zh/community" className="hg-link">加入社区</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
