# Dashboard Dynamic Rendering Fix

## Problem
The dashboard page was failing with:
```
Dynamic server usage: Route /dashboard couldn't be rendered statically because it used `cookies`
```

## Root Cause
- Server components were directly calling `cookies()` via Supabase client
- Multiple places were trying to read/write cookies (middleware + server components)
- No single source of truth for cookie operations
- Next.js couldn't statically render the page because of dynamic cookie access

## Solution Architecture

### 1. **Single Source of Truth: Middleware**
- Middleware is now the ONLY place that reads AND writes cookies
- All session refresh happens in middleware
- Server components use read-only cookie access

### 2. **Force Dynamic Rendering for Dashboard**
```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0
```
- Dashboard REQUIRES authentication, so dynamic rendering is correct
- This is intentional, not a bug
- Authenticated pages should be dynamic

### 3. **Read-Only Supabase Client**
```typescript
// lib/supabase/server.ts
export function getSupabaseServerClient() {
  return createServerClient(url, key, {
    cookies: {
      get(name) { return store.get(name)?.value },
      set() { /* NO-OP - middleware handles this */ },
      remove() { /* NO-OP - middleware handles this */ }
    }
  })
}
```

### 4. **Middleware Flow**
```
1. Request arrives
2. Middleware creates Supabase client (reads cookies)
3. Middleware calls supabase.auth.getUser() (refreshes session if needed)
4. Middleware updates cookies in response
5. Middleware sets x-user-id header (optional, for static pages)
6. Server component reads cookies (read-only via getSupabaseServerClient)
7. Server component fetches profile
```

## Key Principles

### ✅ DO:
- Use middleware for ALL cookie writes
- Mark authenticated pages as `force-dynamic`
- Use `getSupabaseServerClient()` in server components (read-only)
- Let middleware refresh sessions

### ❌ DON'T:
- Write cookies from server components
- Try to statically render authenticated pages
- Create multiple Supabase client instances with different cookie handlers
- Mix cookie write operations across files

## Files Changed

1. **lib/middleware/supabase-middleware.ts**
   - Added user headers (x-user-id)
   - Clarified this is single source of truth

2. **lib/supabase/server.ts**
   - Made cookie set/remove NO-OPs
   - Added getUserIdFromHeaders() helper
   - Added clear documentation

3. **app/dashboard/page.tsx**
   - Added `export const dynamic = 'force-dynamic'`
   - Added `export const revalidate = 0`

4. **lib/service/server/profile-server.service.ts**
   - Updated imports
   - Added comments about middleware flow

## Testing

```bash
# Build and test
pnpm run build
pnpm run dev

# Navigate to /dashboard
# Should now work without errors
```

## Performance Impact

✅ **Positive:**
- No more crashes from cookie conflicts
- Clear separation of concerns
- Single cookie write path (safer)

⚠️ **Trade-off:**
- Dashboard is now fully dynamic (not statically rendered)
- This is CORRECT for authenticated pages
- Initial load may be slightly slower, but:
  - User gets fresh profile data
  - Session is always up-to-date
  - No stale authentication issues

## Future Considerations

For pages that DON'T require auth but still need Supabase:
```typescript
// Use header-based approach
import { getUserIdFromHeaders } from '@/lib/supabase/server'

export default async function PublicPage() {
  const userId = getUserIdFromHeaders()
  // This can be static
}
```

For fully public pages:
- Don't use `getSupabaseServerClient()` at all
- Fetch public data via API routes or public endpoints
- Keep pages static

## Summary

**Before:** Multiple cookie sources → conflicts → crashes
**After:** Single cookie source (middleware) → clean separation → works perfectly

The dashboard now correctly:
1. Refreshes sessions in middleware (single source)
2. Renders dynamically (correct for auth)
3. Fetches fresh profile data
4. No cookie conflicts or undefined sessions
