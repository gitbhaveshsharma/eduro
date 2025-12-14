'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail } from 'lucide-react';
import type { CoachingBranch } from '@/lib/schema/coaching.types';

interface BranchCardProps {
    branch: CoachingBranch;
}

export const BranchCard = memo(({ branch }: BranchCardProps) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${branch.is_main_branch ? 'bg-primary/10' : 'bg-green-100'
                        }`}>
                        <MapPin className={`h-4 w-4 ${branch.is_main_branch ? 'text-primary' : 'text-green-600'
                            }`} />
                    </div>
                    <div>
                        <CardTitle className="text-base">{branch.name}</CardTitle>
                        {branch.is_main_branch && (
                            <Badge variant="secondary" className="text-xs mt-1">Main Branch</Badge>
                        )}
                    </div>
                </div>
                <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {branch.description || 'No description'}
            </p>
            {(branch.phone || branch.email) && (
                <div className="space-y-1 text-xs text-muted-foreground">
                    {branch.phone && (
                        <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{branch.phone}</span>
                        </div>
                    )}
                    {branch.email && (
                        <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{branch.email}</span>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
    </Card>
));

BranchCard.displayName = 'BranchCard';
