'use client';

import { Button } from '@/components/ui/button';
import { Grid3x3, List } from 'lucide-react';

type ViewMode = 'grid' | 'list';

interface ClassesHeaderProps {
    totalClasses: number;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export function ClassesHeader({
    totalClasses,
    viewMode,
    onViewModeChange
}: ClassesHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
                <p className="text-muted-foreground mt-1">
                    {totalClasses} {totalClasses === 1 ? 'class' : 'classes'} assigned
                </p>
            </div>

            <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewModeChange('grid')}
                    className="px-3"
                >
                    <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewModeChange('list')}
                    className="px-3"
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
