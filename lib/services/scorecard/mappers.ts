import type {
  Achievements,
  ActionPanel,
  AssessmentDifficultyBreakdown,
  AssessmentPerformance,
  BadgeEarned,
  BadgeMilestone,
  BehavioralMetrics,
  BenchmarkComparison,
  CertificatesProgress,
  ComparativeInsights,
  ContentCompletionOverview,
  InterviewParameter,
  LearningConsumption,
  MockInterview,
  MockInterviewPerformance,
  PendingTask,
  PerformanceTrends,
  PriorityAction,
  RecommendedContentItem,
  ScorecardData,
  Skill,
  SkillBreakdownItem,
  SkillBreakdownItems,
  StudentOverview,
  TopicIncorrect,
  UpcomingAssessment,
  WeakArea,
  WeakAreaRecommendation,
  WeakAreas,
  WeakAreaSourceContext,
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

export function mapPerformanceTrendsFromApi(api: unknown): PerformanceTrends {
  if (!api || typeof api !== "object") {
    return getEmptyPerformanceTrends();
  }
  const raw = api as Record<string, unknown>;
  const weeklyData = Array.isArray(raw.weekly_data)
    ? (raw.weekly_data as Record<string, unknown>[]).map((w) => ({
        week: num(w.week),
        weekLabel: (w.week_label as string) ?? "",
        mcqAccuracy: num(w.mcq_accuracy),
        subjectiveScore: num(w.subjective_score),
        assessmentScore: num(w.assessment_score),
        interviewScore: num(w.interview_score),
      }))
    : [];
  const skillWiseAccuracy = Array.isArray(raw.skill_wise_accuracy)
    ? (raw.skill_wise_accuracy as Record<string, unknown>[]).map((s) => ({
        skillName: (s.skill_name as string) ?? "",
        accuracy: num(s.accuracy),
        attemptCount: num(s.attempt_count),
        confidenceScore: num(s.confidence_score),
      }))
    : [];
  const granularity = raw.granularity;
  const allowed = new Set(["weekly", "bimonthly", "monthly"] as const);
  return {
    granularity: typeof granularity === "string" && allowed.has(granularity as "weekly")
      ? (granularity as "weekly" | "bimonthly" | "monthly")
      : "weekly",
    weeklyData,
    skillWiseAccuracy,
  };
}

export function getEmptyPerformanceTrends(): PerformanceTrends {
  return { granularity: "weekly", weeklyData: [], skillWiseAccuracy: [] };
}

function mapBreakdownItemList(raw: unknown): SkillBreakdownItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const o = x as Record<string, unknown>;
    return {
      name: (o.name as string) ?? (o.title as string) ?? "",
      score: o.score != null ? num(o.score) : undefined,
      courseName: (o.course_name as string) || undefined,
      moduleName: (o.module_name as string) || undefined,
      submoduleName: (o.submodule_name as string) || undefined,
    };
  });
}

function mapBreakdownItems(items: unknown): SkillBreakdownItems | undefined {
  if (!items || typeof items !== "object") return undefined;
  const raw = items as Record<string, unknown>;
  return {
    quiz: mapBreakdownItemList(raw.quiz),
    video: mapBreakdownItemList(raw.video),
    coding: mapBreakdownItemList(raw.coding),
    assessment: mapBreakdownItemList(raw.assessment),
    interview: mapBreakdownItemList(raw.interview),
    article: mapBreakdownItemList(raw.article),
    subjective: mapBreakdownItemList(raw.subjective),
  };
}

