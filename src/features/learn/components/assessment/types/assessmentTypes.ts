import React from "react";

// Certificate Templates Ref interface
export interface CertificateTemplatesRef {
  downloadPDF: () => Promise<void>;
  isDownloading: boolean;
}

// User State interface
export interface UserState {
  email: string | null;
  full_name: string | null;
  isAuthenticated: boolean;
}

// Topic Stats interface
export interface TopicStats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  rating_out_of_5: number;
}

// Skill Stat interface
export interface SkillStat {
  skill: string;
  accuracy_percent: number;
  rating_out_of_5: number;
  total: number;
  correct: number;
  incorrect: number;
}

// Assessment Stats interface
export interface AssessmentStats {
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  score: number;
  incorrect_answers: number;
  accuracy_percent: number;
  placement_readiness: number;
  maximum_marks: number;
  topic_wise_stats: Record<string, TopicStats>;
  top_skills: SkillStat[];
  low_skills: SkillStat[];
  percentile: number;
  offered_scholarship_percentage: number;
  time_taken_minutes: number;
  total_time_minutes: number;
  percentage_time_taken: number;
}

// Scholarship Redemption Data interface
export interface ScholarshipRedemptionData {
  message: string;
  percentage_scholarship: number;
  score: number;
  maximum_marks: number;
  payable_amount: number;
  total_amount: number;
  txn_status?: string;
  stats?: AssessmentStats;
}

// Accuracy Data interface
export interface AccuracyData {
  label: string;
  value: number;
}

// Rating Data interface
export interface RatingData {
  label: string;
  value: number;
  color: string;
}

// Score Arc Props interface
export interface ScoreArcProps {
  score: number;
  max: number;
}

// Skills Section Props interface
export interface SkillsSectionProps {
  shineSkills: string[];
  attentionSkills: string[];
}

// Mentor Feedback interface
export interface MentorFeedback {
  didWell: string;
  couldDoBetter: string;
  suggestions: string[];
}

// Metric interface for performance report
export interface Metric {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ReactElement;
} 