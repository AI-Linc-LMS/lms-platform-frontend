// Scorecard Type Definitions

export type PerformanceLevel = "Beginner" | "Intermediate" | "Advanced" | "Interview-Ready";
export type SkillStrength = "Strong" | "Needs Attention";
export type StatusBadge = "Green" | "Amber" | "Red";

// Student Overview
export interface StudentOverview {
  studentName: string;
  programName: string;
  cohort: string;
  currentWeek: number;
  currentModule: string;
  overallPerformanceScore: number; // 0-100
  overallGrade: PerformanceLevel;
  totalTimeSpent: number; // in hours
  activeDaysStreak: number;
  completionPercentage: number; // 0-100
  statusBadge: StatusBadge;
}

// Learning Consumption Metrics
export interface VideoMetrics {
  totalAssigned: number;
  completed: number;
  averageWatchPercentage: number;
  rewatchCount: number;
  skippedVideos: string[];
}

export interface ArticleMetrics {
  totalAssigned: number;
  read: number;
  averageReadingTime: number; // in minutes
  expectedReadingTime: number; // in minutes
  markedAsHelpful: number;
}

export interface PracticeMetrics {
  mcqsAttempted: number;
  mcqsTotal: number;
  subjectiveSubmitted: number;
  subjectivePending: number;
  assessmentsAttempted: number;
  assessmentsMissed: number;
}

export interface LearningConsumption {
  videos: VideoMetrics;
  articles: ArticleMetrics;
  practice: PracticeMetrics;
}

// Performance Trends
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
  weeklyData: WeeklyPerformance[];
  skillWiseAccuracy: SkillAccuracy[];
}

// Skill Scorecard
export interface SkillBreakdown {
  mcqAccuracy: number;
  subjectiveScore: number;
  projectScore: number;
  interviewScore: number;
}

export interface Skill {
  id: string;
  name: string;
  proficiencyScore: number; // 0-100
  level: PerformanceLevel;
  strength: SkillStrength;
  confidenceScore: number; // 0-100
  breakdown: SkillBreakdown;
  category?: string;
}

// Weak Areas & Recommendations
export interface WeakArea {
  skillName: string;
  currentScore: number;
  threshold: number;
  recommendation: string;
}

export interface TopicIncorrect {
  topicName: string;
  incorrectCount: number;
  totalAttempts: number;
}

export interface Recommendation {
  type: "revise" | "mcq" | "video" | "interview";
  title: string;
  description: string;
  actionUrl?: string;
  priority: number;
}

export interface WeakAreas {
  skillsBelowThreshold: WeakArea[];
  topicsFrequentlyIncorrect: TopicIncorrect[];
  skippedQuestions: string[];
  recommendations: Recommendation[];
}

// Assessment Performance
export interface AssessmentPerformance {
  assessmentId: string;
  assessmentName: string;
  dateAttempted: string;
  score: number; // 0-100
  percentile?: number;
  rank?: number;
  timeTaken: number; // in minutes
  timeAllowed: number; // in minutes
  accuracy: number; // 0-100
  difficultyBreakdown: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  questionAnalytics: {
    correct: number;
    incorrect: number;
    skipped: number;
    averageTimePerQuestion: number; // in seconds
    negativeMarkImpact: number;
  };
}

// Mock Interview Performance
export interface InterviewParameter {
  name: string;
  score: number; // 0-100
}

export interface InterviewFeedback {
  strengths: string[];
  areasOfImprovement: string[];
  mentorComments: string;
  mentorRatings: {
    overall: number;
    technical: number;
    communication: number;
  };
}

export interface MockInterview {
  interviewId: string;
  date: string;
  overallScore: number; // 0-100
  parameters: InterviewParameter[];
  feedback: InterviewFeedback;
  playbackLink?: string;
}

export interface MockInterviewPerformance {
  totalInterviews: number;
  latestInterviewScore: number;
  interviewReadinessIndex: number; // 0-100
  improvementSinceFirst: number; // percentage
  interviews: MockInterview[];
}

// Behavioral Metrics
export interface LoginFrequency {
  week: string;
  loginCount: number;
}

export interface StudyTimeDistribution {
  day: string;
  hours: number;
}

export interface BehavioralMetrics {
  loginFrequency: LoginFrequency[];
  studyTimeDistribution: StudyTimeDistribution[];
  missedDeadlinesCount: number;
  lastActiveDate: string;
  consistencyScore: number; // 0-100
  activityCalendar: { [date: string]: number }; // date -> activity level (0-4)
}

// Comparative Insights
export interface BenchmarkComparison {
  metric: string;
  studentValue: number;
  batchAverage: number;
  top10Percent: number;
  interviewCleared: number;
}

export interface ComparativeInsights {
  comparisons: BenchmarkComparison[];
  percentileRank: number;
  vsBatchAverage: {
    better: number;
    worse: number;
    equal: number;
  };
}

// Achievements & Gamification
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedDate: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  completedDate: string;
  progress: number; // 0-100
}

export interface Achievement {
  badges: Badge[];
  milestones: Milestone[];
  skillUnlocks: string[];
  streakRewards: {
    currentStreak: number;
    longestStreak: number;
    rewards: string[];
  };
  certificatesProgress: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

// Action Panel
export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  priority: number;
  actionUrl?: string;
  type: "assessment" | "video" | "article" | "mcq" | "interview";
}

export interface RecommendedContent {
  id: string;
  title: string;
  type: "video" | "article" | "assessment";
  reason: string;
  url: string;
}

export interface PendingTask {
  id: string;
  title: string;
  dueDate?: string;
  type: "assignment" | "assessment" | "project";
  url: string;
}

export interface UpcomingAssessment {
  id: string;
  name: string;
  date: string;
  duration: number; // in minutes
  url: string;
}

export interface ActionPanel {
  priorityActions: PriorityAction[];
  recommendedContent: RecommendedContent[];
  pendingTasks: PendingTask[];
  upcomingAssessments: UpcomingAssessment[];
}

// Complete Scorecard Data
export interface ScorecardData {
  overview: StudentOverview;
  learningConsumption: LearningConsumption;
  performanceTrends: PerformanceTrends;
  skills: Skill[];
  weakAreas: WeakAreas;
  assessmentPerformance: AssessmentPerformance[];
  mockInterviewPerformance: MockInterviewPerformance;
  behavioralMetrics: BehavioralMetrics;
  comparativeInsights: ComparativeInsights;
  achievements: Achievement;
  actionPanel: ActionPanel;
}
