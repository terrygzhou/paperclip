import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '快乐退休，精彩生活 | HappyGrandma',
  description: '为即将迈入老年或者已经退休的老人提供养老生活的积极思想、创意和活动。',
};

export default function HomePage() {
  return (
    <main>
      <h1>欢迎来到 HappyGrandma</h1>
      <p>为即将迈入老年或者已经退休的老人提供养老生活的积极思想、创意和活动。</p>
    </main>
  );
}
