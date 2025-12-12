/**
 * Branch Manager - Branch Fees Page
 * 
 * Manage fee collection for a specific branch with complete CRUD operations
 * Features: Dashboard, Receipts list, Create/Edit receipts, Record payments
 * 
 * Uses useBranchContext() to get branchId for fetching data
 * for this specific branch only.
 */

'use client';

import { useState } from 'react';
import { useBranchContext } from '../layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, LayoutDashboard, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';


// Import components
import Dashboard from '../../../../../_components/student-fees/dashboard';
import ReceiptsTable from '../../../../../_components/student-fees/receipts-table';
import ReceiptFilters from '../../../../../_components/student-fees/receipt-filters';
import CreateReceiptDialog from '../../../../../_components/student-fees/create-receipt-dialog';
import RecordPaymentDialog from '../../../../../_components/student-fees/record-payment-dialog';
import ReceiptDetailsDialog from '../../../../../_components/student-fees/receipt-details-dialog';
import EditReceiptDialog from '../../../../../_components/student-fees/edit-receipt-dialog';
import CancelReceiptDialog from '../../../../../_components/student-fees/cancel-receipt-dialog';

export default function BranchFeesPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Get branch from layout context
    const { branch, isLoading, error, refetch } = useBranchContext();

    // Loading state
    if (isLoading || !branch) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-96" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                        {error}
                    </AlertDescription>
                </Alert>
                <Button onClick={refetch} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Branch Fees</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage fee receipts and payments for {branch.name}
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Receipt
                </Button>
            </div>

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </TabsTrigger>                    <TabsTrigger value="receipts" className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        <span>Receipts List</span>
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <Dashboard branchId={branch.id} />
                </TabsContent>

                {/* Receipts List Tab */}
                <TabsContent value="receipts" className="space-y-6">
                    <ReceiptFilters branchId={branch.id} />
                    <Card>
                        <CardContent className="pt-6">
                            <ReceiptsTable branchId={branch.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <CreateReceiptDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                branchId={branch.id}
            />
            <RecordPaymentDialog />
            <ReceiptDetailsDialog />
            <EditReceiptDialog />
            <CancelReceiptDialog />
        </div>
    );
}