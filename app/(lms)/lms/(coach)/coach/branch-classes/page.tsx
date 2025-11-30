/**
 * Branch Classes Management Page
 * 
 * Main page for coaches to manage branch classes with complete CRUD operations
 * Features: Dashboard, List view, Create/Edit forms, Filters, and Analytics
 */

'use client';

import { useEffect, useState } from 'react';
import { BranchClassesDashboard } from './_components/dashboard';
import { ClassesTable } from './_components/classes-table';
import { CreateClassDialog } from './_components/create-class-dialog';
import { EditClassDialog } from './_components/edit-class-dialog';
import { ClassDetailsDialog } from './_components/class-details-dialog';
import { ClassFilters } from './_components/class-filters';
import { DeleteClassDialog } from './_components/delete-class-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Branch Classes Page Component
 */
export default function BranchClassesPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Branch Classes</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your coaching classes, schedules, and enrollments
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
                        <BranchClassesDashboard />
                    </TabsContent>

                    {/* List Tab */}
                    <TabsContent value="list" className="mt-6">
                        <Card className="mb-4 p-4">
                            <CardContent>
                                <ClassFilters />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <ClassesTable />
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
        </div>
    );
}