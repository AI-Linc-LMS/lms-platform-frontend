"use client";

import { HeaderSection } from "./psychometric/HeaderSection";
import { PersonalitySnapshotSection } from "./psychometric/PersonalitySnapshotSection";
import { ResponseQualitySection } from "./psychometric/ResponseQualitySection";
import { TraitInsightsSection } from "./psychometric/TraitInsightsSection";
import { WorkStyleSection } from "./psychometric/WorkStyleSection";
import { CareerOrientationSection } from "./psychometric/CareerOrientationSection";
import { GrowthRoadmapSection } from "./psychometric/GrowthRoadmapSection";
import { AISummarySection } from "./psychometric/AISummarySection";
import { DisclaimerSection } from "./psychometric/DisclaimerSection";
import { PersonalityRadarChart } from "./psychometric/charts/PersonalityRadarChart";
import { ResponseQualityBarChart } from "./psychometric/charts/ResponseQualityBarChart";
import { TraitScoresBarChart } from "./psychometric/charts/TraitScoresBarChart";
import { GrowthRoadmapChart } from "./psychometric/charts/GrowthRoadmapChart";

interface PsychometricData {
  assessment_meta: {
    assessment_id: string;
    assessment_name: string;
    assessment_type: string;
    version: string;
    completed_at: string;
    time_taken_minutes: number;
    recommended_retake_after_months: number;
  };
  response_quality: {
    consistency_level: string;
    random_response_risk: string;
    overthinking_indicator: string;
    confidence_note: string;
  };
  personality_snapshot: Array<{
    trait_id: string;
    trait_name: string;
    band: string;
    score: number;
  }>;
  trait_insights: Array<{
    trait_id: string;
    trait_name: string;
    description: string;
    your_tendency: string;
    strengths: string[];
    growth_suggestions: string[];
    real_life_example: string;
  }>;
  learning_style: {
    primary_style: string;
    attention_pattern: string;
    feedback_preference: string;
    recommended_content_formats: string[];
    visual_percentage: number;
    auditory_percentage: number;
    kinesthetic_percentage: number;
  };
  work_style_preferences: {
    environment: string;
    team_preference: string;
    pressure_handling: string;
    routine_tolerance: string;
  };
  career_orientation: {
    aligned_role_clusters: string[];
    workplace_fit_note: string;
  };
  growth_roadmap: Array<{
    area: string;
    suggested_action: string;
  }>;
  ai_generated_summary: {
    summary_text: string;
    generated_by: string;
    editable: boolean;
  };
  disclaimer: string;
}

interface PsychometricResultViewProps {
  data: PsychometricData;
}

export function PsychometricResultView({ data }: PsychometricResultViewProps) {
  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
        {/* Header / Summary */}
        <HeaderSection meta={data.assessment_meta} />

        {/* Charts Section - Top Row */}
        <PersonalityRadarChart traits={data.personality_snapshot} />

        {/* Personality Snapshot */}
        <PersonalitySnapshotSection traits={data.personality_snapshot} />

        {/* Response Quality Section with Chart */}
        <div className="space-y-6">
          <ResponseQualitySection quality={data.response_quality} />
          <ResponseQualityBarChart quality={data.response_quality} />
        </div>

        {/* Trait Scores Bar Chart */}
        <TraitScoresBarChart traits={data.personality_snapshot} />

        {/* Trait Insights */}
        {data.trait_insights && data.trait_insights.length > 0 && (
          <TraitInsightsSection insights={data.trait_insights} />
        )}

        {/* Work Style Preferences */}
        <WorkStyleSection preferences={data.work_style_preferences} />

        {/* Career Orientation */}
        <CareerOrientationSection career={data.career_orientation} />

        {/* Growth Roadmap */}
        {data.growth_roadmap && data.growth_roadmap.length > 0 && (
          <div className="space-y-6">
            <GrowthRoadmapChart roadmap={data.growth_roadmap} />
            <GrowthRoadmapSection roadmap={data.growth_roadmap} />
          </div>
        )}

        {/* AI Summary */}
        <AISummarySection summary={data.ai_generated_summary} />

        {/* Disclaimer + Download */}
        <DisclaimerSection
          disclaimer={data.disclaimer}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    </div>
  );
}
