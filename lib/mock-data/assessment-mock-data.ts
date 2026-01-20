// Mock data for Aptitude Test Assessment
export const mockAptitudeTestData = {
  message: "stats fetched successfully.",
  status: "submitted",
  score: 58.5,
  assessment_id: "aptitude-test",
  assessment_name: "Aptitude Test",
  maximum_marks: 75,
  stats: {
    total_questions: 40,
    attempted_questions: 38,
    correct_answers: 23,
    score: 58.5,
    incorrect_answers: 15,
    accuracy_percent: 60.5,
    placement_readiness: 72.0,
    maximum_marks: 75,
    topic_wise_stats: {
      "cubes and cuboid": {
        total: 8,
        correct: 6,
        incorrect: 2,
        accuracy_percent: 75.0,
        rating_out_of_5: 4.2
      },
      "blood relations": {
        total: 7,
        correct: 5,
        incorrect: 2,
        accuracy_percent: 71.4,
        rating_out_of_5: 4.0
      },
      "logical reasoning": {
        total: 10,
        correct: 6,
        incorrect: 4,
        accuracy_percent: 60.0,
        rating_out_of_5: 3.5
      },
      "data interpretation": {
        total: 8,
        correct: 4,
        incorrect: 4,
        accuracy_percent: 50.0,
        rating_out_of_5: 3.0
      },
      "verbal ability": {
        total: 7,
        correct: 2,
        incorrect: 5,
        accuracy_percent: 28.6,
        rating_out_of_5: 1.8
      }
    },
    top_skills: [
      {
        skill: "geometry",
        accuracy_percent: 75.0,
        rating_out_of_5: 4.2,
        total: 8,
        correct: 6,
        incorrect: 2
      },
      {
        skill: "algebra",
        accuracy_percent: 71.4,
        rating_out_of_5: 4.0,
        total: 7,
        correct: 5,
        incorrect: 2
      },
      {
        skill: "surface area and volume calculation",
        accuracy_percent: 70.0,
        rating_out_of_5: 3.9,
        total: 5,
        correct: 3.5,
        incorrect: 1.5
      }
    ],
    low_skills: [
      {
        skill: "vocabulary",
        accuracy_percent: 28.6,
        rating_out_of_5: 1.8,
        total: 7,
        correct: 2,
        incorrect: 5
      },
      {
        skill: "family tree analysis",
        accuracy_percent: 35.0,
        rating_out_of_5: 2.1,
        total: 4,
        correct: 1.4,
        incorrect: 2.6
      },
      {
        skill: "relationship deduction",
        accuracy_percent: 40.0,
        rating_out_of_5: 2.5,
        total: 5,
        correct: 2,
        incorrect: 3
      }
    ],
    percentile: 78.5,
    time_taken_minutes: 52,
    total_time_minutes: 60,
    percentage_time_taken: 86.7
  }
};

