'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-white p-1 rounded-lg shadow-sm border border-[#E5E7EB]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200",
        "data-[state=active]:bg-[#1D4ED8] data-[state=active]:text-white data-[state=active]:shadow-sm",
        "text-[#6B7280] hover:text-[#111827]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'outline-none',
        'data-[state=inactive]:animate-tabs-out data-[state=active]:animate-tabs-in',
        className
      )}
      {...props}
    />
  )
}

// Enhanced wrapper for smooth content transitions
const TabsContentWrapper = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    containerClass?: string
  }
>(({ className, containerClass, children, ...props }, ref) => {
  const dataState = (props as any)['data-state']
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'outline-none',
        className
      )}
      {...props}
    >
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        'data-[state=active]:opacity-100 data-[state=active]:translate-x-0',
        'data-[state=inactive]:absolute data-[state=inactive]:inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none',
        containerClass
      )} data-state={dataState}>
        {children}
      </div>
    </TabsPrimitive.Content>
  )
})
TabsContentWrapper.displayName = 'TabsContentWrapper'

// Alternative: Custom Tabs with smooth transitions
const AnimatedTabs = {
  Root: Tabs,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  ContentWrapper: TabsContentWrapper,
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsContentWrapper, AnimatedTabs }