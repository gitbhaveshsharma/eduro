'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Phone, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ButtonLoadingSpinner } from '@/components/ui/loading-spinner'
import {
    phoneOtpRequestSchema,
    phoneOtpVerificationSchema,
    type PhoneOtpRequestData,
    type PhoneOtpVerificationData
} from '@/lib/validations'
import { authService } from '@/lib/auth-service'
import { authToasts } from '@/lib/toast'

interface PhoneOtpFormProps {
    onSuccess?: () => void
    onBack?: () => void
    className?: string
}

export function PhoneOtpForm({ onSuccess, onBack, className }: PhoneOtpFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [phone, setPhone] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const phoneForm = useForm<PhoneOtpRequestData>({
        resolver: zodResolver(phoneOtpRequestSchema),
        mode: 'onSubmit',
        defaultValues: {
            phone: ''
        }
    })

    const otpForm = useForm<PhoneOtpVerificationData>({
        resolver: zodResolver(phoneOtpVerificationSchema),
    })

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const sendOtp = async (data: PhoneOtpRequestData) => {
        setIsLoading(true)

        try {
            const result = await authService.signInWithPhoneOtp(data)

            if (result.success) {
                setPhone(data.phone)
                setOtpSent(true)
                setCountdown(60) // 60 seconds cooldown
                authToasts.otpSent()

                // Set the phone in OTP form
                otpForm.setValue('phone', data.phone)
            } else {
                authToasts.otpError(result.error!)
            }
        } catch (error) {
            authToasts.unexpectedError()
        } finally {
            setIsLoading(false)
        }
    }

    const verifyOtp = async (data: PhoneOtpVerificationData) => {
        setIsVerifying(true)

        try {
            const result = await authService.verifyPhoneOtp(data)

            if (result.success) {
                authToasts.otpSuccess()
                onSuccess?.()
            } else {
                authToasts.otpInvalid()
                otpForm.setValue('otp', '') // Clear OTP field
            }
        } catch (error) {
            authToasts.unexpectedError()
        } finally {
            setIsVerifying(false)
        }
    }

    const resendOtp = async () => {
        if (countdown > 0 || !phone) return

        try {
            const result = await authService.signInWithPhoneOtp({ phone })

            if (result.success) {
                setCountdown(60)
                authToasts.otpSent()
            } else {
                authToasts.otpError(result.error!)
            }
        } catch (error) {
            authToasts.unexpectedError()
        }
    }

    const goBack = () => {
        setOtpSent(false)
        setPhone('')
        setCountdown(0)
        phoneForm.reset()
        otpForm.reset()
        onBack?.()
    }

    if (!otpSent) {
        return (
            <div className={className}>
                <div className="space-y-4">
                    <form onSubmit={phoneForm.handleSubmit(sendOtp)} className="space-y-4" noValidate>
                        {/* Phone Field */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-[#111827]">
                                Phone Number
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                                <Input
                                    id="phone-otp"
                                    type="tel"
                                    placeholder="+1234567890"
                                    autoComplete="tel"
                                    className={`pl-10 bg-white border-[#E5E7EB] focus:border-[#1D4ED8] focus:ring-[#1D4ED8] ${phoneForm.formState.errors.phone ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]' : ''
                                        }`}
                                    {...phoneForm.register('phone', {
                                        onChange: () => {
                                            // Clear errors when user starts typing
                                            if (phoneForm.formState.errors.phone) {
                                                phoneForm.clearErrors('phone')
                                            }
                                        }
                                    })}
                                    disabled={isLoading}
                                />
                            </div>
                            {phoneForm.formState.errors.phone && phoneForm.formState.touchedFields.phone && (
                                <p className="text-sm text-[#EF4444]">{phoneForm.formState.errors.phone.message}</p>
                            )}
                        </div>

                        {/* Send Code Button */}
                        <Button
                            type="submit"
                            className="w-full bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-medium py-2.5 transition-colors border-0 shadow-none"
                            disabled={isLoading || !phoneForm.watch('phone') || !!phoneForm.formState.errors.phone}
                        >
                            {isLoading ? (
                                <ButtonLoadingSpinner message="Sending code..." size="sm" />
                            ) : (
                                'Send Login Code'
                            )}
                        </Button>

                        {/* Alternative Login Option */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full text-sm text-[#3B82F6] hover:text-[#1D4ED8] transition-colors font-medium"
                                disabled={isLoading}
                            >
                                Login with another way
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="space-y-4">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-[#111827]">Enter Login Code</h3>
                    <p className="text-sm text-[#6B7280] mt-1">
                        We sent a code to{' '}
                        <span className="font-medium text-[#111827]">{phone}</span>
                    </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-6">
                    {/* OTP Input */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#111827]">
                            6-digit code
                        </Label>
                        <div className="flex justify-center">
                            <InputOTP
                                maxLength={6}
                                value={otpForm.watch('otp') || ''}
                                onChange={(value) => otpForm.setValue('otp', value)}
                                disabled={isVerifying}
                                className="gap-2"
                            >
                                <InputOTPGroup className="gap-2">
                                    <InputOTPSlot index={0} className="w-12 h-12 text-lg border-[#E5E7EB] focus:border-[#1D4ED8]" />
                                    <InputOTPSlot index={1} className="w-12 h-12 text-lg border-[#E5E7EB] focus:border-[#1D4ED8]" />
                                    <InputOTPSlot index={2} className="w-12 h-12 text-lg border-[#E5E7EB] focus:border-[#1D4ED8]" />
                                    <InputOTPSlot index={3} className="w-12 h-12 text-lg border-[#E5E7EB] focus:border-[#1D4ED8]" />
                                    <InputOTPSlot index={4} className="w-12 h-12 text-lg border-[#E5E7EB] focus:border-[#1D4ED8]" />
                                    <InputOTPSlot index={5} className="w-12 h-12 text-lg border-[#E5E7EB] focus:border-[#1D4ED8]" />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        {otpForm.formState.errors.otp && (
                            <p className="text-sm text-[#EF4444] text-center">{otpForm.formState.errors.otp.message}</p>
                        )}
                    </div>

                    {/* Verify Button */}
                    <Button
                        type="submit"
                        className="w-full bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-medium py-2.5 transition-colors border-0 shadow-none"
                        disabled={isVerifying || (otpForm.watch('otp')?.length || 0) < 6}
                    >
                        {isVerifying ? (
                            <ButtonLoadingSpinner message="Verifying..." size="sm" />
                        ) : (
                            'Verify Code'
                        )}
                    </Button>

                    {/* Resend and Back Options */}
                    <div className="flex justify-between items-center text-sm">
                        <button
                            type="button"
                            onClick={resendOtp}
                            className={`font-medium transition-colors ${countdown > 0
                                ? 'text-[#6B7280] cursor-not-allowed'
                                : 'text-[#3B82F6] hover:text-[#1D4ED8]'
                                }`}
                            disabled={countdown > 0 || isVerifying}
                        >
                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                        </button>

                        <button
                            type="button"
                            onClick={goBack}
                            className="text-[#6B7280] hover:text-[#111827] transition-colors font-medium flex items-center gap-1"
                            disabled={isVerifying}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}