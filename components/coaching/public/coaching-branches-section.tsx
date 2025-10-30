/**
 * Coaching Branches Section Component
 * 
 * Displays all branches of a coaching center
 * Shows branch cards with location, contact info, and "Join" CTA
 */

'use client';

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
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface CoachingBranchesSectionProps {
    branches: PublicCoachingBranch[];
    centerSlug: string;
    onJoinBranch?: (branchId: string) => void;
}

export function CoachingBranchesSection({
    branches,
    centerSlug,
    onJoinBranch
}: CoachingBranchesSectionProps) {
    if (!branches || branches.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Branches
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No branches available at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort branches: main branch first, then active branches, then inactive
    const sortedBranches = [...branches].sort((a, b) => {
        if (a.is_main_branch && !b.is_main_branch) return -1;
        if (!a.is_main_branch && b.is_main_branch) return 1;
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return 0;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Branches ({branches.length})
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
}

interface BranchCardProps {
    branch: PublicCoachingBranch;
    centerSlug: string;
    onJoinBranch?: (branchId: string) => void;
}

function BranchCard({ branch, centerSlug, onJoinBranch }: BranchCardProps) {
    const branchTypeDisplay = CoachingDisplayUtils.getBranchTypeDisplay(branch.is_main_branch);

    return (
        <div className={`
      relative rounded-lg border p-4 space-y-3 transition-all hover:shadow-md
      ${!branch.is_active ? 'opacity-60 bg-muted/30' : 'bg-card'}
    `}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{branch.name}</h3>

                        <div className="flex gap-2">
                            {branch.is_main_branch && (
                                <Badge variant="default" className="text-xs">
                                    {branchTypeDisplay.icon} {branchTypeDisplay.label}
                                </Badge>
                            )}

                            <Badge
                                variant="secondary"
                                className={`text-xs ${branch.is_active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : ""
                                    }`}
                            >
                                {branch.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>

                    {branch.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {branch.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {branch.phone && (
                    <a
                        href={`tel:${branch.phone}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                        <span>{branch.phone}</span>
                    </a>
                )}

                {branch.email && (
                    <a
                        href={`mailto:${branch.email}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Mail className="h-4 w-4" />
                        <span>{branch.email}</span>
                    </a>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                >
                    <Link href={`/coaching/${centerSlug}/branch/${branch.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </Button>

                {branch.is_active && onJoinBranch && (
                    <Button
                        size="sm"
                        onClick={() => onJoinBranch(branch.id)}
                    >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Join
                    </Button>
                )}
            </div>
        </div>
    );
}
