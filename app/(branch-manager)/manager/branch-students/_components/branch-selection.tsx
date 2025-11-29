/**
 * Branch Selection Component
 * 
 * Displays a list of branches the user can manage
 * Shows different cards based on user's role (owner, center manager, branch manager)
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Building2, 
    Users, 
    MapPin, 
    Crown, 
    Shield, 
    UserCog,
    ArrowRight,
    Briefcase
} from 'lucide-react';
import type { CoachingBranch } from '@/lib/schema/coaching.types';

interface BranchWithRole extends CoachingBranch {
    coaching_center?: { 
        id: string; 
        name: string; 
        owner_id: string; 
        manager_id: string | null 
    };
    role: 'owner' | 'center_manager' | 'branch_manager';
}

interface BranchSelectionProps {
    branches: BranchWithRole[];
    onSelectBranch: (branchId: string) => void;
    isLoading?: boolean;
}

const roleConfig = {
    owner: {
        label: 'Owner',
        description: 'You own this coaching center',
        icon: Crown,
        color: 'bg-amber-500',
        badgeVariant: 'default' as const,
    },
    center_manager: {
        label: 'Center Manager',
        description: 'You manage this coaching center',
        icon: Shield,
        color: 'bg-blue-500',
        badgeVariant: 'secondary' as const,
    },
    branch_manager: {
        label: 'Branch Manager',
        description: 'You are assigned to manage this branch',
        icon: UserCog,
        color: 'bg-green-500',
        badgeVariant: 'outline' as const,
    },
};

export function BranchSelection({ branches, onSelectBranch, isLoading }: BranchSelectionProps) {
    // Group branches by coaching center
    const groupedBranches = branches.reduce((acc, branch) => {
        const centerName = branch.coaching_center?.name || 'Unknown Center';
        if (!acc[centerName]) {
            acc[centerName] = [];
        }
        acc[centerName].push(branch);
        return acc;
    }, {} as Record<string, BranchWithRole[]>);

    // Separate owned/managed centers from assigned branches
    const ownedOrManagedCenters = Object.entries(groupedBranches).filter(([_, branchList]) =>
        branchList.some(b => b.role === 'owner' || b.role === 'center_manager')
    );

    const assignedBranches = branches.filter(b => 
        b.role === 'branch_manager' && 
        !ownedOrManagedCenters.some(([_, list]) => list.some(lb => lb.id === b.id))
    );

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Owned/Managed Coaching Centers Section */}
            {ownedOrManagedCenters.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Your Coaching Centers</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Coaching centers you own or manage. Select a branch to manage its students.
                    </p>
                    
                    {ownedOrManagedCenters.map(([centerName, branchList]) => (
                        <div key={centerName} className="space-y-3">
                            <h3 className="font-medium text-lg flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {centerName}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {branchList.map((branch) => (
                                    <BranchCard 
                                        key={branch.id} 
                                        branch={branch} 
                                        onSelect={onSelectBranch} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assigned Branches Section */}
            {assignedBranches.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-green-600" />
                        <h2 className="text-xl font-semibold">Assigned Branches</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Branches where you have been assigned as the branch manager.
                    </p>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {assignedBranches.map((branch) => (
                            <BranchCard 
                                key={branch.id} 
                                branch={branch} 
                                onSelect={onSelectBranch} 
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function BranchCard({ 
    branch, 
    onSelect 
}: { 
    branch: BranchWithRole; 
    onSelect: (branchId: string) => void;
}) {
    const config = roleConfig[branch.role];
    const RoleIcon = config.icon;

    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
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
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${config.color} text-white`}>
                        <RoleIcon className="h-3 w-3" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                </div>

                {/* Coaching Center Name (for assigned branches) */}
                {branch.role === 'branch_manager' && branch.coaching_center && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{branch.coaching_center.name}</span>
                    </div>
                )}

                {/* Action Button */}
                <Button 
                    onClick={() => onSelect(branch.id)} 
                    className="w-full group-hover:bg-primary/90"
                >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Students
                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            </CardContent>
        </Card>
    );
}
