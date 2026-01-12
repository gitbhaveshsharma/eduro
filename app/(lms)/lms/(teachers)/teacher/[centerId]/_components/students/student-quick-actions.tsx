import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    ClipboardCheck,
    FileText,
    GraduationCap,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentQuickActionsProps {
    enrollment: any;
    onMarkAttendance: () => void;
}

export function StudentQuickActions({ enrollment, onMarkAttendance }: StudentQuickActionsProps) {
    const { toast } = useToast();
    console.log('Rendering StudentQuickActions for enrollment:', enrollment);

    // Extract attendance data from the class_attendence array
    const attendanceData = Array.isArray(enrollment.class_attendence)
        ? enrollment.class_attendence[0]
        : enrollment.class_attendence || {};

    const totalDaysPresent = attendanceData.total_days_present ?? 0;
    const totalDaysAbsent = attendanceData.total_days_absent ?? 0;
    const attendancePercentage = attendanceData.attendance_percentage_calculated ?? 0;
    const totalDays = attendanceData.total_attendance_records ?? 0;

    const handleAssignAssignment = () => {
        toast({
            title: 'Assign Assignment',
            description: 'Assignment feature coming soon.',
        });
    };

    const handleAssignQuiz = () => {
        toast({
            title: 'Assign Quiz',
            description: 'Quiz feature coming soon.',
        });
    };

    return (
        <>
            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button
                            onClick={onMarkAttendance}
                            className="w-full justify-start h-11"
                            variant="outline"
                        >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Mark Attendance
                        </Button>
                        <Button
                            onClick={handleAssignAssignment}
                            className="w-full justify-start h-11"
                            variant="outline"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Assign Assignment
                        </Button>
                        <Button
                            onClick={handleAssignQuiz}
                            className="w-full justify-start h-11"
                            variant="outline"
                        >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Assign Quiz
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Attendance Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={CheckCircle2}
                            label="Present"
                            value={totalDaysPresent}
                            variant="success"
                        />
                        <StatCard
                            icon={AlertCircle}
                            label="Absent"
                            value={totalDaysAbsent}
                            variant="error"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Percentage"
                            value={`${attendancePercentage}%`}
                            variant="default"
                        />
                        <StatCard
                            icon={Calendar}
                            label="Total Days"
                            value={totalDays}
                            variant="secondary"
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

// StatCard Helper Component// StatCard Helper Component
interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary';
}

function StatCard({ icon: Icon, label, value, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: 'bg-primary/10 border-primary/20',
        secondary: 'bg-secondary/10 border-secondary/20',
        success: 'bg-success/10 border-success/20 dark:bg-success/20 dark:border-success/30',
        warning: 'bg-warning/10 border-warning/20 dark:bg-warning/20 dark:border-warning/30',
        error: 'bg-error/10 border-error/20 dark:bg-error/20 dark:border-error/30',
    };

    const iconStyles = {
        default: 'text-primary',
        secondary: 'text-secondary',
        success: 'text-success dark:text-success-foreground',
        warning: 'text-warning dark:text-warning-foreground',
        error: 'text-error dark:text-error-foreground',
    };

    const textStyles = {
        default: 'text-primary',
        secondary: 'text-secondary',
        success: 'text-success dark:text-success-foreground',
        warning: 'text-warning dark:text-warning-foreground',
        error: 'text-error dark:text-error-foreground',
    };

    return (
        <div className={cn('p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]', variantStyles[variant])}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', iconStyles[variant])} />
                <span className={cn(
                    'text-xs uppercase tracking-wide font-medium',
                    variant === 'default'
                        ? 'text-primary/80'
                        : variant === 'secondary'
                            ? 'text-secondary/80'
                            : 'text-muted-foreground'
                )}>
                    {label}
                </span>
            </div>
            <p className={cn(
                'text-2xl font-bold tracking-tight',
                textStyles[variant]
            )}>
                {value}
            </p>
        </div>
    );
}