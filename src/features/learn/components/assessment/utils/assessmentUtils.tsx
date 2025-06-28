import {
  AssessmentStats,
  TopicStats,
  SkillStat,
} from "../types/assessmentTypes";
import {
  performanceReportFallbackData,
  accuracyBarFallbackData,
  ratingBarFallbackData,
  skillsFallbackData,
  mentorFeedbackFallbackData,
  scoreArcFallbackData,
} from "../data/assessmentData";

// Transform stats to performance report data
export const transformToPerformanceReportData = (stats?: AssessmentStats) => {
  if (!stats) {
    return performanceReportFallbackData;
  }

  return [
    {
      label: "Overall Accuracy",
      value: stats.accuracy_percent ?? 0,
      unit: "%",
      color: "#22c55e",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
        </svg>
      ),
    },
    {
      label: "Test Duration",
      value: stats.time_taken_minutes ?? 0,
      unit: "mins",
      color: "#facc15",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#facc15"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
        </svg>
      ),
    },
    {
      label: "Placement Readiness",
      value: stats.placement_readiness ?? 0,
      unit: "",
      color: "#facc15",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#facc15"
          strokeWidth="2"
        >
          <polygon points="12,2 15,10 24,10 17,15 19,24 12,19 5,24 7,15 0,10 9,10" />
        </svg>
      ),
    },
    {
      label: "Performance Percentile",
      value: stats.percentile ?? 0,
      unit: "%",
      color: "#0ea5e9",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="4" />
          <rect x="8" y="12" width="8" height="8" rx="2" />
        </svg>
      ),
    },
    {
      label: "Scholarship Eligibility",
      value: stats.offered_scholarship_percentage ?? 0,
      unit: "%",
      color: "#22c55e",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
        </svg>
      ),
    },
  ];
};

// Transform stats to accuracy bar data
export const transformToAccuracyBarData = (stats?: AssessmentStats) => {
  if (!stats?.topic_wise_stats) {
    return accuracyBarFallbackData;
  }

  return Object.entries(
    stats.topic_wise_stats as Record<string, TopicStats>
  ).map(([label, val]) => ({
    label,
    value: val.accuracy_percent ?? 0,
  }));
};

// Transform stats to rating bar data
export const transformToRatingBarData = (stats?: AssessmentStats) => {
  if (!stats?.topic_wise_stats) {
    return ratingBarFallbackData;
  }

  return Object.entries(
    stats.topic_wise_stats as Record<string, TopicStats>
  ).map(([label, val]) => ({
    label,
    value: (val.rating_out_of_5 ?? 0) * 20, // convert to percent for bar
    color: "#facc15",
  }));
};

// Transform stats to skills data
export const transformToSkillsData = (stats?: AssessmentStats) => {
  const shineSkills =
    stats?.top_skills?.map((s: SkillStat) => s.skill) ||
    skillsFallbackData.shineSkills;
  const attentionSkills =
    stats?.low_skills?.map((s: SkillStat) => s.skill) ||
    skillsFallbackData.attentionSkills;

  return { shineSkills, attentionSkills };
};

// Get mentor feedback based on performance
export const getMentorFeedback = (stats?: AssessmentStats) => {
  if (!stats) {
    return mentorFeedbackFallbackData;
  }

  const accuracy = stats.accuracy_percent ?? 0;

  if (accuracy >= 80) {
    return {
      didWell:
        "Excellent performance! Your strong foundation in AI concepts and technical skills is impressive. You've demonstrated exceptional problem-solving abilities.",
      couldDoBetter:
        "Consider exploring advanced topics like system design and optimization to further enhance your expertise.",
      suggestions: [
        "Enroll in our Advanced AI Development course",
        "Practice system design challenges",
        "Build a portfolio project using advanced AI techniques",
      ],
    };
  } else if (accuracy >= 60) {
    return {
      didWell:
        "Good work! You've shown solid understanding of core concepts and have the potential to excel with focused practice.",
      couldDoBetter:
        "Focus on strengthening your fundamentals and practice more problem-solving scenarios.",
      suggestions: [
        "Complete our foundational AI modules",
        "Practice coding challenges regularly",
        "Join our weekly mentorship sessions",
      ],
    };
  } else {
    return {
      didWell:
        "You've shown determination in taking this assessment. Every expert was once a beginner, and you're on the right path.",
      couldDoBetter:
        "Focus on building a strong foundation in basic concepts before moving to advanced topics.",
      suggestions: [
        "Start with our beginner-friendly AI course",
        "Practice basic programming concepts",
        "Attend our foundational workshops",
      ],
    };
  }
};

// Get score arc data
export const getScoreArcData = (stats?: AssessmentStats) => {
  return {
    score: stats?.score ?? scoreArcFallbackData.score,
    max: stats?.maximum_marks ?? scoreArcFallbackData.max,
  };
};
