'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Phone } from 'lucide-react';
import type { CoachingCenter } from '@/lib/schema/coaching.types';

interface CenterInfoProps {
    coachingCenter: CoachingCenter;
}

export function CenterInfo({ coachingCenter }: CenterInfoProps) {
    return (
        <Card className="border-muted/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                        <Building2 className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    About {coachingCenter.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {coachingCenter.description && (
                    <p className="text-muted-foreground leading-relaxed">
                        {coachingCenter.description}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 text-sm">
                    {coachingCenter.email && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <Mail className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
                            <span className="text-muted-foreground truncate">
                                {coachingCenter.email}
                            </span>
                        </div>
                    )}
                    {coachingCenter.phone && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <Phone className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
                            <span className="text-muted-foreground">
                                {coachingCenter.phone}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