export function mapSkillsFromApi(apiSkills: unknown): Skill[] {
  if (!Array.isArray(apiSkills)) return [];
  return apiSkills.map((s, idx) => {
    const raw = s as Record<string, unknown>;
    const breakdown = (raw.breakdown as Record<string, unknown>) ?? {};
    const counts = (raw.breakdown_counts as Record<string, unknown>) ?? {};
    const id = raw.skill_id ?? raw.id ?? idx;
    const hasCounts =
      counts.quiz_count != null ||
      counts.video_count != null ||
      counts.coding_count != null ||
      counts.assessment_count != null ||
      counts.interview_count != null;
    return {
      id: typeof id === "number" || typeof id === "string" ? id : String(id),
      name: (raw.skill_name ?? raw.name ?? "") as string,
      category: (raw.category as string) || undefined,
      proficiencyScore: num(raw.proficiency),
      level: ((raw.level as Skill["level"]) ?? "Beginner") as Skill["level"],
      strength:
        ((raw.strength as Skill["strength"]) ?? "Needs Attention") as Skill["strength"],
      confidenceScore: num(raw.confidence),
      breakdown: {
        quizScore: num(breakdown.quiz_score),
        assessmentScore: num(breakdown.assessment_score),
        interviewScore: num(breakdown.interview_score),
        codingScore: num(breakdown.coding_score),
        videoScore: num(breakdown.video_score),
      },
      breakdownCounts: hasCounts
        ? {
            quizCount: num(counts.quiz_count),
            videoCount: num(counts.video_count),
            assessmentCount: num(counts.assessment_count),
            codingCount: num(counts.coding_count),
            interviewCount: num(counts.interview_count),
          }
        : undefined,
      breakdownItems: mapBreakdownItems(raw.breakdown_items),
    };
  });
}

function mapSourceContext(raw: unknown): WeakAreaSourceContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const ctx: WeakAreaSourceContext = {};
  if (typeof o.content_type === "string" && o.content_type) ctx.contentType = o.content_type;
  if (typeof o.item_name === "string" && o.item_name) ctx.itemName = o.item_name;
  if (typeof o.course_name === "string" && o.course_name) ctx.courseName = o.course_name;
  if (typeof o.module_name === "string" && o.module_name) ctx.moduleName = o.module_name;
  if (typeof o.submodule_name === "string" && o.submodule_name) ctx.submoduleName = o.submodule_name;
  // Return undefined when every field was blank, so the UI can short-circuit.
  return Object.keys(ctx).length ? ctx : undefined;
}

export function mapWeakAreasFromApi(api: unknown): WeakAreas {
  if (!api || typeof api !== "object") {
    return getEmptyWeakAreas();
  }
  const raw = api as Record<string, unknown>;
  const skillsBelowThreshold: WeakArea[] = Array.isArray(raw.skills_below_threshold)
    ? (raw.skills_below_threshold as Record<string, unknown>[]).map((s) => ({
        skillName: (s.skill_name as string) ?? "",
        currentScore: num(s.current_score),
        threshold: num(s.threshold),
        recommendation: (s.recommendation as string) ?? "",
        sourceContext: mapSourceContext(s.source_context),
      }))
    : [];
  const topicsFrequentlyIncorrect: TopicIncorrect[] = Array.isArray(raw.topics_frequently_incorrect)
    ? (raw.topics_frequently_incorrect as Record<string, unknown>[]).map((t) => ({
        topicName: (t.topic_name as string) ?? "",
        incorrectCount: num(t.incorrect_count),
        totalAttempts: num(t.total_attempts),
        sourceContext: mapSourceContext(t.source_context),
      }))
    : [];
  const skippedQuestions: string[] = Array.isArray(raw.skipped_questions)
    ? (raw.skipped_questions as unknown[])
        .filter((q): q is string => typeof q === "string" && q.length > 0)
    : [];
  const recommendations: WeakAreaRecommendation[] = Array.isArray(raw.recommendations)
    ? (raw.recommendations as Record<string, unknown>[]).map((r) => ({
        type: ((r.type as WeakAreaRecommendation["type"]) ?? "revise") as WeakAreaRecommendation["type"],
        title: (r.title as string) ?? "",
        description: (r.description as string) ?? "",
        actionUrl: (r.action_url as string) || undefined,
        priority: num(r.priority),
      }))
    : [];
  return {
    weakThreshold: num(raw.weak_threshold) || 60,
    skillsBelowThreshold,
    topicsFrequentlyIncorrect,
    skippedQuestions,
    recommendations,
  };
}

function mapDifficultyBucket(raw: unknown): { correct: number; total: number } {
  if (!raw || typeof raw !== "object") return { correct: 0, total: 0 };
  const o = raw as Record<string, unknown>;
  return { correct: num(o.correct), total: num(o.total) };
}

