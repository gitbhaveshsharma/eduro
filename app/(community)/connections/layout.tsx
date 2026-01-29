'use client';

/**
 * Connections Layout
 * 
 * Layout for the connections page that provides:
 * - Connections header with search
 * - Shared context for state management
 */

import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { ConnectionsProvider } from './connections-context';

export default function ConnectionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConnectionsProvider>
            <ConditionalLayout
                platform="community"
                forceConfig={{
                    headerType: 'connections',
                    page: 'connections',
                }}
            >
                {children}
            </ConditionalLayout>
        </ConnectionsProvider>
    );
}
