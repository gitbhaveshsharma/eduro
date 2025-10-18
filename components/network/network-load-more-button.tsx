'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LoadMoreButtonProps {
    isLoading: boolean;
    currentCount: number;
    totalCount: number;
    onClick: () => void;
}

export function LoadMoreButton({
    isLoading,
    currentCount,
    totalCount,
    onClick
}: LoadMoreButtonProps) {
    return (
        <div className="flex justify-center mt-6">
            <Button
                variant="outline"
                onClick={onClick}
                disabled={isLoading}
                className="gap-2 w-full sm:w-auto"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more...
                    </>
                ) : (
                    <>
                        Load More
                        <Badge variant="secondary" className="ml-2">
                            {currentCount} of {totalCount}
                        </Badge>
                    </>
                )}
            </Button>
        </div>
    );
}
