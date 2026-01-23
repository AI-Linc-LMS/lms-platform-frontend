import { ScorecardData } from "@/lib/types/scorecard.types";

// Mock data service for scorecard
// This will be replaced with actual API calls when backend is ready

const generateMockScorecardData = (): ScorecardData => {
  // Generate 12 weeks of weekly performance data
  const weeklyData = Array.from({ length: 12 }, (_, i) => ({
    week: i + 1,
    weekLabel: `Week ${i + 1}`,
    mcqAccuracy: Math.floor(Math.random() * 30) + 60, // 60-90
    subjectiveScore: Math.floor(Math.random() * 30) + 65, // 65-95
    assessmentScore: Math.floor(Math.random() * 25) + 70, // 70-95
    interviewScore: i < 3 ? 0 : Math.floor(Math.random() * 20) + 75, // 75-95 after week 3
  }));

  // Generate skills data
  const skillNames = [
    "React",
    "JavaScript",
    "Node.js",
    "SQL",
    "Python",
    "Communication",
    "Problem Solving",
    "Data Structures",
    "Algorithms",
    "System Design",
  ];

  const skills = skillNames.map((name, index) => {
    const proficiencyScore = Math.floor(Math.random() * 40) + 50; // 50-90
    const level =
      proficiencyScore >= 80
        ? "Advanced"
        : proficiencyScore >= 65
        ? "Intermediate"
        : "Beginner";
    const strength = proficiencyScore >= 70 ? "Strong" : "Needs Attention";

    return {
      id: `skill-${index + 1}`,
      name,
      proficiencyScore,
      level: level as any,
      strength: strength as any,
      confidenceScore: Math.floor(Math.random() * 30) + 60,
      breakdown: {
        mcqAccuracy: Math.floor(Math.random() * 30) + 60,
        subjectiveScore: Math.floor(Math.random() * 30) + 65,
        projectScore: Math.floor(Math.random() * 25) + 70,
        interviewScore: Math.floor(Math.random() * 20) + 75,
      },
      category: index < 5 ? "Technical" : "Soft Skills",
    };
  });

  // Generate assessment performance data
  const assessments = Array.from({ length: 8 }, (_, i) => ({
    assessmentId: `assessment-${i + 1}`,
    assessmentName: `Assessment ${i + 1}`,
    dateAttempted: new Date(
      Date.now() - (7 - i) * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    score: Math.floor(Math.random() * 30) + 65,
    percentile: Math.floor(Math.random() * 40) + 50,
    rank: Math.floor(Math.random() * 100) + 1,
    timeTaken: Math.floor(Math.random() * 30) + 45,
    timeAllowed: 60,
    accuracy: Math.floor(Math.random() * 25) + 70,
    difficultyBreakdown: {
      easy: {
        correct: Math.floor(Math.random() * 5) + 8,
        total: 10,
      },
      medium: {
        correct: Math.floor(Math.random() * 5) + 6,
        total: 10,
      },
      hard: {
        correct: Math.floor(Math.random() * 4) + 4,
        total: 8,
      },
    },
    questionAnalytics: {
      correct: Math.floor(Math.random() * 10) + 18,
      incorrect: Math.floor(Math.random() * 5) + 3,
      skipped: Math.floor(Math.random() * 3) + 1,
      averageTimePerQuestion: Math.floor(Math.random() * 30) + 90,
      negativeMarkImpact: Math.floor(Math.random() * 5),
    },
  }));

  // Generate mock interview data
  const mockInterviews = Array.from({ length: 5 }, (_, i) => ({
    interviewId: `interview-${i + 1}`,
    date: new Date(
      Date.now() - (4 - i) * 14 * 24 * 60 * 60 * 1000
    ).toISOString(),
    overallScore: Math.floor(Math.random() * 20) + 75,
    parameters: [
      { name: "Communication Clarity", score: Math.floor(Math.random() * 20) + 75 },
      { name: "Technical Knowledge", score: Math.floor(Math.random() * 20) + 75 },
      { name: "Problem-Solving Approach", score: Math.floor(Math.random() * 20) + 75 },
      { name: "Confidence & Body Language", score: Math.floor(Math.random() * 20) + 75 },
      { name: "Structure of Answers", score: Math.floor(Math.random() * 20) + 75 },
    ],
    feedback: {
      strengths: [
        "Strong technical foundation",
        "Clear communication",
        "Good problem-solving approach",
      ],
      areasOfImprovement: [
        "Could improve time management",
        "More practice with system design",
      ],
      mentorComments: "Great progress! Keep practicing.",
      mentorRatings: {
        overall: Math.floor(Math.random() * 20) + 75,
        technical: Math.floor(Math.random() * 20) + 75,
        communication: Math.floor(Math.random() * 20) + 75,
      },
    },
    playbackLink: `https://example.com/interview-${i + 1}`,
  }));

  // Generate login frequency data (last 8 weeks)
  const loginFrequency = Array.from({ length: 8 }, (_, i) => ({
    week: `Week ${8 - i}`,
    loginCount: Math.floor(Math.random() * 10) + 15,
  }));

  // Generate study time distribution
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const studyTimeDistribution = days.map((day) => ({
    day,
    hours: Math.floor(Math.random() * 4) + 2,
  }));

  // Generate activity calendar (last 30 days)
  const activityCalendar: { [date: string]: number } = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    activityCalendar[dateStr] = Math.floor(Math.random() * 5); // 0-4
  }

  // Calculate overall performance score
  const overallScore = Math.floor(
    (skills.reduce((sum, s) => sum + s.proficiencyScore, 0) / skills.length +
      assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length +
      (mockInterviews.length > 0
        ? mockInterviews.reduce((sum, m) => sum + m.overallScore, 0) /
          mockInterviews.length
        : 0)) /
      3
  );

  const overallGrade =
    overallScore >= 85
      ? "Interview-Ready"
      : overallScore >= 75
      ? "Advanced"
      : overallScore >= 65
      ? "Intermediate"
      : "Beginner";

  return {
    overview: {
      studentName: "Utkarsh Singh",
      programName: "Full Stack Development",
      cohort: "Cohort 2024",
      currentWeek: 8,
      currentModule: "Advanced React & Node.js",
      overallPerformanceScore: overallScore,
      overallGrade: overallGrade as any,
      totalTimeSpent: 245,
      activeDaysStreak: 12,
      completionPercentage: 72,
      statusBadge: overallScore >= 75 ? "Green" : overallScore >= 60 ? "Amber" : "Red",
    },
    learningConsumption: {
      videos: {
        totalAssigned: 120,
        completed: 85,
        averageWatchPercentage: 78,
        rewatchCount: 15,
        skippedVideos: ["Video 12", "Video 45", "Video 67"],
      },
      articles: {
        totalAssigned: 45,
        read: 38,
        averageReadingTime: 12,
        expectedReadingTime: 15,
        markedAsHelpful: 28,
      },
      practice: {
        mcqsAttempted: 450,
        mcqsTotal: 600,
        subjectiveSubmitted: 35,
        subjectivePending: 8,
        assessmentsAttempted: 8,
        assessmentsMissed: 2,
      },
    },
    performanceTrends: {
      weeklyData,
      skillWiseAccuracy: skills.map((skill) => ({
        skillName: skill.name,
        accuracy: skill.breakdown.mcqAccuracy,
        attemptCount: Math.floor(Math.random() * 50) + 20,
        confidenceScore: skill.confidenceScore,
      })),
    },
    skills,
    weakAreas: {
      skillsBelowThreshold: skills
        .filter((s) => s.proficiencyScore < 60)
        .map((s) => ({
          skillName: s.name,
          currentScore: s.proficiencyScore,
          threshold: 60,
          recommendation: `Focus on ${s.name} fundamentals and practice more MCQs`,
        })),
      topicsFrequentlyIncorrect: [
        { topicName: "React Hooks", incorrectCount: 12, totalAttempts: 45 },
        { topicName: "Async/Await", incorrectCount: 8, totalAttempts: 32 },
        { topicName: "SQL Joins", incorrectCount: 6, totalAttempts: 28 },
      ],
      skippedQuestions: [
        "Question ID: MCQ-123",
        "Question ID: MCQ-456",
        "Question ID: MCQ-789",
      ],
      recommendations: [
        {
          type: "revise",
          title: "Revise React Hooks",
          description: "You've missed 12 questions on React Hooks. Review the concepts.",
          actionUrl: "/courses/react-hooks",
          priority: 1,
        },
        {
          type: "mcq",
          title: "Attempt 10 MCQs on Async/Await",
          description: "Practice more to improve your accuracy.",
          actionUrl: "/practice/async-await",
          priority: 2,
        },
        {
          type: "video",
          title: "Watch SQL Joins Video Again",
          description: "Rewatch to strengthen your understanding.",
          actionUrl: "/videos/sql-joins",
          priority: 3,
        },
        {
          type: "interview",
          title: "Book a Mock Interview",
          description: "Practice your interview skills with a mentor.",
          actionUrl: "/mock-interview",
          priority: 4,
        },
      ],
    },
    assessmentPerformance: assessments,
    mockInterviewPerformance: {
      totalInterviews: mockInterviews.length,
      latestInterviewScore: mockInterviews[mockInterviews.length - 1]?.overallScore || 0,
      interviewReadinessIndex: Math.floor(
        mockInterviews.reduce((sum, m) => sum + m.overallScore, 0) /
          mockInterviews.length
      ),
      improvementSinceFirst: 15,
      interviews: mockInterviews,
    },
    behavioralMetrics: {
      loginFrequency,
      studyTimeDistribution,
      missedDeadlinesCount: 3,
      lastActiveDate: new Date().toISOString(),
      consistencyScore: 82,
      activityCalendar,
    },
    comparativeInsights: {
      comparisons: [
        {
          metric: "Overall Score",
          studentValue: overallScore,
          batchAverage: 68,
          top10Percent: 88,
          interviewCleared: 85,
        },
        {
          metric: "MCQ Accuracy",
          studentValue: 75,
          batchAverage: 70,
          top10Percent: 90,
          interviewCleared: 85,
        },
        {
          metric: "Assessment Score",
          studentValue: 78,
          batchAverage: 72,
          top10Percent: 92,
          interviewCleared: 88,
        },
      ],
      percentileRank: 72,
      vsBatchAverage: {
        better: 5,
        worse: 2,
        equal: 1,
      },
    },
    achievements: {
      badges: [
        {
          id: "badge-1",
          name: "Week Warrior",
          description: "Completed 7 days streak",
          earnedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "badge-2",
          name: "Quiz Master",
          description: "Scored 90%+ in 5 assessments",
          earnedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "badge-3",
          name: "Video Enthusiast",
          description: "Watched 50+ videos",
          earnedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      milestones: [
        {
          id: "milestone-1",
          name: "50% Course Completion",
          description: "Completed half of the course",
          completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 100,
        },
        {
          id: "milestone-2",
          name: "First Mock Interview",
          description: "Completed your first mock interview",
          completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 100,
        },
      ],
      skillUnlocks: ["Advanced React Patterns", "System Design Basics"],
      streakRewards: {
        currentStreak: 12,
        longestStreak: 18,
        rewards: ["7-day streak badge", "14-day streak bonus"],
      },
      certificatesProgress: {
        total: 5,
        completed: 2,
        inProgress: 1,
      },
    },
    actionPanel: {
      priorityActions: [
        {
          id: "action-1",
          title: "Complete Week 8 Assessment",
          description: "Due in 2 days",
          priority: 1,
          actionUrl: "/assessments/week-8",
          type: "assessment",
        },
        {
          id: "action-2",
          title: "Review React Hooks",
          description: "Focus area for improvement",
          priority: 2,
          actionUrl: "/courses/react-hooks",
          type: "video",
        },
        {
          id: "action-3",
          title: "Practice SQL MCQs",
          description: "10 questions remaining",
          priority: 3,
          actionUrl: "/practice/sql",
          type: "mcq",
        },
      ],
      recommendedContent: [
        {
          id: "rec-1",
          title: "Advanced React Patterns",
          type: "video",
          reason: "Based on your learning progress",
          url: "/videos/advanced-react-patterns",
        },
        {
          id: "rec-2",
          title: "System Design Fundamentals",
          type: "article",
          reason: "Recommended for interview preparation",
          url: "/articles/system-design-fundamentals",
        },
      ],
      pendingTasks: [
        {
          id: "task-1",
          title: "Complete Project Assignment 3",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: "project",
          url: "/assignments/project-3",
        },
        {
          id: "task-2",
          title: "Submit Week 7 Reflection",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: "assignment",
          url: "/assignments/week-7-reflection",
        },
      ],
      upcomingAssessments: [
        {
          id: "assess-1",
          name: "Final Assessment",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          url: "/assessments/final",
        },
      ],
    },
  };
};

export const scorecardService = {
  // Get complete scorecard data
  getScorecardData: async (): Promise<ScorecardData> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateMockScorecardData();
  },

  // Get dashboard summary (compact version)
  getDashboardSummary: async () => {
    const fullData = await scorecardService.getScorecardData();
    return {
      overallScore: fullData.overview.overallPerformanceScore,
      overallGrade: fullData.overview.overallGrade,
      totalTimeSpent: fullData.overview.totalTimeSpent,
      activeDaysStreak: fullData.overview.activeDaysStreak,
      completionPercentage: fullData.overview.completionPercentage,
      currentWeek: fullData.overview.currentWeek,
      currentModule: fullData.overview.currentModule,
      topSkills: fullData.skills
        .sort((a, b) => b.proficiencyScore - a.proficiencyScore)
        .slice(0, 3),
      recentTrend: fullData.performanceTrends.weeklyData.slice(-4), // Last 4 weeks
      // Additional data for charts
      learningConsumption: fullData.learningConsumption,
      skillDistribution: fullData.skills.map((s) => ({
        name: s.name,
        score: s.proficiencyScore,
        level: s.level,
      })),
      assessmentScores: fullData.assessmentPerformance.map((a) => ({
        name: a.assessmentName.length > 15 ? a.assessmentName.substring(0, 15) + "..." : a.assessmentName,
        score: a.score,
      })),
      skillLevels: {
        beginner: fullData.skills.filter((s) => s.level === "Beginner").length,
        intermediate: fullData.skills.filter((s) => s.level === "Intermediate").length,
        advanced: fullData.skills.filter((s) => s.level === "Advanced").length,
        interviewReady: fullData.skills.filter((s) => s.level === "Interview-Ready").length,
      },
    };
  },
};
