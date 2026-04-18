import type {
  ContentCompletionOverview,
  LearningConsumption,
  ScorecardData,
  StudentOverview,
} from "@/lib/types/scorecard.types";

export function mapOverviewFromApi(overview: Record<string, unknown>): StudentOverview {
  const mapped: StudentOverview = {
    studentName: (overview.student_name as string) ?? "",
    programName: (overview.program_name as string) ?? "—",
    cohort: (overview.cohort as string) ?? "—",
    currentWeek: Number(overview.current_week) ?? 1,
    currentModule: (overview.current_module as string) ?? "—",
    overallPerformanceScore: Number(overview.overall_performance_score) ?? 0,
    overallGrade: (overview.overall_grade as StudentOverview["overallGrade"]) ?? "Beginner",
    totalTimeSpentSeconds:
      Number(overview.total_time_spent_seconds) ??
      (Number(overview.total_time_spent) || 0) * 3600,
    totalDaysActive: Number(overview.total_days_active) ?? 0,
    activeDaysStreak: Number(overview.active_days_streak) ?? 0,
    completionPercentage: Number(overview.completion_percentage) ?? 0,
    statusBadge: (overview.status_badge as StudentOverview["statusBadge"]) ?? "Amber",
  };
  if (overview.current_course_name != null && overview.current_course_name !== "") {
    mapped.currentCourseName = overview.current_course_name as string;
  }
  const rawProgress = overview.course_progress as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(rawProgress) && rawProgress.length > 0) {
    mapped.courseProgress = rawProgress.map((p) => ({
      courseId: Number(p.course_id),
      courseName: (p.course_name as string) ?? "—",
      currentWeek: Number(p.current_week) ?? 1,
      currentModule: (p.current_module as string) ?? "—",
    }));
  }
  if (overview.daily_progress_percentage != null) {
    mapped.dailyProgressPercentage = Number(overview.daily_progress_percentage);
  }
  if (overview.daily_performance_score != null) {
    mapped.dailyPerformanceScore = Number(overview.daily_performance_score);
  } else if (overview.daily_performance_score === null) {
    mapped.dailyPerformanceScore = null;
  }
  if (typeof overview.grade_criteria === "string") {
    mapped.gradeCriteria = overview.grade_criteria;
  }
  if (typeof overview.status_criteria === "string") {
    mapped.statusCriteria = overview.status_criteria;
  }
  if (overview.profile_pic_url != null && overview.profile_pic_url !== "") {
    mapped.profilePicUrl = overview.profile_pic_url as string;
  }
  return mapped;
}

