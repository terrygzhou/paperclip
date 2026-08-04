export {
  // Tables
  users,
  profiles,
  contentCategories,
  contentItems,
  subscriptions,
  familyMembers,
  comments,
  newsletterSubscriptions,
  activityLogs,
  // Enums / Types
  contentTypes,
  activityTypes,
} from './schema';

// ── Types ──────────────────────────────────────────────────────────────────
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

// Infer types from schema
export type User = InferSelectModel<typeof users.$inferSelect>;
export type NewUser = InferInsertModel<typeof users.$inferInsert>;
export type Profile = InferSelectModel<typeof profiles.$inferSelect>;
export type NewProfile = InferInsertModel<typeof profiles.$inferInsert>;
export type ContentCategory = InferSelectModel<typeof contentCategories.$inferSelect>;
export type NewContentCategory = InferInsertModel<typeof contentCategories.$inferInsert>;
export type ContentItem = InferSelectModel<typeof contentItems.$inferSelect>;
export type NewContentItem = InferInsertModel<typeof contentItems.$inferInsert>;
export type Subscription = InferSelectModel<typeof subscriptions.$inferSelect>;
export type NewSubscription = InferInsertModel<typeof subscriptions.$inferInsert>;
export type FamilyMember = InferSelectModel<typeof familyMembers.$inferSelect>;
export type NewFamilyMember = InferInsertModel<typeof familyMembers.$inferInsert>;
export type Comment = InferSelectModel<typeof comments.$inferSelect>;
export type NewComment = InferInsertModel<typeof comments.$inferInsert>;
export type NewsletterSubscription = InferSelectModel<typeof newsletterSubscriptions.$inferSelect>;
export type NewNewsletterSubscription = InferInsertModel<typeof newsletterSubscriptions.$inferInsert>;
export type ActivityLog = InferSelectModel<typeof activityLogs.$inferSelect>;
export type NewActivityLog = InferInsertModel<typeof activityLogs.$inferInsert>;

// ── DB Client ──────────────────────────────────────────────────────────────
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE || '20', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
});

export const db = drizzle(pool, { schema });

// Export schema for migrations
export { schema };
