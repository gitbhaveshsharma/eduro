/**
 * Coaching Center Card (LMS Style)
 * 
 * Redesigned to match the ProfileCard visual style.
 * Clean layout with gradient header, floating logo, and modern minimal UI.
 */

"use client";

import { Shield, BookOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CoachingCenter {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    subjects: string[] | null;
    target_audience: string[] | null;
    is_verified: boolean;
    is_featured: boolean;
    established_year: number | null;
    category: string;
}

interface CoachingCenterCardProps {
    center?: CoachingCenter;
    className?: string;
}

// Dummy data for demonstration
const dummyCenter: CoachingCenter = {
    id: '1',
    name: 'Elite Learning Academy',
    slug: 'elite-learning-academy',
    description: 'Premier coaching institute for competitive exams preparation with expert faculty and proven track record',
    // Use avatar proxy when available to ensure COEP/COOP compatibility
    logo_url: (() => {
        try {
            const AvatarUtils = require('@/lib/utils/avatar.utils').AvatarUtils;
            const remote = 'https://ui-avatars.com/api/?name=Elite+Learning&size=200&background=1D4ED8&color=fff&bold=true';
            return AvatarUtils.getPublicAvatarUrlFromRemote(remote);
        } catch {
            return 'https://ui-avatars.com/api/?name=Elite+Learning&size=200&background=1D4ED8&color=fff&bold=true';
        }
    })(),
    cover_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=200&fit=crop',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
    target_audience: ['JEE', 'NEET', 'Grade 11-12'],
    is_verified: true,
    is_featured: true,
    established_year: 2010,
    category: 'COMPETITIVE_EXAM'
};

export function CoachingCenterCard({ center = dummyCenter, className = "" }: CoachingCenterCardProps) {
    return (
        <Card
            className={`bg-white rounded-xl p-4 border border-gray-200 transition-all duration-300 ${className}`}
        >
            <CardContent className="p-0">
                {/* Header Background */}
                <div className="relative -mx-4 -mt-4 h-20 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl mb-12">
                    {/* Floating Logo */}
                    <div className="absolute -bottom-10 left-4">
                        <div className="relative">
                            <img
                                src={
                                    center.logo_url ||
                                    (() => {
                                        try {
                                            const AvatarUtils = require('@/lib/utils/avatar.utils').AvatarUtils;
                                            const remote = 'https://ui-avatars.com/api/?name=Institute&size=200';
                                            return AvatarUtils.getPublicAvatarUrlFromRemote(remote);
                                        } catch {
                                            return 'https://ui-avatars.com/api/?name=Institute&size=200';
                                        }
                                    })()
                                }
                                alt={center.name}
                                className="w-20 h-20 rounded-lg border-4 border-white object-cover bg-white shadow-md"
                            />
                            {center.is_verified && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white">
                                    <Shield className="h-4 w-4 text-white fill-white" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Info */}
                <div className="space-y-2">
                    {/* Name + Verified */}
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {center.name}
                        </h3>
                        {center.is_verified && (
                            <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                    </div>

                    {/* Category + Year */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="capitalize">{center.category.replaceAll("_", " ").toLowerCase()}</span>
                        {center.established_year && (
                            <span>• Est. {center.established_year}</span>
                        )}
                    </div>

                    {/* Subjects */}
                    {center.subjects && center.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {center.subjects.slice(0, 3).map((subject, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {subject}
                                </Badge>
                            ))}
                            {center.subjects.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{center.subjects.length - 3} more
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Target Audience */}
                    {center.target_audience && center.target_audience.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {center.target_audience.slice(0, 2).map((audience, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {audience}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    {center.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {center.description}
                        </p>
                    )}

                    {/* CTA Button */}
                    <div className="pt-4">
                        <Button
                            variant="default"
                            className="w-full bg-brand-primary hover:bg-brand-primary/90"
                        >
                            Visit LMS
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
