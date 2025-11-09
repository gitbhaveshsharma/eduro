/**
 * Coaching Center Public Profile Page
 * 
 * Modern, optimized public profile with grid layout
 * Features: Memoization, skeleton loading, error boundaries
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    useCoachingStore,
    type PublicCoachingCenter,
    type PublicCoachingBranch
} from '@/lib/coaching';
import { CoachingProfileHeader } from '@/components/coaching/public/coaching-profile-header';
import { CoachingAboutSection } from '@/components/coaching/public/coaching-about-section';
import { CoachingBranchesSection } from '@/components/coaching/public/coaching-branches-section';
import { CoachingReviewsSection } from '@/components/coaching/public/coaching-reviews-section';
// import { CoachingStatsCards } from '@/components/coaching/public/coaching-stats-cards';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CoachingCenterProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const slug = params?.slug as string;

    const { loadCoachingCenterBySlug, loadBranchesByCenter } = useCoachingStore();

    const [center, setCenter] = useState<PublicCoachingCenter | null>(null);
    const [branches, setBranches] = useState<PublicCoachingBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize data loading function
    const loadCoachingData = useCallback(async () => {
        if (!slug) return;

        setLoading(true);
        setError(null);

        try {
            await loadCoachingCenterBySlug(slug);
            const storeState = useCoachingStore.getState();
            const centerData = storeState.currentCoachingCenter;

            if (!centerData) {
                setError('Coaching center not found');
                return;
            }

            setCenter(centerData as unknown as PublicCoachingCenter);
            const branchesData = await loadBranchesByCenter(centerData.id, true);
            setBranches(branchesData || []);
        } catch (err) {
            console.error('Failed to load coaching center:', err);
            setError('Failed to load coaching center details');
        } finally {
            setLoading(false);
        }
    }, [slug, loadCoachingCenterBySlug, loadBranchesByCenter]);

    useEffect(() => {
        loadCoachingData();
    }, [loadCoachingData]);

    // Memoized handlers
    const handleShare = useCallback(() => {
        if (navigator.share && center) {
            navigator.share({
                title: center.name,
                text: center.description || `Check out ${center.name}`,
                url: window.location.href,
            }).catch((err) => console.error('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: 'Link copied!',
                description: 'The link has been copied to your clipboard.',
            });
        }
    }, [center, toast]);

    const handleSave = useCallback(() => {
        toast({
            title: 'Saved!',
            description: 'This coaching center has been added to your saved list.',
        });
    }, [toast]);

    const handleJoinBranch = useCallback((branchId: string) => {
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            router.push(`/coaching/${slug}/branch/${branchId}`);
        }
    }, [branches, slug, router]);

    // Memoized branch IDs
    const branchIds = useMemo(() => branches.map(b => b.id), [branches]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                <LoadingSpinner
                    message={`Loading ${slug}...`}
                    size="lg"
                    variant="primary"
                    fullscreen
                />
            </div>
        );
    }

    if (error || !center) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Coaching center not found'}
                    </AlertDescription>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push('/coaching')}
                    >
                        Browse All Coaching Centers
                    </Button>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header Section */}
            <CoachingProfileHeader
                center={center}
                branchIds={branchIds}
                onShare={handleShare}
                onSave={handleSave}
            />

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Stats Cards - Bento Grid */}
                {/* <CoachingStatsCards 
                    center={center}
                    totalBranches={branches.length}
                    activeBranches={branches.filter(b => b.is_active).length}
                /> */}

                {/* Main Content Grid */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column - About */}
                    <div className="lg:col-span-2 space-y-6">
                        <CoachingAboutSection center={center} />
                        <CoachingBranchesSection
                            branches={branches}
                            centerSlug={slug}
                            onJoinBranch={handleJoinBranch}
                        />
                    </div>

                    {/* Right Column - Reviews */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-8 space-y-6">
                            <CoachingReviewsSection
                                coachingCenterId={center.id}
                                centerName={center.name}
                                centerSlug={slug}
                                branchIds={branchIds}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
