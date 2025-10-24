import { ConditionalLayout } from '@/components/layout'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <ConditionalLayout platform="lms" forceConfig={{ headerType: 'lms' }}>
            {children}
        </ConditionalLayout>
    )
}
