import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { brandColors } from '@/components/theme-provider'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        outline: '',
        secondary: '',
        ghost: '',
        link: '',
        success: '',
        warning: '',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    ...props
  },
  ref,
) {
  const { theme } = useTheme()
  const Comp: any = asChild ? Slot : 'button'

  // Dynamic theme-based styles
  const getVariantStyles = (variant: string) => {
    const isDark = theme === 'dark'

    type PseudoStyle = {
      ringColor?: string
      [key: string]: any
    }

    type VariantStyle = {
      backgroundColor?: string
      color?: string
      boxShadow?: string
      border?: string
      textDecoration?: string
      textUnderlineOffset?: string | number
      ':hover'?: Record<string, any>
      ':focus-visible'?: PseudoStyle
      [key: string]: any
    }

    const variantStyles: Record<string, VariantStyle> = {
      default: {
        backgroundColor: brandColors.primary,
        color: '#ffffff',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        ':hover': {
          backgroundColor: `color-mix(in srgb, ${brandColors.primary} 90%, black)`,
        },
        ':focus-visible': {
          ringColor: `${brandColors.primary}50`,
        }
      },
      destructive: {
        backgroundColor: brandColors.error,
        color: '#ffffff',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        ':hover': {
          backgroundColor: `color-mix(in srgb, ${brandColors.error} 90%, black)`,
        },
        ':focus-visible': {
          ringColor: `${brandColors.error}33`,
        }
      },
      outline: {
        backgroundColor: isDark ? `${brandColors.textPrimary}30` : brandColors.background,
        color: isDark ? brandColors.card : brandColors.textPrimary,
        border: `1px solid ${isDark ? `${brandColors.border}33` : brandColors.border}`,
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        ':hover': {
          backgroundColor: isDark ? `${brandColors.textPrimary}50` : `${brandColors.primary}10`,
          color: isDark ? brandColors.card : brandColors.primary,
        }
      },
      secondary: {
        backgroundColor: brandColors.secondary,
        color: '#ffffff',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        ':hover': {
          backgroundColor: `color-mix(in srgb, ${brandColors.secondary} 80%, black)`,
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: isDark ? brandColors.card : brandColors.textPrimary,
        ':hover': {
          backgroundColor: isDark ? `${brandColors.primary}20` : `${brandColors.primary}10`,
          color: brandColors.primary,
        }
      },
      link: {
        backgroundColor: 'transparent',
        color: brandColors.primary,
        textDecoration: 'underline',
        textUnderlineOffset: '4px',
        ':hover': {
          textDecoration: 'underline',
        }
      },
      success: {
        backgroundColor: brandColors.success,
        color: '#ffffff',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        ':hover': {
          backgroundColor: `color-mix(in srgb, ${brandColors.success} 90%, black)`,
        },
        ':focus-visible': {
          ringColor: `${brandColors.success}33`,
        }
      },
      warning: {
        backgroundColor: brandColors.warning,
        color: '#ffffff',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        ':hover': {
          backgroundColor: `color-mix(in srgb, ${brandColors.warning} 90%, black)`,
        },
        ':focus-visible': {
          ringColor: `${brandColors.warning}33`,
        }
      },
    }

    return variantStyles[variant as keyof typeof variantStyles] || variantStyles.default
  }

  const variantStyles = getVariantStyles(variant || 'default')

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        color: variantStyles.color,
        border: variantStyles.border || 'none',
        boxShadow: variantStyles.boxShadow,
        textDecoration: variantStyles.textDecoration || 'none',
        textUnderlineOffset: variantStyles.textUnderlineOffset,
        transition: 'all 0.2s ease-in-out',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        const hoverStyle = variantStyles[':hover']
        if (hoverStyle && typeof hoverStyle === 'object') {
          Object.assign(e.currentTarget.style, hoverStyle)
        }
        ; (props as React.ButtonHTMLAttributes<HTMLButtonElement>).onMouseEnter?.(e)
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        Object.assign(e.currentTarget.style, {
          backgroundColor: variantStyles.backgroundColor,
          color: variantStyles.color,
          textDecoration: variantStyles.textDecoration || 'none',
        })
          ; (props as React.ButtonHTMLAttributes<HTMLButtonElement>).onMouseLeave?.(e)
      }}
      onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
        const focusStyle = variantStyles[':focus-visible']
        if (focusStyle && focusStyle.ringColor) {
          // Apply an outer ring via boxShadow while preserving existing boxShadow
          const existing = e.currentTarget.style.boxShadow || ''
          e.currentTarget.style.boxShadow = `${existing ? existing + ', ' : ''}0 0 0 3px ${focusStyle.ringColor}, 0 0 0 2px transparent`
        }
        ; (props as React.ButtonHTMLAttributes<HTMLButtonElement>).onFocus?.(e)
      }}
      onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
        const baseBox = variantStyles.boxShadow || 'none'
        e.currentTarget.style.boxShadow = baseBox
          ; (props as React.ButtonHTMLAttributes<HTMLButtonElement>).onBlur?.(e)
      }}
      {...props}
    />
  )
})

export { Button, buttonVariants }
