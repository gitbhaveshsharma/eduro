'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { UserRole, OnboardingLevel } from '@/lib/schema/profile.types'
import { CoachingCategory } from '@/lib/schema/coaching.types'
import { useProfileStore } from '@/lib/store/profile.store'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { RoleSelectionStep } from './role-selection-step'
import { CoachingSelectionStep } from './coaching-selection-step'
import { PersonalInfoStep } from './personal-info-step'
import { TermsConditionsStep } from './terms-conditions-step'

interface OnboardingContainerProps {
    initialStep?: number
}

const ONBOARDING_STEPS = [
    {
        id: 1,
        title: 'Choose Role',
        description: 'Select your role on the platform'
    },
    {
        id: 2,
        title: 'Personal Info',
        description: 'Add your basic information'
    },
    {
        id: 3,
        title: 'Coaching Details',
        description: 'Setup your coaching center'
    },
    {
        id: 4,
        title: 'Terms & Conditions',
        description: 'Accept terms and conditions'
    }
]

export function OnboardingContainer({ initialStep = 1 }: OnboardingContainerProps) {
    const router = useRouter()
    const { currentProfile, updateCurrentProfile, updateOnboardingLevel, loadCurrentProfile } = useProfileStore()

    // State management
    const [currentStep, setCurrentStep] = useState(initialStep)
    const [loading, setLoading] = useState(false)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])

    // Form data
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
    const [coachingName, setCoachingName] = useState('')
    const [coachingCategory, setCoachingCategory] = useState<CoachingCategory | null>(null)
    const [fullName, setFullName] = useState('')
    const [pinCode, setPinCode] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')

    // Update current step when initialStep changes
    useEffect(() => {
        setCurrentStep(initialStep)
    }, [initialStep])

    // Calculate age from date of birth
    const calculateAge = (dob: string): number => {
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        
        return age
    }

    // Load current profile data if available
    useEffect(() => {
        if (currentProfile) {
            if (currentProfile.role) {
                setSelectedRole(currentProfile.role)
            }
            if (currentProfile.full_name) {
                setFullName(currentProfile.full_name)
            }
            if (currentProfile.date_of_birth) {
                setDateOfBirth(currentProfile.date_of_birth)
            }

            // Mark steps as completed based on existing data
            const completed: number[] = []
            if (currentProfile.role && currentProfile.onboarding_level >= '2') {
                completed.push(1) // Role selection
            }
            if (currentProfile.full_name && currentProfile.onboarding_level >= '3') {
                completed.push(2) // Personal info
            }
            if (currentProfile.role === 'C' && currentProfile.onboarding_level >= '4') {
                completed.push(3) // Coaching step only for coaching centers
            }
            if (currentProfile.onboarding_level >= '5') {
                completed.push(4) // Terms and conditions
            }
            setCompletedSteps(completed)
        }
    }, [currentProfile])

    // Calculate total steps and display step based on role
    const getTotalSteps = () => {
        if (selectedRole === 'C') {
            return 4 // Role, Personal, Coaching, Terms
        }
        return 3 // Role, Personal, Terms (skip coaching step)
    }

    const getDisplayStep = () => {
        if (selectedRole === 'C') {
            return currentStep // All steps are sequential for coaching centers
        }
        // For non-coaching roles, step 3 is skipped, so step 4 becomes step 3
        if (currentStep === 4) return 3
        return currentStep
    }

    const getStepTitle = () => {
        if (currentStep === 4) return 'Terms & Conditions'
        return ONBOARDING_STEPS[currentStep - 1]?.title || ''
    }

    const progressPercentage = (getDisplayStep() / getTotalSteps()) * 100

    const handleRoleNext = async () => {
        if (!selectedRole) return

        setLoading(true)
        try {
            // Update user role and onboarding level
            const success = await updateCurrentProfile({ role: selectedRole })

            if (success) {
                // Update onboarding level to 2
                const levelSuccess = await updateOnboardingLevel('2' as OnboardingLevel)

                if (levelSuccess) {
                    setCompletedSteps(prev => [...prev, 1])
                    // Always go to personal info step next (step 2)
                    setCurrentStep(2)
                    showSuccessToast('Role updated successfully!')
                } else {
                    showErrorToast('Failed to update onboarding level. Please try again.')
                }
            } else {
                showErrorToast('Failed to update role. Please try again.')
            }
        } catch (error) {
            console.error('Error updating role:', error)
            if (error instanceof Error && error.message.includes('timeout')) {
                showErrorToast('Request timed out. Please check your connection and try again.')
            } else if (error instanceof Error && error.message.includes('Session expired')) {
                showErrorToast('Your session has expired. Please refresh the page and log in again.')
                // Redirect to login after a delay
                setTimeout(() => {
                    window.location.href = '/login'
                }, 2000)
            } else {
                showErrorToast('An error occurred. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handlePersonalInfoNext = async () => {
        if (!fullName.trim() || !dateOfBirth) return

        // Validate age before proceeding
        const age = calculateAge(dateOfBirth)
        if (selectedRole === 'S' && (age < 5 || age > 26)) {
            showErrorToast('Students must be between 5 and 26 years old')
            return
        }
        if ((selectedRole === 'T' || selectedRole === 'C') && age < 15) {
            showErrorToast('Teachers and Coaches must be at least 15 years old')
            return
        }

        setLoading(true)
        try {
            // Update user full name and date of birth
            const updates = {
                full_name: fullName.trim(),
                date_of_birth: dateOfBirth
            }

            const success = await updateCurrentProfile(updates)

            if (success) {
                // Update onboarding level to 3
                await updateOnboardingLevel('3' as OnboardingLevel)

                setCompletedSteps(prev => [...prev, 2])
                showSuccessToast('Profile updated successfully!')

                // Reload profile to get latest data
                await loadCurrentProfile()

                // For coaching centers, go to coaching setup step
                if (selectedRole === 'C') {
                    setCurrentStep(3)
                } else {
                    // For other roles, go to terms and conditions step
                    setCurrentStep(4)
                }
            } else {
                showErrorToast('Failed to update profile. Please try again.')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            showErrorToast('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCoachingNext = async () => {
        // The coaching step component will handle creating the coaching center
        // and then call this function when done
        setLoading(true)
        try {
            // Update onboarding level to 4 (coaching completed, now go to terms)
            await updateOnboardingLevel('4' as OnboardingLevel)

            setCompletedSteps(prev => [...prev, 3])
            showSuccessToast('Coaching details saved successfully!')

            // Reload profile to get latest data
            await loadCurrentProfile()

            // Go to terms and conditions step
            setCurrentStep(4)
        } catch (error) {
            console.error('Error updating coaching details:', error)
            showErrorToast('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleTermsNext = async () => {
        setLoading(true)
        try {
            // Update onboarding level to 5 (complete)
            await updateOnboardingLevel('5' as OnboardingLevel)

            setCompletedSteps(prev => [...prev, 4])
            showSuccessToast('Registration completed successfully!')

            // Reload profile to get latest data
            await loadCurrentProfile()

            // Redirect to dashboard after completion
            setTimeout(() => {
                router.push('/dashboard')
            }, 1500)
        } catch (error) {
            console.error('Error completing onboarding:', error)
            showErrorToast('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleNext = () => {
        if (currentStep === 1) {
            handleRoleNext()
        } else if (currentStep === 2) {
            handlePersonalInfoNext()
        } else if (currentStep === 3) {
            handleCoachingNext()
        } else if (currentStep === 4) {
            handleTermsNext()
        }
    }

    const isStepCompleted = (stepId: number) => completedSteps.includes(stepId)

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Progress Section - Shadcn Style */}
                <div className="space-y-6 mb-8">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">
                                Step {getDisplayStep()} of {getTotalSteps()}
                            </span>
                            <span className="text-muted-foreground">
                                {getStepTitle()}
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="w-full" />
                    </div>
                </div>
                {currentStep === 1 && (
                    <RoleSelectionStep
                        selectedRole={selectedRole}
                        onRoleSelect={setSelectedRole}
                        onNext={handleRoleNext}
                        onPrevious={handlePrevious}
                        loading={loading}
                    />
                )}

                {currentStep === 2 && (
                    <PersonalInfoStep
                        fullName={fullName}
                        pinCode={pinCode}
                        dateOfBirth={dateOfBirth}
                        userRole={selectedRole}
                        onFullNameChange={setFullName}
                        onPinCodeChange={setPinCode}
                        onDateOfBirthChange={setDateOfBirth}
                        onNext={handlePersonalInfoNext}
                        onPrevious={handlePrevious}
                        loading={loading}
                    />
                )}

                {currentStep === 3 && selectedRole === 'C' && (
                    <CoachingSelectionStep
                        coachingName={coachingName}
                        coachingCategory={coachingCategory}
                        onCoachingNameChange={setCoachingName}
                        onCoachingCategoryChange={setCoachingCategory}
                        onNext={handleCoachingNext}
                        onPrevious={handlePrevious}
                        loading={loading}
                    />
                )}

                {currentStep === 4 && (
                    <TermsConditionsStep
                        onNext={handleTermsNext}
                        onPrevious={handlePrevious}
                        loading={loading}
                    />
                )}

                {/* Help Text */}
                <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                        Having trouble? Contact our{' '}
                        <a href="/support" className="text-primary hover:underline">
                            support team
                        </a>{' '}
                        for assistance.
                    </p>
                </div>
            </div>
        </div>
    )
}
