/**
 * Learning Resource Page Layout
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Learn - Tutrsy',
        default: 'Learning Resources | Tutrsy',
    },
};

export default function LearnLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
