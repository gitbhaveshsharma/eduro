'use client'

import { toast, Toaster, ToastBar } from 'react-hot-toast'
import { brandColors } from '@/components/theme-provider'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// Custom toast configuration with brand colors
const toastConfig = {
    duration: 4000,
    position: 'top-center' as const,
    style: {
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '400px',
    },
}

// Success toast
export const showSuccessToast = (message: string, options?: any) => {
    return toast.success(message, {
        ...toastConfig,
        ...options,
        style: {
            ...toastConfig.style,
            background: brandColors.success,
            color: '#FFFFFF',
        },
        icon: <CheckCircle size={20} color="#FFFFFF" />,
    })
}

// Error toast
export const showErrorToast = (message: string, options?: any) => {
    return toast.error(message, {
        ...toastConfig,
        ...options,
        style: {
            ...toastConfig.style,
            background: brandColors.error,
            color: '#FFFFFF',
        },
        icon: <XCircle size={20} color="#FFFFFF" />,
    })
}

// Warning toast
export const showWarningToast = (message: string, options?: any) => {
    return toast(message, {
        ...toastConfig,
        ...options,
        style: {
            ...toastConfig.style,
            background: brandColors.warning,
            color: '#FFFFFF',
        },
        icon: <AlertTriangle size={20} color="#FFFFFF" />,
    })
}

// Info toast
export const showInfoToast = (message: string, options?: any) => {
    return toast(message, {
        ...toastConfig,
        ...options,
        style: {
            ...toastConfig.style,
            background: brandColors.secondary,
            color: '#FFFFFF',
        },
        icon: <Info size={20} color="#FFFFFF" />,
    })
}

// Loading toast
export const showLoadingToast = (message: string = 'Loading...', options?: any) => {
    return toast.loading(message, {
        ...toastConfig,
        ...options,
        style: {
            ...toastConfig.style,
            background: brandColors.card,
            color: brandColors.textPrimary,
            border: `1px solid ${brandColors.border}`,
        },
    })
}

// Auth-specific toast messages
export const authToasts = {
    loginSuccess: (message?: string) => showSuccessToast(message || 'Login successful! Welcome back.'),
    loginError: (error: string) => showErrorToast(error || 'Login failed. Please try again.'),

    signUpSuccess: (message?: string) => showInfoToast(message || 'Account created! Please check your email to verify.'),
    signUpError: (error: string) => showErrorToast(error || 'Sign up failed. Please try again.'),

    otpSent: () => showInfoToast('Login code sent successfully.'),
    otpError: (error: string) => showErrorToast(error || 'Failed to send login code.'),

    otpSuccess: () => showSuccessToast('Login successful!'),
    otpInvalid: () => showErrorToast('Invalid or expired code. Please try again.'),

    logoutSuccess: () => showInfoToast('Logged out successfully.'),

    resetPasswordSent: () => showInfoToast('Password reset link sent to your email.'),
    resetPasswordError: (error: string) => showErrorToast(error || 'Failed to send reset link.'),

    passwordUpdated: () => showSuccessToast('Password updated successfully!'),
    passwordUpdateError: (error: string) => showErrorToast(error || 'Failed to update password.'),

    providerRedirect: (provider: string) => showLoadingToast(`Redirecting to ${provider}...`),
    providerError: (provider: string, error: string) =>
        showErrorToast(error || `${provider} login failed. Please try again.`),

    sessionExpired: () => showWarningToast('Your session has expired. Please log in again.'),
    networkError: () => showErrorToast('Network error. Please check your connection.'),
    unexpectedError: () => showErrorToast('Something went wrong. Please try again.'),
}

// Custom Toaster component with close button and swipe support
export function CustomToaster() {
    return (
        <Toaster
            position="top-center"
            gutter={8}
            containerStyle={{
                top: 20,
            }}
        >
            {(t) => (
                <ToastBar toast={t}>
                    {({ icon, message }) => (
                        <div className="flex items-center gap-2 w-full">
                            {icon}
                            <div className="flex-1">{message}</div>
                            {t.type !== 'loading' && (
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                                    aria-label="Close notification"
                                >
                                    <X size={16} className="text-current" />
                                </button>
                            )}
                        </div>
                    )}
                </ToastBar>
            )}
        </Toaster>
    )
}

// Promise-based toast for async operations
export const promiseToast = {
    auth: function <T>(
        promise: Promise<T>,
        options: {
            loading?: string
            success?: string | ((data: T) => string)
            error?: string | ((error: any) => string)
        }
    ) {
        const {
            loading = 'Processing...',
            success = 'Success!',
            error = 'Something went wrong',
        } = options

        return toast.promise(promise, {
            loading,
            success,
            error,
        }, {
            style: toastConfig.style,
            success: {
                style: {
                    ...toastConfig.style,
                    background: brandColors.success,
                    color: '#FFFFFF',
                },
            },
            error: {
                style: {
                    ...toastConfig.style,
                    background: brandColors.error,
                    color: '#FFFFFF',
                },
            },
            loading: {
                style: {
                    ...toastConfig.style,
                    background: brandColors.card,
                    color: brandColors.textPrimary,
                    border: `1px solid ${brandColors.border}`,
                },
            },
        })
    },
}

// Utility to dismiss all toasts
export const dismissAllToasts = () => {
    toast.dismiss()
}
