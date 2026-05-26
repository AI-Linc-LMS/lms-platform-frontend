// Scorecard types (overview + learning consumption + per-module additions)

export type PerformanceLevel = "Beginner" | "Intermediate" | "Advanced" | "Interview-Ready";
export type SkillStrength = "Strong" | "Intermediate" | "Needs Attention";
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

// Performance Trends (Phase 1) — added incrementally as new modules land.
// Older mockup branch had these in a single big drop; on stagging they're
// introduced one section at a time so each phase merges cleanly.
export interface WeeklyPerformance {
  week: number;
  weekLabel: string;
  mcqAccuracy: number;
  subjectiveScore: number;
  assessmentScore: number;
  interviewScore: number;
}

export interface SkillAccuracy {
  skillName: string;
  accuracy: number; // 0-100
  attemptCount: number;
  confidenceScore: number; // 0-100
}

export interface PerformanceTrends {
  granularity?: "weekly" | "bimonthly" | "monthly";
  weeklyData: WeeklyPerformance[];
  skillWiseAccuracy: SkillAccuracy[];
}

// Skill Scorecard (Phase 2)
export interface SkillBreakdown {
  quizScore: number; // 0-100
  assessmentScore: number;
  interviewScore: number;
  codingScore: number;
  videoScore: number;
}

export interface SkillBreakdownCounts {
  quizCount: number;
  videoCount: number;
  assessmentCount: number;
  codingCount: number;
  interviewCount: number;
}

export interface SkillBreakdownItem {
  name: string;
  score?: number;
  courseName?: string;
  moduleName?: string;
  submoduleName?: string;
}

export interface SkillBreakdownItems {
  quiz: SkillBreakdownItem[];
  video: SkillBreakdownItem[];
  coding: SkillBreakdownItem[];
  assessment: SkillBreakdownItem[];
  interview: SkillBreakdownItem[];
  article?: SkillBreakdownItem[];
  subjective?: SkillBreakdownItem[];
}

export interface Skill {
  id: string | number;
  name: string;
  category?: string;
  proficiencyScore: number; // 0-100
  level: PerformanceLevel;
  strength: SkillStrength;
  confidenceScore: number; // 0-100
  breakdown: SkillBreakdown;
  breakdownCounts?: SkillBreakdownCounts;
  breakdownItems?: SkillBreakdownItems;
}

// Weak Areas & Attention Alerts (Phase 3)
export interface WeakAreaSourceContext {
  contentType?: string;
  itemName?: string;
  courseName?: string;
  moduleName?: string;
  submoduleName?: string;
}

export interface WeakArea {
  skillName: string;
  currentScore: number;
  threshold: number;
  recommendation: string;
  sourceContext?: WeakAreaSourceContext;
}

export interface TopicIncorrect {
  topicName: string;
  incorrectCount: number;
  totalAttempts: number;
  sourceContext?: WeakAreaSourceContext;
}

export interface WeakAreaRecommendation {
  type: "revise" | "mcq" | "video" | "interview";
  title: string;
  description: string;
  actionUrl?: string;
  priority: number;
}

export interface WeakAreas {
  weakThreshold: number;
  skillsBelowThreshold: WeakArea[];
  topicsFrequentlyIncorrect: TopicIncorrect[];
  skippedQuestions: string[];
  recommendations: WeakAreaRecommendation[];
}

// Assessment Performance (Phase 4)
export interface AssessmentDifficultyBucket {
  correct: number;
  total: number;
}

export interface AssessmentDifficultyBreakdown {
  easy: AssessmentDifficultyBucket;
  medium: AssessmentDifficultyBucket;
  hard: AssessmentDifficultyBucket;
}

export interface AssessmentQuestionAnalytics {
  correct: number;
  incorrect: number;
  skipped: number;
  averageTimePerQuestion: number; // seconds
  negativeMarkImpact: number;
}

