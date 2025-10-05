'use client'

import { toast, Toaster, ToastOptions } from 'react-hot-toast'
import { brandColors } from '@/components/theme-provider'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// Custom toast configuration with brand colors
const toastConfig: ToastOptions = {
    duration: 4000,
    position: 'top-center',
    style: {
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '400px',
    },
}

// Success toast
export const showSuccessToast = (message: string, options?: ToastOptions) => {
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
export const showErrorToast = (message: string, options?: ToastOptions) => {
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
export const showWarningToast = (message: string, options?: ToastOptions) => {
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
export const showInfoToast = (message: string, options?: ToastOptions) => {
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
export const showLoadingToast = (message: string = 'Loading...', options?: ToastOptions) => {
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

// Custom Toaster component with brand styling
export function CustomToaster() {
    return (
        <Toaster
            position="top-center"
            gutter={8}
            containerStyle={{
                top: 20,
            }}
            toastOptions={{
                // Global toast options
                duration: 4000,
                style: {
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    maxWidth: '400px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },

                // Success toast styling
                success: {
                    style: {
                        background: brandColors.success,
                        color: '#FFFFFF',
                    },
                    iconTheme: {
                        primary: '#FFFFFF',
                        secondary: brandColors.success,
                    },
                },

                // Error toast styling
                error: {
                    style: {
                        background: brandColors.error,
                        color: '#FFFFFF',
                    },
                    iconTheme: {
                        primary: '#FFFFFF',
                        secondary: brandColors.error,
                    },
                },

                // Loading toast styling
                loading: {
                    style: {
                        background: brandColors.card,
                        color: brandColors.textPrimary,
                        border: `1px solid ${brandColors.border}`,
                    },
                    iconTheme: {
                        primary: brandColors.primary,
                        secondary: 'transparent',
                    },
                },
            }}
        />
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