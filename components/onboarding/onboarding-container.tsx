'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { UserRole, OnboardingLevel } from '@/lib/schema/profile.types'
import { useProfileStore } from '@/lib/store/profile.store'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { RoleSelectionStep } from './role-selection-step'
import { PersonalInfoStep } from './personal-info-step'

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
    const [fullName, setFullName] = useState('')
    const [pinCode, setPinCode] = useState('')

    // Load current profile data if available
    useEffect(() => {
        if (currentProfile) {
            if (currentProfile.role && currentProfile.role !== 'S') {
                setSelectedRole(currentProfile.role)
            }
            if (currentProfile.full_name) {
                setFullName(currentProfile.full_name)
            }

            // Mark steps as completed based on existing data
            const completed: number[] = []
            if (currentProfile.role && currentProfile.onboarding_level >= '2') {
                completed.push(1)
            }
            if (currentProfile.full_name && currentProfile.onboarding_level >= '3') {
                completed.push(2)
            }
            setCompletedSteps(completed)
        }
    }, [currentProfile])

    const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100

    const handleRoleNext = async () => {
        if (!selectedRole) return

        setLoading(true)
        try {
            // Update user role and onboarding level
            const success = await updateCurrentProfile({ role: selectedRole })

            if (success) {
                // Update onboarding level to 2
                await updateOnboardingLevel('2' as OnboardingLevel)

                setCompletedSteps(prev => [...prev, 1])
                setCurrentStep(2)
                showSuccessToast('Role updated successfully!')
            } else {
                showErrorToast('Failed to update role. Please try again.')
            }
        } catch (error) {
            console.error('Error updating role:', error)
            showErrorToast('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePersonalInfoNext = async () => {
        if (!fullName.trim()) return

        setLoading(true)
        try {
            // Update user full name and onboarding level
            const updates = {
                full_name: fullName.trim()
            }

            const success = await updateCurrentProfile(updates)

            if (success) {
                // Update onboarding level to 3
                await updateOnboardingLevel('3' as OnboardingLevel)

                setCompletedSteps(prev => [...prev, 2])
                showSuccessToast('Profile updated successfully!')

                // Reload profile to get latest data
                await loadCurrentProfile()

                // Redirect to dashboard after completion
                setTimeout(() => {
                    router.push('/dashboard')
                }, 1500)
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
                                Step {currentStep} of {ONBOARDING_STEPS.length}
                            </span>
                            <span className="text-muted-foreground">
                                {ONBOARDING_STEPS[currentStep - 1].title}
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
                        onFullNameChange={setFullName}
                        onPinCodeChange={setPinCode}
                        onNext={handlePersonalInfoNext}
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
