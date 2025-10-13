# Onboarding Flow Update - Coaching Center Support

## Overview
Updated the onboarding system to include a coaching center setup step when users select the "Coaching Center" role. This adds an intermediate step between role selection and personal information for coaching centers.

## Changes Made

### 1. New Coaching Selection Step Component
**File:** `components/onboarding/coaching-selection-step.tsx`
- Created a new step component for coaching center name and category selection
- Includes validation for both required fields
- Displays categorized options with icons and descriptions
- Shows preview of selected category

### 2. Updated Onboarding Container
**File:** `components/onboarding/onboarding-container.tsx`
- Added coaching step between role selection and personal info (only for coaching centers)
- Updated step navigation logic to handle different flows for different roles
- Added temporary storage of coaching data in localStorage during onboarding
- Updated onboarding level progression (coaching centers now complete at level 4 instead of 3)

### 3. Enhanced Validation Schema
**File:** `lib/validations.ts`
- Added `onboardingCoachingSelectionSchema` with validation for:
  - `coaching_name`: Required, 2-100 characters, trimmed
  - `coaching_category`: Required, must be one of the valid coaching categories
- Added TypeScript type export for the new schema

### 4. Updated Onboarding Hooks
**File:** `hooks/use-onboarding.ts`
- Modified logic to handle different completion requirements:
  - Coaching centers: 4 steps (Role → Coaching → Personal → Complete)
  - Other roles: 3 steps (Role → Personal → Complete)
- Updated step calculation and redirect logic

### 5. Updated Component Exports
**File:** `components/onboarding/index.ts`
- Added exports for the new coaching selection step
- Added validation schema exports

## Flow Diagram

### For Coaching Centers (Role 'C'):
```
Step 1: Role Selection → Level 2
Step 2: Coaching Details → Level 3  
Step 3: Personal Info → Level 4 (Complete)
```

### For Other Roles (Student 'S', Teacher 'T'):
```
Step 1: Role Selection → Level 2
Step 3: Personal Info → Level 3 (Complete)
```

## Data Flow

1. **Role Selection**: User selects "Coaching Center" role
2. **Coaching Details**: User enters coaching name and selects category
3. **Temporary Storage**: Coaching data stored in localStorage as JSON
4. **Personal Info**: User completes personal information
5. **Completion**: Coaching data can be used to create actual coaching center record

## Validation Rules

### Coaching Name
- Required field
- Minimum 2 characters
- Maximum 100 characters
- Automatically trimmed

### Coaching Category
- Required field
- Must be one of 25+ predefined categories
- Categories are grouped into 6 main groups:
  - Academic & School Level
  - Competitive Exams
  - Skill & Career Development
  - Hobby & Talent
  - Professional & Certification
  - Coaching Type & Mode

## UI/UX Features

### Coaching Selection Step
- Clean card-based layout with form fields
- Categorized dropdown with icons and descriptions
- Selected category preview with icon and description
- Validation error messages
- Progress indicator shows current step
- Navigation buttons with loading states

### Progressive Navigation
- Previous/Next buttons with appropriate enable/disable states
- Loading indicators during async operations
- Success/error toast notifications
- Automatic redirect to dashboard after completion

## Technical Implementation

### State Management
- Local component state for form data
- Profile store integration for onboarding level updates
- localStorage for temporary coaching data storage

### Type Safety
- Full TypeScript support with proper interfaces
- Zod validation schemas with type inference
- Proper error handling and validation

### Performance
- Optimistic updates where appropriate
- Efficient re-renders with proper state management
- Validation only on form submission

## Future Enhancements

1. **Coaching Center Creation**: Integration with coaching service to automatically create coaching center records after onboarding
2. **Branch Setup**: Optional branch setup during onboarding
3. **Media Upload**: Logo/cover image upload during onboarding
4. **Advanced Details**: Additional fields like subjects, target audience, etc.

## Testing Considerations

- Test role selection flow for all user types
- Verify coaching step only appears for coaching centers
- Test form validation for all required fields
- Verify localStorage data persistence
- Test onboarding completion levels for different roles
- Test navigation between steps