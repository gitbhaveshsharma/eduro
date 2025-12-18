'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import type { CoachingBranch } from '@/lib/schema/coaching.types';
import { BranchCard } from './branch-card';

interface BranchesSectionProps {
    branches: CoachingBranch[];
    onAddBranch?: () => void;
}

export const BranchesSection = memo(({ branches, onAddBranch }: BranchesSectionProps) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Branches</h2>
            <Badge variant="secondary">{branches.length} Total</Badge>
        </div>

        {branches.length === 0 ? (
            <Card>
                <CardContent className="py-8 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No branches found</p>
                    <Button className="mt-4" variant="outline" onClick={onAddBranch}>
                        Add Branch
                    </Button>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                    <BranchCard key={branch.id} branch={branch} />
                ))}
            </div>
        )}
    </div>
));

BranchesSection.displayName = 'BranchesSection';
