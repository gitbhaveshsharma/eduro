import type { Metadata } from 'next';
import { ConditionalLayout } from '@/components/layout/conditional-layout';

export const metadata: Metadata = {
    title: 'Settings | Eduro',
    description: 'Manage your profile, preferences, and account settings',
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConditionalLayout
            forceConfig={{
                page: 'settings',
                headerType: 'universal',
                title: 'Settings',
                sidebar: {
                    enabled: true,
                    defaultOpen: false,
                },
            }}
        // Enable search in header for settings page
        >
            {children}
        </ConditionalLayout>
    );
}