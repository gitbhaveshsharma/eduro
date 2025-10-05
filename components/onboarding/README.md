# Onboarding System Documentation

This comprehensive onboarding system guides new users through setting up their Eduro profiles with a step-by-step process.

## Overview

The onboarding system consists of multiple steps:

1. **Role Selection** - Users choose between Student (S), Teacher (T), or Coach (C)
2. **Personal Information** - Users provide their full name and optional pin code

The system automatically updates the user's onboarding level and redirects them appropriately based on their progress.

## Components

### 1. OnboardingContainer (`components/onboarding/onboarding-container.tsx`)

Main container component that manages the onboarding flow:

- **Progress tracking** with visual indicators
- **Step navigation** with previous/next buttons
- **State management** for form data
- **Profile updates** using the profile service
- **Automatic redirection** upon completion

```tsx
import { OnboardingContainer } from '@/components/onboarding/onboarding-container'

<OnboardingContainer initialStep={1} />
```

### 2. RoleSelectionStep (`components/onboarding/role-selection-step.tsx`)

First step where users select their role:

- **Visual role cards** with descriptions and benefits
- **Form validation** using Zod schemas
- **Loading states** during updates
- **Error handling** with toast notifications

```tsx
<RoleSelectionStep
  selectedRole={selectedRole}
  onRoleSelect={setSelectedRole}
  onNext={handleNext}
  onPrevious={handlePrevious}
  loading={loading}
/>
```

### 3. PersonalInfoStep (`components/onboarding/personal-info-step.tsx`)

Second step for personal information:

- **Full name input** (required)
- **Pin code input** (optional)
- **Real-time validation** with error messages
- **Field-level validation** on blur events

```tsx
<PersonalInfoStep
  fullName={fullName}
  pinCode={pinCode}
  onFullNameChange={setFullName}
  onPinCodeChange={setPinCode}
  onNext={handleNext}
  onPrevious={handlePrevious}
  loading={loading}
/>
```

## Validation Schemas

The system uses Zod for form validation:

```typescript
// Role selection validation
export const onboardingRoleSelectionSchema = z.object({
  role: z.enum(['S', 'T', 'C'], {
    required_error: 'Please select a role',
  }),
})

// Personal info validation
export const onboardingPersonalInfoSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  pin_code: z
    .string()
    .min(6, 'Pin code must be at least 6 characters')
    .max(10, 'Pin code must be less than 10 characters')
    .regex(/^[0-9]+$/, 'Pin code can only contain numbers')
    .optional(),
})
```

## Onboarding Logic

### Onboarding Levels

The system uses onboarding levels to track progress:

- **Level 1**: Fresh user, needs role selection
- **Level 2**: Role selected, needs personal info
- **Level 3+**: Onboarding completed

### Automatic Redirects

The `useOnboardingRedirect` hook handles automatic redirects:

```typescript
import { useOnboardingRedirect } from '@/hooks/use-onboarding'

function MyComponent() {
  const { loading, shouldShowOnboarding, onboardingCompleted } = useOnboardingRedirect()
  
  // Hook automatically redirects users based on onboarding status
}
```

### Integration with Profile System

The onboarding system integrates with the profile service:

```typescript
// Update role during onboarding
const success = await updateCurrentProfile({ role: selectedRole })

// Update onboarding level
await updateOnboardingLevel('2' as OnboardingLevel)

// Update personal information
const success = await updateCurrentProfile({
  full_name: fullName.trim()
})
```

## Page Implementation

### Main Onboarding Page (`app/onbording/page.tsx`)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
import { OnboardingContainer } from '@/components/onboarding/onboarding-container'

export default function OnboardingPage() {
  const router = useRouter()
  const profile = useCurrentProfile()
  const loading = useCurrentProfileLoading()
  const [initialStep, setInitialStep] = useState(1)

  useEffect(() => {
    if (!loading && profile) {
      const onboardingLevel = parseInt(profile.onboarding_level)
      
      if (onboardingLevel >= 3) {
        // Redirect completed users
        router.push('/')
        return
      }

      // Set appropriate starting step
      setInitialStep(onboardingLevel >= 2 ? 2 : 1)
    }
  }, [loading, profile, router])

  if (loading) return <LoadingState />
  if (!profile) return <ErrorState />

  return <OnboardingContainer initialStep={initialStep} />
}
```

## Usage Examples

### Basic Implementation

```tsx
// 1. Add onboarding to your routing
// app/onbording/page.tsx
import OnboardingPage from './page'

