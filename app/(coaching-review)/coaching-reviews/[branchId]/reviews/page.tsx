/**
 * Coaching Branch Reviews Page
 * 
 * Next.js page for displaying reviews of a specific coaching branch
 * Route: /coaching/[branchId]/reviews
 */

// Import the CoachingReviewsPage component from the app page file where it's defined.
import { CoachingReviewsPage } from '@/app/(coaching-review)/coaching-reviews/page';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface PageProps {
    params: {
        branchId: string;
    };
}

export default async function BranchReviewsPage({ params }: PageProps) {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Get branch details
    const { data: branch } = await supabase
        .from('coaching_branches')
        .select(`
      name,
      coaching_centers (
        name
      )
    `)
        .eq('id', params.branchId)
        .single();

    if (!branch) {
        redirect('/404');
    }

    return (
        <CoachingReviewsPage
            branchId={params.branchId}
            branchName={branch.name}
            centerName={(branch.coaching_centers as any)?.name}
            currentUserId={user?.id}
        />
    );
}

// Metadata
export async function generateMetadata({ params }: PageProps) {
    const supabase = await createServerClient();

    const { data: branch } = await supabase
        .from('coaching_branches')
        .select('name')
        .eq('id', params.branchId)
        .single();

    return {
        title: branch ? `Reviews - ${branch.name}` : 'Reviews',
        description: `Read reviews and ratings for ${branch?.name || 'this coaching center'}`
    };
}
