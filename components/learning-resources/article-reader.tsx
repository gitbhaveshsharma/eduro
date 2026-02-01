/**
 * Article Reader Component
 * Modern minimalist design with scroll progress tracking
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    CheckCircle2,
    Lightbulb,
    FlaskConical,
    Sparkles,
    Play,
    Share2,
    BookmarkPlus,
    ChevronUp,
} from 'lucide-react';
import type { LearningResource, LearningSection } from '@/lib/learning-resources/data';
import { useReadingProgress, formatTimeSpent } from '@/lib/learning-resources/use-reading-progress';
import { getSubjectConfig, getSubjectImageById } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import { UserAvatar } from '@/components/avatar';
import { useProfileStore } from '@/lib/store/profile.store';
import { useToast } from '@/hooks/use-toast';

interface ArticleReaderProps {
    resource: LearningResource;
    onBack?: () => void;
}

// Get icon for section type
function getSectionIcon(type: LearningSection['type']) {
    switch (type) {
        case 'tip':
            return <Lightbulb className="h-4 w-4 text-warning" />;
        case 'example':
            return <FlaskConical className="h-4 w-4 text-primary" />;
        case 'activity':
            return <Play className="h-4 w-4 text-success" />;
        case 'fun-fact':
            return <Sparkles className="h-4 w-4 text-secondary" />;
        default:
            return <BookOpen className="h-4 w-4 text-muted-foreground" />;
    }
}

// Get background color for section type - minimalist approach
function getSectionBgColor(type: LearningSection['type']) {
    switch (type) {
        case 'tip':
            return 'bg-warning/5 border-l-2 border-l-warning';
        case 'example':
            return 'bg-primary/5 border-l-2 border-l-primary';
        case 'activity':
            return 'bg-success/5 border-l-2 border-l-success';
        case 'fun-fact':
            return 'bg-secondary/5 border-l-2 border-l-secondary';
        default:
            return '';
    }
}

// Parse markdown-like content to JSX
function parseContent(content: string) {
    // Split by paragraphs
    const paragraphs = content.split('\n\n');

    return paragraphs.map((paragraph, idx) => {
        // Check for bullet points
        if (paragraph.includes('\n-') || paragraph.startsWith('-')) {
            const lines = paragraph.split('\n');
            const listItems = lines.filter(line => line.startsWith('-'));
            const intro = lines.find(line => !line.startsWith('-'));

            return (
                <div key={idx} className="mb-4">
                    {intro && <p className="mb-2">{formatText(intro)}</p>}
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        {listItems.map((item, i) => (
                            <li key={i} className="text-muted-foreground">
                                {formatText(item.replace(/^-\s*/, ''))}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        // Check for numbered lists
        if (/^\d+\./.test(paragraph)) {
            const lines = paragraph.split('\n').filter(Boolean);
            return (
                <ol key={idx} className="list-decimal list-inside space-y-2 mb-4 ml-2">
                    {lines.map((line, i) => (
                        <li key={i} className="text-muted-foreground">
                            {formatText(line.replace(/^\d+\.\s*/, ''))}
                        </li>
                    ))}
                </ol>
            );
        }

        // Regular paragraph
        return (
            <p key={idx} className="mb-4 text-muted-foreground leading-relaxed">
                {formatText(paragraph)}
            </p>
        );
    });
}

