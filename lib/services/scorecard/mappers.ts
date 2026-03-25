import {
  Achievement,
  ActionPanel,
  AssessmentPerformance,
  BehavioralMetrics,
  ComparativeInsights,
  ContentCompletionOverview,
  LearningConsumption,
  MockInterviewPerformance,
  PerformanceTrends,
  Recommendation,
  ScorecardData,
  Skill,
  StudentOverview,
  TopicIncorrect,
  WeakArea,
  WeakAreas,
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

/** Format cumulative seconds as "Xh Ym" (e.g. 3661 → "1h 1m") */
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

export function mapLearningConsumptionFromApi(api: Record<string, unknown>): LearningConsumption {
  const v = (api.videos as Record<string, unknown>) ?? {};
  const a = (api.articles as Record<string, unknown>) ?? {};
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
    markedAsHelpful: num(a.marked_as_helpful),
    efficiencyPercentage: numOrUndefined(a.efficiency_percentage),
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
          }
        : undefined,
    };
  }

  const result: LearningConsumption = {
    videos,
    articles,
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

// Map backend snake_case performance_trends to frontend PerformanceTrends type (exported for admin scorecard)
export function mapPerformanceTrendsFromApi(api: unknown): PerformanceTrends {
  if (!api || typeof api !== "object") {
    return { weeklyData: [], skillWiseAccuracy: [] };
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
  return { weeklyData, skillWiseAccuracy };
}

// Map backend snake_case skills to frontend Skill type (exported for admin scorecard)
export function mapSkillsFromApi(apiSkills: unknown[]): Skill[] {
  if (!Array.isArray(apiSkills)) return [];
  return apiSkills.map((s, idx) => {
    const raw = s as Record<string, unknown>;
    const breakdown = (raw.breakdown as Record<string, unknown>) ?? {};
    const counts = (raw.breakdown_counts as Record<string, unknown>) ?? {};
    const id = raw.skill_id ?? raw.id ?? idx;
    return {
      id: typeof id === "number" || typeof id === "string" ? id : String(id),
      name: (raw.skill_name ?? raw.name ?? "") as string,
      proficiencyScore: num(raw.proficiency),
      level: (raw.level ?? "Beginner") as Skill["level"],
      strength: (raw.strength ?? "Needs Attention") as Skill["strength"],
      confidenceScore: num(raw.confidence),
      breakdown: {
        quizScore: num(breakdown.quiz_score),
        assessmentScore: num(breakdown.assessment_score),
        interviewScore: num(breakdown.interview_score),
        codingScore: num(breakdown.coding_score),
        videoScore: num(breakdown.video_score),
      },
      breakdownCounts:
        counts.quiz_count != null || counts.video_count != null
          ? {
              quizCount: num(counts.quiz_count),
              videoCount: num(counts.video_count),
              assessmentCount: num(counts.assessment_count),
              codingCount: num(counts.coding_count),
              interviewCount: num(counts.interview_count),
            }
          : undefined,
      breakdownItems: mapBreakdownItems(raw.breakdown_items),
      category: raw.category as string | undefined,
    };
  });
}

function mapBreakdownItems(items: unknown): Skill["breakdownItems"] | undefined {
  if (!items || typeof items !== "object") return undefined;
  const raw = items as Record<string, unknown>;
  const mapList = (arr: unknown) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        name: (o.name as string) ?? "",
        score: o.score != null ? num(o.score) : undefined,
        courseName: (o.course_name as string) || undefined,
        moduleName: (o.module_name as string) || undefined,
        submoduleName: (o.submodule_name as string) || undefined,
      };
    });
  };
  return {
    quiz: mapList(raw.quiz),
    video: mapList(raw.video),
    coding: mapList(raw.coding),
    assessment: mapList(raw.assessment),
    interview: mapList(raw.interview),
    article: mapList(raw.article),
  };
}

