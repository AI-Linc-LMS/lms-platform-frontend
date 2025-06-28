// Certificate fallback data
export const certificateFallbackData = {
  id: "1",
  name: "AI Linc Scholarship Assessment",
  type: "assessment" as const,
  issuedDate: "2025-06-28",
  studentName: "Student",
  studentEmail: "student@example.com",
  score: 0,
  sessionNumber: 1,
};

// Performance report fallback data
export const performanceReportFallbackData = [
  {
    label: "Overall Accuracy",
    value: 75,
    unit: "%",
    color: "#22c55e",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
      </svg>
    ),
  },
  {
    label: "Test Duration",
    value: 25,
    unit: "mins",
    color: "#facc15",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#facc15" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
      </svg>
    ),
  },
  {
    label: "Placement Readiness",
    value: 3,
    unit: "",
    color: "#facc15",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#facc15" strokeWidth="2">
        <polygon points="12,2 15,10 24,10 17,15 19,24 12,19 5,24 7,15 0,10 9,10" />
      </svg>
    ),
  },
  {
    label: "Performance Percentile",
    value: 65,
    unit: "%",
    color: "#0ea5e9",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#0ea5e9" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <rect x="8" y="12" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    label: "Scholarship Eligibility",
    value: 20,
    unit: "%",
    color: "#22c55e",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#22c55e" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
      </svg>
    ),
  },
];

// Accuracy bar chart fallback data
export const accuracyBarFallbackData = [
  { label: "AI Basics", value: 80 },
  { label: "Machine Learning", value: 65 },
  { label: "Web Development", value: 70 },
  { label: "Data Structures", value: 55 },
  { label: "Algorithms", value: 60 },
];

// Rating bars fallback data
export const ratingBarFallbackData = [
  { label: "Problem Solving", value: 75, color: "#facc15" },
  { label: "Technical Skills", value: 65, color: "#facc15" },
  { label: "Critical Thinking", value: 80, color: "#facc15" },
  { label: "Time Management", value: 70, color: "#facc15" },
  { label: "Communication", value: 85, color: "#facc15" },
];

// Skills fallback data
export const skillsFallbackData = {
  shineSkills: [
    "Problem Solving",
    "Critical Thinking",
    "Technical Aptitude",
    "Analytical Skills",
    "Quick Learning",
  ],
  attentionSkills: [
    "Advanced Algorithms",
    "System Design",
    "Database Optimization",
    "API Integration",
    "Performance Tuning",
  ],
};

// Mentor feedback fallback data
export const mentorFeedbackFallbackData = {
  didWell:
    "Your understanding of modern AI tools and ability to build no-code solutions stood out. You've shown strong logical clarity in problem-solving.",
  couldDoBetter:
    "Some answers lacked deeper reasoning—especially around coding implementation and architecture. Consider reviewing system design patterns.",
  suggestions: [
    'Take our micro-module on "Advanced React for Developers."',
    "Revisit MongoDB schema design via our video series.",
    "Try building a freelance portfolio page using our Glide + Zapier tutorial.",
  ],
};

// Score arc fallback data
export const scoreArcFallbackData = {
  score: 35,
  max: 50,
};
