/**
 * Onboarding Components Export
 * 
 * Centralized exports for all onboarding-related components
 */

// Main onboarding components
export { OnboardingContainer } from './onboarding-container'
export { RoleSelectionStep } from './role-selection-step'
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
  type OnboardingRoleSelectionData,
  type OnboardingPersonalInfoData
} from '../../lib/validations'