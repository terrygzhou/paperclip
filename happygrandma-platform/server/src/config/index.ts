// Server configuration — shared between server and UI
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || null,
  dbPoolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
  dbConnectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  dbIdleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  // OpenRouter (AI content generation)
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openrouterModel: process.env.OPENROUTER_MODEL || 'qwen/qwen3.6-32b',
  // JWT / Session
  sessionSecret: process.env.SESSION_SECRET || 'happygrandma-dev-secret-change-in-prod',
  jwtSecret: process.env.JWT_SECRET || 'happygrandma-jwt-secret-change-in-prod',
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3100'],
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  // Timezone
  timezone: process.env.TIMEZONE || 'Australia/Sydney',
  // File uploads
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10),
};
