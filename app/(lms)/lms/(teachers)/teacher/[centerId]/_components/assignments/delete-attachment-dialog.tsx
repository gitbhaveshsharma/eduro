import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';

/**
 * Delete Attachment Dialog Component
 * 
 * Confirmation dialog for deleting assignment instruction files
 */

export interface DeleteAttachmentDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** File to delete */
    file: {
        id: string;
        fileName: string;
        fileSize: number;
    } | null;
    /** Callback on confirmed deletion */
    onConfirm: (fileId: string, fileName: string) => Promise<void>;
    /** Whether deletion is in progress */
    isDeleting?: boolean;
}

export function DeleteAttachmentDialog({
    open,
    onOpenChange,
    file,
    onConfirm,
    isDeleting = false,
}: DeleteAttachmentDialogProps) {
    const handleConfirm = async () => {
        if (!file) return;
        await onConfirm(file.id, file.fileName);
    };

    if (!file) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Attachment
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate text-foreground">
                                    {file.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.fileSize / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <p>
                            Are you sure you want to delete this file?
                        </p>
                        <p className="text-destructive font-medium">
                            This action cannot be undone. Students will no longer be able to download this file.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete File
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}