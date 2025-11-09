# Settings Page Implementation

## Overview

Centralized settings and management page that provides role-based access to different management interfaces.

## Features

### 1. **Profile Management** (All Users)

- Available to all users regardless of role
- Includes:
  - Profile editing
  - Settings configuration
  - Social links management
  - Profile statistics

### 2. **Coaching Center Management** (Role-Based)

- **Accessible to:**
  - Role 'C' (Coach)
  - Role 'SA' (Super Admin)
  - Role 'A' (Admin)
- **Not accessible to:**
  - Role 'T' (Teacher)
  - Role 'S' (Student)
  - Other roles

## Implementation Details

### File Structure

```
app/
  settings/
    layout.tsx        # Metadata and layout wrapper
    page.tsx          # Main settings page component
```

### Key Components Used

1. **ProfileManager** (`@/components/profile/profile-manager`)

   - Handles all profile-related management
   - Used by all users

2. **CoachingManager** (`@/components/coaching/management/coaching-manager`)
   - Handles coaching center management
   - Conditionally rendered based on user role

### Role Check Logic

```typescript
const hasCoachingAccess =
  profile?.role === "C" || profile?.role === "SA" || profile?.role === "A";
```

### Dynamic Tab Rendering

- **All Users:** See "Profile Management" tab
- **Coaches/Admins:** See both "Profile Management" and "Coaching Management" tabs
- Tab grid adjusts automatically:
  - 1 column for non-coaches
  - 2 columns for coaches/admins

### Loading States

- Shows loading spinner while fetching profile
- Prevents flash of incorrect content
- Graceful error handling with user feedback

### Security Features

1. **Client-side validation:** Uses `useCurrentProfile()` hook
2. **Auto-redirect:** If user tries to access coaching tab without permission, automatically switches to profile tab
3. **Visual feedback:** Shows info alert to non-coaching users about role requirements

## Usage

### Navigation

Users can access the settings page at: `/settings`

### Adding to Navigation Menu

Add a link to your navigation component:

```tsx
<Link href="/settings">
  <Settings className="h-4 w-4" />
  Settings
</Link>
```

## Code Quality Features

✅ **No hardcoding:** All role checks use dynamic profile data
✅ **Type-safe:** Full TypeScript implementation
✅ **Responsive:** Mobile-friendly tab layout
✅ **Accessible:** Proper ARIA labels and semantic HTML
✅ **Clean code:** Well-organized with clear comments
✅ **Error handling:** Comprehensive loading and error states
✅ **Maintainable:** Single source of truth for role logic

## Testing Checklist

- [ ] User with role 'C' sees both tabs
- [ ] User with role 'T' sees only profile tab
- [ ] User with role 'S' sees only profile tab
- [ ] Loading state displays correctly
- [ ] Tab switching works smoothly
- [ ] Coaching tab auto-redirects for non-coaches
- [ ] Info alert shows correct role information
- [ ] Mobile layout is responsive

## Future Enhancements

1. **Additional Tabs:**

   - Notifications settings
   - Privacy settings
   - Security settings
   - Billing (for premium features)

2. **Role-Specific Features:**

   - Teacher-specific settings
   - Student-specific settings
   - Admin panel access

3. **Preferences:**
   - Theme customization
   - Language settings
   - Notification preferences
