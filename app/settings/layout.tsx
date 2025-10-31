import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings | Eduro',
    description: 'Manage your profile, preferences, and account settings',
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