// Map backend assessment_performance (snake_case) to frontend AssessmentPerformance (camelCase)
export function mapAssessmentPerformanceFromApi(apiList: unknown[]): AssessmentPerformance[] {
  if (!Array.isArray(apiList)) return [];
  return apiList.map((item) => {
    const raw = item as Record<string, unknown>;
    const diff = (raw.difficulty_breakdown as Record<string, { correct: number; total: number }>) ?? {};
    const qa = (raw.question_analytics as Record<string, unknown>) ?? {};
    return {
      assessmentId: (raw.assessment_id as string) ?? "",
      assessmentName: (raw.assessment_name as string) ?? "",
      dateAttempted: (raw.date_attempted as string) ?? "",
      score: num(raw.score),
      percentile: raw.percentile != null ? num(raw.percentile) : undefined,
      rank: raw.rank != null ? num(raw.rank) : undefined,
      timeTaken: num(raw.time_taken_minutes),
      timeAllowed: num(raw.total_time_minutes),
      accuracy: num(raw.accuracy_percent),
      difficultyBreakdown: {
        easy: diff.easy ?? { correct: 0, total: 0 },
        medium: diff.medium ?? { correct: 0, total: 0 },
        hard: diff.hard ?? { correct: 0, total: 0 },
      },
      questionAnalytics: {
        correct: num(qa.correct),
        incorrect: num(qa.incorrect),
        skipped: num(qa.skipped),
        averageTimePerQuestion: num(qa.average_time_per_question),
        negativeMarkImpact: num(qa.negative_mark_impact),
      },
    };
  });
}

// Map backend weak_areas (snake_case) to frontend WeakAreas (camelCase) (exported for admin scorecard)
export function mapWeakAreasFromApi(api: unknown): WeakAreas {
  if (!api || typeof api !== "object") return getEmptyWeakAreas();
  const raw = api as Record<string, unknown>;
  const mapSourceContext = (sc: unknown): WeakArea["sourceContext"] | undefined => {
    if (!sc || typeof sc !== "object") return undefined;
    const s = sc as Record<string, unknown>;
    const course = (s.course_name as string) ?? "";
    const module = (s.module_name as string) ?? "";
    const submodule = (s.submodule_name as string) ?? "";
    if (!course && !module && !submodule) return undefined;
    return {
      contentType: (s.content_type as string) || undefined,
      itemName: (s.item_name as string) || undefined,
      courseName: course || undefined,
      moduleName: module || undefined,
      submoduleName: submodule || undefined,
    };
  };
  const mapSkill = (s: unknown): WeakArea => {
    const o = (s as Record<string, unknown>) ?? {};
    const skill: WeakArea = {
      skillName: (o.skill_name as string) ?? "",
      currentScore: num(o.current_score),
      threshold: num(o.threshold),
      recommendation: (o.recommendation as string) ?? "",
    };
    const src = mapSourceContext(o.source_context);
    if (src) skill.sourceContext = src;
    return skill;
  };
  const mapTopic = (t: unknown): TopicIncorrect => {
    const o = (t as Record<string, unknown>) ?? {};
    const topic: TopicIncorrect = {
      topicName: (o.topic_name as string) ?? "",
      incorrectCount: num(o.incorrect_count),
      totalAttempts: num(o.total_attempts),
    };
    const src = mapSourceContext(o.source_context);
    if (src) topic.sourceContext = src;
    return topic;
  };
  const mapRec = (r: unknown): Recommendation => {
    const o = (r as Record<string, unknown>) ?? {};
    return {
      type: (o.type as Recommendation["type"]) ?? "revise",
      title: (o.title as string) ?? "",
      description: (o.description as string) ?? "",
      actionUrl: (o.action_url as string) || undefined,
      priority: num(o.priority),
    };
  };
  const skillsRaw = Array.isArray(raw.skills_below_threshold) ? raw.skills_below_threshold : [];
  const topicsRaw = Array.isArray(raw.topics_frequently_incorrect) ? raw.topics_frequently_incorrect : [];
  const skippedRaw = Array.isArray(raw.skipped_questions) ? raw.skipped_questions : [];
  const recsRaw = Array.isArray(raw.recommendations) ? raw.recommendations : [];
  return {
    skillsBelowThreshold: skillsRaw.map(mapSkill),
    topicsFrequentlyIncorrect: topicsRaw.map(mapTopic),
    skippedQuestions: skippedRaw.map((x) => String(x ?? "")),
    recommendations: recsRaw.map(mapRec),
  };
}

export function getEmptyWeakAreas(): WeakAreas {
  return {
    skillsBelowThreshold: [],
    topicsFrequentlyIncorrect: [],
    skippedQuestions: [],
    recommendations: [],
  };
}