function mapDifficultyBreakdown(raw: unknown): AssessmentDifficultyBreakdown {
  if (!raw || typeof raw !== "object") {
    return {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    easy: mapDifficultyBucket(o.easy),
    medium: mapDifficultyBucket(o.medium),
    hard: mapDifficultyBucket(o.hard),
  };
}

export function mapAssessmentPerformanceFromApi(api: unknown): AssessmentPerformance[] {
  if (!Array.isArray(api)) return [];
  return api.map((row) => {
    const r = row as Record<string, unknown>;
    const analytics = (r.question_analytics as Record<string, unknown>) ?? {};
    const score = r.score == null ? null : num(r.score);
    return {
      assessmentId: String(r.assessment_id ?? ""),
      assessmentName: (r.assessment_name as string) ?? "Assessment",
      dateAttempted: (r.date_attempted as string) || null,
      score,
      rawScore: r.raw_score == null ? null : num(r.raw_score),
      maximumMarks: num(r.maximum_marks),
      percentile: r.percentile == null ? null : num(r.percentile),
      rank: r.rank == null ? null : num(r.rank),
      cohortCount: num(r.cohort_count),
      timeTaken: num(r.time_taken),
      timeAllowed: num(r.time_allowed),
      accuracy: num(r.accuracy),
      difficultyBreakdown: mapDifficultyBreakdown(r.difficulty_breakdown),
      questionAnalytics: {
        correct: num(analytics.correct),
        incorrect: num(analytics.incorrect),
        skipped: num(analytics.skipped),
        averageTimePerQuestion: num(analytics.average_time_per_question),
        negativeMarkImpact: num(analytics.negative_mark_impact),
      },
      reviewStatus: (r.review_status as string) || undefined,
    };
  });
}

function mapInterviewParameters(raw: unknown): InterviewParameter[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      const o = p as Record<string, unknown>;
      const name = (o.name as string) ?? "";
      const score = num(o.score);
      return name ? { name, score } : null;
    })
    .filter((x): x is InterviewParameter => x !== null);
}

function mapInterview(raw: unknown): MockInterview {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const feedbackRaw = (o.feedback as Record<string, unknown>) ?? {};
  const ratingsRaw = (feedbackRaw.mentor_ratings as Record<string, unknown>) ?? {};
  return {
    interviewId: String(o.interview_id ?? ""),
    title: (o.title as string) ?? "Mock interview",
    topic: (o.topic as string) || undefined,
    subtopic: (o.subtopic as string) || undefined,
    difficulty: (o.difficulty as string) || undefined,
    date: (o.date as string) || null,
    overallScore: o.overall_score == null ? null : num(o.overall_score),
    parameters: mapInterviewParameters(o.parameters),
    feedback: {
      strengths: Array.isArray(feedbackRaw.strengths)
        ? (feedbackRaw.strengths as unknown[]).filter((s): s is string => typeof s === "string")
        : [],
      areasOfImprovement: Array.isArray(feedbackRaw.areas_of_improvement)
        ? (feedbackRaw.areas_of_improvement as unknown[]).filter((s): s is string => typeof s === "string")
        : [],
      mentorComments: (feedbackRaw.mentor_comments as string) ?? "",
      mentorRatings: {
        overall: num(ratingsRaw.overall),
        technical: num(ratingsRaw.technical),
        communication: num(ratingsRaw.communication),
      },
    },
    playbackLink: (o.playback_link as string) || null,
  };
}

export function mapMockInterviewPerformanceFromApi(api: unknown): MockInterviewPerformance {
  if (!api || typeof api !== "object") {
    return getEmptyMockInterviewPerformance();
  }
  const raw = api as Record<string, unknown>;
  const interviews = Array.isArray(raw.interviews)
    ? (raw.interviews as unknown[]).map(mapInterview)
    : [];
  return {
    totalInterviews: num(raw.total_interviews),
    latestInterviewScore: num(raw.latest_interview_score),
    interviewReadinessIndex: num(raw.interview_readiness_index),
    improvementSinceFirst: num(raw.improvement_since_first),
    interviews,
  };
}

