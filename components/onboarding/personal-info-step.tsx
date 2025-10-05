'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { onboardingPersonalInfoSchema } from '@/lib/validations'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import { usePinCode } from '@/hooks/use-pincode'
import { useAddressStore } from '@/lib/address'

interface PersonalInfoStepProps {
    fullName: string
    pinCode: string
    onFullNameChange: (value: string) => void
    onPinCodeChange: (value: string) => void
    onNext: () => void
    onPrevious: () => void
    loading: boolean
}

export function PersonalInfoStep({
    fullName,
    pinCode,
    onFullNameChange,
    onPinCodeChange,
    onNext,
    onPrevious,
    loading
}: PersonalInfoStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [pinCodeStatus, setPinCodeStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
    const [addressData, setAddressData] = useState<{ state: string; district: string } | null>(null)

    // PIN code hook for validation and data fetching
    const {
        isLoading: pinCodeLoading,
        data: pinCodeData,
        error: pinCodeError,
        isValid: pinCodeValid,
        fetchPinCodeData,
        validatePinCode,
        reset: resetPinCode
    } = usePinCode()

    // Address store for creating address
    const { createAddress } = useAddressStore()

    // Update PIN code status based on hook state
    useEffect(() => {
        if (pinCodeLoading) {
            setPinCodeStatus('validating')
        } else if (pinCodeValid && pinCodeData) {
            setPinCodeStatus('valid')
            setAddressData({
                state: pinCodeData.state,
                district: pinCodeData.district
            })
        } else if (pinCodeError) {
            setPinCodeStatus('invalid')
            setAddressData(null)
        } else {
            setPinCodeStatus('idle')
            setAddressData(null)
        }
    }, [pinCodeLoading, pinCodeValid, pinCodeData, pinCodeError])

    // Handle PIN code validation with debounce
    useEffect(() => {
        if (!pinCode.trim()) {
            resetPinCode()
            return
        }

        if (!validatePinCode(pinCode)) {
            setPinCodeStatus('invalid')
            setAddressData(null)
            return
        }

        const timeoutId = setTimeout(() => {
            fetchPinCodeData(pinCode)
        }, 1000) // 1 second debounce

        return () => clearTimeout(timeoutId)
    }, [pinCode, fetchPinCodeData, validatePinCode, resetPinCode])

    const validateField = (field: string, value: string) => {
        try {
            if (field === 'full_name') {
                onboardingPersonalInfoSchema.pick({ full_name: true }).parse({ full_name: value })
            }
            // Note: pin_code is optional so we don't validate it strictly
            setErrors(prev => ({ ...prev, [field]: '' }))
        } catch (error: any) {
            if (error.errors) {
                setErrors(prev => ({ ...prev, [field]: error.errors[0].message }))
            }
        }
    }

    const handleFieldChange = (field: string, value: string) => {
        if (field === 'full_name') {
            onFullNameChange(value)
        } else if (field === 'pin_code') {
            onPinCodeChange(value)
        }

        if (touched[field]) {
            validateField(field, value)
        }
    }

    const handleFieldBlur = (field: string, value: string) => {
        setTouched(prev => ({ ...prev, [field]: true }))
        validateField(field, value)
    }

    const handleNext = async () => {
        try {
            // Validate all fields
            const data = {
                full_name: fullName,
                pin_code: pinCode || undefined
            }

            onboardingPersonalInfoSchema.parse(data)
            setErrors({})

            // If PIN code is provided and valid, create address
            if (pinCode && pinCodeValid && pinCodeData) {
                try {
                    const addressCreated = await createAddress({
                        address_type: 'HOME',
                        label: 'Home Address',
                        state: pinCodeData.state,
                        district: pinCodeData.district,
                        pin_code: pinCodeData.pinCode,
                        country: 'India',
                        is_primary: true
                    })

                    if (addressCreated) {
                        showSuccessToast(`Address created for ${pinCodeData.state}, ${pinCodeData.district}`)
                    }
                } catch (addressError) {
                    console.error('Failed to create address:', addressError)
                    showErrorToast('Failed to save address information')
                    // Continue with onboarding even if address creation fails
                }
            }

            onNext()
        } catch (error: any) {
            const validationErrors: Record<string, string> = {}
            if (error.errors) {
                error.errors.forEach((err: any) => {
                    validationErrors[err.path[0]] = err.message
                })
            }
            setErrors(validationErrors)
            showErrorToast('Please fix the errors below')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Personal Information</h1>
                <p className="text-muted-foreground text-lg">
                    Tell us a bit about yourself to personalize your experience
                </p>
            </div>

            {/* Form Card */}
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Basic Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Full Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">
                            Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => handleFieldChange('full_name', e.target.value)}
                            onBlur={(e) => handleFieldBlur('full_name', e.target.value)}
                            className={errors.full_name ? 'border-destructive focus:ring-destructive' : ''}
                            disabled={loading}
                        />
                        {errors.full_name && (
                            <p className="text-destructive text-sm">{errors.full_name}</p>
                        )}
                    </div>

                    {/* Pin Code Field */}
                    <div className="space-y-2">
                        <Label htmlFor="pinCode" className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Pin Code <span className="text-muted-foreground text-xs">(Optional)</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="pinCode"
                                type="text"
                                placeholder="Enter your pin code"
                                value={pinCode}
                                onChange={(e) => handleFieldChange('pin_code', e.target.value)}
                                onBlur={(e) => handleFieldBlur('pin_code', e.target.value)}
                                className={`${errors.pin_code ? 'border-destructive focus:ring-destructive' : ''} ${pinCodeStatus === 'valid' ? 'border-green-500 focus:ring-green-500' : ''
                                    } ${pinCodeStatus === 'invalid' ? 'border-destructive focus:ring-destructive' : ''}`}
                                disabled={loading}
                                maxLength={6}
                            />

                            {/* Status Icons */}
                            <div className="absolute right-3 top-3">
                                {pinCodeStatus === 'validating' && (
                                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                                )}
                                {pinCodeStatus === 'valid' && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                {pinCodeStatus === 'invalid' && (
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                )}
                            </div>
                        </div>

                        {/* Error Messages */}
                        {errors.pin_code && (
                            <p className="text-destructive text-sm">{errors.pin_code}</p>
                        )}
                        {pinCodeError && pinCodeStatus === 'invalid' && (
                            <p className="text-destructive text-sm">{pinCodeError}</p>
                        )}

                        {/* Success Message with Address Data */}
                        {pinCodeStatus === 'valid' && addressData && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-green-700 font-medium text-sm">Address Found!</span>
                                </div>
                                <p className="text-green-600 text-sm">
                                    {addressData.district}, {addressData.state}
                                </p>
                            </div>
                        )}

                        <p className="text-muted-foreground text-xs">
                            We'll use this to connect you with local opportunities
                        </p>
                    </div>

                    {/* Info Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">Why do we need this?</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Personalize your dashboard and recommendations</li>
                            <li>• Help you connect with relevant opportunities</li>
                            <li>• Automatically set up your address profile</li>
                            <li>• Ensure you get the best learning experience</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={loading}
                >
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!fullName.trim() || loading}
                    className="min-w-[120px]"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                        </div>
                    ) : (
                        'Complete Setup'
                    )}
                </Button>
            </div>
        </div>
    )
}