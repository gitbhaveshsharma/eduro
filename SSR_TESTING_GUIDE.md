# 🧪 SSR Authentication Testing Guide

## ⚠️ CRITICAL: Clean Slate Test Required

Before testing, you MUST clear all existing storage to ensure the new cookie-based system works correctly.

### Pre-Test Cleanup (Required)

1. **Open Chrome DevTools** → `Application` tab
2. **Clear Storage:**
   - ✅ Cookies
   - ✅ Local Storage  
   - ✅ Session Storage
3. **Click "Clear site data"**
4. **Hard refresh** the page (`Ctrl+Shift+R` or `Cmd+Shift+R`)

---

## 🔬 Test Scenarios

### Test 1: Fresh Login

1. Navigate to `/login`
2. Login with email OTP or OAuth
3. **Check Chrome DevTools → Application → Cookies**
4. **Expected Result:**
   ```
   Cookies should contain:
   ✅ sb-ixhlpassuqmqpzpumkuw-auth-token
   ✅ sb-ixhlpassuqmqpzpumkuw-auth-token.0
   ✅ sb-ixhlpassuqmqpzpumkuw-auth-token.1
   (and possibly more .2, .3, etc. chunks)
   ```
5. **Check Chrome DevTools → Application → Local Storage**
6. **Expected Result:**
   ```
   ❌ NO auth tokens in localStorage
   ❌ NO "sb-ixhlpassuqmqpzpumkuw-auth-token" in localStorage
   ```

### Test 2: Server Logs After Login

After successful login, check your **terminal/server logs**.

**Expected Output:**
```
[SUPABASE MIDDLEWARE] ✅ User authenticated: {
  userId: 'f604bdf3-4765-426f-b53d-3b2c69df7162',
  email: 'user@example.com'
}

[ProfileServerService] Fetching profile for user: f604bdf3-4765-426f-b53d-3b2c69df7162
[ProfileServerService] Profile fetched successfully

Dashboard: Profile fetched: SUCCESS
```

**Failure Indicators (These should NOT appear):**
```
❌ [SUPABASE MIDDLEWARE] ❌ No user session: Auth session missing!
❌ [ProfileServerService] No authenticated user
❌ Dashboard: Profile fetched: NULL
```

### Test 3: Page Refresh

1. After logging in, refresh the `/dashboard` page
2. **You should stay logged in** (no redirect to login)
3. Check server logs again
4. **Expected Result:**
   - Middleware finds session
   - Profile loads successfully
   - No authentication errors

### Test 4: New Tab

1. While logged in, open a **new tab**
2. Navigate to `http://localhost:3000/dashboard`
3. **Expected Result:**
   - You should be logged in (session persists across tabs)
   - Dashboard loads your profile
   - No login redirect

### Test 5: Middleware Cookie Detection

1. Refresh any protected page
2. Watch server logs for this output:

**Expected:**
```
[SUPABASE MIDDLEWARE] ✅ User authenticated: {
  userId: '...',
  email: '...'
}
```

**If you see this, something is wrong:**
```
❌ [SUPABASE MIDDLEWARE] ❌ No user session: Auth session missing!
```

---

## 🐛 Troubleshooting

### Issue: "Auth session missing!" in middleware

**Possible Causes:**
1. Old localStorage tokens still present
2. Cookies not being set by browser client
3. Browser blocking third-party cookies

**Solution:**
1. Clear ALL storage (see Pre-Test Cleanup)
2. Log out completely
3. Log in again
4. Check if cookies are set

### Issue: Profile shows NULL on dashboard

**Check:**
1. Server logs - does middleware find the user?
2. Chrome DevTools → Application → Cookies - are auth cookies present?
3. Network tab - is dashboard making requests with cookies?

**Solution:**
```bash
# Stop the dev server
# Clear .next cache
rm -rf .next

# Restart
pnpm dev
```

### Issue: Tokens still in localStorage

**Cause:** Browser client not properly migrated

**Check:**
- Are you importing from `@/lib/supabase/client`?
- Did you restart the dev server after changes?

**Solution:**
1. Hard refresh page
2. Clear site data
3. Log in again

### Issue: "Cannot find module '@/lib/supabase/client'"

**Cause:** TypeScript cache or build issues

**Solution:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Restart dev server
pnpm dev
```

---

## ✅ Success Criteria

Your SSR authentication is working correctly if:

- [x] Tokens stored in **cookies**, NOT localStorage
- [x] Middleware logs show "✅ User authenticated"
- [x] Server components load profile successfully
- [x] Dashboard shows your profile without errors
- [x] Page refresh maintains login state
- [x] New tabs inherit auth session
- [x] No "Auth session missing!" errors
- [x] No "Profile fetched: NULL" errors

---

## 📊 Before/After Comparison

### ❌ BEFORE (Broken):

**Browser:**
```
localStorage: {
  "sb-ixhlpassuqmqpzpumkuw-auth-token": "{...session...}"  ❌
}
Cookies: {
  "auth-storage": "..."  ❌ (Wrong format)
}
```

**Server Logs:**
```
[SUPABASE MIDDLEWARE] ❌ No user session: Auth session missing!
[ProfileServerService] No authenticated user
Dashboard: Profile fetched: NULL
```

### ✅ AFTER (Fixed):

**Browser:**
```
localStorage: {
  // Empty or unrelated data only
}
Cookies: {
  "sb-ixhlpassuqmqpzpumkuw-auth-token": "base64..."  ✅
  "sb-ixhlpassuqmqpzpumkuw-auth-token.0": "base64..."  ✅
  "sb-ixhlpassuqmqpzpumkuw-auth-token.1": "base64..."  ✅
}
```

**Server Logs:**
```
[SUPABASE MIDDLEWARE] ✅ User authenticated: {
  userId: 'f604bdf3-4765-426f-b53d-3b2c69df7162',
  email: 'user@example.com'
}
[ProfileServerService] Fetching profile for user: f604bdf3-4765-426f-b53d-3b2c69df7162
[ProfileServerService] Profile fetched successfully
Dashboard: Profile fetched: SUCCESS
```

---

## 🎯 Next Steps After Successful Test

Once authentication is working:

1. **Remove localStorage fallbacks** (if any remain in custom code)
2. **Update all client imports** to use `@/lib/supabase/client`
3. **Update all server imports** to use `@/lib/supabase/server`
4. **Consider removing** `lib/supabase.ts` entirely (marked deprecated)
5. **Test all protected routes** (feed, network, connections, etc.)
6. **Test all auth flows** (login, logout, OAuth, OTP)

---

## 📝 Verification Checklist

Run through this checklist to confirm everything works:

- [ ] Clear all browser storage
- [ ] Login successfully
- [ ] Verify cookies in DevTools (NOT localStorage)
- [ ] Check middleware logs show authentication
- [ ] Dashboard loads profile
- [ ] Refresh page maintains session
- [ ] Open new tab maintains session
- [ ] Logout clears cookies
- [ ] Login again works correctly
- [ ] OAuth login works (if applicable)
- [ ] OTP login works
- [ ] Protected routes block unauthenticated users
- [ ] API routes receive auth context

---

## 🆘 If All Else Fails

1. **Stop dev server**
2. **Delete these folders:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```
3. **Clear browser:**
   - All cookies
   - All localStorage
   - All sessionStorage
4. **Restart dev server:**
   ```bash
   pnpm dev
   ```
5. **Try logging in again**

If it still doesn't work, check:
- Environment variables are set correctly
- Supabase project is running
- No browser extensions blocking cookies
- Not in incognito/private mode (some modes block cookies)
