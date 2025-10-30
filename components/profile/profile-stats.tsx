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
    Star
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
    const getReputationLevel = (score: number): { label: string; color: string } => {
        if (score >= 1000) return { label: 'Elite', color: 'text-purple-600' };
        if (score >= 500) return { label: 'Expert', color: 'text-blue-600' };
        if (score >= 200) return { label: 'Advanced', color: 'text-green-600' };
        if (score >= 50) return { label: 'Intermediate', color: 'text-yellow-600' };
        return { label: 'Beginner', color: 'text-gray-600' };
    };

    const reputationLevel = getReputationLevel(profile.reputation_score);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Profile Completion */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Profile Completion
                    </CardTitle>
                    <CardDescription>
                        Complete your profile to unlock all features
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overall Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm font-bold">
                                {profile.profile_completion_percentage}%
                            </span>
                        </div>
                        <Progress value={profile.profile_completion_percentage} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{earnedPoints} / {totalPoints} points earned</span>
                            <span>{completedSteps.length} / {completionSteps.length} steps</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Next Step Recommendation */}
                    {nextStep && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                Recommended Next Step
                            </h4>
                            <div className="p-3 bg-muted rounded-lg space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{nextStep.label}</span>
                                    <Badge variant="secondary">+{nextStep.points} pts</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {nextStep.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Completion Steps */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Completion Steps</h4>
                        <div className="space-y-2">
                            {completionSteps.map((step) => (
                                <div
                                    key={step.key}
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    {step.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
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
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Account Statistics
                    </CardTitle>
                    <CardDescription>
                        Your profile metrics and achievements
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Reputation Score */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                            <Star className={`h-5 w-5 ${reputationLevel.color}`} />
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

                    {/* Activity Stats */}
                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Joined</span>
                            </div>
                            <span className="font-medium">
                                {ProfileDisplayUtils.formatJoinDate(profile.created_at)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Last Active</span>
                            </div>
                            <span className="font-medium">
                                {ProfileDisplayUtils.formatLastSeen(profile.last_seen_at)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Circle className="h-4 w-4" />
                                <span>Status</span>
                            </div>
                            <Badge variant={profile.is_online ? "default" : "secondary"}>
                                {profile.is_online ? 'Online' : 'Offline'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Role-Specific Stats */}
            {(profile.role === 'T' || profile.role === 'C') && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Professional Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {profile.years_of_experience !== null && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Experience</span>
                                <span className="font-medium">
                                    {profile.years_of_experience} {profile.years_of_experience === 1 ? 'year' : 'years'}
                                </span>
                            </div>
                        )}

                        {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-sm text-muted-foreground">Expertise Areas</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.expertise_areas.map((area, index) => (
                                        <Badge key={index} variant="secondary">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.hourly_rate !== null && profile.hourly_rate > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Hourly Rate</span>
                                <span className="font-medium">₹{profile.hourly_rate}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Student Stats */}
            {profile.role === 'S' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Academic Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {profile.grade_level && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Grade Level</span>
                                <span className="font-medium">{profile.grade_level}</span>
                            </div>
                        )}

                        {profile.subjects_of_interest && profile.subjects_of_interest.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-sm text-muted-foreground">Subjects of Interest</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.subjects_of_interest.map((subject, index) => (
                                        <Badge key={index} variant="secondary">
                                            {subject}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
