'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, Home } from 'lucide-react';
import { UserAvatar } from '@/components/avatar';
import { useCurrentProfile } from '@/lib/profile';

interface LMSHeaderProps {
    notificationCount?: number;
    onNotificationClick?: () => void;
    onBackClick?: () => void;
}

export const LMSHeader = memo(({
    notificationCount = 0,
    onNotificationClick,
    onBackClick
}: LMSHeaderProps) => {
    const router = useRouter();
    const profile = useCurrentProfile();

    const handleBack = useCallback(() => {
        if (onBackClick) {
            onBackClick();
        } else {
            router.back();
        }
    }, [onBackClick, router]);

    const handleHome = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    const handleNotifications = useCallback(() => {
        if (onNotificationClick) {
            onNotificationClick();
        }
    }, [onNotificationClick]);

    const handleAvatarClick = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16 gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="h-10 w-full p-0 hover:bg-gray-100 rounded-lg"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-5 w-5" /> Back
                        </Button>
                    </div>

                    <div className="flex items-center justify-center flex-grow">
                        <h1 className="text-lg font-semibold">Tutrsy LMS</h1>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleHome}
                            className="h-10 p-0 hover:bg-gray-100 rounded-lg"
                        >
                            <Home className="h-5 w-5" /> Home
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNotifications}
                            className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                            aria-label="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {notificationCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </Badge>
                            )}
                        </Button>

                        {profile && (
                            <UserAvatar
                                profile={profile}
                                size="sm"
                                showOnlineStatus
                                className="cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all"
                                onClick={handleAvatarClick}
                            />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});

LMSHeader.displayName = 'LMSHeader';
