import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  X,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Ban
} from 'lucide-react'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm grid grid-cols-[auto_1fr_auto] items-start gap-3 transition-all duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-card border-border text-card-foreground [&>[data-slot=alert-icon]]:text-muted-foreground',
        destructive:
          'bg-destructive/10 border-destructive/20 text-destructive [&>[data-slot=alert-icon]]:text-destructive',
        warning:
          'bg-yellow-50 border-yellow-200 text-yellow-600 [&>[data-slot=alert-icon]]:text-yellow-600',
        success:
          'bg-success/10 border-success/20 text-success [&>[data-slot=alert-icon]]:text-success',
        info:
          'bg-blue-50 border-blue-200 text-blue-700 [&>[data-slot=alert-icon]]:text-blue-600',
      },
      size: {
        sm: 'text-xs p-3',
        md: 'text-sm p-4',
        lg: 'text-base p-5',
      },
      elevation: {
        flat: 'shadow-none',
        low: 'shadow-sm',
        medium: 'shadow-md',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'md',
      elevation: 'flat',
    },
  },
)

const iconVariants = cva('size-4 shrink-0', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      destructive: 'text-destructive',
      warning: 'text-yellow-600',
      success: 'text-success',
      info: 'text-blue-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface AlertProps extends React.ComponentProps<'div'>,
  VariantProps<typeof alertVariants> {
  onClose?: () => void
  showIcon?: boolean
  closable?: boolean
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant,
    size,
    elevation,
    onClose,
    showIcon = true,
    closable = false,
    icon,
    children,
    ...props
  }, ref) => {
    const getIcon = () => {
      if (icon) return icon

      const iconProps = { className: iconVariants({ variant }) }

      switch (variant) {
        case 'destructive':
          return <Ban {...iconProps} />
        case 'warning':
          return <AlertTriangle {...iconProps} />
        case 'success':
          return <CheckCircle {...iconProps} />
        case 'info':
          return <HelpCircle {...iconProps} />
        default:
          return <Info {...iconProps} />
      }
    }

    return (
      <div
        ref={ref}
        data-slot="alert"
        role="alert"
        aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
        className={cn(alertVariants({ variant, size, elevation }), className)}
        {...props}
      >
        {/* Icon */}
        {showIcon && (
          <div
            data-slot="alert-icon"
            className="flex items-center h-5" // Changed from items-start to items-center and added fixed height
          >
            {getIcon()}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'flex flex-col justify-center min-h-5', // Added flex column, center alignment, and minimum height
          !showIcon && 'col-start-1'
        )}>
          {children}
        </div>

        {/* Close Button */}
        {closable && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'size-4 rounded flex items-center justify-center transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 self-center', // Added self-center for vertical alignment
              variant === 'destructive' && 'hover:bg-destructive/20',
              variant === 'warning' && 'hover:bg-yellow-100',
              variant === 'success' && 'hover:bg-success/20',
              variant === 'info' && 'hover:bg-blue-100'
            )}
            aria-label="Close alert"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = 'Alert'

interface AlertTitleProps extends React.ComponentProps<'div'> {
  asChild?: boolean
}

const AlertTitle = React.forwardRef<HTMLDivElement, AlertTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'div'

    return (
      <Comp
        ref={ref}
        data-slot="alert-title"
        className={cn(
          'font-semibold leading-none tracking-tight flex items-center gap-2', // Changed leading-6 to leading-none
          className
        )}
        {...props}
      />
    )
  }
)
AlertTitle.displayName = 'AlertTitle'

interface AlertDescriptionProps extends React.ComponentProps<'div'> {
  asChild?: boolean
}

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'div'

    return (
      <Comp
        ref={ref}
        data-slot="alert-description"
        className={cn(
          'text-sm leading-normal mt-1 text-inherit [&_p]:leading-normal', // Changed leading-relaxed to leading-normal
          className
        )}
        {...props}
      />
    )
  }
)
AlertDescription.displayName = 'AlertDescription'

// Additional components for better structure
const AlertAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      data-slot="alert-action"
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-8 px-3 py-2',
        className
      )}
      {...props}
    />
  )
)
AlertAction.displayName = 'AlertAction'

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  type AlertProps
}