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
    const totalDays = totalDaysPresent + totalDaysAbsent;

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
                            variant="danger"
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
                            variant="default"
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

// StatCard Helper Component
interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    variant?: 'default' | 'success' | 'danger';
}

function StatCard({ icon: Icon, label, value, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: 'bg-card border-border',
        success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    };

    const iconStyles = {
        default: 'text-muted-foreground',
        success: 'text-green-600 dark:text-green-400',
        danger: 'text-red-600 dark:text-red-400',
    };

    return (
        <div className={cn('p-4 rounded-lg border', variantStyles[variant])}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', iconStyles[variant])} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}