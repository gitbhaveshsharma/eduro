/**
 * Branch Classes Management Page
 * 
 * Main page for coaches to manage branch classes with complete CRUD operations
 * Features: Dashboard, List view, Create/Edit forms, Filters, and Analytics
 * 
 * NOTE: This page uses coaching center context to show all classes across all branches
 * of the coach's coaching center.
 * 
 * Data fetching is handled by ClassesTable component using context-based approach
 * (similar to receipts-table.tsx pattern). Filtering is done client-side.
 */

'use client';

import { useState } from 'react';
import { useCoachContext } from '../layout';
import { BranchClassesDashboard } from '../../../_components/branch-classes/dashboard';
import { ClassesTable } from '../../../_components/branch-classes/classes-table';
import { CreateClassDialog } from '../../../_components/branch-classes/create-class-dialog';
import { EditClassDialog } from '../../../_components/branch-classes/edit-class-dialog';
import { ClassDetailsDialog } from '../../../_components/branch-classes/class-details-dialog';
import { ClassFilters } from '../../../_components/branch-classes/class-filters';
import { DeleteClassDialog } from '../../../_components/branch-classes/delete-class-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutDashboard, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { type BranchClassFilters } from '@/lib/branch-system/branch-classes';

/**
 * Branch Classes Page Component
 * 
 * Shows all classes across all branches for the coach's coaching center
 */
export default function BranchClassesPage() {
    const { coachingCenterId, coachingCenter, isLoading: contextLoading } = useCoachContext();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [filters, setFilters] = useState<BranchClassFilters>({});

    // Loading state
    if (contextLoading || !coachingCenterId) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branch Classes</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage classes across all branches of <strong>{coachingCenter?.name || 'your coaching center'}</strong>
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    size="lg"
                    className="gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Create New Class
                </Button>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dashboard' | 'list')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span>All Classes</span>
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-6">
                    <BranchClassesDashboard coachingCenterId={coachingCenterId} />
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="mt-6">
                    <Card className="mb-4 p-4">
                        <CardContent className="p-0">
                            <ClassFilters
                                coachingCenterId={coachingCenterId}
                                onFiltersChange={setFilters}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <ClassesTable
                                coachingCenterId={coachingCenterId}
                                filters={filters}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <CreateClassDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
            <EditClassDialog />
            <ClassDetailsDialog />
            <DeleteClassDialog />
        </div>
    );
}