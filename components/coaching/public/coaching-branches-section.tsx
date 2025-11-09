/**
 * Coaching Branches Section - Modern List Design
 * Optimized with memoization and callbacks
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    type PublicCoachingBranch,
    CoachingDisplayUtils
} from '@/lib/coaching';
import {
    MapPin,
    Phone,
    Mail,
    Building2,
    UserPlus,
    ChevronRight,
    Star
} from 'lucide-react';
import Link from 'next/link';

interface CoachingBranchesSectionProps {
    branches: PublicCoachingBranch[];
    centerSlug: string;
    onJoinBranch?: (branchId: string) => void;
}

export const CoachingBranchesSection = memo(function CoachingBranchesSection({
    branches,
    centerSlug,
    onJoinBranch
}: CoachingBranchesSectionProps) {
    const sortedBranches = useMemo(() => {
        return [...branches].sort((a, b) => {
            if (a.is_main_branch && !b.is_main_branch) return -1;
            if (!a.is_main_branch && b.is_main_branch) return 1;
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return 0;
        });
    }, [branches]);

    if (!branches || branches.length === 0) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5 text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        Branches
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-muted rounded-2xl mb-4">
                            <Building2 className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">No branches available at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    Branches
                    <Badge variant="secondary" className="ml-2">
                        {branches.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedBranches.map((branch) => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            centerSlug={centerSlug}
                            onJoinBranch={onJoinBranch}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
});

interface BranchCardProps {
    branch: PublicCoachingBranch;
    centerSlug: string;
    onJoinBranch?: (branchId: string) => void;
}

const BranchCard = memo(function BranchCard({
    branch,
    centerSlug,
    onJoinBranch
}: BranchCardProps) {
    const branchTypeDisplay = useMemo(
        () => CoachingDisplayUtils.getBranchTypeDisplay(branch.is_main_branch),
        [branch.is_main_branch]
    );

    const handleJoin = useCallback(() => {
        onJoinBranch?.(branch.id);
    }, [branch.id, onJoinBranch]);

    return (
        <div className={`
            group relative rounded-xl border border-border/50 p-5 space-y-4
            transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
            ${!branch.is_active ? 'opacity-60 bg-muted/30' : 'bg-card hover:border-primary/20'}
        `}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                            {branch.name}
                        </h3>

                        {branch.is_main_branch && (
                            <Badge variant="default" className="text-xs bg-primary">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                {branchTypeDisplay.label}
                            </Badge>
                        )}

                        <Badge
                            variant={branch.is_active ? "default" : "secondary"}
                            className={`text-xs ${branch.is_active
                                    ? "bg-green-500 hover:bg-green-600"
                                    : ""
                                }`}
                        >
                            {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>

                    {branch.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {branch.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            {(branch.phone || branch.email) && (
                <div className="flex flex-wrap gap-4 text-sm">
                    {branch.phone && (
                        <a
                            href={`tel:${branch.phone}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <div className="p-1.5 bg-muted rounded-lg">
                                <Phone className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{branch.phone}</span>
                        </a>
                    )}

                    {branch.email && (
                        <a
                            href={`mailto:${branch.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <div className="p-1.5 bg-muted rounded-lg">
                                <Mail className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">{branch.email}</span>
                        </a>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border/50">
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 rounded-xl"
                >
                    <Link href={`/coaching/${centerSlug}/branch/${branch.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </Button>

                {branch.is_active && onJoinBranch && (
                    <Button
                        size="sm"
                        onClick={handleJoin}
                        className="rounded-xl"
                    >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Join
                    </Button>
                )}
            </div>
        </div>
    );
});
