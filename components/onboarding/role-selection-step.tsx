'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, GraduationCap, Users, ChevronRight } from 'lucide-react'
import { UserRole } from '@/lib/schema/profile.types'
import { onboardingRoleSelectionSchema } from '@/lib/validations'
import { showErrorToast } from '@/lib/toast'

interface RoleOption {
    value: UserRole
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    benefits: string[]
}

const roleOptions: RoleOption[] = [
    {
        value: 'S',
        label: 'Student',
        description: 'Learn, ask, and grow with teachers & coaching centers.',
        icon: GraduationCap,
        color: 'bg-blue-500',
        benefits: [
            'Post your doubts in community',
            'Get answers & guidance from teachers',
            'Check reviews, fees & join coaching',
            'Receive class & fee notifications'
        ]
    },
    {
        value: 'T',
        label: 'Teacher',
        description: 'Share knowledge, solve doubts, and connect with students.',
        icon: User,
        color: 'bg-green-500',
        benefits: [
            'Answer student questions in community',
            'Build profile & gain reviews',
            'Get hired by coaching centers',
            'Manage your classes & students'
        ]
    },
    {
        value: 'C',
        label: 'Coaching Center',
        description: 'Grow your reach & manage students easily.',
        icon: Users,
        color: 'bg-purple-500',
        benefits: [
            'Post updates & engage in community',
            'Showcase fees, reviews & details',
            'Admit students via platform',
            'Hire expert teachers'
        ]
    }
]

interface RoleSelectionStepProps {
    selectedRole: UserRole | null
    onRoleSelect: (role: UserRole) => void
    onNext: () => void
    onPrevious: () => void
    loading: boolean
}

export function RoleSelectionStep({
    selectedRole,
    onRoleSelect,
    onNext,
    onPrevious,
    loading
}: RoleSelectionStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleNext = () => {
        try {
            // Validate selection
            onboardingRoleSelectionSchema.parse({ role: selectedRole })
            setErrors({})
            onNext()
        } catch (error: any) {
            const validationErrors: Record<string, string> = {}
            if (error.errors) {
                error.errors.forEach((err: any) => {
                    validationErrors[err.path[0]] = err.message
                })
            }
            setErrors(validationErrors)
            showErrorToast('Please select a role to continue')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Choose Your Role</h1>
                <p className="text-muted-foreground text-lg">
                    Select the role that best describes how you want to use Tutrsy
                </p>
            </div>

            {/* Role Options */}
            <div className="grid gap-4 md:grid-cols-3">
                {roleOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = selectedRole === option.value

                    return (
                        <Card
                            key={option.value}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                                ? 'ring-2 ring-primary border-primary shadow-lg'
                                : 'hover:border-primary/50'
                                }`}
                            onClick={() => onRoleSelect(option.value)}
                        >
                            <CardHeader className="text-center space-y-4">
                                <div className={`mx-auto w-16 h-16 rounded-full ${option.color} flex items-center justify-center`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{option.label}</h3>
                                    <p className="text-muted-foreground text-sm">{option.description}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">What you'll get:</h4>
                                    <ul className="space-y-1">
                                        {option.benefits.map((benefit, index) => (
                                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                                <ChevronRight className="w-3 h-3 text-primary" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Error Message */}
            {errors.role && (
                <div className="text-center">
                    <p className="text-destructive text-sm">{errors.role}</p>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={true}
                >
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!selectedRole || loading}
                    className="min-w-[120px]"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                        </div>
                    ) : (
                        'Next'
                    )}
                </Button>
            </div>
        </div>
    )
}
