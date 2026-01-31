/**
 * Article Reader Client Component
 * Handles client-side interactions for reading articles
 */

'use client';

import { useRouter } from 'next/navigation';
import { ArticleReader } from '@/components/learning-resources/article-reader';
import { ResourceCardCompact } from '@/components/learning-resources/resource-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';
import type { LearningResource } from '@/lib/learning-resources/data';
import { useAllReadingProgress } from '@/lib/learning-resources/use-reading-progress';

interface ArticleReaderClientProps {
    resource: LearningResource;
    relatedResources: LearningResource[];
}

export function ArticleReaderClient({
    resource,
    relatedResources,
}: ArticleReaderClientProps) {
    const router = useRouter();
    const { getProgressPercentage, getStatus } = useAllReadingProgress();

    const handleBack = () => {
        router.push('/learn');
    };

    const handleRelatedClick = (relatedResource: LearningResource) => {
        router.push(`/learn/${relatedResource.slug}`);
    };

    return (
        <div className="bg-background">
            <ArticleReader
                resource={resource}
                onBack={handleBack}
            />

            {/* Related Resources Section */}
            {relatedResources.length > 0 && (
                <section className="max-w-4xl mx-auto px-4 pb-12">
                    <Separator className="my-8" />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Related Resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {relatedResources.map((related) => (
                                <ResourceCardCompact
                                    key={related.id}
                                    resource={related}
                                    progress={getProgressPercentage(related.id)}
                                    status={getStatus(related.id)}
                                    onStart={() => handleRelatedClick(related)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
