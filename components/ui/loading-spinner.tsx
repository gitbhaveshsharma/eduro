'use client'

import { cn } from '@/lib/utils'

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
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4'
}

const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
}

// Static color classes for Tailwind to properly compile
const variantColorClasses = {
    primary: 'border-blue-700',
    secondary: 'border-blue-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500'
}

// Button-specific spinner colors (white for filled buttons)
const buttonVariantColorClasses = {
    primary: 'border-white',
    secondary: 'border-white',
    success: 'border-white',
    warning: 'border-white',
    error: 'border-white'
}

// For outline/ghost/link variants
const outlineButtonVariantColorClasses = {
    primary: 'border-blue-700',
    secondary: 'border-blue-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500'
}

// Static transparent border classes for the top border
const variantTransparentClasses = {
    primary: 'border-t-transparent',
    secondary: 'border-t-transparent',
    success: 'border-t-transparent',
    warning: 'border-t-transparent',
    error: 'border-t-transparent'
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
                    'animate-spin rounded-full',
                    sizeClasses[size],
                    variantColorClasses[variant],
                    variantTransparentClasses[variant]
                )}
                style={{
                    borderStyle: 'solid',
                    borderTopColor: 'transparent'
                }}
            />

            {/* Title below spinner */}
            {title && (
                <div className={cn(
                    'font-semibold',
                    textSizeClasses[size],
                    variant === 'primary' && 'text-blue-700',
                    variant === 'secondary' && 'text-blue-500',
                    variant === 'success' && 'text-green-500',
                    variant === 'warning' && 'text-yellow-500',
                    variant === 'error' && 'text-red-500'
                )}>
                    {title}
                </div>
            )}

            {/* Message below title */}
            {displayMessage && (
                <span className={cn(
                    'font-medium',
                    textSizeClasses[size],
                    'text-gray-600'
                )}>
                    {displayMessage}
                </span>
            )}
        </div>
    )

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
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
            title="Authenticating"
            message="Please wait while we verify your credentials..."
            size="lg"
            variant="primary"
            fullscreen
        />
    )
}

export function PageLoadingSpinner({ component }: { component?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
            <LoadingSpinner
                component={component}
                size="lg"
                variant="primary"
            />
        </div>
    )
}

interface ButtonLoadingSpinnerProps {
    message?: string
    size?: 'sm' | 'md'
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    /** Button variant for styling context */
    buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning'
}
export function ButtonLoadingSpinner({
    message,
    size = 'sm',
    variant = 'primary',
    buttonVariant = 'default'
}: ButtonLoadingSpinnerProps) {
    const buttonSizeClasses = {
        sm: 'h-3 w-3 border-2',
        md: 'h-4 w-4 border-2'
    }

    // Determine if button is filled (needs white spinner) or outline/ghost/link
    const isFilledButton = ['default', 'destructive', 'secondary', 'success', 'warning'].includes(buttonVariant)
    const isOutlineButton = ['outline', 'ghost', 'link'].includes(buttonVariant)

    // Choose spinner color based on button variant
    const spinnerColorClass = isFilledButton
        ? 'border-white'
        : outlineButtonVariantColorClasses[variant]

    // Text color for loading message
    const getTextColorClass = () => {
        if (isFilledButton) return 'text-white'

        // For outline/ghost/link buttons, use appropriate colors
        switch (variant) {
            case 'primary': return 'text-blue-600 dark:text-blue-400'
            case 'secondary': return 'text-blue-500 dark:text-blue-300'
            case 'success': return 'text-green-600 dark:text-green-400'
            case 'warning': return 'text-yellow-600 dark:text-yellow-400'
            case 'error': return 'text-red-600 dark:text-red-400'
            default: return 'text-gray-700 dark:text-gray-300'
        }
    }

    return (
        <div className="inline-flex items-center gap-2">
            <div
                className={cn(
                    'animate-spin rounded-full',
                    buttonSizeClasses[size],
                    spinnerColorClass,
                    variantTransparentClasses[variant]
                )}
                style={{
                    borderStyle: 'solid',
                    borderTopColor: 'transparent'
                }}
            />
            {message && (
                <span className={cn(
                    'font-medium',
                    size === 'sm' ? 'text-xs' : 'text-sm',
                    getTextColorClass()
                )}>
                    {message}
                </span>
            )}
        </div>
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
            inline
        />
    )
}

// Additional specialized spinners
export function TableLoadingSpinner() {
    return (
        <div className="py-8">
            <LoadingSpinner
                message="Loading data..."
                size="md"
                variant="secondary"
            />
        </div>
    )
}

export function CardLoadingSpinner() {
    return (
        <div className="p-6">
            <LoadingSpinner
                message="Loading content..."
                size="sm"
                variant="secondary"
            />
        </div>
    )
}

// Dashboard loading spinner with multiple spinners
export function DashboardLoadingSpinner() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <LoadingSpinner
                    title="Loading Dashboard"
                    message="Please wait while we prepare your dashboard..."
                    size="lg"
                    variant="primary"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                            <LoadingSpinner
                                message={`Loading widget ${item}...`}
                                size="sm"
                                variant="secondary"
                                inline
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}