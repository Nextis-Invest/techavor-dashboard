# Technology Stack

**Analysis Date:** 2026-01-17

## Languages

**Primary:**
- TypeScript 5.x - All application code, API routes, components, utilities

**Secondary:**
- JavaScript - Configuration files (next.config.mjs, postcss.config.mjs)

## Runtime

**Environment:**
- Node.js (version managed by project, no .nvmrc detected)
- Next.js 15.1.4 App Router with React Server Components

**Package Manager:**
- pnpm (pnpm-lock.yaml present)
- Lockfile: Present (244KB)

## Frameworks

**Core:**
- Next.js 15.1.4 - Full-stack React framework with App Router
- React 19.0.0 - UI library (latest version)
- React DOM 19.0.0 - DOM rendering

**UI Framework:**
- Tailwind CSS 4.1.7 - Utility-first CSS framework
- shadcn/ui (new-york style) - Component library built on Radix UI
- Radix UI - Headless component primitives (25+ packages)

**State Management:**
- Zustand 5.0.9 - Client-side state management (`lib/store/cart-store.ts`)
- TanStack React Query 5.90.15 - Server state management and data fetching

**Data & Forms:**
- React Hook Form 7.60.0 - Form handling
- Zod 3.25.76 - Schema validation
- @hookform/resolvers 3.10.0 - Form validation integration

**ORM & Database:**
- Prisma 6.9.0 - Database ORM and query builder
- @prisma/client 6.9.0 - Prisma runtime client

## Key Dependencies

**Critical:**
- next-auth 5.0.0-beta.29 - Authentication (v5 beta with App Router support)
- stripe 20.1.2 - Payment processing SDK
- ioredis 5.8.2 - Redis client for caching
- minio 8.0.6 - S3-compatible object storage client
- bcryptjs 3.0.3 - Password hashing

**AI & Content:**
- @google/genai 1.35.0 - Google Gemini AI for content/image generation

**Email:**
- resend 6.6.0 - Transactional email service

**UI Components:**
- lucide-react 0.454.0 - Icon library
- recharts 2.15.4 - Charting library for analytics
- @tanstack/react-table 8.21.3 - Data table handling
- react-markdown 10.1.0 - Markdown rendering
- embla-carousel-react 8.5.1 - Carousel/slider
- cmdk 1.0.4 - Command palette
- react-day-picker 9.8.0 - Date picker
- sonner 1.7.4 - Toast notifications
- vaul 1.1.2 - Drawer component

**Utilities:**
- date-fns 4.1.0 - Date manipulation
- clsx 2.1.1 - Conditional classnames
- tailwind-merge 3.3.1 - Tailwind class merging
- class-variance-authority 0.7.1 - Component variant handling

**Analytics:**
- @vercel/analytics 1.3.1 - Vercel analytics integration

**Dev Dependencies:**
- @aws-sdk/client-s3 3.958.0 - AWS S3 SDK (dev, likely for type definitions)
- @tailwindcss/postcss 4.1.7 - Tailwind PostCSS plugin
- postcss 8.5.x - CSS processing
- TypeScript type definitions (@types/node, @types/react, @types/react-dom, @types/bcryptjs)

## Configuration

**Environment:**
- `.env` file with environment variables
- Environment variables for:
  - `DATABASE_URL` - PostgreSQL connection string
  - `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe configuration
  - `AUTH_SECRET`, `NEXTAUTH_URL` - NextAuth configuration
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME` - MinIO storage
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`, `RESEND_DOMAIN` - Email configuration
  - `REDIS_URL` - Redis connection string
  - `GEMINI_API_KEY` - Google AI (for content generation)

**Build:**
- `next.config.mjs` - Next.js configuration
  - TypeScript build errors ignored (`ignoreBuildErrors: true`)
  - Images unoptimized
  - Server-external packages: `@aws-sdk/client-s3`, `@prisma/client`, `stripe`, `bcryptjs`, `ioredis`, `minio`, `resend`
  - Optimized package imports: `lucide-react`, `date-fns`, `recharts`, `@tanstack/react-query`, `@tanstack/react-table`
- `tsconfig.json` - TypeScript configuration
  - ES6 target, ESNext module
  - Strict mode enabled
  - Path alias: `@/*` maps to project root
- `postcss.config.mjs` - PostCSS with Tailwind plugin
- `components.json` - shadcn/ui configuration (new-york style, CSS variables, Lucide icons)

**Scripts:**
```bash
pnpm dev          # Development with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run Next.js linting
pnpm postinstall  # Generate Prisma client
```

## Platform Requirements

**Development:**
- Node.js (compatible with Next.js 15)
- pnpm package manager
- PostgreSQL database (external, connection via DATABASE_URL)
- Redis server (external, connection via REDIS_URL)
- MinIO/S3-compatible storage (external)

**Production:**
- Node.js runtime
- PostgreSQL database
- Redis for caching
- MinIO/S3 for file storage
- Vercel-compatible (has @vercel/analytics integration)

## Database

**Provider:**
- PostgreSQL (via Prisma)

**Schema Location:**
- `prisma/schema.prisma`

**Key Models:**
- User, Address - User management
- Product, ProductVariant, ProductImage, ProductAttribute - Product catalog
- Category - Product categorization
- Order, OrderItem - Order management
- Inventory, Warehouse, StockMovement, StockAlert - Inventory management
- Coupon, CouponUsage - Discount system
- CartItem, WishlistItem - Shopping features
- StoreSettings - Store configuration
- PricingRegion, ProductRegionPrice - Multi-region pricing
- ApiKey - External API access
- Article - Blog/CMS content

---

*Stack analysis: 2026-01-17*
