'use client'

import { cn } from '@/lib/utils'
import { brandColors } from '@/components/theme-provider'

interface LoadingSpinnerProps {
    /** The text to display below the spinner */
    message?: string
    /** Short title or label for the spinner (displayed above message) */
    title?: string
    /** The component or feature being loaded */
    component?: string
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** Color variant of the spinner */
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    /** Whether to show as fullscreen overlay */
    fullscreen?: boolean
    /** Additional CSS classes */
    className?: string
    /** Show inline (no vertical centering) */
    inline?: boolean
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
}

const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
}

const getSpinnerColor = (variant: LoadingSpinnerProps['variant']) => {
    switch (variant) {
        case 'primary':
            return `border-[${brandColors.primary}]`
        case 'secondary':
            return `border-[${brandColors.secondary}]`
        case 'success':
            return `border-[${brandColors.success}]`
        case 'warning':
            return `border-[${brandColors.warning}]`
        case 'error':
            return `border-[${brandColors.error}]`
        default:
            return `border-[${brandColors.primary}]`
    }
}

export function LoadingSpinner({
    message = 'Loading...',
    title,
    component,
    size = 'md',
    variant = 'primary',
    fullscreen = false,
    className,
    inline = false
}: LoadingSpinnerProps) {
    const displayMessage = component ? `Loading ${component}...` : message

    const spinnerContent = (
        <div className={cn(
            'flex flex-col items-center gap-3',
            inline ? '' : 'justify-center',
            className
        )}>
            {/* Spinner at the top */}
            <div
                className={cn(
                    'animate-spin rounded-full border-2 border-t-transparent',
                    sizeClasses[size],
                    variant === 'primary' && 'border-[#1D4ED8]',
                    variant === 'secondary' && 'border-[#3B82F6]',
                    variant === 'success' && 'border-[#10B981]',
                    variant === 'warning' && 'border-[#F59E0B]',
                    variant === 'error' && 'border-[#EF4444]'
                )}
            />

            {/* Title below spinner */}
            {title && (
                <div className={cn('text-sm font-semibold text-gray-700')}>{title}</div>
            )}

            {/* Message below title */}
            {displayMessage && (
                <span className={cn(
                    'text-[#6B7280] font-medium',
                    textSizeClasses[size]
                )}>
                    {displayMessage}
                </span>
            )}
        </div>
    )

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-[#F3F4F6] flex items-center justify-center z-50">
                {spinnerContent}
            </div>
        )
    }

    if (inline) {
        return spinnerContent
    }

    return (
        <div className="flex items-center justify-center min-h-[200px]">
            {spinnerContent}
        </div>
    )
}

// Specialized loading components for common use cases
export function AuthLoadingSpinner() {
    return (
        <LoadingSpinner
            component="authentication"
            size="lg"
            variant="primary"
            fullscreen
        />
    )
}

export function PageLoadingSpinner({ component }: { component?: string }) {
    return (
        <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
            <LoadingSpinner
                component={component}
                size="lg"
                variant="primary"
            />
        </div>
    )
}

export function ButtonLoadingSpinner({
    message = 'Please wait...',
    size = 'sm'
}: {
    message?: string
    size?: 'sm' | 'md'
}) {
    return (
        <LoadingSpinner
            message={message}
            size={size}
            variant="primary"
            inline
        />
    )
}

export function ComponentLoadingSpinner({
    component,
    size = 'md'
}: {
    component?: string
    size?: 'sm' | 'md' | 'lg'
}) {
    return (
        <LoadingSpinner
            component={component}
            size={size}
            variant="primary"
        />
    )
}