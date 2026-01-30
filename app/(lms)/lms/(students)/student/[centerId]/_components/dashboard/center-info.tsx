// Placeholder exports - implement these components as needed
export { UpcomingAssignments as UpcomingQuizzes } from './upcoming-assignments';
export { UpcomingAssignments as PerformanceOverview } from './upcoming-assignments';
export { UpcomingAssignments as ClassProgress } from './upcoming-assignments';
export { UpcomingAssignments as RecentSubmissions } from './upcoming-assignments';
export { UpcomingAssignments as RecentNotices } from './upcoming-assignments';
export { UpcomingAssignments as OverdueAlerts } from './upcoming-assignments';

// Center info - reuse from existing
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import type { CoachingCenter } from '@/lib/schema/coaching.types';

interface CenterInfoProps {
    coachingCenter: CoachingCenter;
}

export function CenterInfo({ coachingCenter }: CenterInfoProps) {
    return (
        <Card className="overflow-hidden border-border/60">
            <div className="h-1.5 bg-brand-primary/20 w-full" />
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-5 w-5 text-brand-primary" />
                    About {coachingCenter.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {coachingCenter.description && (
                    <p className="text-muted-foreground leading-relaxed max-w-4xl">
                        {coachingCenter.description}
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t">
                    {coachingCenter.email && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Official Email</p>
                            <p className="font-semibold text-foreground">{coachingCenter.email}</p>
                        </div>
                    )}
                    {coachingCenter.phone && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Support</p>
                            <p className="font-semibold text-foreground">{coachingCenter.phone}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
