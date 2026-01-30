/**
 * Student Dashboard Components
 * 
 * Export all dashboard components for easy imports
 */

// Stats and charts
export { DashboardStatsCard } from './dashboard-stats-card';
export { MiniBar, MiniBarChart, StatWithBar } from './mini-charts';

// Layout components
export { StudentDashboardHeader as DashboardHeader } from './student-dashboard-header';
export { DashboardSkeleton, DashboardError, DashboardEmpty } from './dashboard-skeleton';

// Schedule and classes
export { TodaySchedule } from './today-schedule';

// Assignments and quizzes
export { UpcomingAssignments } from './upcoming-assignments';
export { UpcomingQuizzes } from './upcoming-quizzes';

// Performance and progress
export { PerformanceOverview } from './performance-overview';
export { ClassProgress } from './class-progress';
export { RecentSubmissions } from './recent-submissions';

// Notices and alerts
export { RecentNotices } from './recent-notices';
export { OverdueAlerts } from './overdue-alerts';

// Info
export { CenterInfo } from './center-info';
