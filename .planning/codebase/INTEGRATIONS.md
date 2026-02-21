# External Integrations

**Analysis Date:** 2026-01-17

## APIs & External Services

**Payment Processing:**
- Stripe - Primary payment gateway
  - SDK/Client: `stripe` v20.1.2
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
  - Implementation: `lib/stripe-sync.ts`
  - API Version: `2024-12-18.acacia`
  - Features: Checkout sessions, product sync, webhook handling

**AI Content Generation:**
- Google Gemini (via @google/genai SDK)
  - SDK/Client: `@google/genai` v1.35.0
  - Auth: `GEMINI_API_KEY`
  - Implementation: `lib/ai-services.ts`
  - Models: `gemini-2.5-flash` (text), `gemini-2.5-flash-image` (images)
  - Features: Article generation, SEO content, cover image generation

**Email Service:**
- Resend - Transactional email
  - SDK/Client: `resend` v6.6.0
  - Auth: `RESEND_API_KEY`
  - Implementation: `app/api/send-email/route.ts`
  - Config: `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`, `RESEND_DOMAIN`
  - Features: Contact form emails, HTML templates

**Analytics:**
- Vercel Analytics
  - SDK/Client: `@vercel/analytics` v1.3.1
  - Auth: Automatic via Vercel deployment
  - Features: Page views, web vitals

## Data Storage

**Databases:**
- PostgreSQL (primary database)
  - Connection: `DATABASE_URL`
  - Client: Prisma ORM (`@prisma/client` v6.9.0)
  - Schema: `prisma/schema.prisma`
  - Features: Full e-commerce data model with 25+ tables

**Object Storage:**
- MinIO (S3-compatible)
  - SDK/Client: `minio` v8.0.6
  - Implementation: `lib/minio.ts`
  - Connection: `MINIO_ENDPOINT`, `MINIO_PORT`
  - Auth: `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - SSL: `MINIO_USE_SSL`
  - Bucket: `MINIO_BUCKET_NAME` (default: "public")
  - Features: File upload, presigned URLs, file listing, deletion

**Caching:**
- Redis
  - SDK/Client: `ioredis` v5.8.2
  - Connection: `REDIS_URL`
  - Implementation: `lib/redis.ts`, `lib/cache.ts`
  - Features: Key-value caching, TTL support, pattern deletion, counters

## Authentication & Identity

**Auth Provider:**
- NextAuth.js v5 (beta)
  - Implementation: `lib/auth/config.ts`
  - Session Strategy: JWT (30-day expiry)

**Auth Methods:**
1. Credentials (Email/Password)
   - Password hashing: bcryptjs
   - Email verification required
   - Implementation: Database-backed via Prisma

2. Magic Link
   - Passwordless authentication
   - Token stored in User model (`verificationToken`, `verificationTokenExpiry`)
   - API: `app/api/auth/magic-link/send/route.ts`, `app/api/auth/magic-link/verify/route.ts`

3. Google OAuth
   - Provider: Google
   - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - Auto-creates user on first login

**Custom API Keys:**
- Bearer token authentication for external API access
- Implementation: `lib/api-auth.ts`
- Storage: Hashed keys in `ApiKey` database table
- Permissions: `read`, `write`, `checkout`, `webhooks`, `admin`
- Format: `nxts_<64-char-hex>`

## Monitoring & Observability

**Error Tracking:**
- Console logging (no dedicated error tracking service detected)

**Logs:**
- Prisma query logging (development mode)
- Console-based application logging

**Analytics:**
- Vercel Analytics for frontend metrics

## CI/CD & Deployment

**Hosting:**
- Vercel-compatible (detected @vercel/analytics)
- Turbopack for development (`next dev --turbo`)

**CI Pipeline:**
- Not detected in repository root

**Build Process:**
- `next build` for production
- `prisma generate` on postinstall

## Environment Configuration

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgres://..."

# Authentication
AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Stripe (Payment)
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# MinIO (Storage)
MINIO_ENDPOINT="..."
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY="..."
MINIO_SECRET_KEY="..."
MINIO_BUCKET_NAME="public"

# Redis (Cache)
REDIS_URL="redis://..."

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="..."
RESEND_TO_EMAIL="..."
```

**Optional Environment Variables:**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI Content Generation
GEMINI_API_KEY="..."

# Stripe Currency Override
STRIPE_CURRENCY="eur"
```

**Secrets Location:**
- `.env` file (local development)
- Environment variables in deployment platform

## Webhooks & Callbacks

**Incoming Webhooks:**
- Stripe Webhook: `POST /api/external/webhooks/stripe`
  - Events handled: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`
  - Signature verification: `STRIPE_WEBHOOK_SECRET`
  - Creates orders on successful payment

**Outgoing Webhooks:**
- None detected

## External API Endpoints

**External API (for storefronts):**
All external APIs require Bearer token authentication.

- `GET /api/external/products` - List products with regional pricing
- `GET /api/external/config` - Store configuration
- `POST /api/external/checkout` - Create Stripe checkout session
- `GET /api/external/coupons` - Validate coupons
- `GET /api/external/articles` - List articles
- `GET /api/external/articles/[slug]` - Get article by slug
- `POST /api/external/articles/generate` - Generate AI article
- `POST /api/external/articles/generate/batch` - Batch generate articles
- `POST /api/external/articles/keywords` - Generate keyword-targeted content

**CORS:**
- Enabled for external API routes
- Implementation: `lib/api-auth.ts` (`corsHeaders` function)

## Integration Patterns

**Stripe Product Sync:**
- Location: `lib/stripe-sync.ts`
- Syncs dashboard products to Stripe
- Creates/updates Stripe products and prices
- Archives products when deleted

**Redis Caching:**
- Location: `lib/cache.ts`
- TTL-based caching (default: 1 hour)
- Pattern-based cache invalidation
- Get-or-set pattern for cache-through reads

**MinIO File Management:**
- Location: `lib/minio.ts`
- Bucket auto-creation
- Public URL generation
- Presigned URL support for temporary access

---

*Integration audit: 2026-01-17*
