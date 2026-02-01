/**
 * Not Found Page for Learning Resources
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookX, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <CardContent className="pt-12 pb-8">
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-6">
                        <BookX className="h-12 w-12 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">
                        Resource Not Found
                    </h1>

                    <p className="text-muted-foreground mb-8">
                        Sorry, we couldn&apos;t find the learning resource you&apos;re looking for.
                        It may have been moved or doesn&apos;t exist.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild variant="outline">
                            <Link href="/learn">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Resources
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href="/learn">
                                <Search className="h-4 w-4 mr-2" />
                                Browse All
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
