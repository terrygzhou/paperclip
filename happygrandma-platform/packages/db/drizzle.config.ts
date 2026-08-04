import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://happygrandma:happygrandma@localhost:5432/happygrandma',
  },
  verbose: true,
  strict: true,
});
