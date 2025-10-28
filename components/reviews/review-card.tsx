/**
 * Review Card Component
 * 
 * Displays a single review with ratings, user info, and actions
 * Fully responsive and uses shadcn UI components
 */

'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ThumbsUp,
    Flag,
    Star,
    MessageSquare,
    MoreVertical,
    Edit,
    Trash2,
    MapPin
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ReviewDisplayUtils, ReviewValidationUtils } from '@/lib/utils/review.utils';
import type { ReviewWithDetails } from '@/lib/schema/review.types';

interface ReviewCardProps {
    review: ReviewWithDetails;
    onHelpfulClick?: () => void;
    onEditClick?: () => void;
    onDeleteClick?: () => void;
    onReportClick?: () => void;
    isOwner?: boolean;
    className?: string;
}

export function ReviewCard({
    review,
    onHelpfulClick,
    onEditClick,
    onDeleteClick,
    onReportClick,
    isOwner = false,
    className
}: ReviewCardProps) {
    const canEdit = isOwner && ReviewValidationUtils.canEdit(review.created_at);
    const canDelete = isOwner && ReviewValidationUtils.canDelete(review.created_at);

    const getRatingColor = (rating: string) => {
        const num = parseInt(rating);
        if (num >= 4) return 'text-green-600';
        if (num >= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    const renderStars = (rating: string) => {
        const num = parseInt(rating);
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            'h-4 w-4',
                            i < num ? 'fill-current' : 'stroke-current fill-none',
                            getRatingColor(rating)
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    {/* User Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={review.reviewer_name || undefined} />
                            <AvatarFallback>
                                {review.is_anonymous ? 'A' : (review.reviewer_name?.[0] || 'U')}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm truncate">
                                    {ReviewDisplayUtils.getReviewerName(review)}
                                </h4>

                                {review.is_verified_reviewer && (
                                    <Badge variant="secondary" className="text-xs">
                                        Verified
                                    </Badge>
                                )}

                                {review.is_anonymous && (
                                    <Badge variant="outline" className="text-xs">
                                        Anonymous
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{ReviewDisplayUtils.formatTimeAgo(review.created_at)}</span>
                                {review.branch_city && (
                                    <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{review.branch_city}, {review.branch_state}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canEdit && onEditClick && (
                                <DropdownMenuItem onClick={onEditClick}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Review
                                </DropdownMenuItem>
                            )}
                            {canDelete && onDeleteClick && (
                                <DropdownMenuItem onClick={onDeleteClick} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Review
                                </DropdownMenuItem>
                            )}
                            {!isOwner && onReportClick && (
                                <DropdownMenuItem onClick={onReportClick}>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Report Review
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Overall Rating */}
                <div className="flex items-center gap-3 mt-3">
                    {renderStars(review.overall_rating)}
                    <span className={cn('text-2xl font-bold', getRatingColor(review.overall_rating))}>
                        {review.overall_rating}.0
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base mt-2">{review.title}</h3>
            </CardHeader>

            <CardContent className="pb-3 space-y-4">
                {/* Comment */}
                {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                    </p>
                )}

                {/* Category Ratings */}
                {(review.teaching_quality || review.infrastructure || review.staff_support || review.value_for_money) && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        {review.teaching_quality && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Teaching Quality</p>
                                {renderStars(review.teaching_quality)}
                            </div>
                        )}
                        {review.infrastructure && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Infrastructure</p>
                                {renderStars(review.infrastructure)}
                            </div>
                        )}
                        {review.staff_support && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Staff Support</p>
                                {renderStars(review.staff_support)}
                            </div>
                        )}
                        {review.value_for_money && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Value for Money</p>
                                {renderStars(review.value_for_money)}
                            </div>
                        )}
                    </div>
                )}

                {/* Media */}
                {review.media && review.media.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {review.media.slice(0, 3).map((media) => (
                            <div
                                key={media.id}
                                className="relative aspect-video rounded-md overflow-hidden bg-muted"
                            >
                                {media.media_type === 'IMAGE' ? (
                                    <img
                                        src={media.media_url}
                                        alt="Review media"
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <video
                                        src={media.media_url}
                                        className="object-cover w-full h-full"
                                    />
                                )}
                            </div>
                        ))}
                        {review.media.length > 3 && (
                            <div className="aspect-video rounded-md bg-muted flex items-center justify-center text-sm font-medium">
                                +{review.media.length - 3} more
                            </div>
                        )}
                    </div>
                )}

                {/* Coaching Center Response */}
                {review.response && review.response.is_public && (
                    <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge>Response from {review.center_name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {review.response.response_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {ReviewDisplayUtils.formatTimeAgo(review.response.created_at)}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-3 border-t">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {/* Helpful Button */}
                        <Button
                            variant={review.user_has_voted ? 'default' : 'outline'}
                            size="sm"
                            onClick={onHelpfulClick}
                            className="gap-2"
                        >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs">
                                Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                            </span>
                        </Button>

                        {/* Response Count */}
                        {review.response_exists && (
                            <Badge variant="secondary" className="gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Response
                            </Badge>
                        )}
                    </div>

                    {/* Edit Time Remaining */}
                    {isOwner && canEdit && (
                        <span className="text-xs text-muted-foreground">
                            {ReviewValidationUtils.getEditTimeRemaining(review.created_at)}
                        </span>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