// Mock data for Psychometric Assessment - Profile 1: Analytical & Balanced
export const mockPsychometricData1 = {
  message: "psychometric report generated successfully",
  status: "completed",
  assessment_meta: {
    assessment_id: "psychometric-personality-v1",
    assessment_name: "Psychometric Personality Assessment",
    assessment_type: "personality",
    version: "1.0",
    completed_at: "2026-01-20T10:45:00Z",
    time_taken_minutes: 27,
    recommended_retake_after_months: 6
  },
  response_quality: {
    consistency_level: "High",
    random_response_risk: "Low",
    overthinking_indicator: "Moderate",
    confidence_note: "Responses show strong internal consistency"
  },
  personality_snapshot: [
    {
      trait_id: "emotional_regulation",
      trait_name: "Emotional Regulation",
      band: "Balanced",
      score: 72
    },
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      band: "Analytical",
      score: 85
    },
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      band: "High",
      score: 78
    },
    {
      trait_id: "stress_tolerance",
      trait_name: "Stress Tolerance",
      band: "Moderate",
      score: 65
    },
    {
      trait_id: "social_orientation",
      trait_name: "Social Interaction",
      band: "Balanced",
      score: 70
    }
  ],
  trait_insights: [
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      description: "This trait reflects how you approach choices and problem-solving.",
      your_tendency: "You prefer analyzing information before making decisions.",
      strengths: [
        "Thoughtful and structured thinking",
        "Lower chances of impulsive errors"
      ],
      growth_suggestions: [
        "In time-sensitive situations, quicker decisions may be beneficial"
      ],
      real_life_example: "You may prefer planning tasks in advance rather than acting spontaneously."
    },
    {
      trait_id: "emotional_regulation",
      trait_name: "Emotional Regulation",
      description: "Your ability to manage and respond to emotional experiences.",
      your_tendency: "You maintain a balanced approach to emotional situations.",
      strengths: [
        "Stable emotional responses",
        "Good self-awareness"
      ],
      growth_suggestions: [
        "Practice mindfulness techniques for enhanced emotional control"
      ],
      real_life_example: "You tend to remain calm under pressure and think clearly."
    },
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      description: "How well you adjust to new situations and changes.",
      your_tendency: "You adapt well to changing circumstances.",
      strengths: [
        "Flexible thinking",
        "Openness to new experiences"
      ],
      growth_suggestions: [
        "Continue building resilience through diverse experiences"
      ],
      real_life_example: "You handle unexpected changes in plans with relative ease."
    }
  ],
  learning_style: {
    primary_style: "Visual + Practice-based",
    attention_pattern: "Short focused intervals",
    feedback_preference: "Immediate feedback",
    recommended_content_formats: [
      "Video lessons",
      "Interactive MCQs",
      "Hands-on exercises"
    ],
    visual_percentage: 45,
    auditory_percentage: 25,
    kinesthetic_percentage: 30
  },
  work_style_preferences: {
    environment: "Structured",
    team_preference: "Small teams",
    pressure_handling: "Moderate",
    routine_tolerance: "High"
  },
  career_orientation: {
    aligned_role_clusters: [
      "Analytical roles",
      "Research-oriented roles",
      "Structured technical roles"
    ],
    workplace_fit_note: "You may feel more comfortable in environments with clear expectations and planning."
  },
  growth_roadmap: [
    {
      area: "Communication Confidence",
      suggested_action: "Participate in mock interviews or small group discussions"
    },
    {
      area: "Stress Recovery",
      suggested_action: "Short breaks and reflection exercises may help maintain balance"
    }
  ],
  ai_generated_summary: {
    summary_text: "You demonstrate a thoughtful and balanced approach to challenges, with a preference for clarity, planning, and structured environments.",
    generated_by: "ai",
    editable: true
  },
  disclaimer: "This assessment is intended for self-awareness and guidance only. It does not diagnose, rank, or determine capability."
};