// Format text with bold and italic
function formatText(text: string): React.ReactNode {
    // Replace **bold** with <strong>
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={idx} className="text-foreground font-semibold">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        // Replace *italic* with <em>
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
            return <em key={idx}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

export function ArticleReader({ resource, onBack }: ArticleReaderProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('');
    const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

    // User profile and toast
    const currentProfile = useProfileStore(state => state.currentProfile);
    const { toast } = useToast();

    // Subject config from centralized assets
    const subjectConfig = getSubjectConfig(resource.subject.id as SubjectId);
    const subjectImage = getSubjectImageById(resource.subject.id as SubjectId);

    const {
        progress,
        isLoaded,
        markSectionComplete,
        updateScrollProgress,
        updateTimeSpent,
    } = useReadingProgress(resource.id, resource.slug, resource.sections.length);

    // Get display name from profile
    const displayName = currentProfile?.full_name?.split(' ')[0] || currentProfile?.username || 'Learner';

    // Show welcome toast when logged in user starts reading
    useEffect(() => {
        if (isLoaded && currentProfile) {
            toast({
                title: `Welcome back, ${displayName}!`,
                description: progress?.progress
                    ? `Continue from where you left off (${progress.progress}%)`
                    : 'Happy learning!',
            });
        }
    }, [isLoaded, currentProfile?.id]); // Only trigger on initial load

    // Time tracking
    useEffect(() => {
        const interval = setInterval(() => {
            updateTimeSpent(30); // Update every 30 seconds
        }, 30000);

        return () => clearInterval(interval);
    }, [updateTimeSpent]);

    // Scroll progress tracking
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

            setScrollProgress(scrollPercentage);
            setShowScrollTop(scrollTop > 500);

            // Update localStorage progress
            if (scrollPercentage > (progress?.progress ?? 0)) {
                updateScrollProgress(scrollPercentage);
            }

            // Detect active section
            sectionRefs.current.forEach((element, sectionId) => {
                const rect = element.getBoundingClientRect();
                if (rect.top <= 150 && rect.bottom > 0) {
                    setActiveSection(sectionId);
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [progress?.progress, updateScrollProgress]);

    // Register section ref
    const registerSectionRef = useCallback((sectionId: string, element: HTMLElement | null) => {
        if (element) {
            sectionRefs.current.set(sectionId, element);
        }
    }, []);

    // Scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle section click (mark as read)
    const handleSectionRead = (sectionId: string) => {
        markSectionComplete(sectionId);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
            {/* Fixed Progress Bar at Top */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
                <Progress value={scrollProgress} className="h-0.5 rounded-none" variant="primary" />
                <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>

                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground font-medium">
                            {scrollProgress}%
                        </span>
                        {progress && (
                            <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {formatTimeSpent(progress.timeSpentSeconds)}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <BookmarkPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Share2 className="h-4 w-4" />
                        </Button>
                        {currentProfile && (
                            <UserAvatar
                                profile={currentProfile}
                                size="xs"
                                className="ml-2"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="pt-16 pb-20">
                {/* Hero Header with Subject Image */}
                <header className="relative overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 h-64 md:h-80">
                        <Image
                            src={subjectImage}
                            alt={resource.subject.name}
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
                    </div>

                    <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
                        {/* Subject Badge */}
                        <Badge
                            variant="secondary"
                            className={cn(
                                'text-xs px-2.5 py-1 mb-4 backdrop-blur-sm',
                                subjectConfig.color
                            )}
                        >
                            {subjectConfig.icon} {resource.subject.name}
                        </Badge>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-white">
                            {resource.title}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base md:text-lg text-white/80 mb-6 max-w-2xl">
                            {resource.subtitle}
                        </p>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{resource.estimatedReadTime} min</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" />
                                <span>{resource.sections.length} sections</span>
                            </div>
                            <Badge variant="outline" className="text-xs border-white/30 text-white/90">
                                Grade {resource.gradeLevel}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    resource.difficulty === 'easy' && 'border-success/50 text-success',
                                    resource.difficulty === 'medium' && 'border-warning/50 text-warning',
                                    resource.difficulty === 'hard' && 'border-error/50 text-error'
                                )}
                            >
                                {resource.difficulty}
                            </Badge>
                        </div>
                    </div>
                </header>

                {/* What you'll learn - Minimal card */}
                <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10">
                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                What you'll learn
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {resource.keyTakeaways.map((takeaway, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                        <span className="text-muted-foreground">{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Article Content */}
                <article className="max-w-4xl mx-auto px-4 py-8">
                    {/* Table of Contents - Minimal */}
                    <Card className="mb-8 border-border/50">
                        <CardContent className="p-5">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Contents
                            </h3>
                            <nav className="space-y-0.5">
                                {resource.sections.map((section, idx) => {
                                    const isComplete = progress?.sectionsCompleted.includes(section.id);
                                    const isActive = activeSection === section.id;

                                    return (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className={cn(
                                                'flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors',
                                                isActive && 'bg-primary/10 text-primary font-medium',
                                                !isActive && 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {isComplete ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                                            ) : (
                                                <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                                                    {idx + 1}
                                                </span>
                                            )}
                                            <span className="truncate">{section.title}</span>
                                        </a>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Sections */}
                    <div className="space-y-6">
                        {resource.sections.map((section, idx) => {
                            const isComplete = progress?.sectionsCompleted.includes(section.id);

                            return (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    ref={(el) => registerSectionRef(section.id, el)}
                                    className={cn(
                                        'scroll-mt-20 rounded-lg p-5 transition-colors',
                                        getSectionBgColor(section.type)
                                    )}
                                >
                                    {/* Section Header */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            {getSectionIcon(section.type)}
                                            <h2 className="text-lg md:text-xl font-semibold text-foreground">
                                                {section.title}
                                            </h2>
                                        </div>
                                        <Button
                                            variant={isComplete ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleSectionRead(section.id)}
                                            className={cn(
                                                'flex-shrink-0 h-8 text-xs',
                                                isComplete && 'text-success'
                                            )}
                                        >
                                            {isComplete ? (
                                                <>
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                    Done
                                                </>
                                            ) : (
                                                'Mark done'
                                            )}
                                        </Button>
                                    </div>

                                    {/* Section Content */}
                                    <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                                        {parseContent(section.content)}
                                    </div>

                                    {idx < resource.sections.length - 1 && (
                                        <Separator className="mt-6 opacity-50" />
                                    )}
                                </section>
                            );
                        })}
                    </div>

                    {/* Completion Card */}
                    {progress?.completed && (
                        <Card className="mt-10 bg-success/5 border-success/20">
                            <CardContent className="p-6 text-center">
                                <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
                                <h3 className="text-lg font-semibold mb-1 text-foreground">
                                    Well done!
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    You've completed this article.
                                </p>
                                <Button onClick={onBack} size="sm">
                                    Explore More
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </article>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-md z-40 border border-border/50"
                    onClick={scrollToTop}
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
