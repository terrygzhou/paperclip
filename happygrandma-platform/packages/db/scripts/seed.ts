/**
 * HappyGrandma Platform — HappyGrandma Content Seeder
 * Seeds the database with initial bilingual content
 */
import { defineSeed } from 'drizzle-seed';
import { db, schema } from '../src';
import { contentItems } from '../src/schema';

async function main() {
  console.log('🌱 Seeding HappyGrandma content...');

  // Seed initial content categories
  await db.insert(schema.contentCategories).values([
    {
      nameZn: '健康养生',
      nameEn: 'Health & Wellness',
      slugZn: 'jian-kang',
      slugEn: 'health',
      sortOrder: 1,
    },
    {
      nameZn: '休闲活动',
      nameEn: 'Leisure Activities',
      slugZn: 'xiu-xian',
      slugEn: 'leisure',
      sortOrder: 2,
    },
    {
      nameZn: '科技指南',
      nameEn: 'Tech Guide',
      slugZn: 'ke-ji',
      slugEn: 'tech',
      sortOrder: 3,
    },
  ]);

  console.log('✅ Seeded content categories');

  // Seed sample content
  await db.insert(schema.contentItems).values([
    {
      titleZn: '退休生活十个幸福秘诀',
      titleEn: '10 Secrets to a Happy Retirement Life',
      excerptZn: '探索退休生活中的幸福秘诀，从健康、社交到学习新技能。',
      excerptEn: 'Explore the secrets of happiness in retirement — from health and social connections to learning new skills.',
      bodyZn: JSON.stringify([
        { type: 'h2', children: [{ text: '退休第一步：心态转变' }] },
        { type: 'p', children: [{ text: '退休不是终点，而是新生活的起点。保持积极心态是幸福的关键。' }] },
      ]),
      bodyEn: JSON.stringify([
        { type: 'h2', children: [{ text: 'First Step: Mindset Shift' }] },
        { type: 'p', children: [{ text: 'Retirement is not an end, but the beginning of a new life.' }] },
      ]),
      type: 'article',
      status: 'published',
      publishedAt: new Date(),
      featured: true,
    },
    {
      titleZn: '悉尼公园散步路线图',
      titleEn: 'Sydney Park Walking Guide',
      excerptZn: '推荐悉尼最好的公园步道，适合老年人轻松行走。',
      excerptEn: 'Recommended best park trails in Sydney for easy walking for seniors.',
      bodyZn: JSON.stringify([{ type: 'p', children: [{ text: '悉尼拥有世界级的公园网络...' }] }]),
      bodyEn: JSON.stringify([{ type: 'p', children: [{ text: 'Sydney boasts world-class park networks...' }] }]),
      type: 'guide',
      status: 'published',
      publishedAt: new Date(),
    },
  ]);

  console.log('✅ Seeded sample content items');
  console.log('🎉 Seeding complete!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
