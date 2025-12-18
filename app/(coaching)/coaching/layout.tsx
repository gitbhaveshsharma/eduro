import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

// Client-only layout (moved to a separate file to keep this a server component)
const CoachingLayoutClient = dynamic(() => import('./CoachingLayoutClient'), { ssr: false });

export async function generateMetadata(): Promise<Metadata> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
    const title = 'Coaching Centers — tutrsy';
    const description = 'Discover verified coaching centers, compare branches, read reviews, and find local coaching near you.';
    const ogImage = `${siteUrl}/images/og/coaching-default.png`;

    return {
        title,
        description,
        metadataBase: new URL(siteUrl),
        openGraph: {
            title,
            description,
            url: `${siteUrl}/coaching`,
            siteName: 'tutrsy',
            images: [{ url: ogImage, alt: 'Coaching centers on tutrsy' }],
            type: 'website'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage]
        },
        robots: {
            index: true,
            follow: true
        },
        keywords: ['coaching', 'tutors', 'education', 'centers', 'reviews', 'branches'],
        alternates: {
            canonical: '/coaching'
        }
    };
}

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
    return <CoachingLayoutClient>{children}</CoachingLayoutClient>;
}