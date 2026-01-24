/**
 * Fee Download Modal Component
 * 
 * Modal for downloading fee receipts as PDF
 * Allows students to select date range (month/year) for receipts to download
 * Generates professional PDF using jsPDF with receipt details
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { useFeeReceiptsStore } from '@/lib/branch-system/stores/fee-receipts.store';
import { formatCurrency, formatDate, formatReceiptStatus } from '@/lib/branch-system/utils/fee-receipts.utils';
import type { FeeReceipt } from '@/lib/branch-system/types/fee-receipts.types';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingCenter } from '@/lib/schema/coaching.types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const [coachingCenter, setCoachingCenter] = useState<CoachingCenter | null>(null);

    // Get receipts from store
    const { receipts } = useFeeReceiptsStore();
    const monthOptions = useMemo(() => generateMonthOptions(), []);

    // Load coaching center details when modal opens
    useEffect(() => {
        if (isOpen && centerId && !coachingCenter) {
            CoachingAPI.getCenter(centerId).then((result) => {
                if (result.success && result.data) {
                    setCoachingCenter(result.data);
                }
            });
        }
    }, [isOpen, centerId, coachingCenter]);

    // Filter receipts by date range
    const filteredReceipts = useMemo(() => {
        if (!fromMonth || !toMonth || receipts.length === 0) return [];

        const [fromYear, fromMonthNum] = fromMonth.split('-').map(Number);
        const [toYear, toMonthNum] = toMonth.split('-').map(Number);

        return receipts.filter((receipt) => {
            const receiptDate = new Date(receipt.receipt_date);
            const receiptYear = receiptDate.getFullYear();
            const receiptMonth = receiptDate.getMonth() + 1;

            const fromDate = new Date(fromYear, fromMonthNum - 1, 1);
            const toDate = new Date(toYear, toMonthNum, 0); // Last day of toMonth
            const checkDate = new Date(receiptYear, receiptMonth - 1, receiptDate.getDate());

            return checkDate >= fromDate && checkDate <= toDate;
        });
    }, [receipts, fromMonth, toMonth]);

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

        if (filteredReceipts.length === 0) {
            showErrorToast('No receipts found in the selected date range');
            return;
        }

        setIsDownloading(true);

        try {
            // Generate PDF
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Get first receipt for header info (all have same student/center info)
            const firstReceipt = filteredReceipts[0];

            // ============ HEADER SECTION ============
            // Blue background header
            pdf.setFillColor(59, 130, 246);
            pdf.rect(0, 0, pageWidth, 45, 'F');

            // Coaching center name
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(coachingCenter?.name || 'Coaching Center', pageWidth / 2, 15, { align: 'center' });

            // Subtitle
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Fee Receipt Summary', pageWidth / 2, 24, { align: 'center' });

            // Branch name (if not empty or strange)
            const branchName = firstReceipt.branch?.name || '';
            if (branchName && branchName.trim().length > 0) {
                pdf.setFontSize(9);
                pdf.text(branchName, pageWidth / 2, 31, { align: 'center' });
            }

            // Verified badge
            // if (coachingCenter?.is_verified) {
            //     pdf.setFontSize(8);
            //     pdf.text('Verified', pageWidth / 2, 39, { align: 'center' });
            // }

            // ============ STUDENT INFO SECTION ============
            const infoStartY = 55;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');

            // Left side - Student details
            pdf.text('Student Information', 14, infoStartY);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.text(`Name: ${firstReceipt.student?.full_name || 'N/A'}`, 14, infoStartY + 8);
            pdf.text(`Username: ${firstReceipt.student?.username || 'N/A'}`, 14, infoStartY + 15);
            pdf.text(`Class: ${firstReceipt.class?.class_name || 'N/A'}`, 14, infoStartY + 22);
            pdf.text(`Branch Name: ${firstReceipt.branch?.name || 'N/A'}`, 14, infoStartY + 29);
            // if (firstReceipt.class?.subject) {
            //     pdf.setFontSize(8);
            //     pdf.setTextColor(100, 100, 100);
            //     pdf.text(`Subject: ${firstReceipt.class.subject}`, 14, infoStartY + 28);
            //     pdf.setTextColor(0, 0, 0);
            // }

            // Right side - Report details
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Report Details', pageWidth - 14, infoStartY, { align: 'right' });
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Period: ${monthOptions.find(o => o.value === fromMonth)?.label}`, pageWidth - 14, infoStartY + 8, { align: 'right' });
            pdf.text(`to ${monthOptions.find(o => o.value === toMonth)?.label}`, pageWidth - 14, infoStartY + 15, { align: 'right' });
            pdf.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 14, infoStartY + 22, { align: 'right' });
            pdf.text(`Total Receipts: ${filteredReceipts.length}`, pageWidth - 14, infoStartY + 29, { align: 'right' });

            // ============ RECEIPTS TABLE ============
            const tableData = filteredReceipts.map((receipt) => {
                // Format currency using Rs. prefix (ASCII safe)
                const formatAmount = (amount: number) => {
                    return `Rs. ${amount.toFixed(2)}`;
                };

                return [
                    receipt.receipt_number,
                    formatDate(receipt.receipt_date),
                    formatDate(receipt.due_date),
                    formatAmount(receipt.base_fee_amount),
                    formatAmount(receipt.late_fee_amount || 0),
                    formatAmount(receipt.discount_amount || 0),
                    formatAmount(receipt.tax_amount || 0),
                    formatAmount(receipt.total_amount),
                    formatAmount(receipt.amount_paid),
                    formatAmount(receipt.balance_amount),
                    formatReceiptStatus(receipt.receipt_status),
                ];
            });

            autoTable(pdf, {
                startY: infoStartY + 38,
                head: [[
                    'Receipt #',
                    'Date',
                    'Due Date',
                    'Base Fee',
                    'Late Fee',
                    'Discount',
                    'Tax',
                    'Total',
                    'Paid',
                    'Balance',
                    'Status'
                ]],
                body: tableData,
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                    font: 'helvetica',
                    lineColor: [220, 220, 220],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 8,
                },
                columnStyles: {
                    0: { cellWidth: 20, fontSize: 7 },
                    1: { cellWidth: 18 },
                    2: { cellWidth: 18 },
                    3: { cellWidth: 18, halign: 'right' },
                    4: { cellWidth: 18, halign: 'right' },
                    5: { cellWidth: 18, halign: 'right' },
                    6: { cellWidth: 15, halign: 'right' },
                    7: { cellWidth: 18, halign: 'right', fontStyle: 'bold', fillColor: [240, 248, 255] },
                    8: { cellWidth: 18, halign: 'right' },
                    9: { cellWidth: 18, halign: 'right' },
                    10: { cellWidth: 18, halign: 'center', fontSize: 7 },
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251],
                },
                margin: { left: 14, right: 14 },
            });

            // ============ SUMMARY BOX ============
            const finalY = (pdf as any).lastAutoTable.finalY + 12;

            const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.total_amount, 0);
            const totalPaid = filteredReceipts.reduce((sum, r) => sum + r.amount_paid, 0);
            const totalBalance = filteredReceipts.reduce((sum, r) => sum + r.balance_amount, 0);
            const paidCount = filteredReceipts.filter(r => r.receipt_status === 'PAID').length;
            const pendingCount = filteredReceipts.filter(r => r.receipt_status === 'PENDING').length;

            // Format amounts using Rs. prefix
            const formatSummaryAmount = (amount: number) => `Rs. ${amount.toFixed(2)}`;

            // Professional summary box with better spacing
            const summaryBoxX = 14;
            const summaryBoxY = finalY;
            const summaryBoxWidth = pageWidth - 28;
            const summaryBoxHeight = 32;

            // Box background and border
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.5);
            pdf.setFillColor(240, 248, 255);
            pdf.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 3, 3, 'FD');

            // Summary header
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(59, 130, 246);
            pdf.text('Financial Summary', summaryBoxX + 5, summaryBoxY + 8);

            // Divider line
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.line(summaryBoxX + 5, summaryBoxY + 10, summaryBoxX + summaryBoxWidth - 5, summaryBoxY + 10);

            // Summary content in 3 columns
            const col1X = summaryBoxX + 8;
            const col2X = summaryBoxX + (summaryBoxWidth / 3) + 5;
            const col3X = summaryBoxX + ((summaryBoxWidth / 3) * 2) + 2;
            const contentY = summaryBoxY + 17;

            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);

            // Column 1 - Total Amount
            pdf.text('Total Amount', col1X, contentY);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(formatSummaryAmount(totalAmount), col1X, contentY + 6);

            // Column 2 - Total Paid
            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text('Total Paid', col2X, contentY);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94); // Green
            pdf.text(formatSummaryAmount(totalPaid), col2X, contentY + 6);

            // Column 3 - Total Balance
            pdf.setFontSize(8.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text('Total Balance', col3X, contentY);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(239, 68, 68); // Red
            pdf.text(formatSummaryAmount(totalBalance), col3X, contentY + 6);

            // Status counts at bottom
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Receipts: ${paidCount} Paid, ${pendingCount} Pending`, summaryBoxX + 8, summaryBoxY + summaryBoxHeight - 4);

            // ============ FOOTER ============
            const footerY = pageHeight - 20;
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.3);
            pdf.line(14, footerY - 5, pageWidth - 14, footerY - 5);

            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(120, 120, 120);
            pdf.text('This is a computer-generated document. No signature required.', pageWidth / 2, footerY, { align: 'center' });

            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated by ${coachingCenter?.name || 'Coaching Center'} | ${formatDate(new Date().toISOString())}`, pageWidth / 2, footerY + 5, { align: 'center' });

            // Download PDF
            const fileName = `fee-receipts-${firstReceipt.student?.full_name?.replace(/\s+/g, '-') || 'student'}-${fromMonth}-to-${toMonth}.pdf`;
            pdf.save(fileName);

            showSuccessToast(
                `${filteredReceipts.length} receipt(s) downloaded successfully`
            );

            // Reset and close
            setFromMonth('');
            setToMonth('');
            onClose();

        } catch (error) {
            console.error('Download error:', error);
            showErrorToast('Failed to generate PDF');
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
                                {filteredReceipts.length} receipt(s) from{' '}
                                {monthOptions.find(o => o.value === fromMonth)?.label} to{' '}
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
                        disabled={!isValidRange || isDownloading || filteredReceipts.length === 0}
                        loading={isDownloading}
                        loadingText="Generating PDF..."
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
