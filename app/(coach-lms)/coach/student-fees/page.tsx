'use client';

/**
 * Student Fees Management - Main Page
 * 
 * Provides comprehensive fee receipts management for coaches with:
 * - Interactive dashboard with revenue statistics
 * - Receipts list with advanced filtering and sorting
 * - Full CRUD operations for fee receipts
 * - Payment recording and tracking
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Import components
import Dashboard from './_components/dashboard';
import ReceiptsTable from './_components/receipts-table';
import ReceiptFilters from './_components/receipt-filters';
import CreateReceiptDialog from './_components/create-receipt-dialog';
import RecordPaymentDialog from './_components/record-payment-dialog';
import ReceiptDetailsDialog from './_components/receipt-details-dialog';
import EditReceiptDialog from './_components/edit-receipt-dialog';
import CancelReceiptDialog from './_components/cancel-receipt-dialog';

export default function StudentFeesPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Fees Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage fee receipts, record payments, and track revenue
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
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="receipts">Receipts List</TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <Dashboard />
                </TabsContent>

                {/* Receipts List Tab */}
                <TabsContent value="receipts" className="space-y-6">
                    <ReceiptFilters />
                    <ReceiptsTable />
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
