# Codebase Concerns

**Analysis Date:** 2026-01-17

## Tech Debt

**Magic Link 4-Digit Code Security:**
- Issue: Magic link uses a 4-digit numeric code with 15-minute expiry
- Files: `app/api/auth/magic-link/send/route.ts`
- Impact: Only 10,000 possible combinations makes brute force attacks feasible
- Fix approach: Increase to 6-8 digits or use alphanumeric codes; add rate limiting on verification endpoint

**Extensive Use of `any` Type:**
- Issue: 30+ occurrences of `: any` type across 19 files
- Files: `app/api/orders/route.ts`, `app/api/products/route.ts`, `app/api/dashboard/orders/route.ts`, `app/(dashboard)/products/[id]/page.tsx`, `lib/api/auth-middleware.ts`
- Impact: Bypasses TypeScript type safety, increases runtime error risk
- Fix approach: Define proper interfaces for all API request/response payloads and map functions

**Missing Notifications Implementation:**
- Issue: TODOs for SMS and email notifications never implemented
- Files: `app/api/orders/route.ts:128-129`
- Impact: Customers and admins don't receive order notifications
- Fix approach: Integrate Resend for email and a provider like Twilio for SMS

**Duplicate Order Number Generation Logic:**
- Issue: Order number generation duplicated in multiple places with different patterns
- Files: `app/api/orders/route.ts` (NS prefix), `app/api/external/webhooks/stripe/route.ts` (ORD- prefix)
- Impact: Inconsistent order numbering across payment methods
- Fix approach: Centralize order number generation in `lib/utils.ts`

**Hardcoded Country Code:**
- Issue: Country code hardcoded to "MA" (Morocco) in order creation
- Files: `app/api/orders/route.ts:72,84`
- Impact: Limits international expansion
- Fix approach: Accept country from request or determine from shipping address

## Known Bugs

**Inconsistent Prisma Schema vs API:**
- Symptoms: Order creation API references fields not in schema
- Files: `app/api/dashboard/orders/route.ts`, `app/(dashboard)/orders/page.tsx`
- Trigger: API references `shippingName`, `shippingPhone`, `shippingCity`, `shippingCost` but Order model uses `shippingAddressId` relation
- Workaround: May be accessing fields from included relations, but direct field access will fail

**Inventory Schema Mismatch:**
- Symptoms: Inventory adjust API references `quantity` but schema uses `quantityOnHand`
- Files: `app/api/inventory/adjust/route.ts`, `prisma/schema.prisma`
- Trigger: Stock adjustments may fail or operate on wrong field
- Workaround: Schema uses `quantityOnHand`, `quantityReserved`, `quantityAvailable` but API uses `quantity`, `reservedQuantity`

**StockAlert Unique Constraint Missing:**
- Symptoms: Code references composite unique key that may not exist
- Files: `app/api/inventory/adjust/route.ts:133-138`
- Trigger: Uses `productId_variantId_warehouseId` but schema only has indexes, no unique constraint
- Workaround: Upsert will fail; needs schema migration

## Security Considerations

**Exposed Production Secrets in .env:**
- Risk: Live Stripe keys, database credentials, MinIO keys in .env file
- Files: `.env`
- Current mitigation: .env is in .gitignore
- Recommendations: Rotate all exposed keys immediately; use environment-specific secret management

**AUTH_SECRET Not Properly Set:**
- Risk: AUTH_SECRET contains placeholder instruction text
- Files: `.env:9`
- Current mitigation: None
- Recommendations: Generate proper secret with `openssl rand -base64 32`

**Public Products API Without Authentication:**
- Risk: GET /api/products endpoint has no authentication
- Files: `app/api/products/route.ts:8`
- Current mitigation: Limited to read-only access
- Recommendations: Consider rate limiting; sensitive product data (cost prices) exposed

**CORS Allows Any Origin:**
- Risk: `corsHeaders()` function defaults to `"*"` for all origins
- Files: `lib/api-auth.ts:136`
- Current mitigation: Only applied to external API routes
- Recommendations: Implement origin whitelist for production

**Redis Connection Failure Handling:**
- Risk: Application may crash if Redis unavailable; throws on missing REDIS_URL
- Files: `lib/redis.ts:10-11`
- Current mitigation: Retry strategy implemented
- Recommendations: Add graceful degradation; cache operations should fail silently