export interface AssessmentPerformance {
  assessmentId: string;
  assessmentName: string;
  dateAttempted: string | null;
  /** Normalized percentage (0-100). null when score is missing. */
  score: number | null;
  /** Raw points awarded (pre-normalization). Useful for the "X / Y" subtitle. */
  rawScore: number | null;
  maximumMarks: number;
  percentile: number | null;
  rank: number | null;
  cohortCount: number;
  timeTaken: number; // minutes
  timeAllowed: number; // minutes
  accuracy: number; // 0-100
  difficultyBreakdown: AssessmentDifficultyBreakdown;
  questionAnalytics: AssessmentQuestionAnalytics;
  reviewStatus?: string;
}

// Mock Interview Performance (Phase 5)
export interface InterviewParameter {
  name: string;
  score: number; // 0-100
}

export interface InterviewMentorRatings {
  overall: number;
  technical: number;
  communication: number;
}

export interface InterviewFeedback {
  strengths: string[];
  areasOfImprovement: string[];
  mentorComments: string;
  mentorRatings: InterviewMentorRatings;
}

export interface MockInterview {
  interviewId: string;
  title: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  date: string | null;
  overallScore: number | null;
  parameters: InterviewParameter[];
  feedback: InterviewFeedback;
  playbackLink?: string | null;
}

export interface MockInterviewPerformance {
  totalInterviews: number;
  latestInterviewScore: number;
  interviewReadinessIndex: number;
  improvementSinceFirst: number;
  interviews: MockInterview[];
}

// Behavioral & Consistency (Phase 6)
export interface LoginFrequency {
  week: string;
  loginCount: number;
}

export interface StudyTimeByWeek {
  week: string;
  hours: number;
}

export interface StudyTimeDistribution {
  day: string;
  hours: number;
}

export interface BehavioralMetrics {
  loginFrequency: LoginFrequency[];
  studyTimeByWeek: StudyTimeByWeek[];
  studyTimeDistribution: StudyTimeDistribution[];
  missedDeadlinesCount: number;
  lastActiveDate: string | null;
  consistencyScore: number;
  activityCalendar: Record<string, number>;
}

// Comparative Insights (Phase 7)
export interface BenchmarkComparison {
  metric: string;
  label: string;
  unit: "percent" | "hours" | string;
  studentValue: number;
  batchAverage: number | null;
  top10Percent: number | null;
  percentile: number;
}

export interface ComparativeInsights {
  cohortSize: number;
  percentileRank: number;
  vsBatchAverage: {
    better: number;
    worse: number;
    equal: number;
  };
  comparisons: BenchmarkComparison[];
}

// Achievements & Gamification (Phase 8)
export interface BadgeEarned {
  id: string;
  name: string;
  description: string;
  iconSlug: string;
  earnedDate: string | null;
  points: number;
  snapshotValue: string;
}

export interface BadgeMilestone {
  id: string;
  name: string;
  description: string;
  iconSlug: string;
  progress: number; // 0-100
}

export interface CertificatesProgress {
  total: number;
  completed: number;
  inProgress: number;
}

export interface Achievements {
  badges: BadgeEarned[];
  milestones: BadgeMilestone[];
  streakRewards: {
    currentStreak: number;
    longestStreak: number;
    rewards: unknown[];
  };
  certificatesProgress: CertificatesProgress;
  totalPoints: number;
  badgesEarnedCount: number;
  badgesAvailableCount: number;
}

export interface ScorecardData {
  scorecardConfig?: ScorecardConfig;
  overview: StudentOverview;
  learningConsumption: LearningConsumption;
  performanceTrends?: PerformanceTrends;
  skills?: Skill[];
  weakAreas?: WeakAreas;
  assessmentPerformance?: AssessmentPerformance[];
  mockInterviewPerformance?: MockInterviewPerformance;
  behavioralMetrics?: BehavioralMetrics;
  comparativeInsights?: ComparativeInsights;
  achievements?: Achievements;
}
