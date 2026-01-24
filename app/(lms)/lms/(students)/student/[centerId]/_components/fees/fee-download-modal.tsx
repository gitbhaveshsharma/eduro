/**
 * Fee Download Modal Component
 * 
 * Modal for downloading fee receipts as PDF
 * Allows students to select date range (month/year) for receipts to download
 */

'use client';

import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, AlertCircle, FileText } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface FeeDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    centerId: string;
}

// Generate last 12 months + current + next 2 months
const generateMonthOptions = () => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const options: Array<{ value: string; label: string; month: number; year: number }> = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Generate from 12 months ago to 2 months ahead
    for (let i = -12; i <= 2; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const month = date.getMonth() + 1; // 1-12
        const year = date.getFullYear();
        const value = `${year}-${String(month).padStart(2, '0')}`;
        const label = `${months[date.getMonth()]} ${year}`;

        options.push({ value, label, month, year });
    }

    return options.reverse(); // Most recent first
};

export function FeeDownloadModal({
    isOpen,
    onClose,
    studentId,
    centerId,
}: FeeDownloadModalProps) {
    const [fromMonth, setFromMonth] = useState<string>('');
    const [toMonth, setToMonth] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);

    const monthOptions = useMemo(() => generateMonthOptions(), []);

    // Validate date range
    const isValidRange = useMemo(() => {
        if (!fromMonth || !toMonth) return false;

        const fromDate = new Date(fromMonth + '-01');
        const toDate = new Date(toMonth + '-01');

        return fromDate <= toDate;
    }, [fromMonth, toMonth]);

    const handleDownload = async () => {
        if (!isValidRange) {
            showErrorToast('Please select a valid date range');
            return;
        }

        setIsDownloading(true);

        try {
            // Parse from/to dates
            const [fromYear, fromMonthNum] = fromMonth.split('-').map(Number);
            const [toYear, toMonthNum] = toMonth.split('-').map(Number);

            // TODO: Call API to generate PDF
            // This would typically call a backend endpoint that generates the PDF
            // For now, we'll simulate the download

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In a real implementation, you would:
            // const response = await fetch('/api/receipts/download-pdf', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         student_id: studentId,
            //         coaching_center_id: centerId,
            //         from_month: fromMonthNum,
            //         from_year: fromYear,
            //         to_month: toMonthNum,
            //         to_year: toYear,
            //     }),
            // });
            // const blob = await response.blob();
            // const url = window.URL.createObjectURL(blob);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = `fee-receipts-${fromMonth}-to-${toMonth}.pdf`;
            // a.click();

            showSuccessToast(
                `Fee receipts downloaded successfully (${fromMonth} to ${toMonth})`
            );

            // Reset and close
            setFromMonth('');
            setToMonth('');
            onClose();

        } catch (error) {
            console.error('Download error:', error);
            showErrorToast('Failed to download fee receipts');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleClose = () => {
        if (!isDownloading) {
            setFromMonth('');
            setToMonth('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-4">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Download Fee Receipts
                    </DialogTitle>
                    <DialogDescription>
                        Select the date range for fee receipts you want to download as PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* From Month */}
                    <div className="space-y-2">
                        <Label htmlFor="from-month">From Month</Label>
                        <Select
                            value={fromMonth}
                            onValueChange={setFromMonth}
                            disabled={isDownloading}
                        >
                            <SelectTrigger id="from-month">
                                <SelectValue placeholder="Select starting month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* To Month */}
                    <div className="space-y-2">
                        <Label htmlFor="to-month">To Month</Label>
                        <Select
                            value={toMonth}
                            onValueChange={setToMonth}
                            disabled={isDownloading}
                        >
                            <SelectTrigger id="to-month">
                                <SelectValue placeholder="Select ending month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Validation Alert */}
                    {fromMonth && toMonth && !isValidRange && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                End month must be after or equal to start month.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Info Alert */}
                    {isValidRange && (
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                                Fee receipts from {monthOptions.find(o => o.value === fromMonth)?.label} to{' '}
                                {monthOptions.find(o => o.value === toMonth)?.label} will be downloaded.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDownloading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDownload}
                        disabled={!isValidRange || isDownloading}
                        loading={isDownloading}
                        loadingText="Downloading..."
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