// Mock data for Psychometric Assessment - Profile 2: Creative & High Energy
export const mockPsychometricData2 = {
  message: "psychometric report generated successfully",
  status: "completed",
  assessment_meta: {
    assessment_id: "psychometric-personality-v2",
    assessment_name: "Psychometric Personality Assessment",
    assessment_type: "personality",
    version: "1.0",
    completed_at: "2026-01-22T14:30:00Z",
    time_taken_minutes: 32,
    recommended_retake_after_months: 6
  },
  response_quality: {
    consistency_level: "High",
    random_response_risk: "Very Low",
    overthinking_indicator: "Low",
    confidence_note: "Responses demonstrate high authenticity and self-awareness"
  },
  personality_snapshot: [
    {
      trait_id: "emotional_regulation",
      trait_name: "Emotional Regulation",
      band: "High",
      score: 88
    },
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      band: "Intuitive",
      score: 82
    },
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      band: "Very High",
      score: 92
    },
    {
      trait_id: "stress_tolerance",
      trait_name: "Stress Tolerance",
      band: "High",
      score: 80
    },
    {
      trait_id: "social_orientation",
      trait_name: "Social Interaction",
      band: "High",
      score: 85
    }
  ],
  trait_insights: [
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      description: "Your exceptional ability to adjust to new situations and embrace change.",
      your_tendency: "You thrive in dynamic environments and welcome new challenges.",
      strengths: [
        "Quick to learn and adapt",
        "Comfortable with uncertainty",
        "Resilient in face of change"
      ],
      growth_suggestions: [
        "Balance flexibility with consistency when needed",
        "Help others adapt by sharing your strategies"
      ],
      real_life_example: "You excel in fast-paced projects and enjoy exploring new opportunities."
    },
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      description: "Your approach to making choices and solving problems.",
      your_tendency: "You trust your instincts and make decisions quickly.",
      strengths: [
        "Fast decision-making",
        "Creative problem-solving",
        "Comfortable with ambiguity"
      ],
      growth_suggestions: [
        "Consider gathering more data for complex decisions",
        "Document your decision-making process for learning"
      ],
      real_life_example: "You often make quick choices in meetings and trust your gut feeling."
    },
    {
      trait_id: "social_orientation",
      trait_name: "Social Interaction",
      description: "Your comfort and preference in social settings.",
      your_tendency: "You enjoy collaborative environments and team interactions.",
      strengths: [
        "Strong communication skills",
        "Build rapport easily",
        "Energized by group work"
      ],
      growth_suggestions: [
        "Ensure you also get solo time to recharge",
        "Practice active listening in group settings"
      ],
      real_life_example: "You prefer brainstorming sessions and collaborative projects."
    }
  ],
  learning_style: {
    primary_style: "Kinesthetic + Visual",
    attention_pattern: "Long engaging sessions",
    feedback_preference: "Continuous feedback",
    recommended_content_formats: [
      "Interactive workshops",
      "Project-based learning",
      "Group discussions",
      "Video demonstrations"
    ],
    visual_percentage: 35,
    auditory_percentage: 30,
    kinesthetic_percentage: 35
  },
  work_style_preferences: {
    environment: "Flexible",
    team_preference: "Large collaborative teams",
    pressure_handling: "High",
    routine_tolerance: "Low"
  },
  career_orientation: {
    aligned_role_clusters: [
      "Creative roles",
      "Innovation-focused positions",
      "Team leadership roles",
      "Dynamic project management"
    ],
    workplace_fit_note: "You thrive in environments that value creativity, collaboration, and rapid innovation."
  },
  growth_roadmap: [
    {
      area: "Strategic Planning",
      suggested_action: "Develop structured planning techniques while maintaining flexibility"
    },
    {
      area: "Deep Focus",
      suggested_action: "Practice concentration exercises for tasks requiring sustained attention"
    },
    {
      area: "Solo Productivity",
      suggested_action: "Create dedicated quiet time for individual deep work"
    }
  ],
  ai_generated_summary: {
    summary_text: "You are a dynamic, creative individual who thrives in collaborative environments. Your high adaptability and intuitive decision-making make you well-suited for innovative roles that require quick thinking and team collaboration.",
    generated_by: "ai",
    editable: false
  },
  disclaimer: "This assessment is intended for self-awareness and guidance only. It does not diagnose, rank, or determine capability."
};

