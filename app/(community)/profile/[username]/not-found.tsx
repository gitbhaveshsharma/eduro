/**
 * Profile Not Found Page
 * 
 * Displayed when a profile cannot be found.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserX, ArrowLeft, Search } from 'lucide-react';

export default function ProfileNotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-8 pb-6 text-center space-y-6">
                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <UserX className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-foreground">
                            Profile Not Found
                        </h1>
                        <p className="text-muted-foreground">
                            The profile you're looking for doesn't exist or may have been removed.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild variant="outline">
                            <Link href="/network">
                                <Search className="h-4 w-4 mr-2" />
                                Find People
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