// 2. Use the redirect hook in your layout
import { useOnboardingRedirect } from '@/hooks/use-onboarding'

function Layout({ children }) {
  useOnboardingRedirect() // Automatically handles redirects
  return <>{children}</>
}
```

### Custom Onboarding Flow

```tsx
import { useState } from 'react'
import { OnboardingContainer } from '@/components/onboarding/onboarding-container'

function CustomOnboarding() {
  const [step, setStep] = useState(1)
  
  return (
    <div className="custom-onboarding">
      <OnboardingContainer initialStep={step} />
    </div>
  )
}
```

### Checking Onboarding Status

```tsx
import { useCurrentProfile } from '@/lib/profile'
import { isOnboardingRequired, getOnboardingStep } from '@/hooks/use-onboarding'

function Dashboard() {
  const profile = useCurrentProfile()
  
  if (isOnboardingRequired(profile)) {
    const step = getOnboardingStep(profile)
    return <div>Please complete onboarding (step {step})</div>
  }
  
  return <div>Welcome to your dashboard!</div>
}
```

## Styling and Theming

The onboarding system uses consistent styling with your design system:

### Color Scheme
- **Primary colors** for selected states and buttons
- **Muted colors** for descriptions and secondary text
- **Success/Error colors** for validation feedback

### Component Styling
- **Cards** for step containers and role options
- **Badges** for selected states
- **Progress bars** for completion tracking
- **Gradients** for background aesthetics

### Responsive Design
- **Mobile-first** approach
- **Grid layouts** that adapt to screen sizes
- **Flexible typography** that scales appropriately

## Error Handling

The system provides comprehensive error handling:

### Validation Errors
```typescript
// Field-level validation
const validateField = (field: string, value: string) => {
  try {
    schema.parse({ [field]: value })
    setErrors(prev => ({ ...prev, [field]: '' }))
  } catch (error) {
    setErrors(prev => ({ ...prev, [field]: error.errors[0].message }))
  }
}
```

### Service Errors
```typescript
try {
  const success = await updateCurrentProfile(updates)
  if (success) {
    showSuccessToast('Profile updated successfully!')
  } else {
    showErrorToast('Failed to update profile. Please try again.')
  }
} catch (error) {
  showErrorToast('An error occurred. Please try again.')
}
```

### Network Errors
- **Retry mechanisms** for failed requests
- **Offline detection** and appropriate messaging
- **Graceful degradation** when services are unavailable

## Testing

### Unit Testing
```typescript
// Test role selection
test('should update role when valid role is selected', async () => {
  const { result } = renderHook(() => useOnboardingFlow())
  
  await act(async () => {
    await result.current.updateRole('T')
  })
  
  expect(result.current.selectedRole).toBe('T')
})

// Test validation
test('should show error for invalid full name', () => {
  const { result } = validationSchema.safeParse({ full_name: 'A' })
  expect(result.success).toBe(false)
})
```

### Integration Testing
```typescript
// Test complete onboarding flow
test('should complete onboarding successfully', async () => {
  render(<OnboardingContainer />)
  
  // Select role
  fireEvent.click(screen.getByText('Teacher'))
  fireEvent.click(screen.getByText('Next'))
  
  // Fill personal info
  fireEvent.change(screen.getByLabelText('Full Name'), {
    target: { value: 'John Doe' }
  })
  fireEvent.click(screen.getByText('Complete Setup'))
  
  // Verify redirect
  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })
})
```

## Performance Considerations

### Optimization Strategies
- **Lazy loading** of step components
- **Memoization** of expensive calculations
- **Debounced validation** for real-time feedback
- **Optimistic updates** for better UX

### Caching
- **Profile data caching** in Zustand store
- **Form state persistence** across page reloads
- **Progress tracking** in local storage

## Security

### Data Protection
- **Input sanitization** for all form fields
- **Validation** at both client and server levels
- **CSRF protection** for state updates

### Privacy
- **Minimal data collection** during onboarding
- **Clear consent** for optional information
- **Secure transmission** of profile updates

This onboarding system provides a smooth, user-friendly experience while maintaining code quality and following best practices.