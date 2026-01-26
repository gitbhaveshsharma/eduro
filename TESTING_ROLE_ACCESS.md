# Testing Role-Based Access Control

## Quick Test Commands

### 1. Check Logs (Development Mode)

```bash
# Set development mode in your terminal
$env:NODE_ENV="development"

# Run your dev server
pnpm dev
```

### 2. Test Scenarios

#### Scenario A: Coach tries to access Teacher LMS route ❌

**URL:** `http://localhost:3000/lms/teacher/[any-center-id]`

**Expected:**

- 403 Access Denied page
- Shows "Your Role: Coach"
- Shows "Required Roles: Teacher, Admin, Super Admin"

**Console Output:**

```
[MIDDLEWARE] Processing request: /lms/teacher/[centerId]
[RouteProtector] Route config: pattern match found
  - pattern: /lms/teacher/*
[RouteProtector] Role-based authorization check
  - userRole: C
  - requiredRoles: [T, A, SA]
  - hasRequiredRole: false
[RouteProtector] Insufficient role permissions
```

#### Scenario B: Teacher tries to access Coach LMS route ❌

**URL:** `http://localhost:3000/lms/coach/branch-teachers`

**Expected:**

- 403 Access Denied page
- Shows "Your Role: Teacher"
- Shows "Required Roles: Coach, Admin, Super Admin"

#### Scenario C: Teacher accesses Teacher LMS route ✅

**URL:** `http://localhost:3000/lms/teacher/[their-center-id]`

**Expected:**

- Access granted
- Page loads normally

**Console Output:**

```
[MIDDLEWARE] Processing request: /lms/teacher/[centerId]
[RouteProtector] Route config: pattern match found
  - pattern: /lms/teacher/*
[RouteProtector] Role-based authorization check
  - userRole: T
  - requiredRoles: [T, A, SA]
  - hasRequiredRole: true
[RouteProtector] Route protection passed
```

#### Scenario D: Coach accesses Coach LMS route ✅

**URL:** `http://localhost:3000/lms/coach/branch-teachers`

**Expected:**

- Access granted
- Page loads normally

#### Scenario E: Admin accesses any protected route ✅

**URL:** Any `/lms/teacher/*`, `/lms/coach/*`, `/lms/student/*`, `/teacher/*`, `/coach/*`, `/manager/*` route

**Expected:**

- Access granted (Admin has access to all role-based routes)

---

## Testing with Browser DevTools

### Enable Middleware Logging

1. Open your `middleware.ts` file
2. Ensure `debug` is enabled:

   ```typescript
   enabled: true,
   debug: process.env.NODE_ENV === 'development',
   ```

3. Check browser console and terminal for logs

### Network Tab Check

1. Open DevTools → Network tab
2. Try accessing a restricted route
3. Check response:
   - Status: `403 Forbidden`
   - Preview: HTML error page with role information

### API Route Testing

Use Postman, curl, or fetch:

```bash
# Try to access teacher API as coach
curl -X GET http://localhost:3000/api/teacher/assignments \
  -H "Cookie: [your-auth-cookie]" \
  -v
```

**Expected Response:**

```json
{
  "error": "Insufficient permissions",
  "details": {
    "userRole": "C",
    "requiredRoles": ["T", "A", "SA"],
    "pathname": "/api/teacher/assignments"
  }
}
```

---

## What to Look For

### ✅ Working Correctly

- Coach sees 403 error on teacher routes
- Teacher sees 403 error on coach routes
- Error page shows correct role information
- Console logs show authorization check details
- API returns 403 with role details

### ❌ Still Broken (Report if you see this)

- Coach can access teacher routes
- No 403 error shown
- Error page missing role information
- Console shows "Suspicious request allowed"
- Access granted when it should be denied

---

## Common Routes to Test

### LMS Teacher Routes (T, A, SA only)

- `/lms/teacher/[centerId]`
- `/lms/teacher/[centerId]/classes`
- `/lms/teacher/[centerId]/students`

### LMS Coach Routes (C, A, SA only)

- `/lms/coach/branch-teachers`
- `/lms/coach/[anything]`

### LMS Student Routes (S, T, A, SA)

- `/lms/student/[centerId]`
- `/lms/student/[centerId]/classes`

### Teacher Routes (T, A, SA only)

- `/teacher/[centerId]`
- `/teacher/[centerId]/classes`
- `/teacher/[centerId]/students`
- `/api/teacher/*`

### Coach Routes (C, A, SA only)

- `/coach/branch-teachers`
- `/manager/[branchId]`
- `/settings/coaching-center`
- `/settings/coaching-center/[centerId]`

### Admin Routes (A, SA only)

- `/admin/*`
- `/api/admin/*`

### Public Routes (Everyone)

- `/coaching`
- `/coaching/[slug]`
- `/coaching-reviews`
- `/feed`
- `/network`

---

## Debug Mode

### Enable Verbose Logging

In [lib/middleware/config.ts](lib/middleware/config.ts):

```typescript
logging: {
  enabled: true,
  logLevel: 'debug',  // More verbose
  logRequests: true,  // Log all requests
  logResponses: true, // Log all responses
  logErrors: true,
  logSecurity: true,
}
```

### Check Specific Routes

Add temporary logging in [lib/middleware/route-protection.ts](lib/middleware/route-protection.ts):

```typescript
Logger.debug(
  `🔍 Checking route: ${pathname}`,
  {
    pattern: routeConfig.pattern,
    securityLevel: routeConfig.securityLevel,
    userRole: context.user?.role,
    allowedRoles: routeConfig.allowedRoles,
  },
  context
);
```

---

## Troubleshooting

### Problem: Coach can still access teacher routes

**Check:**

1. Clear browser cache and cookies
2. Verify middleware is running (check console logs)
3. Check user role in database/auth session
4. Verify route pattern in config matches actual URL

### Problem: No error logs appearing

**Check:**

1. `NODE_ENV=development` is set
2. `debug: true` in middleware config
3. `logRequests: true` in middleware config
4. Browser console is not filtered

### Problem: Wrong role showing in error page

**Check:**

1. Verify user role in Supabase `profiles` table
2. Check `x-user-role` header in middleware
3. Verify auth utils is reading role correctly

---

## Success Criteria

✅ All tests pass when:

- Coaches cannot access teacher routes
- Teachers cannot access coach routes
- Admins can access both
- Error pages show correct role information
- Console logs show proper authorization checks
- No "suspicious request allowed" bypass messages

---

## Need Help?

Check these files if issues persist:

1. [lib/middleware/route-protection.ts](lib/middleware/route-protection.ts) - Authorization logic
2. [lib/middleware/config.ts](lib/middleware/config.ts) - Route configurations
3. [lib/middleware/auth-utils.ts](lib/middleware/auth-utils.ts) - Role validation
4. [middleware.ts](middleware.ts) - Main middleware orchestration
