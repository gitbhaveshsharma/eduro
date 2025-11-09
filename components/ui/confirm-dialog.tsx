"use client";

import * as React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => Promise<void> | void;
    children?: React.ReactNode; // optional trigger element
    intent?: "default" | "danger";
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    children,
    intent = "default",
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {children ? <AlertDialogTrigger asChild>{children}</AlertDialogTrigger> : null}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description ? (
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                            await onConfirm();
                        }}
                        className={intent === "danger" ? "bg-destructive hover:bg-destructive/90" : undefined}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmDialog;
