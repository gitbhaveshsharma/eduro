# Avatar/Image Display Fix for Production

## Problem Summary

In production, all avatars and images were displaying incorrectly:

1. User avatars showed the same initials for everyone (not their actual avatars)
2. Coaching center logos were not loading properly
3. Gravatar/RoboHash avatars worked on localhost but not in production

## Root Causes Identified

### 1. Node.js `crypto` Module in Browser (Critical)

The `avatar.utils.ts` was importing `crypto` from Node.js:

```typescript
import crypto from "crypto";
// ...
crypto.createHash("md5").update(input).digest("hex");
```

This doesn't work in the browser environment, causing silent failures and all avatars falling back to the same default.

### 2. Avatar Proxy Missing Supabase Storage URLs

The avatar proxy (`/api/avatar-proxy`) only allowed:

- gravatar.com
- robohash.org
- ui-avatars.com

But NOT Supabase storage URLs, causing coaching logos stored in Supabase to fail.

### 3. JSON Parsing for AvatarConfig

The `avatar_url` field can be stored as:

- An `AvatarConfig` object: `{ type: 'gravatar_monster', uniqueString: 'abc123' }`
- A JSON string of the above
- A legacy URL string

The code wasn't properly parsing JSON strings from the database.

## Fixes Applied

### 1. Replaced Node.js `crypto` with Browser-Compatible Solution

**File:** `lib/utils/avatar.utils.ts`

- Removed `import crypto from 'crypto';`
- Added Web Crypto API fallback with simple hash function
- Made `generateUniqueString()` synchronous and browser-safe

### 2. Updated Avatar Proxy to Allow Supabase Storage

**File:** `pages/api/avatar-proxy.ts`

```typescript
const allowedHosts = [
  "gravatar.com",
  "www.gravatar.com",
  "robohash.org",
  "www.robohash.org",
  "ui-avatars.com",
  "www.ui-avatars.com",
  "ixhlpassuqmqpzpumkuw.supabase.co", // Your Supabase storage
];

// Also allow any *.supabase.co domain
const supabaseStoragePattern = /^[a-z0-9]+\.supabase\.co$/i;
```

### 3. Enhanced Avatar Configuration Parsing

**File:** `lib/utils/avatar.utils.ts`

The `getAvatarConfig()` method now properly handles:

- Direct `AvatarConfig` objects
- JSON-stringified `AvatarConfig`
- Legacy URL strings

### 4. Added Safe Avatar URL Helper

**File:** `lib/utils/avatar.utils.ts`

New method `getSafeAvatarUrl()` that:

- Always returns a valid URL string
- Handles all avatar_url formats safely
- Applies proxy when needed in production
- Provides proper fallbacks with initials

### 5. Updated Coaching Utils for Logo/Cover URLs

**File:** `lib/utils/coaching.utils.ts`

- `getLogoUrl()` now applies proxy for Supabase storage URLs
- `getCoverUrl()` now applies proxy for Supabase storage URLs

### 6. Fixed Direct Avatar Usage in Components

Updated components that were using `avatar_url` directly without proper handling:

- `enroll-student-dialog.tsx`
- `create-class-dialog.tsx`
- `edit-class-dialog.tsx`
- `dashboard.tsx` (attendance)
- `attendance-table.tsx`

## How the Fix Works

1. **On Localhost**: Images load directly from external services (no proxy needed)
2. **In Production**:
   - External avatar URLs (Gravatar, RoboHash, ui-avatars) go through `/api/avatar-proxy`
   - Supabase storage URLs also go through the proxy
   - Proxy adds proper CORS headers for embedded images

## Configuration

The proxy is automatically enabled in production. To override:

- Set `NEXT_PUBLIC_AVATAR_PROXY=true` to force proxy in development
- Set `NEXT_PUBLIC_AVATAR_PROXY=false` to disable proxy in production

## Files Modified

1. `lib/utils/avatar.utils.ts` - Main avatar utility (browser-compatible crypto, JSON parsing, safe URL helper)
2. `lib/utils/profile.utils.ts` - Profile URL utilities (uses AvatarUtils properly)
3. `lib/utils/coaching.utils.ts` - Coaching URL utilities (proxy for storage URLs)
4. `pages/api/avatar-proxy.ts` - API proxy (added Supabase domains)
5. `app/(coach-lms)/coach/branch-students/_components/enroll-student-dialog.tsx`
6. `app/(coach-lms)/coach/branch-classes/_components/create-class-dialog.tsx`
7. `app/(coach-lms)/coach/branch-classes/_components/edit-class-dialog.tsx`
8. `app/(coach-lms)/coach/student-attendance/_components/dashboard.tsx`
9. `app/(coach-lms)/coach/student-attendance/_components/attendance-table.tsx`

## Testing Checklist

- [ ] User avatars display correctly on Network page
- [ ] User avatars display correctly on Profile page
- [ ] Gravatar-style avatars (monsters, robots, retro) show properly
- [ ] RoboHash avatars (cats, sexy robots, robo) show properly
- [ ] Coaching center logos display on search page
- [ ] Coaching center logos display on profile page
- [ ] Users without avatars show proper initials fallback
- [ ] Avatar selection in settings works
- [ ] Works on both localhost and production (Netlify)
