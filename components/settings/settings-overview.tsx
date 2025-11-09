/**
 * Settings Overview Component
 * 
 * Displays all available settings organized by category
 * with search functionality and role-based access control
 */

"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getAvailableCategories, getSettingsByCategory } from './settings-data';
import type { UserRole } from './types';

interface SettingsOverviewProps {
    userRole?: UserRole;
    className?: string;
}

export function SettingsOverview({ userRole, className = '' }: SettingsOverviewProps) {
    const router = useRouter();

    // Get categories and items based on user role
    const categories = useMemo(() => {
        return getAvailableCategories(userRole);
    }, [userRole]);

    const handleItemClick = (href: string) => {
        router.push(href);
    };

    if (categories.length === 0) {
        return (
            <div className={cn('space-y-4', className)}>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No settings available for your account type.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Info Banner */}
            <Alert variant={"info"}>
                <AlertDescription >
                    Use the search bar above to quickly find specific settings, or browse by category below.
                </AlertDescription>
            </Alert>

            {/* Categories */}
            {categories.map((category) => {
                const items = getSettingsByCategory(category.id, userRole);
                const CategoryIcon = category.icon;

                if (items.length === 0) return null;

                return (
                    <Card key={category.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                    <CategoryIcon className="h-5 w-5 text-brand-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{category.label}</CardTitle>
                                    <CardDescription className="text-sm">
                                        {category.description}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="h-6 px-2">
                                    {items.length}
                                </Badge>
                            </div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                {items.map((item, index) => {
                                    const ItemIcon = item.icon;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleItemClick(item.href)}
                                            className={cn(
                                                'w-full flex items-center gap-4 px-6 py-4',
                                                'hover:bg-gray-50 transition-colors',
                                                'text-left group'
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                                                    <ItemIcon className="h-5 w-5 text-gray-600 group-hover:text-brand-primary transition-colors" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        {item.name}
                                                    </h3>
                                                    {item.badge && item.badge > 0 && (
                                                        <Badge variant="destructive" className="h-5 px-2 text-xs">
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                    {item.priority === 'high' && (
                                                        <Badge variant="default" className="h-5 px-2 text-xs">
                                                            Recommended
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {item.description}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Footer Info */}
            <Alert variant={"info"}>
                <AlertDescription >
                    Some settings may only be available to specific user roles (Student, Teacher, Coach, Admin).
                    {userRole && (
                        <span className="ml-1 font-medium">
                            Your role: {
                                userRole === 'S' ? 'Student' :
                                    userRole === 'T' ? 'Teacher' :
                                        userRole === 'C' ? 'Coach' :
                                            userRole === 'A' ? 'Admin' :
                                                userRole === 'SA' ? 'Super Admin' :
                                                    'Unknown'
                            }
                        </span>
                    )}
                </AlertDescription>
            </Alert>
        </div>
    );
}
