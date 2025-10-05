'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { brandColors, type BrandColor } from '@/components/theme-provider'

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

function Progress({
  className,
  value,
  variant = 'primary',
  ...props
}: ProgressProps) {
  const { theme } = useTheme()

  // Define color mappings based on your brand colors
  const getProgressColors = (variant: string) => {
    const colorMap = {
      primary: {
        background: 'rgba(29, 78, 216, 0.2)', // primary with 20% opacity
        indicator: brandColors.primary
      },
      secondary: {
        background: 'rgba(59, 130, 246, 0.2)', // secondary with 20% opacity  
        indicator: brandColors.secondary
      },
      success: {
        background: 'rgba(16, 185, 129, 0.2)', // success with 20% opacity
        indicator: brandColors.success
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.2)', // warning with 20% opacity
        indicator: brandColors.warning
      },
      error: {
        background: 'rgba(239, 68, 68, 0.2)', // error with 20% opacity
        indicator: brandColors.error
      }
    }

    return colorMap[variant as keyof typeof colorMap] || colorMap.primary
  }

  const colors = getProgressColors(variant)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full transition-colors',
        className,
      )}
      style={{
        backgroundColor: colors.background
      }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all duration-300 ease-in-out"
        style={{
          backgroundColor: colors.indicator,
          transform: `translateX(-${100 - (value || 0)}%)`
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
