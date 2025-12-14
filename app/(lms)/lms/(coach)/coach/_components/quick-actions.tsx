'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Calendar, DollarSign } from 'lucide-react';

interface QuickActionsProps {
    onManageStudents?: () => void;
    onManageClasses?: () => void;
    onTrackAttendance?: () => void;
    onCollectFees?: () => void;
}

export const QuickActions = memo(({
    onManageStudents,
    onManageClasses,
    onTrackAttendance,
    onCollectFees
}: QuickActionsProps) => (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={onManageStudents}
            >
                <Users className="h-6 w-6" />
                <span>Manage Students</span>
            </Button>
            <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={onManageClasses}
            >
                <BookOpen className="h-6 w-6" />
                <span>Manage Classes</span>
            </Button>
            <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={onTrackAttendance}
            >
                <Calendar className="h-6 w-6" />
                <span>Track Attendance</span>
            </Button>
            <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={onCollectFees}
            >
                <DollarSign className="h-6 w-6" />
                <span>Collect Fees</span>
            </Button>
        </div>
    </div>
));

QuickActions.displayName = 'QuickActions';