// Mock data for Psychometric Assessment - Profile 3: Methodical & Detail-Oriented
export const mockPsychometricData3 = {
  message: "psychometric report generated successfully",
  status: "completed",
  assessment_meta: {
    assessment_id: "psychometric-personality-v3",
    assessment_name: "Psychometric Personality Assessment",
    assessment_type: "personality",
    version: "1.0",
    completed_at: "2026-01-25T09:15:00Z",
    time_taken_minutes: 35,
    recommended_retake_after_months: 6
  },
  response_quality: {
    consistency_level: "Very High",
    random_response_risk: "Very Low",
    overthinking_indicator: "High",
    confidence_note: "Responses show careful consideration and thorough reflection"
  },
  personality_snapshot: [
    {
      trait_id: "emotional_regulation",
      trait_name: "Emotional Regulation",
      band: "Balanced",
      score: 75
    },
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      band: "Systematic",
      score: 90
    },
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      band: "Moderate",
      score: 62
    },
    {
      trait_id: "stress_tolerance",
      trait_name: "Stress Tolerance",
      band: "Moderate",
      score: 68
    },
    {
      trait_id: "social_orientation",
      trait_name: "Social Interaction",
      band: "Balanced",
      score: 72
    }
  ],
  trait_insights: [
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      description: "Your systematic approach to analyzing and making decisions.",
      your_tendency: "You prefer thorough analysis and structured evaluation before deciding.",
      strengths: [
        "Comprehensive problem analysis",
        "Reduced risk of errors",
        "Well-documented decision process"
      ],
      growth_suggestions: [
        "Set time limits for decision-making to avoid over-analysis",
        "Trust your analysis and act on it more quickly"
      ],
      real_life_example: "You create detailed pros/cons lists and research thoroughly before major decisions."
    },
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      description: "How well you adjust to new situations and changes.",
      your_tendency: "You prefer stability and well-defined processes.",
      strengths: [
        "Consistency in work quality",
        "Reliable and predictable",
        "Strong in structured environments"
      ],
      growth_suggestions: [
        "Gradually expose yourself to more varied situations",
        "Practice flexibility in low-stakes scenarios"
      ],
      real_life_example: "You work best when you have clear procedures and established routines."
    },
    {
      trait_id: "stress_tolerance",
      trait_name: "Stress Tolerance",
      description: "Your ability to handle pressure and stressful situations.",
      your_tendency: "You manage stress through planning and preparation.",
      strengths: [
        "Good at anticipating challenges",
        "Prepared for various scenarios",
        "Maintains quality under moderate pressure"
      ],
      growth_suggestions: [
        "Develop stress management techniques for unexpected situations",
        "Practice mindfulness to handle sudden changes"
      ],
      real_life_example: "You perform best when you have time to prepare and plan ahead."
    }
  ],
  learning_style: {
    primary_style: "Auditory + Reading",
    attention_pattern: "Extended focused periods",
    feedback_preference: "Detailed feedback",
    recommended_content_formats: [
      "Written materials",
      "Audio lectures",
      "Structured courses",
      "Detailed documentation"
    ],
    visual_percentage: 30,
    auditory_percentage: 40,
    kinesthetic_percentage: 30
  },
  work_style_preferences: {
    environment: "Quiet and structured",
    team_preference: "Small focused teams",
    pressure_handling: "Moderate",
    routine_tolerance: "Very High"
  },
  career_orientation: {
    aligned_role_clusters: [
      "Quality assurance roles",
      "Research and analysis",
      "Process improvement",
      "Technical documentation"
    ],
    workplace_fit_note: "You excel in roles that require attention to detail, systematic thinking, and quality focus."
  },
  growth_roadmap: [
    {
      area: "Adaptability",
      suggested_action: "Practice handling unexpected changes in controlled environments"
    },
    {
      area: "Quick Decision Making",
      suggested_action: "Set time limits for analysis and practice making faster decisions"
    },
    {
      area: "Stress Management",
      suggested_action: "Learn techniques for managing stress in unpredictable situations"
    }
  ],
  ai_generated_summary: {
    summary_text: "You are a methodical and detail-oriented individual who excels in structured environments. Your systematic approach to decision-making and preference for well-defined processes make you valuable in roles requiring precision and quality focus.",
    generated_by: "ai",
    editable: false
  },
  disclaimer: "This assessment is intended for self-awareness and guidance only. It does not diagnose, rank, or determine capability."
};

