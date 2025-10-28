"use client";

import { useState } from "react";
import {
    TrendingUp,
    Users,
    Hash,
    Calendar,
    BookOpen,
    Sparkles,
    ChevronRight,
    UserPlus,
    X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LocationReviewsCardCompact } from "../reviews";

interface SuggestionSectionProps {
    className?: string;
}

// Mock data
const trendingTopics = [
    { tag: "ai", count: 1250, trend: "+12%" },
    { tag: "react", count: 892, trend: "+8%" },
    { tag: "webdev", count: 654, trend: "+15%" },
    { tag: "nextjs", count: 445, trend: "+22%" },
    { tag: "typescript", count: 389, trend: "+5%" },
];

const suggestedUsers = [
    {
        id: "1",
        username: "techguru",
        fullName: "David Chen",
        avatar: "/placeholder-user.jpg",
        followers: 12500,
        isVerified: true,
        bio: "Full-stack developer & tech enthusiast",
        mutualConnections: 3
    },
    {
        id: "2",
        username: "designpro",
        fullName: "Lisa Park",
        avatar: "/placeholder-user.jpg",
        followers: 8900,
        isVerified: false,
        bio: "UI/UX Designer creating beautiful experiences",
        mutualConnections: 5
    },
    {
        id: "3",
        username: "startupfan",
        fullName: "Alex Rivera",
        avatar: "/placeholder-user.jpg",
        followers: 5600,
        isVerified: false,
        bio: "Entrepreneur & startup advisor",
        mutualConnections: 2
    }
];

const upcomingEvents = [
    {
        id: "1",
        title: "Web Development Bootcamp",
        date: "Dec 15, 2024",
        time: "2:00 PM",
        attendees: 156,
        type: "workshop"
    },
    {
        id: "2",
        title: "AI in Education Summit",
        date: "Dec 18, 2024",
        time: "10:00 AM",
        attendees: 324,
        type: "conference"
    },
    {
        id: "3",
        title: "React Study Group",
        date: "Dec 20, 2024",
        time: "6:00 PM",
        attendees: 45,
        type: "study"
    }
];

const featuredContent = [
    {
        id: "1",
        title: "Getting Started with TypeScript",
        type: "guide",
        readTime: "8 min read",
        views: 2340,
        thumbnail: "/placeholder.jpg"
    },
    {
        id: "2",
        title: "Best Practices for React Hooks",
        type: "tutorial",
        readTime: "12 min read",
        views: 1890,
        thumbnail: "/placeholder.jpg"
    }
];

export function SuggestionSection({ className = "" }: SuggestionSectionProps) {
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

    const handleFollowUser = (userId: string) => {
        setFollowedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleDismissUser = (userId: string) => {
        setDismissedSuggestions(prev => new Set(prev).add(userId));
    };

    const visibleSuggestedUsers = suggestedUsers.filter(user => !dismissedSuggestions.has(user.id));

    return (
        <div className={`space-y-6 ${className}`}>
            {/* cochin Location Reviews */}
            <LocationReviewsCardCompact
                key="suggestion-section"
                sortOption={false}
                commentPreviewLength={100}
                title="Coaching Reviews"
                className="h-fit"
            />


            {/* Suggested Users */}
            {visibleSuggestedUsers.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            People to Follow
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {visibleSuggestedUsers.map((user) => (
                            <div key={user.id} className="flex items-start space-x-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1">
                                            <h4 className="font-semibold text-sm truncate">{user.fullName}</h4>
                                            {user.isVerified && (
                                                <Badge variant="outline" className="text-xs px-1 py-0">
                                                    ✓
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDismissUser(user.id)}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.bio}</p>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-xs text-gray-500">
                                            <span className="font-medium">{user.followers.toLocaleString()}</span> followers
                                            {user.mutualConnections > 0 && (
                                                <span className="ml-2">
                                                    · {user.mutualConnections} mutual
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant={followedUsers.has(user.id) ? "outline" : "default"}
                                            onClick={() => handleFollowUser(user.id)}
                                            className="text-xs h-7"
                                        >
                                            {followedUsers.has(user.id) ? (
                                                <>
                                                    <Users className="h-3 w-3 mr-1" />
                                                    Following
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-3 w-3 mr-1" />
                                                    Follow
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700">
                            Discover more people
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Upcoming Events */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        Upcoming Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {upcomingEvents.map((event) => (
                        <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                        <span>{event.date}</span>
                                        <span>·</span>
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                            {event.type}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {event.attendees} attending
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button variant="ghost" size="sm" className="w-full text-purple-600 hover:text-purple-700">
                        View all events
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </CardContent>
            </Card>

            {/* Featured Content */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Featured Learning
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {featuredContent.map((content) => (
                        <div key={content.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                <img
                                    src={content.thumbnail}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                    {content.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {content.type}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{content.readTime}</span>
                                </div>
                                <div className="flex items-center space-x-1 mt-1">
                                    <BookOpen className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                        {content.views.toLocaleString()} views
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button variant="ghost" size="sm" className="w-full text-yellow-600 hover:text-yellow-700">
                        Explore learning resources
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Create Event
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            Start Topic
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Find Friends
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Study Group
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}