**API Key Update Fire-and-Forget:**
- Risk: lastUsedAt update errors are silently swallowed
- Files: `lib/api-auth.ts:77-81`
- Current mitigation: Using `.catch(() => {})`
- Recommendations: Log failures for debugging; implement async queue for non-critical updates

## Performance Bottlenecks

**N+1 Query Potential in External Products:**
- Problem: Regional pricing query per product in list view
- Files: `app/api/external/products/route.ts:130-136`
- Cause: Conditional include based on region, may cause additional queries
- Improvement path: Always include regionalPrices, filter in application code

**Dashboard Stats Makes 14 Parallel Queries:**
- Problem: Stats endpoint fires 14 separate database queries
- Files: `app/api/dashboard/stats/route.ts:15-122`
- Cause: Separate count/aggregate for each metric
- Improvement path: Consolidate into raw SQL query; implement caching with Redis

**No Database Connection Pooling Configuration:**
- Problem: Default Prisma connection settings
- Files: `lib/prisma.ts`
- Cause: No explicit pool size configuration
- Improvement path: Configure connection pool for production load

## Fragile Areas

**Order Creation Flow:**
- Files: `app/api/orders/route.ts`, `app/api/external/webhooks/stripe/route.ts`
- Why fragile: Two separate order creation paths with different data handling; webhook creates order but doesn't create OrderItems
- Safe modification: Consolidate order creation into shared service function
- Test coverage: No test files found in project

**Stripe Webhook Order Creation:**
- Files: `app/api/external/webhooks/stripe/route.ts:59-104`
- Why fragile: Creates order without line items; no inventory deduction
- Safe modification: Parse Stripe session metadata for items; implement proper inventory management
- Test coverage: None

**Authentication Config Complexity:**
- Files: `lib/auth/config.ts`
- Why fragile: Magic link, password, and Google OAuth all in single authorize function; email verification logic duplicated
- Safe modification: Extract auth strategies into separate modules
- Test coverage: None

## Scaling Limits

**Redis Single Instance:**
- Current capacity: Single Redis connection
- Limit: Connection pool exhaustion under high load
- Scaling path: Implement Redis cluster; add connection pooling

**File Upload to MinIO:**
- Current capacity: Single bucket, synchronous uploads
- Limit: Large file uploads block request
- Scaling path: Implement presigned URL uploads; add CDN layer

**Session Storage:**
- Current capacity: JWT tokens with 30-day expiry
- Limit: No session revocation mechanism
- Scaling path: Implement token blacklist in Redis

## Dependencies at Risk

**Next-Auth Beta Version:**
- Risk: Using `next-auth@5.0.0-beta.29`, unstable API
- Impact: Breaking changes in future updates; limited community support for issues
- Migration plan: Monitor for stable 5.x release; prepare for API changes

**No Test Framework:**
- Risk: Zero test files in project
- Impact: Regressions undetected; refactoring risky
- Migration plan: Add Vitest or Jest; start with critical path tests

## Missing Critical Features

**No Rate Limiting:**
- Problem: All API endpoints lack rate limiting
- Blocks: Production deployment without DDoS protection

**No Request Validation:**
- Problem: API endpoints lack structured request validation
- Blocks: Consistent error handling; input sanitization
- Note: Zod is installed but not used for API validation

**No Logging Infrastructure:**
- Problem: Only console.error for errors
- Blocks: Production debugging; audit trails

**No Error Monitoring:**
- Problem: No Sentry or similar integration
- Blocks: Proactive error detection; crash reporting

## Test Coverage Gaps

**All Application Code:**
- What's not tested: Entire codebase has no test files
- Files: All `app/`, `lib/`, `components/` directories
- Risk: Any change could introduce undetected regressions
- Priority: High - critical for production readiness

**API Route Handlers:**
- What's not tested: All 30+ API routes
- Files: `app/api/**/*.ts`
- Risk: Business logic errors, authentication bypass
- Priority: High

**Authentication Flows:**
- What's not tested: Magic link, password login, OAuth
- Files: `lib/auth/config.ts`, `app/api/auth/**/*.ts`
- Risk: Security vulnerabilities, account takeover
- Priority: Critical

**Order Processing:**
- What's not tested: Order creation, status updates, inventory
- Files: `app/api/orders/*.ts`, `app/api/inventory/*.ts`
- Risk: Revenue loss, inventory discrepancies
- Priority: High

---

*Concerns audit: 2026-01-17*
