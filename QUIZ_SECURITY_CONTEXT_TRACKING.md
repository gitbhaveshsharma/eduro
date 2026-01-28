# Quiz Security Context Tracking Implementation

## Overview
Implemented comprehensive security context tracking for quiz attempts to monitor and prevent cheating.

## Changes Made

### 1. ✅ Fixed TypeScript Errors in `use-quiz-security.ts`

**Problem:**
```
Property 'isExtended' does not exist on type 'Screen'
Property 'screenDetails' does not exist on type 'Window & typeof globalThis'
```

**Solution:**
Added proper TypeScript declarations for experimental Screen Details API:

```typescript
declare global {
    interface Window {
        getScreenDetails?: () => Promise<{
            screens: ScreenDetailed[];
            currentScreen: ScreenDetailed;
        }>;
    }
    
    interface Screen {
        isExtended?: boolean;
    }
}
```

**Fixed Code:**
- Properly type-checked `window.screen.isExtended` as optional property
- Used type-safe API access with proper checks
- Added fallback for browsers without Screen Details API support

---

### 2. ✅ IP Address, User Agent, and Session ID Tracking

**Problem:** 
Quiz attempts were created without security context (IP, user agent, session ID all null in database)

**Solution:**
Implemented end-to-end security context capture and storage.

#### A. Database Fields (Already Exist)
```sql
quiz_attempts table:
- ip_address: text (stores IPv4/IPv6)
- user_agent: text (browser/device info)
- session_id: text (unique session identifier)
```

#### B. Updated Type Definitions

**File:** `lib/branch-system/types/quiz.types.ts`
```typescript
export interface StartAttemptDTO {
    quiz_id: string;
    student_id: string;
    class_id: string;
    ip_address?: string;      // NEW
    user_agent?: string;       // NEW
    session_id?: string;       // NEW
}
```

#### C. Updated Validation Schema

**File:** `lib/branch-system/validations/quiz.validation.ts`
```typescript
export const startAttemptSchema = z.object({
    quiz_id: uuidSchema,
    student_id: uuidSchema,
    class_id: uuidSchema,
    ip_address: z.string().max(45).optional(),    // IPv4/IPv6
    user_agent: z.string().max(500).optional(),   // Browser UA
    session_id: z.string().max(100).optional(),   // Session ID
});
```

#### D. Updated Quiz Service

**File:** `lib/branch-system/services/quiz.service.ts`
```typescript
const { data: attempt, error: attemptError } = await this.supabase
    .from('quiz_attempts')
    .insert({
        // ... existing fields
        ip_address: validatedInput.ip_address || null,
        user_agent: validatedInput.user_agent || null,
        session_id: validatedInput.session_id || null,
    })
```

#### E. Client-Side Context Capture

**File:** `app/(lms)/lms/(students)/student/[centerId]/quizzes/[quizId]/attempt/page.tsx`

```typescript
const handleStartQuiz = async () => {
    // Capture IP address via API
    const ipAddress = await fetch('/api/get-client-ip')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
    
    // Capture user agent
    const userAgent = typeof navigator !== 'undefined' 
        ? navigator.userAgent 
        : null;
    
    // Generate unique session ID
    const sessionId = typeof window !== 'undefined' 
        ? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : null;

    // Pass to startAttempt
    const result = await startAttempt({
        quiz_id: quizId,
        student_id: userId,
        class_id: quiz.class_id,
        ip_address: ipAddress || undefined,
        user_agent: userAgent || undefined,
        session_id: sessionId || undefined,
    });
};
```

#### F. Created IP Detection API

**File:** `app/api/get-client-ip/route.ts`

New API endpoint that uses security utilities to get real client IP:

```typescript
import { IPUtils } from '@/lib/middleware/security-utils';

export async function GET(request: NextRequest) {
    const ip = IPUtils.getRealIP(request);
    return NextResponse.json({ ip, success: true });
}
```

**Features:**
- Checks `x-forwarded-for` header (proxy/load balancer)
- Checks `x-real-ip` header
- Checks `cf-connecting-ip` (CloudFlare)
- Fallback to connection IP
- Returns standardized JSON response

---

## Security Context Data Captured

### 1. **IP Address**
- **Format:** IPv4 (xxx.xxx.xxx.xxx) or IPv6
- **Source:** Extracted from request headers using `IPUtils.getRealIP()`
- **Use Cases:**
  - Detect same IP taking multiple quizzes
  - Geographic tracking
  - Suspicious activity detection
  - Prevent proxy/VPN abuse

