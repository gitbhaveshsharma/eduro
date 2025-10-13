'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, GraduationCap, Users } from 'lucide-react'
import { CoachingCategory, COACHING_CATEGORY_METADATA, CoachingCategoryGroup } from '@/lib/schema/coaching.types'
import { useCoachingStore } from '@/lib/store/coaching.store'
import { onboardingCoachingSelectionSchema } from '@/lib/validations'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

interface CoachingSelectionStepProps {
    coachingName: string
    coachingCategory: CoachingCategory | null
    onCoachingNameChange: (name: string) => void
    onCoachingCategoryChange: (category: CoachingCategory) => void
    onNext: () => void
    onPrevious: () => void
    loading: boolean
}

// Group categories for better UI organization
const categoryGroups: Record<CoachingCategoryGroup, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    ACADEMIC: { label: 'Academic & School Level', icon: GraduationCap },
    COMPETITIVE: { label: 'Competitive Exams', icon: Building2 },
    SKILL_DEVELOPMENT: { label: 'Skill & Career Development', icon: Users },
    HOBBY: { label: 'Hobby & Talent', icon: Users },
    PROFESSIONAL: { label: 'Professional & Certification', icon: Building2 },
    COACHING_TYPE: { label: 'Coaching Type & Mode', icon: GraduationCap },
}

export function CoachingSelectionStep({
    coachingName,
    coachingCategory,
    onCoachingNameChange,
    onCoachingCategoryChange,
    onNext,
    onPrevious,
    loading
}: CoachingSelectionStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { createCoachingCenter } = useCoachingStore()

    const handleNext = async () => {
        try {
            // Validate selection
            onboardingCoachingSelectionSchema.parse({
                coaching_name: coachingName,
                coaching_category: coachingCategory
            })
            setErrors({})

            // Create coaching center
            const coachingData = {
                name: coachingName.trim(),
                category: coachingCategory!,
                description: `${COACHING_CATEGORY_METADATA[coachingCategory!].label} coaching center`,
            }

            const result = await createCoachingCenter(coachingData)

            if (result) {
                showSuccessToast('Coaching center created successfully!')
                onNext()
            } else {
                showErrorToast('Failed to create coaching center. Please try again.')
            }
        } catch (error: any) {
            const validationErrors: Record<string, string> = {}
            if (error.errors) {
                error.errors.forEach((err: any) => {
                    validationErrors[err.path[0]] = err.message
                })
            }
            setErrors(validationErrors)
            showErrorToast('Please fill in all required fields')
        }
    }

    // Group categories by their group
    const groupedCategories = Object.values(COACHING_CATEGORY_METADATA).reduce((acc, meta) => {
        if (!acc[meta.group]) {
            acc[meta.group] = []
        }
        acc[meta.group].push(meta)
        return acc
    }, {} as Record<CoachingCategoryGroup, typeof COACHING_CATEGORY_METADATA[CoachingCategory][]>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Setup Your Coaching Center</h1>
                <p className="text-muted-foreground text-lg">
                    Tell us about your coaching center to get started
                </p>
            </div>

            {/* Form Card */}
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">Coaching Information</h3>
                            <p className="text-muted-foreground text-sm">
                                Provide basic details about your coaching center
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Coaching Name */}
                    <div className="space-y-2">
                        <Label htmlFor="coaching-name" className="text-sm font-medium">
                            Coaching Center Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="coaching-name"
                            type="text"
                            placeholder="Enter your coaching center name"
                            value={coachingName}
                            onChange={(e) => onCoachingNameChange(e.target.value)}
                            className={errors.coaching_name ? 'border-destructive' : ''}
                        />
                        {errors.coaching_name && (
                            <p className="text-destructive text-sm">{errors.coaching_name}</p>
                        )}
                    </div>

                    {/* Coaching Category */}
                    <div className="space-y-2">
                        <Label htmlFor="coaching-category" className="text-sm font-medium">
                            Category <span className="text-destructive">*</span>
                        </Label>
                        <Select value={coachingCategory || ''} onValueChange={(value) => onCoachingCategoryChange(value as CoachingCategory)}>
                            <SelectTrigger className={errors.coaching_category ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Select coaching category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(groupedCategories).map(([groupKey, categories]) => {
                                    const group = categoryGroups[groupKey as CoachingCategoryGroup]
                                    const GroupIcon = group.icon

                                    return (
                                        <div key={groupKey}>
                                            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
                                                <div className="flex items-center gap-2">
                                                    <GroupIcon className="w-4 h-4" />
                                                    {group.label}
                                                </div>
                                            </div>
                                            {categories.map((meta) => (
                                                <SelectItem key={meta.category} value={meta.category}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{meta.icon}</span>
                                                        <div>
                                                            <div className="font-medium">{meta.label}</div>
                                                            <div className="text-xs text-muted-foreground">{meta.description}</div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </div>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                        {errors.coaching_category && (
                            <p className="text-destructive text-sm">{errors.coaching_category}</p>
                        )}
                    </div>

                    {/* Selected Category Preview */}
                    {coachingCategory && (
                        <div className="p-4 bg-primary/5 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{COACHING_CATEGORY_METADATA[coachingCategory].icon}</span>
                                <div>
                                    <h4 className="font-medium">{COACHING_CATEGORY_METADATA[coachingCategory].label}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {COACHING_CATEGORY_METADATA[coachingCategory].description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                >
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!coachingName.trim() || !coachingCategory || loading}
                    className="min-w-[120px]"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                        </div>
                    ) : (
                        'Complete Setup'
                    )}
                </Button>
            </div>
        </div>
    )
}