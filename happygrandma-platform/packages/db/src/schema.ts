import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, uuid, primaryKey, index, foreignKey, uniqueIndex } from 'drizzle-orm/pg-core';

// ── Users ──────────────────────────────────────────────────────────────────
// Accounts with accessibility settings, bilingual preference

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    role: varchar('role', { enum: ['admin', 'user', 'family_admin'] }).default('user').notNull(),
    // Accessibility
    font_size: integer('font_size').default(18).notNull(), // large default (px)
    high_contrast: boolean('high_contrast').default(true).notNull(),
    reduced_motion: boolean('reduced_motion').default(false).notNull(),
    language: varchar('language', { enum: ['zh', 'en'] }).default('zh').notNull(),
    // Auth
    emailVerified: boolean('email_verified').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index().on(t.email)]
);

// ── Profiles ───────────────────────────────────────────────────────────────
// Demographic data, emergency contacts, interests

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Demographics
    age: integer('age'),
    gender: varchar('gender', { enum: ['male', 'female', 'non_binary', 'prefer_not_say'] }),
    location: text('location'), // city, state in Australia
    languages: text('languages').array().default(['zh-CN']).notNull(), // languages spoken
    // Interests
    interests: jsonb('interests').default([]).notNull(), // array of interest categories
    // Emergency
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    emergencyContactRelation: text('emergency_contact_relation'),
    medicalNotes: text('medical_notes'), // text field for health info
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index().on(t.userId)]
);

// ── Content Categories ─────────────────────────────────────────────────────
// Bilingual category taxonomy with parent/child support

export const contentCategories = pgTable(
  'content_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    nameZn: text('name_zn').notNull(),
    nameEn: text('name_en').notNull(),
    slugZn: varchar('slug_zn', { length: 100 }).notNull(),
    slugEn: varchar('slug_en', { length: 100 }).notNull(),
    parentId: uuid('parent_id').references(() => contentCategories.id, { onDelete: 'set null' }),
    descriptionZn: text('description_zn'),
    descriptionEn: text('description_en'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex().on(t.slugZn),
    uniqueIndex().on(t.slugEn),
    index().on(t.parentId),
  ]
);

// ── Content Items ──────────────────────────────────────────────────────────
// Articles/activities/guides/videos with bilingual content

export const contentTypes = ['article', 'activity', 'guide', 'video'] as const;

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    titleZn: text('title_zn').notNull(),
    titleEn: text('title_en').notNull(),
    excerptZn: text('excerpt_zn'),
    excerptEn: text('excerpt_en'),
    bodyZn: jsonb('body_zn'), // rich text / markdown as JSON array
    bodyEn: jsonb('body_en'), // rich text / markdown as JSON array
    // Metadata
    type: varchar('content_type', { enum: contentTypes }).notNull(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id').references(() => contentCategories.id, { onDelete: 'set null' }),
    // SEO
    seoTitleZn: text('seo_title_zn'),
    seoTitleEn: text('seo_title_en'),
    seoDescriptionZn: text('seo_description_zn'),
    seoDescriptionEn: text('seo_description_en'),
    seoKeywordsZn: text('seo_keywords_zn'), // comma-separated
    seoKeywordsEn: text('seo_keywords_en'),
    coverImage: text('cover_image'), // URL
    // Publishing
    status: varchar('status', { enum: ['draft', 'published', 'archived'] }).default('draft').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    featured: boolean('featured').default(false).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index().on(t.status),
    index().on(t.type),
    index().on(t.categoryId),
    index().on(t.publishedAt),
    // Full-text search index on title + excerpt in both languages
    index('content_items_fts_idx').on(t.titleZn).using('gin', pgTable('pg_catalog', { tsvector: `to_tsvector('simple', coalesce(title_zn, '') || ' ' || coalesce(excerpt_zn, ''))` })),
    index('content_items_fts_en_idx').on(t.titleEn).using('gin', pgTable('pg_catalog', { tsvector: `to_tsvector('english', coalesce(title_en, '') || ' ' || coalesce(excerpt_en, ''))` })),
  ]
);

// ── Subscriptions ──────────────────────────────────────────────────────────
// Stripe-synced subscription status

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Stripe
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    // Status
    status: varchar('status', { enum: ['active', 'past_due', 'canceled', 'trialing'] }).default('active').notNull(),
    planId: varchar('plan_id', { length: 50 }),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true, mode: 'date' }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true, mode: 'date' }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    // Metadata
    features: jsonb('features'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index().on(t.userId),
    index().on(t.status),
    uniqueIndex('subscriptions_stripe_sub_idx').on(t.stripeSubscriptionId),
  ]
);

// ── Family Members ─────────────────────────────────────────────────────────
// Multi-account family sharing

export const familyMembers = pgTable(
  'family_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    parentId: uuid('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    memberUserId: uuid('member_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    relationship: varchar('relationship', { enum: ['spouse', 'child', 'grandchild', 'caregiver', 'other'] }).notNull(),
    role: varchar('role', { enum: ['viewer', 'co_admin'] }).default('viewer').notNull(),
    invitedAt: timestamp('invited_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('family_members_unique_pair_idx').on(t.parentId, t.memberUserId),
    index().on(t.parentId),
  ]
);

// ── Comments ───────────────────────────────────────────────────────────────
// Moderated content engagement with replies

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentItemId: uuid('content_item_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentCommentId: uuid('parent_comment_id').references(() => comments.id, { onDelete: 'cascade' }),
    body: jsonb('body').notNull(), // rich text / markdown
    // Moderation
    status: varchar('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending').notNull(),
    reported: boolean('reported').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index().on(t.contentItemId),
    index().on(t.userId),
    index().on(t.status),
  ]
);

// ── Newsletter Subscriptions ───────────────────────────────────────────────
// Email preference management

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    status: varchar('status', { enum: ['subscribed', 'unsubscribed', 'bounced'] }).default('subscribed').notNull(),
    // Preferences
    frequency: varchar('frequency', { enum: ['daily', 'weekly', 'biweekly'] }).default('weekly').notNull(),
    topics: jsonb('topics').default([]).notNull(), // array of topic slugs
    language: varchar('language', { enum: ['zh', 'en'] }).default('zh').notNull(),
    // Source
    source: text('source'),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index().on(t.email),
    index().on(t.status),
  ]
);

// ── Activity Logs ──────────────────────────────────────────────────────────
// Analytics and engagement tracking

export const activityTypes = ['page_view', 'content_read', 'comment_post', 'comment_like', 'subscription_start', 'subscription_cancel', 'newsletter_subscribe', 'newsletter_unsubscribe', 'login'] as const;

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: text('session_id'),
    type: varchar('activity_type', { enum: activityTypes }).notNull(),
    // Metadata
    data: jsonb('data'), // flexible event data
    // Context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    // Page context
    referrer: text('referrer'),
    path: text('path'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index().on(t.userId),
    index().on(t.type),
    index().on(t.createdAt),
  ]
);
