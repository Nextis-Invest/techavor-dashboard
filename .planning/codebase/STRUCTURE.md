# Codebase Structure

**Analysis Date:** 2026-01-17

## Directory Layout

```
ecom-dashboard/
├── app/                    # Next.js App Router pages and API
│   ├── (auth)/             # Auth route group (login, register)
│   ├── (dashboard)/        # Admin dashboard route group
│   └── api/                # API route handlers
├── components/             # React components
│   ├── dashboard/          # Dashboard-specific components
│   └── ui/                 # Shadcn/Radix UI primitives
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and services
│   ├── api/                # API utilities
│   ├── auth/               # Auth configuration
│   └── store/              # Zustand stores
├── prisma/                 # Database schema and migrations
├── scripts/                # CLI utility scripts
├── types/                  # TypeScript type definitions
└── .planning/              # Planning documents
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js 15 App Router with pages and API routes
- Contains: Layouts, pages, route handlers, providers
- Key files: `layout.tsx`, `globals.css`

**`app/(auth)/`:**
- Purpose: Authentication pages grouped without URL prefix
- Contains: Login, register, magic link verification pages
- Key files: `login/page.tsx`, `register/page.tsx`, `layout.tsx`

**`app/(dashboard)/`:**
- Purpose: Admin dashboard pages grouped at root URL
- Contains: Dashboard home, products, orders, customers, settings
- Key files: `page.tsx`, `layout.tsx`, `providers.tsx`

**`app/api/`:**
- Purpose: Backend API endpoints (38 routes)
- Contains: RESTful handlers for dashboard and external APIs
- Key files: `auth/[...nextauth]/route.ts`, `external/products/route.ts`

**`app/api/external/`:**
- Purpose: Headless commerce API for external storefronts
- Contains: Products, checkout, coupons, webhooks, articles
- Key files: `products/route.ts`, `checkout/route.ts`

**`app/api/dashboard/`:**
- Purpose: Internal dashboard-only API endpoints
- Contains: Stats, orders, customers
- Key files: `stats/route.ts`, `orders/route.ts`

**`components/`:**
- Purpose: Reusable React components
- Contains: UI primitives, dashboard components
- Key files: `logo.tsx`, `sign-in.tsx`

**`components/ui/`:**
- Purpose: Shadcn UI component library (56 components)
- Contains: Radix-based primitives with CVA styling
- Key files: `button.tsx`, `card.tsx`, `dialog.tsx`, `sidebar.tsx`

**`components/dashboard/`:**
- Purpose: Dashboard-specific composite components
- Contains: Sidebar, header, navigation
- Key files: `sidebar.tsx`, `site-header.tsx`

**`hooks/`:**
- Purpose: Custom React hooks
- Contains: Mobile detection, other utilities
- Key files: `use-mobile.ts`

**`lib/`:**
- Purpose: Core utilities and service integrations
- Contains: Database, cache, auth, storage, external services
- Key files: `prisma.ts`, `utils.ts`, `redis.ts`, `cache.ts`

**`lib/auth/`:**
- Purpose: Authentication configuration and utilities
- Contains: NextAuth config, session helpers
- Key files: `config.ts`, `session.ts`

**`lib/api/`:**
- Purpose: API middleware and utilities
- Contains: Auth middleware, helpers
- Key files: `auth-middleware.ts`

**`lib/store/`:**
- Purpose: Client-side state management
- Contains: Zustand stores with persistence
- Key files: `cart-store.ts`

**`prisma/`:**
- Purpose: Database schema and migrations
- Contains: Prisma schema, migration history
- Key files: `schema.prisma`

**`scripts/`:**
- Purpose: CLI utility scripts
- Contains: Admin creation, data seeding
- Key files: `create-admin.ts`

**`types/`:**
- Purpose: TypeScript type augmentations
- Contains: NextAuth module declarations
- Key files: `next-auth.d.ts`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout with fonts and toaster
- `app/(dashboard)/layout.tsx`: Dashboard layout with auth guard
- `app/(auth)/layout.tsx`: Auth pages layout

**Configuration:**
- `next.config.mjs`: Next.js configuration
- `tsconfig.json`: TypeScript configuration
- `components.json`: Shadcn UI configuration
- `prisma/schema.prisma`: Database schema (705 lines, 25+ models)

**Core Logic:**
- `lib/auth/config.ts`: NextAuth.js configuration with providers
- `lib/api-auth.ts`: External API key authentication
- `lib/api/auth-middleware.ts`: Dashboard API auth middleware
- `lib/prisma.ts`: Prisma client singleton

**State Management:**
- `lib/store/cart-store.ts`: Zustand cart store with persistence
- `app/(dashboard)/providers.tsx`: React Query + Theme providers

**Utilities:**
- `lib/utils.ts`: cn(), formatCurrency(), formatDate(), slugify()
- `lib/cache.ts`: Redis cache utilities
- `lib/currencies.ts`: Currency locale mapping

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `site-header.tsx`)
- Route handlers: `route.ts`
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Hooks: `use-[name].ts` (e.g., `use-mobile.ts`)
- Stores: `[name]-store.ts` (e.g., `cart-store.ts`)
- Utilities: `kebab-case.ts` (e.g., `api-auth.ts`)

**Directories:**
- Route groups: `(group-name)` (e.g., `(dashboard)`, `(auth)`)
- Dynamic routes: `[param]` (e.g., `[id]`, `[slug]`)
- Catch-all routes: `[...param]` (e.g., `[...nextauth]`)

**Functions:**
- Components: PascalCase (e.g., `DashboardSidebar`)
- Hooks: camelCase with `use` prefix (e.g., `useIsMobile`)
- Utilities: camelCase (e.g., `formatCurrency`, `validateApiKey`)
- API handlers: UPPERCASE HTTP method (e.g., `GET`, `POST`)

**Variables:**
- Constants: SCREAMING_SNAKE_CASE (e.g., `FREE_SHIPPING_THRESHOLD`)
- Interfaces/Types: PascalCase (e.g., `CartItem`, `DashboardStats`)
- Enums (Prisma): PascalCase values (e.g., `OrderStatus.PENDING`)

## Where to Add New Code

**New Dashboard Page:**
- Primary code: `app/(dashboard)/[feature]/page.tsx`
- Layout (if needed): `app/(dashboard)/[feature]/layout.tsx`
- Tests: Not currently implemented

**New API Endpoint:**
- Dashboard API: `app/api/[resource]/route.ts`
- External API: `app/api/external/[resource]/route.ts`
- Use `withAuth()` middleware for dashboard APIs
- Use `validateApiKey()` for external APIs

**New UI Component:**
- Shadcn primitive: `components/ui/[component].tsx`
- Dashboard component: `components/dashboard/[component].tsx`
- Use CVA for variants, cn() for class merging

**New React Hook:**
- Location: `hooks/use-[name].ts`
- Pattern: Follow `use-mobile.ts` structure

**New Utility Function:**
- General utils: Add to `lib/utils.ts`
- Domain-specific: Create `lib/[domain].ts`

**New Zustand Store:**
- Location: `lib/store/[name]-store.ts`
- Pattern: Follow `cart-store.ts` with persist middleware

**New Database Model:**
- Schema: Add to `prisma/schema.prisma`
- Run: `npx prisma generate` then `npx prisma db push`

**New Type Augmentation:**
- Location: `types/[module].d.ts`
- Pattern: Follow `next-auth.d.ts`

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`node_modules/`:**
- Purpose: Package dependencies
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: Project planning documents
- Generated: No
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code configuration
- Generated: No
- Committed: Project-dependent

**`prisma/migrations/`:**
- Purpose: Database migration history
- Generated: Via `prisma migrate`
- Committed: Yes

---

*Structure analysis: 2026-01-17*