### 2. **User Agent**
- **Format:** Browser UA string
- **Example:** `Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0`
- **Source:** `navigator.userAgent`
- **Use Cases:**
  - Detect bot attempts
  - Identify device switches mid-quiz
  - Browser compatibility tracking
  - Detect automation tools

### 3. **Session ID**
- **Format:** `session_{timestamp}_{random}`
- **Example:** `session_1706454888_k3j2h9d`
- **Source:** Generated client-side
- **Use Cases:**
  - Track unique quiz sessions
  - Detect session hijacking
  - Link security violations to sessions
  - Audit trail

---

## Example Database Record

**Before:**
```sql
INSERT INTO quiz_attempts (
    ..., 
    ip_address, 
    user_agent, 
    session_id
) VALUES (
    ..., 
    null,  -- ❌ No IP
    null,  -- ❌ No user agent
    null   -- ❌ No session
);
```

**After:**
```sql
INSERT INTO quiz_attempts (
    ..., 
    ip_address, 
    user_agent, 
    session_id
) VALUES (
    ..., 
    '192.168.1.100',                    -- ✅ Client IP
    'Mozilla/5.0 (Windows NT 10.0...', -- ✅ Browser info
    'session_1706454888_k3j2h9d'       -- ✅ Unique session
);
```

---

## Security Benefits

### 1. **Cheating Detection**
- Multiple quiz attempts from same IP
- Rapid IP changes (VPN switching)
- Unusual user agent patterns
- Session anomalies

### 2. **Audit Trail**
- Complete forensic data for investigations
- Proof of quiz attempt origin
- Timeline of security events
- Evidence for academic integrity cases

### 3. **Analytics**
- Device usage patterns
- Browser compatibility issues
- Geographic distribution
- Access patterns

### 4. **Compliance**
- Data retention for investigations
- Proof of identity verification
- FERPA/GDPR compliance documentation
- Legal evidence if needed

---

## Privacy Considerations

### IP Address Storage
- **Anonymization:** Can be anonymized using `IPUtils.anonymizeIP()`
- **Retention:** Should have data retention policy
- **GDPR:** May be considered PII in some jurisdictions
- **Recommendation:** Document in privacy policy

### User Agent Storage
- **Not PII:** Generally not considered personal data
- **Fingerprinting:** Can contribute to device fingerprinting
- **Transparency:** Inform students in quiz rules

### Session ID
- **Internal:** Only used for system tracking
- **Not Shared:** Never exposed to other students
- **Temporary:** Can be purged after quiz completion

---

## Testing

### Test 1: Verify IP Capture
```bash
# Start quiz and check database
SELECT ip_address, user_agent, session_id 
FROM quiz_attempts 
ORDER BY started_at DESC 
LIMIT 1;

# Should return:
# ip_address: 192.168.x.x (or your IP)
# user_agent: Mozilla/5.0...
# session_id: session_1706454888_xxx
```

### Test 2: Verify Different IPs
```bash
# Use VPN or different network
# Start new quiz attempt
# Both attempts should show different IPs
```

### Test 3: Verify Session Uniqueness
```bash
# Start multiple quizzes
# Each should have unique session_id
SELECT DISTINCT session_id 
FROM quiz_attempts 
WHERE student_id = 'xxx';
```

---

## API Usage

### Get Client IP
```typescript
const response = await fetch('/api/get-client-ip');
const { ip, success } = await response.json();

// Response format:
{
    "ip": "192.168.1.100",
    "success": true
}
```

### Error Handling
```typescript
const ipAddress = await fetch('/api/get-client-ip')
    .then(res => res.json())
    .then(data => data.ip)
    .catch(() => null);  // Graceful fallback
```

---

## Files Modified

1. ✅ `hooks/use-quiz-security.ts` - Fixed TypeScript errors
2. ✅ `lib/branch-system/types/quiz.types.ts` - Added security fields to DTO
3. ✅ `lib/branch-system/validations/quiz.validation.ts` - Added validation rules
4. ✅ `lib/branch-system/services/quiz.service.ts` - Save security context
5. ✅ `app/(lms)/lms/(students)/student/[centerId]/quizzes/[quizId]/attempt/page.tsx` - Capture context
6. ✅ `app/api/get-client-ip/route.ts` - NEW API endpoint

---

## Summary

✅ **TypeScript Errors:** Fixed with proper type declarations  
✅ **IP Address:** Captured and stored using security utilities  
✅ **User Agent:** Captured from browser navigator  
✅ **Session ID:** Generated unique identifier per attempt  
✅ **API Endpoint:** Created `/api/get-client-ip` route  
✅ **Database:** All fields now properly populated  
✅ **Privacy:** Documented considerations and compliance  

All quiz attempts now have complete security context for monitoring and audit purposes!
