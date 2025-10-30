/**
 * Coaching Center Public Profile Page
 * 
 * Public-facing profile page for a coaching center
 * Shows center info, branches, reviews, and contact details
 * Accessible at: /coaching/[slug]
 */

'use client';

import { useEffect, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
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

    useEffect(() => {
        if (slug) {
            loadCoachingData();
        }
    }, [slug]);

    const loadCoachingData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load coaching center by slug (this updates the store)
            await loadCoachingCenterBySlug(slug);

            // Get the loaded center from store
            const storeState = useCoachingStore.getState();
            const centerData = storeState.currentCoachingCenter;

            if (!centerData) {
                setError('Coaching center not found');
                return;
            }

            // Convert to PublicCoachingCenter (it already has the right shape)
            setCenter(centerData as unknown as PublicCoachingCenter);

            // Load branches
            const branchesData = await loadBranchesByCenter(centerData.id, true);
            setBranches(branchesData || []);

        } catch (err) {
            console.error('Failed to load coaching center:', err);
            setError('Failed to load coaching center details');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share && center) {
            navigator.share({
                title: center.name,
                text: center.description || `Check out ${center.name}`,
                url: window.location.href,
            }).catch((err) => console.error('Error sharing:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: 'Link copied!',
                description: 'The link has been copied to your clipboard.',
            });
        }
    };

    const handleSave = () => {
        toast({
            title: 'Saved!',
            description: 'This coaching center has been added to your saved list.',
        });
    };

    const handleJoinBranch = (branchId: string) => {
        // Navigate to branch profile or show join dialog
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            router.push(`/coaching/${slug}/branch/${branchId}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Skeleton className="h-96 w-full" />
                <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (error || !center) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
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

    // Extract branch IDs for reviews
    const branchIds = branches.map(b => b.id);

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section */}
            <CoachingProfileHeader
                center={center}
                averageRating={0} // Will be populated by reviews section
                totalReviews={0}  // Will be populated by reviews section
                onShare={handleShare}
                onSave={handleSave}
            />

            {/* Content Sections */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* About Section */}
                <CoachingAboutSection center={center} />

                {/* Branches Section */}
                <CoachingBranchesSection
                    branches={branches}
                    centerSlug={slug}
                    onJoinBranch={handleJoinBranch}
                />

                {/* Reviews Section */}
                <CoachingReviewsSection
                    coachingCenterId={center.id}
                    centerName={center.name}
                    centerSlug={slug}
                    branchIds={branchIds}
                />
            </div>
        </div>
    );
}
