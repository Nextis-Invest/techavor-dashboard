# Architecture

**Analysis Date:** 2026-01-17

## Pattern Overview

**Overall:** Next.js 15 App Router with Full-Stack Monolith

**Key Characteristics:**
- Server-first architecture using Next.js App Router with React Server Components
- Role-based access control (RBAC) with admin-protected dashboard
- Dual API surface: internal dashboard APIs and external headless commerce APIs
- Prisma ORM for type-safe database access with PostgreSQL
- JWT-based authentication via NextAuth.js v5

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction handling
- Location: `app/(dashboard)/`, `app/(auth)/`, `components/`
- Contains: React Server Components, Client Components, UI primitives
- Depends on: API routes, lib utilities, Zustand stores
- Used by: End users (admin dashboard)

**API Layer:**
- Purpose: HTTP request handling, business logic orchestration
- Location: `app/api/`
- Contains: Route handlers (38 endpoints), middleware wrappers
- Depends on: Prisma client, auth utilities, external services (Stripe)
- Used by: Dashboard pages (internal), external storefronts (headless)

**Authentication Layer:**
- Purpose: User authentication, session management, authorization
- Location: `lib/auth/`
- Contains: NextAuth.js configuration, session utilities, middleware
- Depends on: Prisma client, bcryptjs
- Used by: All protected routes, API middleware

**Data Access Layer:**
- Purpose: Database operations, ORM abstraction
- Location: `lib/prisma.ts`, `prisma/schema.prisma`
- Contains: Prisma client singleton, schema definitions
- Depends on: PostgreSQL database
- Used by: API routes, server components, auth layer

**Caching Layer:**
- Purpose: Performance optimization, session storage
- Location: `lib/redis.ts`, `lib/cache.ts`
- Contains: Redis client, cache utilities (get/set/delete patterns)
- Depends on: Redis server
- Used by: API routes for data caching

**State Management Layer:**
- Purpose: Client-side state for cart and UI
- Location: `lib/store/`
- Contains: Zustand stores with persistence
- Depends on: Browser localStorage
- Used by: Client components

## Data Flow

**Dashboard Page Load:**

1. User navigates to dashboard route
2. `app/(dashboard)/layout.tsx` calls `getCurrentUser()` from `lib/auth/session.ts`
3. If unauthenticated or non-admin, redirect to `/login`
4. Layout renders `DashboardProviders` with React Query + Theme providers
5. Page component fetches data via internal API routes
6. API routes validate session via `withAuth()` middleware
7. Prisma queries database, returns JSON response

**External API Request:**

1. External store sends request with `Authorization: Bearer <api_key>`
2. `lib/api-auth.ts` validates API key against `ApiKey` table
3. Permission check (read/write/checkout/admin)
4. Handler executes business logic with Prisma
5. Response includes CORS headers for cross-origin access

**Authentication Flow:**

1. User submits credentials or uses Google OAuth
2. NextAuth.js validates via `lib/auth/config.ts` authorize callback
3. JWT created with user id, email, role
4. Session stored as HTTP-only cookie
5. Subsequent requests include session via `auth()` helper

**State Management:**
- Server state: React Query with 60s stale time
- Client state: Zustand with localStorage persistence (cart)
- Theme state: next-themes provider

## Key Abstractions

**Route Handler Pattern:**
- Purpose: Standardized API endpoint structure
- Examples: `app/api/products/route.ts`, `app/api/external/products/route.ts`
- Pattern: Export named functions (GET, POST, PUT, DELETE) with NextRequest/NextResponse

**Auth Middleware:**
- Purpose: Protect routes with role-based access
- Examples: `lib/api/auth-middleware.ts`
- Pattern: Higher-order function `withAuth(handler, level)` wrapping route handlers

**API Key Authentication:**
- Purpose: Secure external API access for headless commerce
- Examples: `lib/api-auth.ts`
- Pattern: Bearer token validation with hashed key lookup, permission checking

**Prisma Singleton:**
- Purpose: Prevent multiple database connections in development
- Examples: `lib/prisma.ts`
- Pattern: Global instance with conditional HMR handling

**UI Component System:**
- Purpose: Consistent design system with Radix primitives
- Examples: `components/ui/button.tsx`, `components/ui/card.tsx`
- Pattern: CVA variants with cn() utility for class merging

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: All page requests
- Responsibilities: HTML structure, fonts, Toaster provider

**Dashboard Layout:**
- Location: `app/(dashboard)/layout.tsx`
- Triggers: All `/` routes (dashboard group)
- Responsibilities: Auth check, admin validation, sidebar/header, providers

**Auth Layout:**
- Location: `app/(auth)/layout.tsx`
- Triggers: `/login`, `/register`, `/verify-magic-link`
- Responsibilities: Centered auth form container

**API Auth Handler:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: `/api/auth/*` requests
- Responsibilities: NextAuth.js route handling

**External API Endpoints:**
- Location: `app/api/external/`
- Triggers: External store API calls
- Responsibilities: Headless commerce (products, checkout, coupons)

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**
- API routes: try/catch with structured error responses `{ error: string, code?: string }`
- Auth middleware: Returns 401/403 with error messages
- Client components: useEffect error states, loading states
- External APIs: CORS-aware error responses with status codes

## Cross-Cutting Concerns

**Logging:**
- Prisma: Conditional query logging in development
- Redis: Connection event logging
- API errors: console.error with context

**Validation:**
- Schema: Zod validation on request bodies
- Auth: Role-based permission checks
- API keys: SHA-256 hashed comparison

**Authentication:**
- Method: NextAuth.js v5 with JWT strategy
- Providers: Google OAuth, Credentials (password + magic link)
- Session: 30-day expiry, HTTP-only cookies
- Roles: CUSTOMER, AFFILIATE, ADMIN

**Internationalization:**
- Default locale: fr-MA (French/Morocco)
- Currency formatting: Intl.NumberFormat with configurable locale
- Date formatting: Intl.DateTimeFormat

---

*Architecture analysis: 2026-01-17*
