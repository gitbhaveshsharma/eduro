'use client';

/**
 * Student Fees Management - Coach Page
 * 
 * Provides comprehensive fee receipts management for coaches with:
 * - Interactive dashboard with revenue statistics across ALL branches
 * - Receipts list with advanced filtering and sorting
 * - Full CRUD operations for fee receipts
 * - Payment recording and tracking
 * 
 * Uses useCoachContext() to get coachingCenterId for fetching data
 * across all branches of the coaching center.
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Plus, AlertCircle,
    LayoutDashboard, ListChecks
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoachContext } from '../layout';
import { Card, CardContent } from '@/components/ui/card';


// Import components
import Dashboard from '../../../_components/student-fees/dashboard';
import ReceiptsTable from '../../../_components/student-fees/receipts-table';
import ReceiptFilters from '../../../_components/student-fees/receipt-filters';
import CreateReceiptDialog from '../../../_components/student-fees/create-receipt-dialog';
import RecordPaymentDialog from '../../../_components/student-fees/record-payment-dialog';
import ReceiptDetailsDialog from '../../../_components/student-fees/receipt-details-dialog';
import EditReceiptDialog from '../../../_components/student-fees/edit-receipt-dialog';
import CancelReceiptDialog from '../../../_components/student-fees/cancel-receipt-dialog';

export default function StudentFeesPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Get coaching center from layout context
    const { coachingCenterId, isLoading, error, refetch } = useCoachContext();

    // Loading state
    if (isLoading || !coachingCenterId) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
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
                    <h1 className="text-3xl font-bold tracking-tight">Student Fees Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage fee receipts, record payments, and track revenue across all branches
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
                    </TabsTrigger>
                    <TabsTrigger value="receipts" className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        <span>Receipts List</span>
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <Dashboard coachingCenterId={coachingCenterId} />
                </TabsContent>

                {/* Receipts List Tab */}
                <TabsContent value="receipts" className="space-y-6">
                    <ReceiptFilters coachingCenterId={coachingCenterId} />
                    <Card>
                        <CardContent className="pt-6">
                            <ReceiptsTable coachingCenterId={coachingCenterId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <CreateReceiptDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
            <RecordPaymentDialog />
            <ReceiptDetailsDialog />
            <EditReceiptDialog />
            <CancelReceiptDialog />
        </div>
    );
}
