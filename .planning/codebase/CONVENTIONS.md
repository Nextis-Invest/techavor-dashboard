# Coding Conventions

**Analysis Date:** 2026-01-17

## Naming Patterns

**Files:**
- React components: PascalCase for component files (e.g., `Button.tsx`, `DashboardSidebar.tsx`)
- Pages: lowercase with Next.js App Router conventions (`page.tsx`, `layout.tsx`, `route.ts`)
- Utilities/Libraries: lowercase kebab-case or camelCase (`utils.ts`, `cart-store.ts`, `auth-middleware.ts`)
- API routes: `route.ts` in folder structure matching URL pattern

**Functions:**
- camelCase for all functions: `formatCurrency`, `fetchOrders`, `handleSubmit`
- React components: PascalCase function names (`DashboardPage`, `Button`)
- Event handlers: `handle` prefix (`handleSearch`, `handleSubmit`)
- Fetch functions: `fetch` prefix (`fetchCategories`, `fetchStats`, `fetchOrders`)
- Boolean getters: `is` prefix (`isActive`, `isAdmin`, `isAffiliate`)

**Variables:**
- camelCase for all variables: `formData`, `isLoading`, `searchParams`
- Constants: UPPER_SNAKE_CASE (`FREE_SHIPPING_THRESHOLD`, `SHIPPING_COST`)
- Status/config objects: UPPER_SNAKE_CASE keys (`ORDER_STATUS`, `PAYMENT_STATUS`)

**Types/Interfaces:**
- PascalCase for all types and interfaces (`DashboardStats`, `CartItem`, `AuthLevel`)
- Props interfaces: `ComponentNameProps` pattern (`DashboardSidebarProps`)
- API response types: descriptive names (`CheckoutRequest`, `AuthResult`)

## Code Style

**Formatting:**
- No explicit Prettier config detected - uses default Next.js formatting
- 2-space indentation
- Double quotes for JSX attributes, single quotes for imports
- Trailing commas in multi-line arrays/objects
- No semicolons at end of statements (mixed - some files use them)

**Linting:**
- ESLint via `next lint` command
- No custom `.eslintrc` in project root - uses Next.js defaults
- TypeScript strict mode enabled in `tsconfig.json`

## Import Organization

**Order:**
1. React and core library imports (`react`, `next/...`)
2. Third-party libraries (`@radix-ui/...`, `lucide-react`, `sonner`)
3. Internal absolute imports using `@/` alias (`@/components/...`, `@/lib/...`)
4. Relative imports (less common)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use `@/components/ui/...` for UI components
- Use `@/lib/...` for utilities and services
- Use `@/app/...` rarely (prefer relative within app directory)

**Examples:**
```typescript
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
```

## Error Handling

**Patterns:**
- API routes: Try-catch blocks with `console.error` logging and JSON error responses
- Consistent error response format: `{ error: "message" }` with appropriate status codes
- Client-side: Try-catch with `toast.error()` for user feedback
- Never expose internal error details to clients

**API Error Response Pattern:**
```typescript
try {
  // operation
} catch (error) {
  console.error("Descriptive context:", error)
  return NextResponse.json(
    { error: "User-friendly message" },
    { status: 500 }
  )
}
```

**Status Codes Used:**
- `400`: Bad Request (validation errors, missing required fields)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error (unexpected errors)
- `201`: Created (successful POST creating resource)

## Logging

**Framework:** `console.error` for errors, `console.log` rarely used

**Patterns:**
- Log errors with descriptive context: `console.error("Error fetching products:", error)`
- Prisma logging configured by environment: development shows queries, production shows errors only
- No structured logging library - simple console output

## Comments

**When to Comment:**
- JSDoc-style comments for utility functions explaining purpose and parameters
- Inline comments for non-obvious business logic
- Section separators in schema files using `// ==================== SECTION ====================`

**JSDoc/TSDoc:**
- Used in `lib/cache.ts` for cache utility functions
- Pattern includes `@param` and `@returns` annotations
- Used for middleware documentation in `lib/api/auth-middleware.ts`

**Example:**
```typescript
/**
 * Get a value from cache
 * @param key Cache key
 * @returns Cached value or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
```

## Function Design

**Size:**
- Most functions are focused and under 50 lines
- Larger page components can be 200-500 lines due to form handling

**Parameters:**
- Prefer object destructuring for multiple parameters
- Use TypeScript interfaces for complex parameter objects
- Default values provided inline

**Return Values:**
- API routes return `NextResponse.json()` with typed responses
- React Query pattern: return data objects with pagination metadata
- Utility functions return typed values with null for not-found cases

## Module Design

**Exports:**
- Named exports preferred over default exports for utilities
- Components use named exports: `export { Button, buttonVariants }`
- UI components export both component and variant helper

**Barrel Files:**
- Not heavily used - direct imports preferred
- UI components could use barrel files but currently use direct imports

## Component Patterns

**UI Components (shadcn/ui style):**
```typescript
function ComponentName({ className, ...props }: React.ComponentProps<'element'>) {
  return (
    <element
      data-slot="component-name"
      className={cn('base-classes', className)}
      {...props}
    />
  )
}
```

**Page Components:**
- Use `"use client"` directive for client-side interactivity
- State management with `useState` hooks
- Data fetching with `useEffect` and async functions
- Loading states with dedicated UI (Spinner/Loader2)

**Form Handling:**
- Direct state with `useState` for form data objects
- `handleSubmit` async functions for form submission
- `toast.success()` and `toast.error()` for feedback

## API Route Patterns

**GET Endpoints:**
```typescript
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    // Extract query params
    // Query database with Prisma
    return NextResponse.json({ data, pagination })
  } catch (error) {
    console.error("Context:", error)
    return NextResponse.json({ error: "Message" }, { status: 500 })
  }
}
```

**Protected POST/PUT/DELETE:**
```typescript
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    // Validate required fields
    // Perform operation
    return NextResponse.json({ resource }, { status: 201 })
  } catch (error) {
    console.error("Context:", error)
    return NextResponse.json({ error: "Message" }, { status: 500 })
  }
}, "admin")
```

## State Management

**Client State:**
- Zustand for global client state (`lib/store/cart-store.ts`)
- Pattern: create store with state and actions in single file
- Persist middleware for localStorage persistence

**Server State:**
- React Query (`@tanstack/react-query`) for API data
- Query client provider in dashboard layout

## Prisma Conventions

**Model Naming:**
- PascalCase for model names (`User`, `Product`, `Order`)
- Plural lowercase for table mapping: `@@map("users")`
- camelCase for field names with snake_case column mapping

**Relation Naming:**
- Descriptive relation names for clarity
- `@relation("RelationName")` for self-referential or ambiguous relations

**Enum Conventions:**
- UPPER_SNAKE_CASE for enum values
- Enums grouped at top of schema file

---

*Convention analysis: 2026-01-17*