// Map backend mock_interview_performance (snake_case) to frontend MockInterviewPerformance (camelCase)
export function mapMockInterviewPerformanceFromApi(api: unknown): MockInterviewPerformance {
  if (!api || typeof api !== "object") return getEmptyMockInterviewPerformance();
  const raw = api as Record<string, unknown>;
  const interviewsRaw = Array.isArray(raw.interviews) ? raw.interviews : [];
  const interviews = interviewsRaw.map((item) => {
    const i = item as Record<string, unknown>;
    const fb = (i.feedback as Record<string, unknown>) ?? {};
    const ratings = (fb.mentor_ratings as Record<string, unknown>) ?? {};
    return {
      interviewId: (i.interview_id as string) ?? String(i.id ?? ""),
      date: (i.date as string) ?? "",
      overallScore: num(i.overall_score),
      parameters: Array.isArray(i.parameters)
        ? (i.parameters as Array<{ name: string; score: number }>).map((p) => ({
            name: p.name ?? "",
            score: num(p.score),
          }))
        : [],
      feedback: {
        strengths: Array.isArray(fb.strengths) ? (fb.strengths as string[]) : [],
        areasOfImprovement: Array.isArray(fb.areas_of_improvement)
          ? (fb.areas_of_improvement as string[])
          : [],
        mentorComments: (fb.mentor_comments as string) ?? "",
        mentorRatings: {
          overall: num(ratings.overall),
          technical: num(ratings.technical),
          communication: num(ratings.communication),
        },
      },
      playbackLink: (i.playback_link as string) || undefined,
    };
  });
  return {
    totalInterviews: num(raw.total_interviews),
    latestInterviewScore: num(raw.latest_interview_score),
    interviewReadinessIndex: num(raw.interview_readiness_index),
    improvementSinceFirst: num(raw.improvement_since_first),
    interviews,
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

// Map backend behavioral_metrics (snake_case) to frontend BehavioralMetrics (camelCase)
export function mapBehavioralMetricsFromApi(api: unknown): BehavioralMetrics {
  if (!api || typeof api !== "object") return getEmptyBehavioralMetrics();
  const raw = api as Record<string, unknown>;
  const loginRaw = Array.isArray(raw.login_frequency) ? raw.login_frequency : [];
  const studyByWeekRaw = Array.isArray(raw.study_time_by_week) ? raw.study_time_by_week : [];
  const studyRaw = Array.isArray(raw.study_time_distribution) ? raw.study_time_distribution : [];
  const calendar = raw.activity_calendar;
  return {
    missedDeadlinesCount: num(raw.missed_deadlines_count),
    lastActiveDate: (raw.last_active_date as string) ?? new Date().toISOString().split("T")[0],
    consistencyScore: num(raw.consistency_score),
    loginFrequency: loginRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        week: (i.week as string) ?? "",
        loginCount: num(i.login_count),
      };
    }),
    studyTimeByWeek: studyByWeekRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        week: (i.week as string) ?? "",
        hours: num(i.hours),
      };
    }),
    studyTimeDistribution: studyRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        day: (i.day as string) ?? "",
        hours: num(i.hours),
      };
    }),
    activityCalendar: calendar && typeof calendar === "object" ? (calendar as Record<string, number>) : {},
  };
}

export function getEmptyBehavioralMetrics(): BehavioralMetrics {
  return {
    missedDeadlinesCount: 0,
    lastActiveDate: "",
    consistencyScore: 0,
    loginFrequency: [],
    studyTimeByWeek: [],
    studyTimeDistribution: [],
    activityCalendar: {},
  };
}

export function mapComparativeInsightsFromApi(api: unknown): ComparativeInsights {
  if (!api || typeof api !== "object") return getEmptyComparativeInsights();
  const raw = api as Record<string, unknown>;
  const comparisonsRaw = Array.isArray(raw.comparisons) ? raw.comparisons : [];
  const vsRaw = raw.vs_batch_average;
  const vs =
    vsRaw && typeof vsRaw === "object"
      ? (vsRaw as Record<string, unknown>)
      : { better: 0, worse: 0, equal: 0 };
  const comparisons = comparisonsRaw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((i) => ({
      metric: (i.metric as string) ?? "",
      studentValue: num(i.student_value),
      batchAverage: num(i.batch_average),
      top10Percent: num(i.top_10_percent),
    }));
  return {
    percentileRank: num(raw.percentile_rank),
    comparisons,
    vsBatchAverage: {
      better: num(vs.better),
      worse: num(vs.worse),
      equal: num(vs.equal),
    },
  };
}

export function getEmptyComparativeInsights(): ComparativeInsights {
  return {
    comparisons: [],
    percentileRank: 0,
    vsBatchAverage: { better: 0, worse: 0, equal: 0 },
  };
}

