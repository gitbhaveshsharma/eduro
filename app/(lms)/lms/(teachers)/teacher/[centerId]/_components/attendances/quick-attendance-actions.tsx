/**
 * Quick Attendance Actions Component
 * 
 * Quick action buttons for bulk attendance marking
 */

'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    UserCheck,
    UserX,
    Clock,
    FileText,
    ChevronDown,
    Users,
    CheckCircle2
} from 'lucide-react';
import { AttendanceStatus } from '@/lib/branch-system/student-attendance';

interface QuickAttendanceActionsProps {
    onMarkAllPresent: () => void;
    onMarkAllAbsent: () => void;
    onBulkMark: () => void;
    disabled?: boolean;
    unmarkedCount: number;
}

export function QuickAttendanceActions({
    onMarkAllPresent,
    onMarkAllAbsent,
    onBulkMark,
    disabled = false,
    unmarkedCount,
}: QuickAttendanceActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Mark All Present Button */}
            <Button
                variant="default"
                size="sm"
                onClick={onMarkAllPresent}
                disabled={disabled || unmarkedCount === 0}
                className="gap-2"
            >
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Mark All Present</span>
                <span className="sm:hidden">All Present</span>
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        className="gap-2"
                    >
                        <span>More</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={onMarkAllPresent}
                        disabled={unmarkedCount === 0}
                    >
                        <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                        Mark All Present
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onMarkAllAbsent}
                        disabled={unmarkedCount === 0}
                    >
                        <UserX className="h-4 w-4 mr-2 text-red-600" />
                        Mark All Absent
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={onBulkMark}>
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        Bulk Mark Dialog
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
