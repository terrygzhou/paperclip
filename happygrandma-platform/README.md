# HappyGrandma Platform

为即将迈入老年或者已经退休的老人提供养老生活的积极思想、创意和活动。

## Project Structure

- `server/` — Express API with TypeScript
- `ui/` — Next.js 14 App Router with i18n (zh/en)
- `packages/db/` — Drizzle ORM schema, migrations
- `docker-compose.yml` — Full stack orchestration (PostgreSQL, Redis, Directus)
- `.github/workflows/` — CI/CD pipelines

## Quick Start

```sh
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Tech Stack

- **Backend**: Express + TypeScript
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Cache**: Redis
- **CMS**: Directus (managed via Docker Compose)
- **Frontend**: Next.js 14 App Router + i18next (zh/en)
- **Payment**: Stripe (subscription sync)
- **AI**: OpenRouter (content generation & personalization)
