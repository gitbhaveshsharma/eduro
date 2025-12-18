/**
 * Branch Manager - Branch Classes Page
 * 
 * Manage classes and batches for a specific branch
 * Integrates the full branch classes management system
 * 
 * Data fetching is handled by ClassesTable component using context-based approach
 * (similar to receipts-table.tsx pattern). Filtering is done client-side.
 */

'use client';

import { useState } from 'react';
import { useBranchContext } from '../layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutDashboard, List } from 'lucide-react';

// Import the existing branch classes components
import { BranchClassesDashboard } from '@/app/(lms)/lms/_components/branch-classes/dashboard';
import { ClassFilters } from '@/app/(lms)/lms/_components/branch-classes/class-filters';
import { ClassesTable } from '@/app/(lms)/lms/_components/branch-classes/classes-table';
import { CreateClassDialog } from '@/app/(lms)/lms/_components/branch-classes/create-class-dialog';
import { EditClassDialog } from '@/app/(lms)/lms/_components/branch-classes/edit-class-dialog';
import { DeleteClassDialog } from '@/app/(lms)/lms/_components/branch-classes/delete-class-dialog';
import { ClassDetailsDialog } from '@/app/(lms)/lms/_components/branch-classes/class-details-dialog';

// Import the branch classes system
import {
    useBranchClassesStore,
    useClassesUI,
    type BranchClassFilters,
} from '@/lib/branch-system/branch-classes';

/**
 * Branch Classes Management Component - Scoped to specific branch
 */
function BranchClassesManager({ branchId }: { branchId: string }) {
    const store = useBranchClassesStore();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [filters, setFilters] = useState<BranchClassFilters>({});

    // Handle creating new class for this branch
    const handleCreateClass = () => {
        // Open create dialog via store (Zustand)
        store.startCreating(branchId);
    };

    return (
        <div className="space-y-6">
            {/* Main Content */}
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'dashboard' | 'list')}
                className="w-full"
            >
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
                    <BranchClassesDashboard branchId={branchId} />
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="mt-6">
                    <Card className="mb-4">
                        <CardContent className="pt-6">
                            <ClassFilters
                                branchId={branchId}
                                onFiltersChange={setFilters}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <ClassesTable
                                branchId={branchId}
                                filters={filters}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <BranchCreateClassDialog
                branchId={branchId}
            />
            <EditClassDialog />
            <DeleteClassDialog />
            <ClassDetailsDialog />
        </div>
    );
}

/**
 * Branch-Specific Create Class Dialog Component
 */
function BranchCreateClassDialog({
    branchId,
}: {
    branchId: string;
}) {
    const store = useBranchClassesStore();
    const { isCreating } = useClassesUI();

    const handleClose = () => {
        store.cancelCreating();
    };

    return (
        <CreateClassDialog
            open={!!isCreating}
            onOpenChange={(open: boolean) => {
                if (!open) handleClose();
            }}
            branchId={branchId}
        />
    );
}

/**
 * Main Page Component
 */
export default function BranchClassesPage() {
    const { branch, isLoading } = useBranchContext();
    const store = useBranchClassesStore();

    if (isLoading || !branch) {
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
                        Manage classes and batches for <strong>{branch.name}</strong>
                    </p>
                </div>
                <Button
                    onClick={() => store.startCreating(branch.id)}
                    size="lg"
                    className="gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Create New Class
                </Button>
            </div>
            {/* Branch Classes Manager */}
            <BranchClassesManager branchId={branch.id} />
        </div>
    );
}
