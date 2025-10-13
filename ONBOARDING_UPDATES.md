# Onboarding Flow Updates

## Overview
Updated the onboarding flow to include Date of Birth validation and Terms & Conditions acceptance.

## Changes Made

### 1. Added Date of Birth Field
- **Location**: `components/onboarding/personal-info-step.tsx`
- **Validation Rules**:
  - **Students (Role 'S')**: Age between 5-26 years
  - **Teachers (Role 'T') & Coaches (Role 'C')**: Minimum age 21 years
- **Features**:
  - Real-time age calculation display
  - Role-based validation messages
  - Prevents future dates

### 2. Added Terms & Conditions Step
- **Location**: `components/onboarding/terms-conditions-step.tsx`
- **Features**:
  - Scrollable Terms of Service section
  - Scrollable Privacy Policy section  
  - Required checkboxes for both terms and privacy
  - Community Guidelines preview
  - Important notices section

### 3. Updated Onboarding Flow
- **Previous Flow**:
  - Students/Teachers: Role → Personal Info → Complete
  - Coaches: Role → Personal Info → Coaching Details → Complete
  
- **New Flow**:
  - Students/Teachers: Role → Personal Info → Terms & Conditions → Complete
  - Coaches: Role → Personal Info → Coaching Details → Terms & Conditions → Complete

### 4. Updated Completion Levels
- **Level 1**: Role Selection
- **Level 2**: Personal Information (now includes DOB)
- **Level 3**: Coaching Details (only for coaches)
- **Level 4**: Terms & Conditions  
- **Level 5**: Complete

## File Changes

### New Files
- `components/onboarding/terms-conditions-step.tsx` - New terms and conditions component

### Modified Files
- `components/onboarding/personal-info-step.tsx` - Added DOB field with validation
- `components/onboarding/onboarding-container.tsx` - Updated flow logic and step handling
- `components/onboarding/index.ts` - Added new component export
- `app/onboarding/page.tsx` - Updated completion level requirements
- `lib/schema/profile.types.ts` - Added date_of_birth field to Profile interfaces
- `lib/validations.ts` - Updated personal info schema to include DOB validation

## Age Validation Logic

```typescript
// Students: 5-26 years old
if (role === 'S' && (age < 5 || age > 26)) {
  return 'Students must be between 5 and 26 years old'
}

// Teachers and Coaches: 21+ years old  
if ((role === 'T' || role === 'C') && age < 21) {
  return ''
}
```

## Progress Calculation
The progress bar now dynamically calculates based on user role:
- **Coaching Centers**: 4 total steps (includes coaching setup)
- **Students/Teachers**: 3 total steps (skips coaching setup)

## Testing Recommendations
1. Test age validation for different roles
2. Verify terms acceptance is required
3. Check flow continuity for both coaching and non-coaching users
4. Validate that onboarding level progression works correctly
5. Test edge cases like future dates and invalid ages