export function mapActionPanelFromApi(api: unknown): ActionPanel {
  if (!api || typeof api !== "object") return getEmptyActionPanel();
  const raw = api as Record<string, unknown>;
  const paRaw = Array.isArray(raw.priority_actions) ? raw.priority_actions : [];
  const rcRaw = Array.isArray(raw.recommended_content) ? raw.recommended_content : [];
  const ptRaw = Array.isArray(raw.pending_tasks) ? raw.pending_tasks : [];
  const uaRaw = Array.isArray(raw.upcoming_assessments) ? raw.upcoming_assessments : [];
  return {
    priorityActions: paRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        id: (i.id as string) ?? "",
        title: (i.title as string) ?? "",
        description: (i.description as string) ?? "",
        priority: num(i.priority),
        actionUrl: (i.action_url as string) ?? undefined,
        type: (i.type as "assessment" | "video" | "article" | "mcq" | "interview") ?? "video",
      };
    }),
    recommendedContent: rcRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        id: (i.id as string) ?? "",
        title: (i.title as string) ?? "",
        type: (i.type as "video" | "article" | "assessment") ?? "video",
        reason: (i.reason as string) ?? "",
        url: (i.url as string) ?? "",
      };
    }),
    pendingTasks: ptRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        id: (i.id as string) ?? "",
        title: (i.title as string) ?? "",
        dueDate: (i.due_date as string) ?? undefined,
        type: (i.type as "assignment" | "assessment" | "project") ?? "assignment",
        url: (i.url as string) ?? "",
      };
    }),
    upcomingAssessments: uaRaw.map((item) => {
      const i = item as Record<string, unknown>;
      return {
        id: (i.id as string) ?? "",
        name: (i.name as string) ?? "",
        date: (i.date as string) ?? "",
        duration: num(i.duration),
        url: (i.url as string) ?? "",
      };
    }),
  };
}

export function getEmptyAchievements(): Achievement {
  return {
    badges: [],
    milestones: [],
    streakRewards: {
      currentStreak: 0,
      longestStreak: 0,
      rewards: [],
    },
    certificatesProgress: {
      total: 0,
      completed: 0,
      inProgress: 0,
    },
  };
}

export function mapAchievementsFromApi(api: unknown): Achievement {
  if (!api || typeof api !== "object") return getEmptyAchievements();
  const raw = api as Record<string, unknown>;
  const badgesRaw = Array.isArray(raw.badges) ? raw.badges : [];
  const milestonesRaw = Array.isArray(raw.milestones) ? raw.milestones : [];
  const streakRaw = raw.streak_rewards as Record<string, unknown> | undefined;
  const certRaw = raw.certificates_progress as Record<string, unknown> | undefined;

  const badges =
    badgesRaw.length > 0
      ? badgesRaw
          .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
          .map((b) => ({
            id: (b.id as string) ?? "",
            name: (b.name as string) ?? "",
            description: (b.description as string) ?? "",
            iconUrl: (b.icon_url as string) ?? undefined,
            iconSlug: (b.icon_slug as string) ?? undefined,
            earnedDate: (b.earned_date as string) ?? undefined,
          }))
      : [];

  const milestones =
    milestonesRaw.length > 0
      ? milestonesRaw
          .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
          .map((m) => ({
            id: (m.id as string) ?? "",
            name: (m.name as string) ?? "",
            description: (m.description as string) ?? "",
            completedDate: (m.completed_date as string) ?? undefined,
            progress: num(m.progress),
          }))
      : [];

  const streakRewards = {
    currentStreak: num(streakRaw?.current_streak),
    longestStreak: num(streakRaw?.longest_streak),
    rewards: Array.isArray(streakRaw?.rewards)
      ? (streakRaw.rewards as string[]).filter((r): r is string => typeof r === "string")
      : [],
  };

  const certificatesProgress = {
    total: num(certRaw?.total),
    completed: num(certRaw?.completed),
    inProgress: num(certRaw?.in_progress),
  };

  return {
    badges,
    milestones,
    streakRewards,
    certificatesProgress,
  };
}

export function getEmptyActionPanel(): ActionPanel {
  return {
    priorityActions: [],
    recommendedContent: [],
    pendingTasks: [],
    upcomingAssessments: [],
  };
}

// Empty/minimal data for Module 1 (Student Overview) and Module 2 (Learning Consumption) when API has no data (exported for admin scorecard)
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
      markedAsHelpful: 0,
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

/** Empty scorecard structure (API-only; no mock data). Used as base before mapping API response. */
export function getEmptyScorecardData(): ScorecardData {
  return {
    overview: getEmptyOverview(),
    learningConsumption: getEmptyLearningConsumption(),
    performanceTrends: { weeklyData: [], skillWiseAccuracy: [] },
    skills: [],
    weakAreas: getEmptyWeakAreas(),
    assessmentPerformance: [],
    mockInterviewPerformance: getEmptyMockInterviewPerformance(),
    behavioralMetrics: getEmptyBehavioralMetrics(),
    comparativeInsights: getEmptyComparativeInsights(),
    achievements: getEmptyAchievements(),
    actionPanel: getEmptyActionPanel(),
  };
}
