/**
 * Profile Card Component for Feed
 * 
 * Minimal profile card displaying user information
 * Links to full profile page using username
 */

"use client";

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/profile';
import type { PublicProfile } from '@/lib/profile';
import { Card, CardContent } from '../ui/card';

interface ProfileCardProps {
    profile: PublicProfile;
    className?: string;
}

export function ProfileCard({ profile, className = '' }: ProfileCardProps) {
    const displayName = ProfileDisplayUtils.getDisplayName(profile);
    const avatarUrl = ProfileUrlUtils.getAvatarUrl(profile, 200);
    const profileUrl = ProfileUrlUtils.getProfileUrl(profile.username || profile.id);

    return (
        <Link href={profileUrl}>
            <Card
                className={`bg-white rounded-xl p-4 border border-gray-200 hover:border-brand-primary transition-all duration-300 cursor-pointer ${className}`}
            >
                <CardContent className="p-0">
                    {/* Header Background */}
                    <div className="relative -mx-4 -mt-4 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-t-xl mb-12">
                        {/* Avatar */}
                        <div className="absolute -bottom-10 left-4">
                            <div className="relative">
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-20 h-20 rounded-full border-4 border-white object-cover"
                                />
                                {profile.is_verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                                        <Shield className="h-4 w-4 text-white fill-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="space-y-2">
                        {/* Name and Verification */}
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                {displayName}
                            </h3>
                            {profile.is_verified && (
                                <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                        </div>

                        {/* Role and Details */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                📊 {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                            </span>
                            {(profile.role === 'T' || profile.role === 'C') && profile.years_of_experience && (
                                <span>• {profile.years_of_experience} yrs exp</span>
                            )}
                        </div>

                        {/* Location/University */}
                        {(profile.role === 'S' && profile.grade_level) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                🎓 {profile.grade_level}
                            </div>
                        )}

                        {/* Bio Preview */}
                        {profile.bio && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                {profile.bio}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// Compact version for sidebars
export function ProfileCardCompact({ profile, className = '' }: ProfileCardProps) {
    const displayName = ProfileDisplayUtils.getDisplayName(profile);
    const avatarUrl = ProfileUrlUtils.getAvatarUrl(profile, 100);
    const profileUrl = ProfileUrlUtils.getProfileUrl(profile.username || profile.id);

    return (
        <Link href={profileUrl}>
            <div
                className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-gray-50 transition-all duration-200 ${className}`}
            >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    {profile.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <Shield className="h-3 w-3 text-white fill-white" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {displayName}
                        </h4>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                        {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                    </p>
                </div>
            </div>
        </Link>
    );
}
