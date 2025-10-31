/**
 * Profile Stats Component
 * 
 * Displays profile statistics and completion progress
 */

"use client";

import { Profile } from '@/lib/schema/profile.types';
import { ProfileCompletionUtils, ProfileDisplayUtils } from '@/lib/utils/profile.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    Circle,
    TrendingUp,
    Award,
    Calendar,
    Clock,
    Shield,
    Star,
    User,
    GraduationCap,
    Briefcase
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ProfileStatsProps {
    profile: Profile;
    className?: string;
}

export function ProfileStats({ profile, className = '' }: ProfileStatsProps) {
    const completionSteps = ProfileCompletionUtils.getCompletionSteps(profile);
    const nextStep = ProfileCompletionUtils.getNextStep(profile);
    const completedSteps = completionSteps.filter(step => step.completed);
    const totalPoints = completionSteps.reduce((sum, step) => sum + step.points, 0);
    const earnedPoints = completedSteps.reduce((sum, step) => sum + step.points, 0);

    // Calculate reputation level
    const getReputationLevel = (score: number): { label: string; color: string; bgColor: string } => {
        if (score >= 1000) return { label: 'Elite', color: 'text-purple-600', bgColor: 'bg-purple-100' };
        if (score >= 500) return { label: 'Expert', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        if (score >= 200) return { label: 'Advanced', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (score >= 50) return { label: 'Intermediate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        return { label: 'Beginner', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    };

    const reputationLevel = getReputationLevel(profile.reputation_score);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Top Row: Profile Completion & Account Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Completion */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5" />
                            Profile Completion
                        </CardTitle>
                        <CardDescription>
                            Complete your profile to unlock all features
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Overall Progress */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-lg font-bold text-primary">
                                    {profile.profile_completion_percentage}%
                                </span>
                            </div>
                            <Progress value={profile.profile_completion_percentage} className="h-3" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{earnedPoints} / {totalPoints} points earned</span>
                                <span>{completedSteps.length} / {completionSteps.length} steps</span>
                            </div>
                        </div>

                        {/* Next Step Recommendation */}
                        {nextStep && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        Recommended Next Step
                                    </h4>
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{nextStep.label}</span>
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                +{nextStep.points} pts
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-yellow-700">
                                            {nextStep.description}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Account Stats */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Award className="h-5 w-5" />
                            Account Statistics
                        </CardTitle>
                        <CardDescription>
                            Your profile metrics and achievements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Reputation Score */}
                        <div className={`flex items-center justify-between p-4 rounded-lg ${reputationLevel.bgColor}`}>
                            <div className="flex items-center gap-3">
                                <Star className={`h-6 w-6 ${reputationLevel.color}`} />
                                <div>
                                    <p className="text-sm font-medium">Reputation Score</p>
                                    <p className="text-xs text-muted-foreground">
                                        {reputationLevel.label} Level
                                    </p>
                                </div>
                            </div>
                            <span className={`text-2xl font-bold ${reputationLevel.color}`}>
                                {profile.reputation_score}
                            </span>
                        </div>

                        {/* Account Status */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted rounded-lg space-y-1">
                                <div className="flex items-center gap-2">
                                    {profile.is_verified ? (
                                        <Shield className="h-4 w-4 text-blue-600" />
                                    ) : (
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="text-xs text-muted-foreground">Verification</span>
                                </div>
                                <p className="text-sm font-medium">
                                    {profile.is_verified ? 'Verified' : 'Not Verified'}
                                </p>
                            </div>

                            <div className="p-3 bg-muted rounded-lg space-y-1">
                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Status</span>
                                </div>
                                <p className="text-sm font-medium">
                                    {profile.is_premium ? 'Premium' : 'Free'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row: Activity Stats & Role-Specific Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Stats */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5" />
                            Activity Information
                        </CardTitle>
                        <CardDescription>
                            Your account activity and status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Joined Date</span>
                                </div>
                                <span className="font-medium">
                                    {ProfileDisplayUtils.formatJoinDate(profile.created_at)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Last Active</span>
                                </div>
                                <span className="font-medium">
                                    {ProfileDisplayUtils.formatLastSeen(profile.last_seen_at)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Circle className="h-4 w-4" />
                                    <span>Online Status</span>
                                </div>
                                <Badge variant={profile.is_online ? "default" : "secondary"}>
                                    {profile.is_online ? 'Online' : 'Offline'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Profile Role</span>
                                </div>
                                <Badge variant="outline">
                                    {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Role-Specific Stats */}
                {(profile.role === 'T' || profile.role === 'C') && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Briefcase className="h-5 w-5" />
                                Professional Information
                            </CardTitle>
                            <CardDescription>
                                Your professional details and expertise
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.years_of_experience !== null && (
                                <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                    <span className="text-muted-foreground">Years of Experience</span>
                                    <span className="font-medium">
                                        {profile.years_of_experience} {profile.years_of_experience === 1 ? 'year' : 'years'}
                                    </span>
                                </div>
                            )}

                            {profile.hourly_rate !== null && profile.hourly_rate > 0 && (
                                <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                    <span className="text-muted-foreground">Hourly Rate</span>
                                    <span className="font-medium text-green-600">₹{profile.hourly_rate}</span>
                                </div>
                            )}

                            {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-sm text-muted-foreground">Expertise Areas</span>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.expertise_areas.map((area, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Student Stats */}
                {profile.role === 'S' && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <GraduationCap className="h-5 w-5" />
                                Academic Information
                            </CardTitle>
                            <CardDescription>
                                Your academic details and interests
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.grade_level && (
                                <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                    <span className="text-muted-foreground">Grade Level</span>
                                    <span className="font-medium">{profile.grade_level}</span>
                                </div>
                            )}

                            {profile.subjects_of_interest && profile.subjects_of_interest.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-sm text-muted-foreground">Subjects of Interest</span>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.subjects_of_interest.map((subject, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {subject}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile.learning_goals && (
                                <div className="space-y-2">
                                    <span className="text-sm text-muted-foreground">Learning Goals</span>
                                    <p className="text-sm text-foreground line-clamp-3">
                                        {profile.learning_goals}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Bottom Row: Completion Steps (Full Width) */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="h-5 w-5" />
                        Completion Steps
                    </CardTitle>
                    <CardDescription>
                        Track your profile completion progress
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completionSteps.map((step) => (
                            <div
                                key={step.key}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                {step.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {step.required && (
                                                <Badge variant="outline" className="text-xs">
                                                    Required
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {step.points} pts
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}