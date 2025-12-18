import React from 'react';
import { Metadata } from 'next';
import { CoachingService, CoachingUrlUtils } from '@/lib/coaching';

type Props = {
    children: React.ReactNode;
    params: { slug: string };
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const slug = params?.slug;
    if (!slug) return {};

    try {
        const result = await CoachingService.getCoachingCenterBySlug(slug);
        if (!result || !result.success || !result.data) {
            return {
                title: `Coaching - ${slug}`,
            };
        }

        const center = result.data;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
        const pageUrl = `${siteUrl}${CoachingUrlUtils.getCoachingCenterUrl(center.slug || center.id)}`;
        const coverUrl = CoachingUrlUtils.getCoverUrl(center);

        const title = center.name || `Coaching - ${slug}`;
        const description = center.description || `${title} — Public profile and branches`;

        return {
            title,
            description,
            metadataBase: new URL(siteUrl),
            openGraph: {
                title,
                description,
                url: pageUrl,
                siteName: 'Eduro',
                images: coverUrl ? [{ url: coverUrl, alt: `${title} cover` }] : undefined,
                type: 'website'
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: coverUrl ? [coverUrl] : undefined
            }
        } as Metadata;
    } catch (err) {
        console.error('generateMetadata error for coaching slug', slug, err);
        return {};
    }
}

export default async function CoachingLayout({ children }: Props) {
    return <>{children}</>;
}
