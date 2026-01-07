'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface StudentsPageHeaderProps {
    totalStudents: number;
    studentsNeedingAttention: number;
    showNeedingAttention: boolean;
    onToggleNeedingAttention: () => void;
}

export function StudentsPageHeader({
    totalStudents,
    studentsNeedingAttention,
    showNeedingAttention,
    onToggleNeedingAttention
}: StudentsPageHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">My Students</h1>
                <p className="text-muted-foreground">
                    View and manage your enrolled students
                </p>
            </div>

            {/* Students Needing Attention Alert */}
            {studentsNeedingAttention > 0 && (
                <Alert 
                    variant="warning"
                    showIcon={true}
                    elevation="low"
                >
                    <AlertTitle>
                        Students Need Attention
                    </AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-4">
                        <span>
                            {studentsNeedingAttention} student{studentsNeedingAttention !== 1 ? 's have' : ' has'} low attendance (&lt;60%)
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleNeedingAttention}
                            className="shrink-0"
                        >
                            {showNeedingAttention ? 'Show All' : 'View'}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