// Mock data for Psychometric Assessment - Profile 4: Leadership & High Confidence
export const mockPsychometricData4 = {
  message: "psychometric report generated successfully",
  status: "completed",
  assessment_meta: {
    assessment_id: "psychometric-personality-v4",
    assessment_name: "Psychometric Personality Assessment",
    assessment_type: "personality",
    version: "1.0",
    completed_at: "2026-01-28T16:45:00Z",
    time_taken_minutes: 28,
    recommended_retake_after_months: 6
  },
  response_quality: {
    consistency_level: "High",
    random_response_risk: "Low",
    overthinking_indicator: "Low",
    confidence_note: "Responses reflect strong self-confidence and clarity"
  },
  personality_snapshot: [
    {
      trait_id: "emotional_regulation",
      trait_name: "Emotional Regulation",
      band: "High",
      score: 85
    },
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      band: "Confident",
      score: 88
    },
    {
      trait_id: "adaptability",
      trait_name: "Adaptability",
      band: "High",
      score: 82
    },
    {
      trait_id: "stress_tolerance",
      trait_name: "Stress Tolerance",
      band: "High",
      score: 85
    },
    {
      trait_id: "social_orientation",
      trait_name: "Social Interaction",
      band: "Very High",
      score: 90
    }
  ],
  trait_insights: [
    {
      trait_id: "social_orientation",
      trait_name: "Social Interaction",
      description: "Your comfort and effectiveness in social and leadership situations.",
      your_tendency: "You are highly comfortable leading and influencing others.",
      strengths: [
        "Natural leadership ability",
        "Strong communication skills",
        "Inspires and motivates others"
      ],
      growth_suggestions: [
        "Ensure you listen as much as you speak",
        "Develop empathy for different perspectives"
      ],
      real_life_example: "You naturally take charge in group settings and people look to you for direction."
    },
    {
      trait_id: "decision_making",
      trait_name: "Decision-Making Style",
      description: "Your confident approach to making choices.",
      your_tendency: "You make decisions quickly and stand by them confidently.",
      strengths: [
        "Decisive leadership",
        "Clear direction setting",
        "Confidence in choices"
      ],
      growth_suggestions: [
        "Consider seeking input before major decisions",
        "Reflect on outcomes to improve future decisions"
      ],
      real_life_example: "You make strategic decisions quickly and communicate them clearly to your team."
    },
    {
      trait_id: "stress_tolerance",
      trait_name: "Stress Tolerance",
      description: "Your ability to perform under pressure.",
      your_tendency: "You handle high-pressure situations with composure.",
      strengths: [
        "Performs well under pressure",
        "Maintains clarity in crises",
        "Resilient and persistent"
      ],
      growth_suggestions: [
        "Help others develop similar stress management skills",
        "Recognize when to step back and recharge"
      ],
      real_life_example: "You remain calm and effective during tight deadlines and challenging projects."
    }
  ],
  learning_style: {
    primary_style: "Mixed - All styles",
    attention_pattern: "Variable based on interest",
    feedback_preference: "Constructive feedback",
    recommended_content_formats: [
      "Leadership workshops",
      "Case studies",
      "Mentorship programs",
      "Strategic planning sessions"
    ],
    visual_percentage: 33,
    auditory_percentage: 34,
    kinesthetic_percentage: 33
  },
  work_style_preferences: {
    environment: "Dynamic and challenging",
    team_preference: "Leading teams",
    pressure_handling: "Very High",
    routine_tolerance: "Moderate"
  },
  career_orientation: {
    aligned_role_clusters: [
      "Leadership roles",
      "Management positions",
      "Strategic planning",
      "Business development"
    ],
    workplace_fit_note: "You are well-suited for leadership positions where you can influence, guide, and drive results."
  },
  growth_roadmap: [
    {
      area: "Empathetic Leadership",
      suggested_action: "Develop deeper listening skills and emotional intelligence"
    },
    {
      area: "Collaborative Decision Making",
      suggested_action: "Practice involving team members in decision processes"
    },
    {
      area: "Work-Life Balance",
      suggested_action: "Ensure you maintain balance while pursuing ambitious goals"
    }
  ],
  ai_generated_summary: {
    summary_text: "You are a natural leader with high confidence and strong social skills. Your ability to make decisive decisions and handle pressure makes you well-suited for leadership roles where you can guide teams and drive organizational success.",
    generated_by: "ai",
    editable: false
  },
  disclaimer: "This assessment is intended for self-awareness and guidance only. It does not diagnose, rank, or determine capability."
};

// Helper function to get different mock data based on slug or random selection
export const getMockPsychometricData = (slug?: string): typeof mockPsychometricData1 => {
  // If slug contains a version number, use that specific profile
  const slugLower = slug?.toLowerCase() || "";
  
  if (slugLower.includes("v2") || slugLower.includes("profile-2") || slugLower.includes("creative")) {
    return mockPsychometricData2;
  }
  if (slugLower.includes("v3") || slugLower.includes("profile-3") || slugLower.includes("methodical")) {
    return mockPsychometricData3;
  }
  if (slugLower.includes("v4") || slugLower.includes("profile-4") || slugLower.includes("leadership")) {
    return mockPsychometricData4;
  }
  
  // Default to profile 1, or random selection for variety
  const profiles = [mockPsychometricData1, mockPsychometricData2, mockPsychometricData3, mockPsychometricData4];
  const randomIndex = Math.floor(Math.random() * profiles.length);
  return profiles[randomIndex];
};

// Export default for backward compatibility
export const mockPsychometricData = mockPsychometricData1;
