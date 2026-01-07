'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, UserCog, ArrowRight, Users } from 'lucide-react';
import type { CoachingBranch } from '@/lib/schema/coaching.types';

interface BranchWithRole extends CoachingBranch {
    coaching_center?: {
        id: string;
        name: string;
        owner_id: string;
        manager_id: string | null;
    };
    role: 'owner' | 'center_manager' | 'branch_manager';
}

interface AssignedBranchCardProps {
    branch: BranchWithRole;
    onSelect: (branch: BranchWithRole) => void;
}

const roleConfig = {
    label: 'Branch Manager',
    description: 'You are assigned to manage this branch',
    icon: UserCog,
    color: 'bg-green-500',
};

export const AssignedBranchCard = memo(({
    branch,
    onSelect
}: AssignedBranchCardProps) => {
    const [loading, setLoading] = useState(false);

    const config = useMemo(() => roleConfig, []);
    const RoleIcon = config.icon;

    const handleSelect = useCallback(async () => {
        setLoading(true);

        // Simulate loading for better UX
        setTimeout(() => {
            setLoading(false);
            onSelect(branch);
        }, 1500);
    }, [onSelect, branch]);

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-green-500/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-600" />
                            {branch.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                            {branch.description || 'No description'}
                        </CardDescription>
                    </div>
                    {branch.is_main_branch && (
                        <Badge variant="secondary" className="text-xs">Main</Badge>
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

                {branch.coaching_center && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{branch.coaching_center.name}</span>
                    </div>
                )}

                <Button
                    onClick={handleSelect}
                    variant="outline"
                    loading={loading}
                    loadingText="Loading..."
                    className="w-full group-hover:bg-green-50 group-hover:border-green-500 group-hover:text-green-700"
                >
                    {!loading && (
                        <>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Branch
                            <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
});

AssignedBranchCard.displayName = 'AssignedBranchCard';