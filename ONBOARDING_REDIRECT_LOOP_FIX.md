# Fix: Onboarding Redirect Loop for Coaching Centers

## Problem
Coaching center users were stuck in an infinite redirect loop after completing personal info (onboarding level 3). The system would:

1. User completes personal info → onboarding level 3
2. System redirects to onboarding because level 3 < required level 4
3. Onboarding page redirects to dashboard because level 3 >= 3 (incorrect logic)
4. Dashboard redirects back to onboarding → **INFINITE LOOP**

## Root Causes

### 1. Incorrect Completion Check in Onboarding Page
**File:** `app/onboarding/page.tsx`
**Issue:** The page was checking `if (onboardingLevel >= 3)` and redirecting coaching centers to dashboard, but coaching centers need level 4 to be complete.

### 2. Missing Step Calculation for Coaching Centers
**File:** `app/onboarding/page.tsx`
**Issue:** The initial step calculation didn't account for coaching centers at level 3 needing to see step 3 (coaching selection).

### 3. Step State Management
**File:** `components/onboarding/onboarding-container.tsx`
**Issue:** The container wasn't properly responding to `initialStep` prop changes.

## Fixes Applied

### 1. Fixed Onboarding Completion Logic
```typescript
// Before - WRONG
if (onboardingLevel >= 3) {
    router.push('/dashboard')
}

// After - CORRECT
const getRequiredOnboardingLevel = (role: string) => {
    if (role === 'C') return 4; // Coaching centers need 4 steps
    return 3; // Others need 3 steps
}

const requiredLevel = getRequiredOnboardingLevel(userRole)

if (onboardingLevel >= requiredLevel) {
    router.push('/dashboard')
}
```

### 2. Fixed Initial Step Calculation
```typescript
// Added proper step calculation for coaching centers
if (userRole === 'C') {
    // Coaching center flow: Role (1) → Personal Info (2) → Coaching Details (3) → Complete (4)
    if (onboardingLevel >= 3) {
        setInitialStep(3) // Start on coaching details step
    } else if (onboardingLevel >= 2) {
        setInitialStep(2) // Start on personal info step
    } else {
        setInitialStep(1) // Start on role selection step
    }
} else {
    // Other roles flow: Role (1) → Personal Info (2) → Complete (3)
    if (onboardingLevel >= 2) {
        setInitialStep(2) // Start on personal info step
    } else {
        setInitialStep(1) // Start on role selection step
    }
}
```

### 3. Fixed Container State Management
```typescript
// Added useEffect to respond to initialStep prop changes
useEffect(() => {
    setCurrentStep(initialStep)
}, [initialStep])
```

## Updated Flow

### For Coaching Centers ('C'):
```
Level 1: Role Selection → Level 2
Level 2: Personal Info → Level 3  
Level 3: Coaching Details → Level 4 (Complete)
```

### For Other Roles ('S', 'T'):
```
Level 1: Role Selection → Level 2
Level 2: Personal Info → Level 3 (Complete)
```

## How It Works Now

1. **Coaching center user at level 3:**
   - `useOnboardingRedirect()` detects level 3 < required level 4 → redirects to `/onboarding`
   - `onboarding/page.tsx` detects level 3 < required level 4 → doesn't redirect to dashboard
   - Sets `initialStep = 3` because user is at level 3
   - `OnboardingContainer` shows step 3 (coaching selection)
   - User completes coaching setup → level 4 → redirects to dashboard

2. **Other users at level 3:**
   - `useOnboardingRedirect()` detects level 3 >= required level 3 → redirects to dashboard
   - Onboarding complete!

## Testing
- ✅ Coaching center users at level 3 now see the coaching selection step
- ✅ No more infinite redirect loops
- ✅ Proper step navigation and completion
- ✅ Other user types unaffected

## Integration with Coaching System
The coaching selection step now properly:
- Uses `useCoachingStore()` to create coaching centers
- Validates coaching name and category with Zod schemas
- Creates actual coaching center records in the database
- Handles errors and success states appropriately