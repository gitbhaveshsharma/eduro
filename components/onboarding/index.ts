/**
 * Onboarding Components Export
 * 
 * Centralized exports for all onboarding-related components
 */

// Main onboarding components
export { OnboardingContainer } from './onboarding-container'
export { RoleSelectionStep } from './role-selection-step'
export { CoachingSelectionStep } from './coaching-selection-step'
export { PersonalInfoStep } from './personal-info-step'

// Onboarding hooks and utilities
export { 
  useOnboardingRedirect,
  isOnboardingRequired,
  getOnboardingStep
} from '../../hooks/use-onboarding'

// Validation schemas
export {
  onboardingRoleSelectionSchema,
  onboardingPersonalInfoSchema,
  onboardingCoachingSelectionSchema,
  type OnboardingRoleSelectionData,
  type OnboardingPersonalInfoData,
  type OnboardingCoachingSelectionData
} from '../../lib/validations'