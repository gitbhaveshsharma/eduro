'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentRecentNotice } from '@/lib/branch-system/types/branch-students.types';
import { formatDate } from '@/lib/branch-system/utils/student-dashboard.utils';

interface RecentNoticesProps {
    notices: StudentRecentNotice[];
}

export function RecentNotices({ notices }: RecentNoticesProps) {
    if (!notices || notices.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5 text-brand-primary" />
                        Recent Notices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No recent notices</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5 text-brand-primary" />
                        Recent Notices
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {notices.filter(n => !n.is_read).length} unread
                    </Badge>
                </div>
                <CardDescription>Important announcements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {notices.map((notice) => (
                    <NoticeItem key={notice.id} notice={notice} />
                ))}
            </CardContent>
        </Card>
    );
}

function NoticeItem({ notice }: { notice: StudentRecentNotice }) {
    const priorityColors = {
        HIGH: 'bg-red-100 text-red-700',
        MEDIUM: 'bg-amber-100 text-amber-700',
        LOW: 'bg-blue-100 text-blue-700',
    };

    return (
        <div className={cn(
            'p-3 rounded-lg border transition-colors',
            !notice.is_read && 'bg-muted/30 border-brand-primary/30'
        )}>
            <div className="flex items-start gap-3">
                <div className={cn(
                    'p-1.5 rounded-lg mt-0.5',
                    priorityColors[notice.priority]
                )}>
                    <Bell className="h-3 w-3" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium line-clamp-1">{notice.title}</h4>
                        {!notice.is_read && (
                            <div className="h-2 w-2 rounded-full bg-brand-primary shrink-0 mt-1" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notice.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{notice.class_name}</span>
                        <span>•</span>
                        <span>{formatDate(notice.published_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}