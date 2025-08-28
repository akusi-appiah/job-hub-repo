export interface DailyStat {
  date: string;
  claimed: number;
}

export interface RecentActivity {
  description: string;
  type: string;
  dateTime: string;
}

export interface Summary {
  totalActivitiesFound: number;
  recentPeriod: string;
  statsPeriod: string;
}

export interface QueryParameters {
  recentDays: number;
  recentLimit: number;
  statsDays: number;
  generatedAt: string;
}

export interface AdminStatistics {
  summary: Summary;
  totalPostedJobs: number;
  totalExpiredJobs: number;
  queryParameters: QueryParameters;
  stats: DailyStat[];
  totalApprovedJobs: number;
  totalJobs: number;
  totalClaimedJobs: number;
  totalSubmittedJobs: number;
  totalRejectedJobs: number;
  recent: RecentActivity[];
}