export function mapBehavioralMetricsFromApi(api: unknown): BehavioralMetrics {
  if (!api || typeof api !== "object") {
    return getEmptyBehavioralMetrics();
  }
  const raw = api as Record<string, unknown>;
  const loginFrequency = Array.isArray(raw.login_frequency)
    ? (raw.login_frequency as Record<string, unknown>[]).map((r) => ({
        week: (r.week as string) ?? "",
        loginCount: num(r.login_count),
      }))
    : [];
  const studyTimeByWeek = Array.isArray(raw.study_time_by_week)
    ? (raw.study_time_by_week as Record<string, unknown>[]).map((r) => ({
        week: (r.week as string) ?? "",
        hours: num(r.hours),
      }))
    : [];
  const studyTimeDistribution = Array.isArray(raw.study_time_distribution)
    ? (raw.study_time_distribution as Record<string, unknown>[]).map((r) => ({
        day: (r.day as string) ?? "",
        hours: num(r.hours),
      }))
    : [];
  const activityCalendarRaw =
    raw.activity_calendar && typeof raw.activity_calendar === "object"
      ? (raw.activity_calendar as Record<string, unknown>)
      : {};
  const activityCalendar: Record<string, number> = {};
  for (const [key, value] of Object.entries(activityCalendarRaw)) {
    activityCalendar[key] = num(value);
  }
  return {
    loginFrequency,
    studyTimeByWeek,
    studyTimeDistribution,
    missedDeadlinesCount: num(raw.missed_deadlines_count),
    lastActiveDate: (raw.last_active_date as string) || null,
    consistencyScore: num(raw.consistency_score),
    activityCalendar,
  };
}

export function mapComparativeInsightsFromApi(api: unknown): ComparativeInsights {
  if (!api || typeof api !== "object") {
    return getEmptyComparativeInsights();
  }
  const raw = api as Record<string, unknown>;
  const comparisons: BenchmarkComparison[] = Array.isArray(raw.comparisons)
    ? (raw.comparisons as Record<string, unknown>[]).map((c) => ({
        metric: (c.metric as string) ?? "",
        label: (c.label as string) ?? "",
        unit: ((c.unit as string) ?? "percent") as BenchmarkComparison["unit"],
        studentValue: num(c.student_value),
        batchAverage: c.batch_average == null ? null : num(c.batch_average),
        top10Percent: c.top_10_percent == null ? null : num(c.top_10_percent),
        percentile: num(c.percentile),
      }))
    : [];
  const vsRaw = (raw.vs_batch_average as Record<string, unknown>) ?? {};
  return {
    cohortSize: num(raw.cohort_size),
    percentileRank: num(raw.percentile_rank),
    vsBatchAverage: {
      better: num(vsRaw.better),
      worse: num(vsRaw.worse),
      equal: num(vsRaw.equal),
    },
    comparisons,
  };
}

export function mapAchievementsFromApi(api: unknown): Achievements {
  if (!api || typeof api !== "object") {
    return getEmptyAchievements();
  }
  const raw = api as Record<string, unknown>;

  const badges: BadgeEarned[] = Array.isArray(raw.badges)
    ? (raw.badges as Record<string, unknown>[]).map((b) => ({
        id: String(b.id ?? ""),
        name: (b.name as string) ?? "",
        description: (b.description as string) ?? "",
        iconSlug: (b.icon_slug as string) || "mdi:trophy-outline",
        earnedDate: (b.earned_date as string) || null,
        points: num(b.points),
        snapshotValue: (b.snapshot_value as string) ?? "",
      }))
    : [];

  const milestones: BadgeMilestone[] = Array.isArray(raw.milestones)
    ? (raw.milestones as Record<string, unknown>[]).map((m) => ({
        id: String(m.id ?? ""),
        name: (m.name as string) ?? "",
        description: (m.description as string) ?? "",
        iconSlug: (m.icon_slug as string) || "mdi:flag-outline",
        progress: num(m.progress),
      }))
    : [];

  const streakRaw = (raw.streak_rewards as Record<string, unknown>) ?? {};
  const certsRaw = (raw.certificates_progress as Record<string, unknown>) ?? {};
  const certificatesProgress: CertificatesProgress = {
    total: num(certsRaw.total),
    completed: num(certsRaw.completed),
    inProgress: num(certsRaw.in_progress),
  };

  return {
    badges,
    milestones,
    streakRewards: {
      currentStreak: num(streakRaw.current_streak),
      longestStreak: num(streakRaw.longest_streak),
      rewards: Array.isArray(streakRaw.rewards) ? (streakRaw.rewards as unknown[]) : [],
    },
    certificatesProgress,
    totalPoints: num(raw.total_points),
    badgesEarnedCount: num(raw.badges_earned_count),
    badgesAvailableCount: num(raw.badges_available_count),
  };
}