export function formatTimeSpent(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "0m";
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrUndefined(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapLearningConsumptionFromApi(api: Record<string, unknown>): LearningConsumption {
  const v = (api.videos as Record<string, unknown>) ?? {};
  const a = (api.articles as Record<string, unknown>) ?? {};
  const cp = (api.coding_problems as Record<string, unknown>) ?? {};
  const mi = (api.mock_interviews as Record<string, unknown>) ?? {};
  const p = (api.practice as Record<string, unknown>) ?? {};
  const overview = api.content_completion_overview as Record<string, unknown> | undefined;
  const byType = overview?.by_type as Record<string, { total?: unknown; completed?: unknown }> | undefined;

  const videos = {
    totalAssigned: num(v.total_assigned),
    completed: num(v.completed),
    averageWatchPercentage: num(v.average_watch_percentage),
    rewatchCount: num(v.rewatch_count),
    skippedVideos: Array.isArray(v.skipped_video_titles) ? (v.skipped_video_titles as string[]) : [],
    skippedCount: numOrUndefined(v.skipped_count),
    engagementCount: numOrUndefined(v.engagement_count),
  };

  const articles = {
    totalAssigned: num(a.total_assigned),
    read: num(a.read),
    averageReadingTime: num(a.average_reading_time_minutes),
    expectedReadingTime: num(a.expected_reading_time_minutes),
    typicalReadTimePerArticle: num(a.typical_read_time_per_article_minutes),
  };

  const codingProblems = {
    totalAssigned: num(cp.total_assigned),
    completed: num(cp.completed),
    submissionCount: num(cp.submission_count),
  };

  const mockInterviews = {
    totalAssigned: num(mi.total_assigned),
    completed: num(mi.completed),
    pendingCount: num(mi.pending_count),
    completionPercentage: num(mi.completion_percentage),
    averageScore: numOrNull(mi.average_score),
  };

  const practice = {
    mcqsAttempted: num(p.mcqs_attempted),
    mcqsTotal: num(p.mcqs_total),
    subjectiveSubmitted: num(p.subjective_submitted),
    subjectivePending: num(p.subjective_pending),
    assessmentsAttempted: num(p.assessments_attempted),
    assessmentsMissed: num(p.assessments_missed),
    totalAssessmentsPresent: numOrUndefined(p.total_assessments_present),
    totalQuizContents: numOrUndefined(p.total_quiz_contents),
    totalItems: numOrUndefined(p.total_items),
    assessmentsEngagementPercentage: numOrUndefined(p.assessments_engagement_percentage),
  };

  let contentCompletionOverview: ContentCompletionOverview | undefined;
  if (overview && typeof overview.total_present === "number" && typeof overview.total_completed === "number") {
    contentCompletionOverview = {
      totalPresent: Number(overview.total_present),
      totalCompleted: Number(overview.total_completed),
      byType: byType
        ? {
            videos: {
              total: num(byType.videos?.total),
              completed: num(byType.videos?.completed),
            },
            articles: {
              total: num(byType.articles?.total),
              completed: num(byType.articles?.completed),
            },
            quizzes: {
              total: num(byType.quizzes?.total),
              completed: num(byType.quizzes?.completed),
            },
            codingProblems: {
              total: num(byType.coding_problems?.total),
              completed: num(byType.coding_problems?.completed),
            },
            mockInterviews: {
              total: num(byType.mock_interviews?.total),
              completed: num(byType.mock_interviews?.completed),
            },
          }
        : undefined,
    };
  }

  const result: LearningConsumption = {
    videos,
    articles,
    codingProblems,
    mockInterviews,
    practice,
  };
  if (typeof api.total_content === "number") {
    result.totalContent = api.total_content;
  }
  if (contentCompletionOverview) {
    result.contentCompletionOverview = contentCompletionOverview;
  }
  return result;
}

export function getEmptyOverview(): StudentOverview {
  return {
    studentName: "",
    programName: "—",
    cohort: "—",
    currentWeek: 1,
    currentModule: "—",
    overallPerformanceScore: 0,
    overallGrade: "Beginner",
    totalTimeSpentSeconds: 0,
    totalDaysActive: 0,
    activeDaysStreak: 0,
    completionPercentage: 0,
    statusBadge: "Amber",
  };
}

export function getEmptyLearningConsumption(): LearningConsumption {
  return {
    videos: {
      totalAssigned: 0,
      completed: 0,
      averageWatchPercentage: 0,
      rewatchCount: 0,
      skippedVideos: [],
    },
    articles: {
      totalAssigned: 0,
      read: 0,
      averageReadingTime: 0,
      expectedReadingTime: 0,
      typicalReadTimePerArticle: 0,
    },
    codingProblems: {
      totalAssigned: 0,
      completed: 0,
      submissionCount: 0,
    },
    mockInterviews: {
      totalAssigned: 0,
      completed: 0,
      pendingCount: 0,
      completionPercentage: 0,
      averageScore: null,
    },
    practice: {
      mcqsAttempted: 0,
      mcqsTotal: 0,
      subjectiveSubmitted: 0,
      subjectivePending: 0,
      assessmentsAttempted: 0,
      assessmentsMissed: 0,
    },
  };
}

export function getEmptyScorecardData(): ScorecardData {
  return {
    overview: getEmptyOverview(),
    learningConsumption: getEmptyLearningConsumption(),
  };
}
