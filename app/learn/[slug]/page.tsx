/**
 * Individual Learning Resource Page
 * SEO-friendly article page with dynamic metadata
 * Route: /learn/[slug]
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LEARNING_RESOURCES, getResourceBySlug, getAllResourceSlugs } from '@/lib/learning-resources/data';
import { ArticleReaderClient } from './_components/article-reader-client';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate static params for all resources (Static Site Generation)
export async function generateStaticParams() {
    return getAllResourceSlugs().map((slug) => ({
        slug,
    }));
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const resource = getResourceBySlug(slug);

    if (!resource) {
        return {
            title: 'Resource Not Found',
            description: 'The requested learning resource could not be found.',
        };
    }

    const keywords = [
        resource.subject.name.toLowerCase(),
        'learning',
        'education',
        'students',
        `class ${resource.gradeLevel}`,
        'study material',
        'free education',
        ...resource.keyTakeaways.map(k => k.toLowerCase().split(' ').slice(0, 3).join(' ')),
    ];

    return {
        title: resource.title,
        description: resource.summary,
        keywords,
        authors: [{ name: 'Tutrsy Education' }],
        openGraph: {
            title: `${resource.emoji} ${resource.title}`,
            description: resource.summary,
            type: 'article',
            url: `/learn/${resource.slug}`,
            publishedTime: resource.createdAt,
            modifiedTime: resource.updatedAt,
            section: resource.subject.name,
            tags: keywords,
        },
        twitter: {
            card: 'summary_large_image',
            title: resource.title,
            description: resource.summary,
        },
        alternates: {
            canonical: `/learn/${resource.slug}`,
        },
        other: {
            'article:published_time': resource.createdAt,
            'article:modified_time': resource.updatedAt,
            'article:section': resource.subject.name,
        },
    };
}

// JSON-LD structured data for the article
function generateArticleStructuredData(resource: typeof LEARNING_RESOURCES[0]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: resource.title,
        description: resource.summary,
        datePublished: resource.createdAt,
        dateModified: resource.updatedAt,
        author: {
            '@type': 'Organization',
            name: 'Tutrsy Education',
            url: 'https://tutrsy.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Tutrsy',
            url: 'https://tutrsy.com',
        },
        educationalLevel: `Grade ${resource.gradeLevel}`,
        learningResourceType: 'Article',
        timeRequired: `PT${resource.estimatedReadTime}M`,
        about: {
            '@type': 'Thing',
            name: resource.subject.name,
        },
        articleSection: resource.subject.name,
        wordCount: resource.sections.reduce((acc, s) => acc + s.content.split(' ').length, 0),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `/learn/${resource.slug}`,
        },
    };
}

// Breadcrumb structured data
function generateBreadcrumbStructuredData(resource: typeof LEARNING_RESOURCES[0]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: '/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Learning Resources',
                item: '/learn',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: resource.title,
                item: `/learn/${resource.slug}`,
            },
        ],
    };
}

// FAQ structured data from article content
function generateFAQStructuredData(resource: typeof LEARNING_RESOURCES[0]) {
    // Extract sections that could be FAQs
    const faqSections = resource.sections.filter(
        s => s.title.includes('?') || s.type === 'tip' || s.title.toLowerCase().includes('what')
    ).slice(0, 5);

    if (faqSections.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqSections.map(section => ({
            '@type': 'Question',
            name: section.title,
            acceptedAnswer: {
                '@type': 'Answer',
                text: section.content.slice(0, 500) + (section.content.length > 500 ? '...' : ''),
            },
        })),
    };
}

export default async function LearnResourcePage({ params }: PageProps) {
    const { slug } = await params;
    const resource = getResourceBySlug(slug);

    if (!resource) {
        notFound();
    }

    // Get related resources
    const relatedResources = resource.relatedResources
        .map(id => LEARNING_RESOURCES.find(r => r.id === id))
        .filter(Boolean) as typeof LEARNING_RESOURCES;

    const articleData = generateArticleStructuredData(resource);
    const breadcrumbData = generateBreadcrumbStructuredData(resource);
    const faqData = generateFAQStructuredData(resource);

    return (
        <>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />
            {faqData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
                />
            )}

            {/* Article Reader */}
            <ArticleReaderClient
                resource={resource}
                relatedResources={relatedResources}
            />
        </>
    );
}
