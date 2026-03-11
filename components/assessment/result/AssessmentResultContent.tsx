"use client";

import { Box } from "@mui/material";
import { AssessmentResult } from "@/lib/services/assessment.service";
import { AssessmentResultHeader } from "./AssessmentResultHeader";
import { ScoreDisplay } from "./ScoreDisplay";
import { EnhancedStatsBar } from "./EnhancedStatsBar";
import { TopicWiseBreakdown } from "./TopicWiseBreakdown";
import { StrengthsWeaknesses } from "./StrengthsWeaknesses";
import { EnhancedSkillsTags } from "./EnhancedSkillsTags";
import { OverallFeedback } from "./OverallFeedback";
import { EyeMovementViolations } from "./EyeMovementViolations";
import { QuizResponsesSection } from "./QuizResponsesSection";
import { CodingProblemResponsesSection } from "./CodingProblemResponsesSection";

interface AssessmentResultContentProps {
  assessmentResult: AssessmentResult;
}

export function AssessmentResultContent({
  assessmentResult,
}: AssessmentResultContentProps) {
  const { stats } = assessmentResult;

  const getStrengthsAndWeaknesses = () => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (stats.topic_wise_stats) {
      Object.entries(stats.topic_wise_stats).forEach(([topic, topicStats]) => {
        if (topicStats.accuracy_percent >= 70) {
          strengths.push(
            `Strong performance in ${topic} (${topicStats.accuracy_percent.toFixed(1)}% accuracy)`
          );
        } else if (topicStats.accuracy_percent < 60) {
          weaknesses.push(
            `Needs improvement in ${topic} (${topicStats.accuracy_percent.toFixed(1)}% accuracy)`
          );
        }
      });
    }

    if (strengths.length === 0 && weaknesses.length === 0) {
      if (stats.accuracy_percent >= 70) {
        strengths.push("Strong understanding of core concepts");
        strengths.push("Good problem-solving approach");
      } else {
        weaknesses.push("Consider reviewing fundamental concepts");
        weaknesses.push("Practice more to improve accuracy");
      }
    }

    return { strengths, weaknesses };
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses();

  const getFeedbackPoints = () => {
    const feedback: string[] = [];
    const accuracy = stats.accuracy_percent;

    if (accuracy >= 80) {
      feedback.push("Excellent performance! You have demonstrated a strong grasp of the concepts");
      feedback.push("Your analytical approach to problems is commendable");
      feedback.push("Continue practicing to maintain this high level of performance");
    } else if (accuracy >= 60) {
      feedback.push("Good performance overall with room for improvement");
      feedback.push("Focus on areas where you had difficulty to boost your score");
      feedback.push("Practice more scenario-based questions to enhance your skills");
    } else if (accuracy >= 40) {
      feedback.push("You have a basic understanding but need more practice");
      feedback.push("Review the topics where you struggled the most");
      feedback.push("Focus on understanding core concepts before moving to advanced topics");
    } else {
      feedback.push("Consider revisiting the fundamental concepts");
      feedback.push("Practice regularly to improve your understanding");
      feedback.push("Don't hesitate to seek help or additional resources");
    }

    if (stats.attempted_questions < stats.total_questions) {
      feedback.push(
        `You attempted ${stats.attempted_questions} out of ${stats.total_questions} questions. Try to attempt all questions next time.`
      );
    }

    return feedback;
  };

  const feedbackPoints = getFeedbackPoints();

  return (
    <Box>
      <AssessmentResultHeader
        assessmentTitle={assessmentResult.assessment_name}
        status={assessmentResult.status}
      />

      <ScoreDisplay
        score={stats.score}
        maximumMarks={stats.maximum_marks}
        accuracy={stats.accuracy_percent}
        percentile={stats.percentile}
      />

      <EnhancedStatsBar
        totalQuestions={stats.total_questions}
        attemptedQuestions={stats.attempted_questions}
        correctAnswers={stats.correct_answers}
        incorrectAnswers={stats.incorrect_answers}
        timeTakenMinutes={stats.time_taken_minutes}
        totalTimeMinutes={stats.total_time_minutes}
      />

      {assessmentResult.proctoring?.eye_movement_count &&
        assessmentResult.proctoring.eye_movement_count > 0 && (
          <EyeMovementViolations
            violations={assessmentResult.proctoring.eye_movement_violations || []}
            count={assessmentResult.proctoring.eye_movement_count}
          />
        )}

      {stats.topic_wise_stats && Object.keys(stats.topic_wise_stats).length > 0 && (
        <TopicWiseBreakdown topicWiseStats={stats.topic_wise_stats} />
      )}

      <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />

      {((Array.isArray(stats.top_skills) && stats.top_skills.length > 0) ||
        (Array.isArray(stats.low_skills) && stats.low_skills.length > 0)) && (
        <EnhancedSkillsTags
          strongSkills={Array.isArray(stats.top_skills) ? stats.top_skills : []}
          weakSkills={Array.isArray(stats.low_skills) ? stats.low_skills : []}
        />
      )}

      {assessmentResult.user_responses?.quiz_responses &&
        assessmentResult.user_responses.quiz_responses.length > 0 && (
          <QuizResponsesSection
            quizResponses={assessmentResult.user_responses.quiz_responses}
          />
        )}

      {assessmentResult.user_responses?.coding_problem_responses &&
        assessmentResult.user_responses.coding_problem_responses.length > 0 && (
          <CodingProblemResponsesSection
            codingResponses={assessmentResult.user_responses.coding_problem_responses}
          />
        )}

      <OverallFeedback feedbackPoints={feedbackPoints} />
    </Box>
  );
}
