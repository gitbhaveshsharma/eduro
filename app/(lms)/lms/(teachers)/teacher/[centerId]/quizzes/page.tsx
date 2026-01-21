/**
 * Teacher Quizzes Page
 * 
 * Main quizzes listing page for teachers
 */

'use client';

import { useTeacherContext } from '../layout';
import { useAuthStore } from '@/lib/auth-store';
import { TeacherQuizzesDashboard } from '../_components/qizes';

export default function TeacherQuizzesPage() {
    const { coachingCenter, centerId } = useTeacherContext();
    const user = useAuthStore((state) => state.user);

    if (!user?.id || !centerId) {
        return null;
    }

    return (
        <TeacherQuizzesDashboard
            centerId={centerId}
            teacherId={user.id}
            userRole="teacher"
        />
    );
}
