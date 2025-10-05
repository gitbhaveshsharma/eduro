'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ButtonLoadingSpinner } from '@/components/ui/loading-spinner'
import {
    emailOtpRequestSchema,
    otpVerificationSchema,
    type EmailOtpRequestData,
    type OtpVerificationData
} from '@/lib/validations'
import { authService } from '@/lib/auth-service'
import { authToasts } from '@/lib/toast'

interface OtpFormProps {
    onSuccess?: () => void
    onBack?: () => void
    className?: string
}

export function OtpForm({ onSuccess, onBack, className }: OtpFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [email, setEmail] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const emailForm = useForm<EmailOtpRequestData>({
        resolver: zodResolver(emailOtpRequestSchema),
        mode: 'onSubmit', // Only validate on submit
        defaultValues: {
            email: ''
        }
    })

    const otpForm = useForm<OtpVerificationData>({
        resolver: zodResolver(otpVerificationSchema),
    })

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const sendOtp = async (data: EmailOtpRequestData) => {
        setIsLoading(true)

        try {
            const result = await authService.signInWithEmailOtp(data)

            if (result.success) {
                setEmail(data.email)
                setOtpSent(true)
                setCountdown(60) // 60 seconds cooldown
                authToasts.otpSent()

                // Set the email in OTP form
                otpForm.setValue('email', data.email)
            } else {
                authToasts.otpError(result.error!)
            }
        } catch (error) {
            authToasts.unexpectedError()
        } finally {
            setIsLoading(false)
        }
    }

    const verifyOtp = async (data: OtpVerificationData) => {
        setIsVerifying(true)

        try {
            const result = await authService.verifyEmailOtp(data)

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
        if (countdown > 0 || !email) return

        try {
            const result = await authService.signInWithEmailOtp({ email })

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
        setEmail('')
        setCountdown(0)
        emailForm.reset()
        otpForm.reset()
        onBack?.()
    }

    if (!otpSent) {
        return (
            <div className={className}>
                <div className="space-y-4">
                    <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4" noValidate>
                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-[#111827]">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                                <Input
                                    id="email-otp"
                                    type="email"
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    className={`pl-10 bg-white border-[#E5E7EB] focus:border-[#1D4ED8] focus:ring-[#1D4ED8] ${emailForm.formState.errors.email ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]' : ''
                                        }`}
                                    {...emailForm.register('email', {
                                        onChange: () => {
                                            // Clear errors when user starts typing
                                            if (emailForm.formState.errors.email) {
                                                emailForm.clearErrors('email')
                                            }
                                        }
                                    })}
                                    disabled={isLoading}
                                />
                            </div>
                            {emailForm.formState.errors.email && emailForm.formState.touchedFields.email && (
                                <p className="text-sm text-[#EF4444]">{emailForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        {/* Send Code Button */}
                        <Button
                            type="submit"
                            className="w-full bg-[#1D4ED8] hover:bg-[#1e40af] text-white font-medium py-2.5 transition-colors border-0 shadow-none"
                            disabled={isLoading || !emailForm.watch('email') || !!emailForm.formState.errors.email}
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
                        <span className="font-medium text-[#111827]">{email}</span>
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
                        disabled={isVerifying || !otpForm.watch('otp') || otpForm.watch('otp')?.length !== 6}
                    >
                        {isVerifying ? (
                            <ButtonLoadingSpinner message="Verifying..." size="sm" />
                        ) : (
                            'Verify & Sign In'
                        )}
                    </Button>

                    {/* Resend Code */}
                    <div className="text-center">
                        <p className="text-sm text-[#6B7280]">
                            Didn't receive the code?{' '}
                            {countdown > 0 ? (
                                <span className="font-medium">Resend in {countdown}s</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resendOtp}
                                    className="font-medium text-[#3B82F6] hover:text-[#1D4ED8] transition-colors"
                                >
                                    Resend code
                                </button>
                            )}
                        </p>
                    </div>

                    {/* Go Back Option */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={goBack}
                            className="text-sm text-[#3B82F6] hover:text-[#1D4ED8] transition-colors font-medium"
                        >
                            ← Back to email
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}