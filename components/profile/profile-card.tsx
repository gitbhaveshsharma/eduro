/**
 * Profile Card Component for Feed
 *
 * Minimal profile card displaying user information
 * Links to dashboard profile page
 */

"use client";

import Link from "next/link";
import { Shield, Briefcase, GraduationCap, User } from "lucide-react";
import { ProfileDisplayUtils } from "@/lib/profile";
import type { PublicProfile } from "@/lib/profile";
import { Card, CardContent } from "../ui/card";
import { UserAvatar } from "@/components/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

/* --------------------------- Role Icon map --------------------------- */
function RoleIcon({ role, className = "h-4 w-4 text-gray-600" }: { role: PublicProfile["role"]; className?: string }) {
    switch (role) {
        case "T":
        case "C":
            return <Briefcase className={className} />;
        case "S":
            return <GraduationCap className={className} />;
        default:
            return <User className={className} />;
    }
}

/* ------------------------------ Full Card --------------------------- */
interface ProfileCardProps {
    profile: PublicProfile;
    className?: string;
}

export function ProfileCard({ profile, className = "" }: ProfileCardProps) {
    const displayName = ProfileDisplayUtils.getDisplayName(profile);
    const profileUrl = `/dashboard`;
    const completionPercentage = profile.profile_completion_percentage || 0;

    return (
        <Link href={profileUrl} className="block">
            <Card className={`bg-white rounded-xl p-4 border border-gray-200 hover:border-brand-primary transition-all duration-300 cursor-pointer ${className}`}>
                <CardContent className="p-0">
                    {/* Header Background */}
                    <div className="relative -mx-4 -mt-4 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-t-xl mb-12">
                        {/* Avatar */}
                        <div className="absolute -bottom-10 left-4">
                            <div className="relative">
                                {/* Avatar Image */}
                                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white">
                                    <UserAvatar
                                        profile={profile}
                                        size="2xl"
                                        className="rounded-full"
                                        showOnlineStatus={false}
                                    />
                                </div>

                                {/* Verification */}
                                {profile.is_verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 ring-2 ring-white">
                                        <Shield className="h-3 w-3 text-white fill-white" />
                                    </div>
                                )}

                                {/* Completion badge with tooltip */}
                                {completionPercentage < 100 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full w-8 h-8 flex items-center justify-center ring-2 ring-white shadow ">
                                                    {Math.round(completionPercentage)}%
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Profile completion: {Math.round(completionPercentage)}%</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="space-y-2">
                        {/* Name + verified */}
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{displayName}</h3>
                            {profile.is_verified && <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        </div>

                        {/* Role and details */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <RoleIcon role={profile.role} />
                                {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                            </span>
                            {(profile.role === "T" || profile.role === "C") && profile.years_of_experience && (
                                <span>• {profile.years_of_experience} yrs exp</span>
                            )}
                        </div>

                        {/* Grade for Students */}
                        {profile.role === "S" && profile.grade_level && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <GraduationCap className="h-4 w-4" />
                                {profile.grade_level}
                            </div>
                        )}

                        {/* Bio */}
                        {profile.bio && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-2">{profile.bio}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

/* --------------------------- Compact Card --------------------------- */
export function ProfileCardCompact({ profile, className = "" }: ProfileCardProps) {
    const displayName = ProfileDisplayUtils.getDisplayName(profile);
    const profileUrl = `/dashboard`;
    const completionPercentage = profile.profile_completion_percentage || 0;

    return (
        <Link href={profileUrl} className="block">
            <div className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-gray-50 transition-all duration-200 ${className}`}>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                        <UserAvatar profile={profile} size="md" showOnlineStatus={false} />
                    </div>

                    {profile.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 ring-2 ring-white">
                            <Shield className="h-2.5 w-2.5 text-white fill-white" />
                        </div>
                    )}

                    {completionPercentage < 100 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring ring-white">
                                        {Math.round(completionPercentage)}%
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Profile completion: {Math.round(completionPercentage)}%</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                        <RoleIcon role={profile.role} className="h-3 w-3 text-gray-600" />
                        <span className="truncate">{ProfileDisplayUtils.getRoleDisplayName(profile.role)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}