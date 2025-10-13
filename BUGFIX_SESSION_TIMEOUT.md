# Critical Bug Fix: Session Timeout on Idle

## Problem Description

When users open the website and wait 10-20 seconds before performing any CRUD operation (like updating role), the operation gets stuck in "Updating..." state and never completes. Refreshing the browser fixes it temporarily, but the issue returns after waiting again.

## Update: Second Issue - Multiple Event Listeners

After the initial fix, we discovered another problem: **duplicate event listeners** were being attached, causing excessive validation calls and interfering with Supabase's built-in auto-refresh mechanism.

**Symptoms:**
- Multiple `[AUTH-SESSION] Window focused, validating session` logs
- GoTrueClient lock acquisition spam in console
- Session validation being triggered multiple times per second

## Root Cause Analysis

### The Issue
1. **Stale Session in localStorage**: Supabase's `auth.getSession()` returns cached sessions from localStorage without verifying if the access token is still valid
2. **Token Expiration**: After 10-20 seconds of inactivity, the JWT access token may expire or become stale
3. **Failed Validation**: The `validateSession()` function only checked if a session exists, not if the token is actually valid
4. **Silent Failures**: API requests with expired tokens fail silently, causing operations to hang indefinitely

### The Problem Chain
```
User waits 10-20s → Token expires in background → 
User clicks "Update" → validateSession() gets stale session from localStorage → 
"Valid" but expired token used → Request hangs/fails → Stuck on "Updating..."
```

## Solution Implemented (Final Version)

### Phase 1: Fixed Stale Session Issue

**1. Fixed Supabase Client Configuration** (`lib/supabase.ts`)
- Removed custom storage implementation that interfered with Supabase's session management
- Let Supabase handle its own storage automatically

**2. Enhanced Session Validation** (`lib/auth-session.ts`)
- Changed validation strategy to trust Supabase's auto-refresh
- Only manually refresh when token is < 1 minute from expiry
- Reduced aggressive validation calls

### Phase 2: Fixed Event Listener Spam

**3. Prevent Duplicate Event Listeners** (`lib/auth-session.ts`)

**Problem:** Every time the module reloaded, new event listeners were added without removing old ones

**Fix:**
- Added `isInitialized` flag to prevent duplicate initialization
- Store event listener references for proper cleanup
- Remove event listeners in cleanup method
- Unsubscribe from auth state changes properly

**4. Add Debouncing** (`lib/auth-session.ts`)

**Problem:** Multiple validation calls happening within milliseconds

**Fix:**
- Added 3-second debounce between validation calls
- Prevents validation spam when window gains focus multiple times quickly
- Track last validation time to skip redundant calls

**5. Removed Aggressive Focus Event**

**Problem:** Both visibility change AND focus events triggering validation simultaneously

**Fix:**
- Removed window focus event listener
- Only use visibility change event (when tab becomes visible)
- Trust Supabase's auto-refresh for most cases

**6. Optimized Validation in API Interceptor** (`lib/api-interceptor.ts`)

**Problem:** Every API request was calling `validateSession()` which made network calls

**Fix:**
- Check if session exists in store first (no network call)
- Only refresh if actual auth error occurs
- Let Supabase handle auto-refresh in background

## Key Changes Summary

### Event Listener Management
```typescript
// Store references for cleanup
private visibilityChangeHandler: (() => void) | null = null
private authStateChangeSubscription: any = null

// Prevent duplicate initialization
if (this.isInitialized) return

// Store subscription
this.authStateChangeSubscription = data.subscription

// Proper cleanup
cleanup() {
  if (this.visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
  }
  if (this.authStateChangeSubscription) {
    this.authStateChangeSubscription.unsubscribe()
  }
}
```

### Debounced Validation
```typescript
private readonly VALIDATION_DEBOUNCE = 3000 // 3 seconds
private lastValidationTime = 0

private async debouncedValidateSession(): Promise<boolean> {
  const timeSinceLastValidation = Date.now() - this.lastValidationTime
  
  if (timeSinceLastValidation < this.VALIDATION_DEBOUNCE) {
    return true // Skip validation
  }
  
  this.lastValidationTime = Date.now()
  return await this.validateSession()
}
```

### Trust Supabase Auto-Refresh
```typescript
// Check session every 5 minutes instead of 1 minute
this.refreshTimer = setInterval(() => {
  this.checkAndRefreshSession()
}, 5 * 60000) // Less aggressive

// In validateSession: Only check localStorage, trust auto-refresh
const { data: { session } } = await supabase.auth.getSession()
// No network call unless needed

// Only refresh if < 1 minute until expiry
if (timeUntilExpiry <= 60000) {
  return await this.refreshSession()
}
```

## Testing Recommendations

1. **Basic Flow Test**
   - Open website
   - Wait 10-20 seconds
   - Try updating role in onboarding
   - Should work without getting stuck

2. **Extended Idle Test**
   - Open website
   - Leave tab idle for 5+ minutes
   - Return to tab and try any CRUD operation
   - Should auto-refresh and work

3. **Multiple Tab Test**
   - Open website in two tabs
   - Perform actions in one tab
   - Switch to other tab after delay
   - Verify sessions stay synced

4. **Token Expiry Test**
   - Use browser dev tools to monitor auth state
   - Watch for automatic token refresh before operations
   - Verify no "Session expired" errors during normal use

## Impact

### Fixed Issues
✅ Operations no longer hang after waiting
✅ No more event listener spam
✅ Supabase auto-refresh works properly
✅ Console logs are clean and minimal
✅ Better performance (fewer validation calls)
✅ Proper cleanup on component unmount

### Performance Impact
- **Before**: Multiple validation calls per second, constant network requests
- **After**: Validation only when needed, trust Supabase's auto-refresh
- **Network**: Minimal - only when actual auth error occurs
- **UX**: Much better - operations complete reliably without console spam

## Files Modified

1. **lib/supabase.ts** - Fixed Supabase client configuration
2. **lib/auth-session.ts** - Enhanced session validation and rehydration
3. **lib/api-interceptor.ts** - Improved error handling and retry logic

## Additional Notes

### Why Trust Supabase's Auto-Refresh?
Supabase has a built-in auto-refresh mechanism that:
- Runs in the background automatically
- Handles token refresh before expiry
- Manages lock acquisition properly
- Syncs across tabs

**Our role:**
- Let it do its job (don't interfere)
- Only manually refresh when token is < 1 minute from expiry
- Handle errors gracefully when refresh fails

### Why 3-Second Debounce?
- Browser events (focus, visibility) can fire multiple times rapidly
- User might click between tabs quickly
- Prevents validation spam while still being responsive
- Balances responsiveness vs. performance

### Event Listener Cleanup
Critical for React apps where components mount/unmount:
- Store event listener references
- Remove listeners in cleanup
- Unsubscribe from Supabase subscriptions
- Prevent memory leaks and duplicate handlers

## Monitoring

Add console logs are in place to monitor:
- `[AUTH-SESSION]` - Session validation and refresh events
- `[SUPABASE]` - API request lifecycle and auth errors
- `[API]` - HTTP interceptor behavior

In production, these should be replaced with proper logging/monitoring.
