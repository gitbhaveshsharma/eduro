/**
 * Teacher Dashboard Components
 * 
 * Export all dashboard components for easy imports
 */

// Stats and charts
export { DashboardStatsCard, CompactStatsCard } from './dashboard-stats-card';
export { MiniBar, MiniBarChart, StatWithBar } from './mini-charts';

// Layout components
// export { DashboardHeader } from './teacher-dashboard-header';
export { DashboardSkeleton, DashboardError, DashboardEmpty } from './dashboard-skeleton';

// Schedule
export { TodaySchedule, ScheduleListItem } from './today-schedule';

// Grading and assignments
export { GradingOverview, UpcomingDeadlines } from './grading-overview';

// Performance and analytics
export { ClassPerformance, AtRiskStudents, RecentActivity } from './class-performance';

// Legacy components (for backward compatibility)
export { StatsCard } from './stats-card';
export { QuickActionCard } from './quick-action-card';
export { DashboardHeader } from './teacher-dashboard-header';
export { AssignmentsList } from './assignments-list';
export { CenterInfo } from './center-info';
