/**
 * Learning Resources List Page
 * SEO-friendly listing of all learning resources
 * Route: /learn
 */

import type { Metadata } from 'next';
import { LEARNING_RESOURCES } from '@/lib/learning-resources/data';
import { ResourcesListClient } from './_components/resources-list-client';

export const metadata: Metadata = {
    title: 'Learning Resources | Tutrsy - Study Materials for Students',
    description: 'Free educational articles and learning resources for students of classes 5-10. Learn Physics, Chemistry, Geography, Business and more with easy-to-understand content.',
    keywords: [
        'learning resources',
        'study materials',
        'educational articles',
        'physics for students',
        'chemistry basics',
        'geography lessons',
        'business studies',
        'class 5-10 students',
        'free education',
        'online learning',
    ],
    openGraph: {
        title: 'Learning Resources | Tutrsy',
        description: 'Free educational articles for students of classes 5-10. Easy-to-understand content for Physics, Chemistry, Geography, and Business.',
        type: 'website',
        url: '/learn',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Learning Resources | Tutrsy',
        description: 'Free educational articles for students of classes 5-10.',
    },
    alternates: {
        canonical: '/learn',
    },
};

// JSON-LD structured data for SEO
function generateStructuredData() {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Learning Resources',
        description: 'Educational articles and learning resources for students',
        url: '/learn',
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: LEARNING_RESOURCES.length,
            itemListElement: LEARNING_RESOURCES.map((resource, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'Article',
                    name: resource.title,
                    description: resource.summary,
                    url: `/learn/${resource.slug}`,
                    educationalLevel: `Grade ${resource.gradeLevel}`,
                    learningResourceType: 'Article',
                    timeRequired: `PT${resource.estimatedReadTime}M`,
                },
            })),
        },
    };
}

export default function LearnPage() {
    const structuredData = generateStructuredData();

    return (
        <>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Page Content */}
            <ResourcesListClient resources={LEARNING_RESOURCES} />
        </>
    );
}
