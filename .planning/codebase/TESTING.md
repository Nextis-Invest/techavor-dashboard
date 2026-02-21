# Testing Patterns

**Analysis Date:** 2026-01-17

## Test Framework

**Runner:**
- No testing framework configured
- No `jest.config.*` or `vitest.config.*` in project
- No test directories or test files in source code

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands defined in package.json
# Only available scripts:
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## Test File Organization

**Location:**
- No test files exist in the project
- No `__tests__` directories
- No `*.test.ts` or `*.spec.ts` files

**Naming:**
- Not established

**Structure:**
- Not established

## Current Testing Approach

**Manual Testing:**
- Application relies on manual testing
- No automated test coverage

**Type Checking:**
- TypeScript strict mode provides compile-time type safety
- Configured in `tsconfig.json` with `"strict": true`

**Linting:**
- ESLint via `next lint` provides code quality checks
- No custom ESLint rules configured

## Recommended Testing Setup

**Suggested Framework:** Vitest (compatible with Next.js 15, fast, ESM-native)

**Suggested Configuration:**
```typescript
// vitest.config.ts (recommended)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

**Suggested Directory Structure:**
```
__tests__/
  unit/
    lib/
      utils.test.ts
      cache.test.ts
    components/
      ui/
        button.test.tsx
  integration/
    api/
      products.test.ts
      categories.test.ts
```

## What to Test

**High Priority (Critical Paths):**
- `lib/utils.ts`: Pure functions like `formatCurrency`, `slugify`, `generateSKU`
- `lib/api/auth-middleware.ts`: Authentication logic and role checks
- `lib/cache.ts`: Cache utility functions
- API route handlers: Request validation, response formatting

**Medium Priority:**
- `lib/store/cart-store.ts`: Zustand store actions and computed values
- Form validation in page components
- Component rendering with different props

**Lower Priority:**
- UI components (already typed, visual testing may be more valuable)
- Layout components

## Suggested Test Patterns

**Unit Tests for Utilities:**
```typescript
// __tests__/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, slugify, generateSKU } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats MAD currency correctly', () => {
    expect(formatCurrency(1000, 'MAD')).toMatch(/1[,\s]?000/)
  })

  it('handles string input', () => {
    expect(formatCurrency('99.99', 'MAD')).toMatch(/99[.,]99/)
  })
})

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Test@Product#123')).toBe('testproduct123')
  })
})
```

**API Route Tests:**
```typescript
// __tests__/integration/api/categories.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/categories/route'
import { NextRequest } from 'next/server'

describe('GET /api/categories', () => {
  it('returns categories list', async () => {
    const request = new NextRequest('http://localhost/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('categories')
    expect(Array.isArray(data.categories)).toBe(true)
  })
})
```

**Store Tests:**
```typescript
// __tests__/unit/store/cart-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/store/cart-store'

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  it('adds item to cart', () => {
    const store = useCartStore.getState()
    store.addItem({
      productId: '1',
      name: 'Test Product',
      slug: 'test-product',
      price: 100,
      quantity: 1,
    })

    expect(store.items).toHaveLength(1)
  })

  it('calculates subtotal correctly', () => {
    const store = useCartStore.getState()
    store.addItem({
      productId: '1',
      name: 'Test',
      slug: 'test',
      price: 100,
      quantity: 2,
    })

    expect(store.getSubtotal()).toBe(200)
  })
})
```

## Mocking

**Framework:** Vitest built-in mocking (when implemented)

**Patterns:**
```typescript
// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

// Mock NextAuth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: '1', email: 'test@test.com', role: 'ADMIN' },
  }),
}))
```

**What to Mock:**
- Database calls (Prisma client)
- External services (Stripe, Redis, MinIO)
- Authentication (NextAuth session)

**What NOT to Mock:**
- Pure utility functions
- Zustand store (test real behavior)
- API response formatting

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// __tests__/fixtures/products.ts
export const mockProduct = {
  id: 'test-id',
  name: 'Test Product',
  slug: 'test-product',
  sku: 'SKU-TEST',
  price: 99.99,
  status: 'ACTIVE',
  categoryId: 'cat-id',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const createMockProduct = (overrides = {}) => ({
  ...mockProduct,
  id: `test-${Date.now()}`,
  ...overrides,
})
```

**Location:**
- `__tests__/fixtures/` for shared test data
- `__tests__/factories/` for factory functions

## Coverage

**Requirements:** Not enforced

**Suggested Targets:**
- `lib/` utilities: 90%+ coverage
- API routes: 80%+ coverage
- Components: 60%+ coverage

**View Coverage (when configured):**
```bash
npm run test:coverage
# or
vitest --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, store actions
- Approach: Isolated, fast, no external dependencies
- Location: `__tests__/unit/`

**Integration Tests:**
- Scope: API routes with mocked database
- Approach: Test request/response cycle
- Location: `__tests__/integration/`

**E2E Tests:**
- Framework: Not configured (Playwright recommended)
- Scope: Full user flows
- Would cover: Login, product creation, checkout

## Getting Started with Testing

**Step 1: Install Dependencies**
```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom vite-tsconfig-paths
```

**Step 2: Add to package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 3: Create vitest.config.ts**
- See suggested configuration above

**Step 4: Start with utility tests**
- `lib/utils.ts` is ideal first target
- Pure functions, no mocking needed

---

*Testing analysis: 2026-01-17*
