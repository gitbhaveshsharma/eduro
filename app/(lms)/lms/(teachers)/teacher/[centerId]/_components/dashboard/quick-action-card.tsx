'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor?: string;
    buttonText: string;
    buttonVariant?: 'default' | 'outline' | 'secondary';
    onClick: () => void;
}

export function QuickActionCard({
    title,
    description,
    icon: Icon,
    iconColor = "text-primary",
    buttonText,
    buttonVariant = "default",
    onClick
}: QuickActionCardProps) {
    return (
        <Card
            className="hover:shadow-md transition-all duration-300 cursor-pointer border-muted/50 group"
            onClick={onClick}
        >
            <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 rounded-lg bg-secondary/10">
                            <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2} />
                        </div>
                        {title}
                    </CardTitle>
                </div>
                <CardDescription className="text-sm">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant={buttonVariant} className="w-full" size="lg">
                    {buttonText}
                </Button>
            </CardContent>
        </Card>
    );
}