export function mapActionPanelFromApi(api: unknown): ActionPanel {
  if (!api || typeof api !== "object") {
    return getEmptyActionPanel();
  }
  const raw = api as Record<string, unknown>;

  const priorityActions: PriorityAction[] = Array.isArray(raw.priority_actions)
    ? (raw.priority_actions as Record<string, unknown>[]).map((p) => ({
        id: String(p.id ?? ""),
        title: (p.title as string) ?? "",
        description: (p.description as string) ?? "",
        priority: num(p.priority),
        type: ((p.type as PriorityAction["type"]) ?? "mcq") as PriorityAction["type"],
        actionUrl: (p.action_url as string) || null,
      }))
    : [];

  const recommendedContent: RecommendedContentItem[] = Array.isArray(raw.recommended_content)
    ? (raw.recommended_content as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        title: (r.title as string) ?? "",
        type: (r.type as string) ?? "",
        reason: (r.reason as string) ?? "",
        url: (r.url as string) || null,
      }))
    : [];

  const pendingTasks: PendingTask[] = Array.isArray(raw.pending_tasks)
    ? (raw.pending_tasks as Record<string, unknown>[]).map((t) => ({
        id: String(t.id ?? ""),
        title: (t.title as string) ?? "",
        dueDate: (t.due_date as string) || null,
        type: (t.type as string) ?? "",
        url: (t.url as string) || null,
      }))
    : [];

  const upcomingAssessments: UpcomingAssessment[] = Array.isArray(raw.upcoming_assessments)
    ? (raw.upcoming_assessments as Record<string, unknown>[]).map((u) => ({
        id: String(u.id ?? ""),
        name: (u.name as string) ?? "",
        date: (u.date as string) || null,
        duration: num(u.duration),
        url: (u.url as string) || null,
      }))
    : [];

  return { priorityActions, recommendedContent, pendingTasks, upcomingAssessments };
}

export function getEmptyActionPanel(): ActionPanel {
  return {
    priorityActions: [],
    recommendedContent: [],
    pendingTasks: [],
    upcomingAssessments: [],
  };
}

export function getEmptyAchievements(): Achievements {
  return {
    badges: [],
    milestones: [],
    streakRewards: { currentStreak: 0, longestStreak: 0, rewards: [] },
    certificatesProgress: { total: 0, completed: 0, inProgress: 0 },
    totalPoints: 0,
    badgesEarnedCount: 0,
    badgesAvailableCount: 0,
  };
}

export function getEmptyComparativeInsights(): ComparativeInsights {
  return {
    cohortSize: 1,
    percentileRank: 0,
    vsBatchAverage: { better: 0, worse: 0, equal: 0 },
    comparisons: [],
  };
}

export function getEmptyBehavioralMetrics(): BehavioralMetrics {
  return {
    loginFrequency: [],
    studyTimeByWeek: [],
    studyTimeDistribution: [],
    missedDeadlinesCount: 0,
    lastActiveDate: null,
    consistencyScore: 0,
    activityCalendar: {},
  };
}

export function getEmptyMockInterviewPerformance(): MockInterviewPerformance {
  return {
    totalInterviews: 0,
    latestInterviewScore: 0,
    interviewReadinessIndex: 0,
    improvementSinceFirst: 0,
    interviews: [],
  };
}

export function getEmptyWeakAreas(): WeakAreas {
  return {
    weakThreshold: 60,
    skillsBelowThreshold: [],
    topicsFrequentlyIncorrect: [],
    skippedQuestions: [],
    recommendations: [],
  };
}

export function getEmptyScorecardData(): ScorecardData {
  return {
    overview: getEmptyOverview(),
    learningConsumption: getEmptyLearningConsumption(),
  };
}
