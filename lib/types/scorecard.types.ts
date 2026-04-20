// Scorecard types (overview + learning consumption only)

export type PerformanceLevel = "Beginner" | "Intermediate" | "Advanced" | "Interview-Ready";
export type StatusBadge = "Green" | "Amber" | "Red";

export interface CourseProgressItem {
  courseId: number;
  courseName: string;
  currentWeek: number;
  currentModule: string;
}

export interface StudentOverview {
  profilePicUrl?: string;
  studentName: string;
  programName: string;
  cohort: string;
  currentWeek: number;
  currentModule: string;
  currentCourseName?: string;
  courseProgress?: CourseProgressItem[];
  overallPerformanceScore: number;
  overallGrade: PerformanceLevel;
  totalTimeSpentSeconds: number;
  totalDaysActive: number;
  activeDaysStreak: number;
  completionPercentage: number;
  statusBadge: StatusBadge;
  dailyProgressPercentage?: number;
  dailyPerformanceScore?: number | null;
  gradeCriteria?: string;
  statusCriteria?: string;
}

export interface VideoMetrics {
  totalAssigned: number;
  completed: number;
  averageWatchPercentage: number;
  rewatchCount: number;
  skippedVideos: string[];
  skippedCount?: number;
  engagementCount?: number;
}

export interface ArticleMetrics {
  totalAssigned: number;
  read: number;
  averageReadingTime: number;
  expectedReadingTime: number;
  /** Mean Content duration (minutes) across all assigned articles — catalog typical read. */
  typicalReadTimePerArticle: number;
}

/** Course coding activities (Content types CodingProblem / DevCodingProblem). */
export interface CodingProblemMetrics {
  totalAssigned: number;
  completed: number;
  /** Submissions / graded attempts logged as UserActivity for those contents. */
  submissionCount: number;
}

/** AI mock interview sessions (MockInterview model; not course Content). */
export interface MockInterviewMetrics {
  /** Non-cancelled sessions (scheduled, in progress, or completed). */
  totalAssigned: number;
  completed: number;
  pendingCount: number;
  /** completed / total_assigned (non-cancelled), 0–100. */
  completionPercentage: number;
  /** Mean of per-interview scores from evaluation_score when present; null if none. */
  averageScore: number | null;
}

export interface PracticeMetrics {
  mcqsAttempted: number;
  mcqsTotal: number;
  subjectiveSubmitted: number;
  subjectivePending: number;
  assessmentsAttempted: number;
  assessmentsMissed: number;
  totalAssessmentsPresent?: number;
  totalQuizContents?: number;
  totalItems?: number;
  assessmentsEngagementPercentage?: number;
}

export interface ContentCompletionOverview {
  totalPresent: number;
  totalCompleted: number;
  byType?: {
    videos: { total: number; completed: number };
    articles: { total: number; completed: number };
    quizzes: { total: number; completed: number };
    codingProblems: { total: number; completed: number };
    mockInterviews: { total: number; completed: number };
  };
}

export interface LearningConsumption {
  videos: VideoMetrics;
  articles: ArticleMetrics;
  codingProblems: CodingProblemMetrics;
  mockInterviews: MockInterviewMetrics;
  practice: PracticeMetrics;
  totalContent?: number;
  contentCompletionOverview?: ContentCompletionOverview;
}

export interface ScorecardConfig {
  enabledModules: string[];
}

export interface ScorecardData {
  scorecardConfig?: ScorecardConfig;
  overview: StudentOverview;
  learningConsumption: LearningConsumption;
}
