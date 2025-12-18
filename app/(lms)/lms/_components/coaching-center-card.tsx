'use client';

import { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Crown, Shield, ArrowRight, LayoutDashboard } from 'lucide-react';
import type { CoachingCenter, CoachingBranch } from '@/lib/schema/coaching.types';

interface CoachingCenterWithBranches extends CoachingCenter {
    branches: CoachingBranch[];
    role: 'owner' | 'center_manager';
}

interface CoachingCenterCardProps {
    center: CoachingCenterWithBranches;
    onSelect: (center: CoachingCenterWithBranches) => void;
}

const roleConfig = {
    owner: {
        label: 'Owner',
        description: 'You own this coaching center',
        icon: Crown,
        color: 'bg-amber-500',
    },
    center_manager: {
        label: 'Center Manager',
        description: 'You manage this coaching center',
        icon: Shield,
        color: 'bg-blue-500',
    },
};

export const CoachingCenterCard = memo(({
    center,
    onSelect
}: CoachingCenterCardProps) => {
    const config = useMemo(() => roleConfig[center.role], [center.role]);
    const RoleIcon = config.icon;

    const activeBranches = useMemo(
        () => center.branches.filter(b => b.is_active),
        [center.branches]
    );

    const branchCountText = useMemo(
        () => `${activeBranches.length} Active Branch${activeBranches.length !== 1 ? 'es' : ''}`,
        [activeBranches.length]
    );

    const handleSelect = useCallback(() => {
        onSelect(center);
    }, [onSelect, center]);

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2 truncate">
                            <Building2 className="h-5 w-5 text-primary" />
                            {center.name.split(' ').slice(0, 3).join(' ')}..
                        </CardTitle>

                        <CardDescription className="line-clamp-2">
                            {center.description || 'No description'}
                        </CardDescription>
                    </div>
                    {center.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${config.color} text-white`}>
                        <RoleIcon className="h-3 w-3" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{branchCountText}</span>
                    </div>
                </div>

                <Button
                    onClick={handleSelect}
                    className="w-full group-hover:bg-primary/90"
                >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Manage Center
                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </CardContent>
        </Card>
    );
});

CoachingCenterCard.displayName = 'CoachingCenterCard';
