/**
 * Class Details Dialog Component
 * 
 * Displays full details of a selected class
 * Features: View all information, Quick actions (edit, delete)
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    useClass,
    useSelectedClass,
    useBranchClassesStore,
    formatClassSchedule,
    formatDate,
    formatTime,
    getCapacityDisplay,
    formatClassStatus,
    calculateUtilization,
    formatFeeFrequency,
} from '@/lib/branch-system/branch-classes';
import {
    Calendar,
    Clock,
    Users,
    BookOpen,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    DollarSign,
} from 'lucide-react';

/**
 * Info Row Component
 */
function InfoRow({ icon: Icon, label, value }: {
    icon: React.ElementType;
    label: string;
    value: string | React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="text-sm font-medium">{value}</div>
            </div>
        </div>
    );
}

/**
 * Main Class Details Dialog Component
 */
export function ClassDetailsDialog() {
    const store = useBranchClassesStore();
    const classData = useSelectedClass();
    const selectedClassId = store.ui.selectedClassId;

    const handleClose = () => {
        store.setSelectedClass(null);
    };

    const handleEdit = () => {
        if (selectedClassId) {
            store.startEditing(selectedClassId);
        }
    };

    const handleDelete = () => {
        // Open the delete confirmation for the currently selected class
        if (selectedClassId) {
            store.openDeleteDialog?.(selectedClassId);
        }
    };

    if (!classData) return null;

    const status = formatClassStatus(classData.status);
    const utilization = calculateUtilization(classData);

    return (
        <Dialog open={!!selectedClassId} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl">{classData.class_name}</DialogTitle>
                            <DialogDescription>
                                {classData.subject} • {classData.grade_level}
                            </DialogDescription>
                        </div>
                        <Badge variant={
                            status.color === 'green' ? 'default' :
                                status.color === 'yellow' ? 'secondary' :
                                    status.color === 'red' ? 'destructive' : 'outline'
                        }>
                            {status.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <div className="space-y-6 p-4">
                        {/* Description */}
                        {classData.description && (
                            <div>
                                <h4 className="font-semibold mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground">{classData.description}</p>
                            </div>
                        )}

                        <Separator />

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold">Class Information</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow
                                    icon={BookOpen}
                                    label="Branch"
                                    value={(classData as any).branch?.name || 'N/A'}
                                />
                                <InfoRow
                                    icon={Users}
                                    label="Teacher"
                                    value={(classData as any).teacher?.full_name || (classData as any).teacher?.username || 'Not Assigned'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow
                                    icon={BookOpen}
                                    label="Subject"
                                    value={classData.subject}
                                />
                                <InfoRow
                                    icon={BookOpen}
                                    label="Grade Level"
                                    value={classData.grade_level}
                                />
                            </div>

                            {classData.batch_name && (
                                <InfoRow
                                    icon={Users}
                                    label="Batch Name"
                                    value={classData.batch_name}
                                />
                            )}
                        </div>

                        <Separator />

                        {/* Schedule */}
                        <div className="space-y-4">
                            <h4 className="font-semibold">Schedule</h4>

                            <InfoRow
                                icon={Calendar}
                                label="Class Days & Time"
                                value={formatClassSchedule(classData)}
                            />

                            {classData.start_date && classData.end_date && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoRow
                                        icon={Calendar}
                                        label="Start Date"
                                        value={formatDate(classData.start_date)}
                                    />
                                    <InfoRow
                                        icon={Calendar}
                                        label="End Date"
                                        value={formatDate(classData.end_date)}
                                    />
                                </div>
                            )}

                            {classData.start_time && classData.end_time && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoRow
                                        icon={Clock}
                                        label="Start Time"
                                        value={formatTime(classData.start_time)}
                                    />
                                    <InfoRow
                                        icon={Clock}
                                        label="End Time"
                                        value={formatTime(classData.end_time)}
                                    />
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Capacity */}
                        <div className="space-y-4">
                            <h4 className="font-semibold">Capacity & Enrollment</h4>

                            <InfoRow
                                icon={Users}
                                label="Current Enrollment"
                                value={
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span>{getCapacityDisplay(classData)}</span>
                                            <span className="text-sm text-muted-foreground">{utilization}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${utilization >= 90 ? 'bg-red-500' :
                                                    utilization >= 70 ? 'bg-orange-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${utilization}%` }}
                                            />
                                        </div>
                                    </div>
                                }
                            />

                            <InfoRow
                                icon={DollarSign}
                                label="Fee Frequency"
                                value={formatFeeFrequency(classData.fees_frequency)}
                            />
                        </div>

                        <Separator />

                        {/* Status & Visibility */}
                        <div className="space-y-4">
                            <h4 className="font-semibold">Status & Visibility</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow
                                    icon={BookOpen}
                                    label="Status"
                                    value={
                                        <Badge variant={
                                            status.color === 'green' ? 'default' :
                                                status.color === 'yellow' ? 'secondary' :
                                                    status.color === 'red' ? 'destructive' : 'outline'
                                        }>
                                            {status.label}
                                        </Badge>
                                    }
                                />
                                <InfoRow
                                    icon={classData.is_visible ? Eye : EyeOff}
                                    label="Visibility"
                                    value={classData.is_visible ? 'Visible to students' : 'Hidden from students'}
                                />
                            </div>
                        </div>

                        {/* Prerequisites & Materials */}
                        {(classData.prerequisites && classData.prerequisites.length > 0) && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Prerequisites</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {classData.prerequisites.map((prereq, index) => (
                                            <li key={index} className="text-sm text-muted-foreground">{prereq}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {(classData.materials_required && classData.materials_required.length > 0) && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Materials Required</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {classData.materials_required.map((material, index) => (
                                            <li key={index} className="text-sm text-muted-foreground">{material}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {/* Metadata */}
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                            <p>Created: {formatDate(classData.created_at, 'long')}</p>
                            <p>Last Updated: {formatDate(classData.updated_at, 'long')}</p>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="outline" onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
