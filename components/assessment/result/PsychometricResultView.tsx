"use client";

import { HeaderSection } from "./psychometric/HeaderSection";
import { IdentityOverviewSection } from "./psychometric/IdentityOverviewSection";
import { EnhancedTraitInsightsSection } from "./psychometric/EnhancedTraitInsightsSection";
import { TraitInsightsSection } from "./psychometric/TraitInsightsSection";
import { EmotionalIntelligenceSection } from "./psychometric/EmotionalIntelligenceSection";
import { CognitiveWorkStyleSection } from "./psychometric/CognitiveWorkStyleSection";
import { SocioEconomicSection } from "./psychometric/SocioEconomicSection";
import { EnhancedCareerFitmentSection } from "./psychometric/EnhancedCareerFitmentSection";
import { CareerOrientationSection } from "./psychometric/CareerOrientationSection";
import { SuitableCareerProfilesSection } from "./psychometric/SuitableCareerProfilesSection";
import { StrengthsRisksSection } from "./psychometric/StrengthsRisksSection";
import { GrowthRoadmapSection } from "./psychometric/GrowthRoadmapSection";
import { PersonalitySnapshotSection } from "./psychometric/PersonalitySnapshotSection";
import { WorkStyleSection } from "./psychometric/WorkStyleSection";
import { TraitScoresBarChart } from "./psychometric/charts/TraitScoresBarChart";
import { DisclaimerSection } from "./psychometric/DisclaimerSection";

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
  // Enhanced sections (optional for backward compatibility)
  identity_overview?: {
    personality_archetype: {
      archetype_name: string;
      archetype_description: string;
      confidence_score: number;
      emotional_stability: number;
      adaptability_score: number;
    };
    personality_snapshot: Array<{
      trait_id: string;
      trait_name: string;
      band: string;
      score: number;
    }>;
    one_line_insight: string;
  };
  enhanced_trait_insights?: Array<{
    trait_id: string;
    trait_name: string;
    description: string;
    your_tendency: string;
    strength_level: number;
    behavioral_manifestation: string;
    real_world_implications: {
      study: string;
      job: string;
      teamwork: string;
    };
    potential_downside: string;
    strengths: string[];
    growth_suggestions: string[];
    real_life_example: string;
  }>;
  emotional_intelligence?: {
    emotional_regulation: {
      score: number;
      level: string;
      description: string;
    };
    stress_handling: {
      score: number;
      level: string;
      description: string;
    };
    empathy: {
      score: number;
      level: string;
      description: string;
    };
    decision_under_pressure: {
      score: number;
      level: string;
      description: string;
    };
    social_intelligence: {
      collaboration_style: string;
      leadership_tendency: string;
      communication_preference: string;
      conflict_response: string;
    };
  };
  cognitive_work_style?: {
    thinking_style: {
      logical_score: number;
      creative_score: number;
      hybrid_score: number;
      dominant_style: string;
    };
    learning_preference: {
      visual: number;
      auditory: number;
      kinesthetic: number;
      reading: number;
    };
    risk_appetite: {
      score: number;
      level: string;
      description: string;
    };
    execution_vs_ideation: {
      execution_score: number;
      ideation_score: number;
      balance: string;
    };
    attention_span: {
      score: number;
      level: string;
      focus_tendency: string;
    };
  };
  socio_economic_factors?: {
    family_background_influence: {
      educational_support: string;
      resource_access: string;
      influence_level: number;
    };
    environmental_constraints: {
      access_to_resources: string;
      support_systems: string;
      opportunity_exposure: string;
    };
    contextual_factors: {
      resource_availability: number;
      support_network_strength: number;
      opportunity_access: number;
    };
  };
  enhanced_career_fitment?: {
    career_paths: Array<{
      role: string;
      score: number;
      fitment_reasons: string[];
      required_skills: Array<{
        skill: string;
        current_level: number;
        required_level: number;
        gap: number;
      }>;
      emotional_alignment: string;
      social_alignment: string;
      work_environment_compatibility: string;
      timeline: {
        short_term: string;
        mid_term: string;
        long_term: string;
      };
    }>;
    workplace_fit_note: string;
  };
  strengths_risks?: {
    core_strengths: Array<{
      strength: string;
      impact_score: number;
      description: string;
    }>;
    hidden_strengths: Array<{
      strength: string;
      potential_score: number;
      description: string;
    }>;
    risk_zones: Array<{
      risk: string;
      severity_score: number;
      description: string;
      mitigation: string;
    }>;
    development_priorities: Array<{
      area: string;
      current_score: number;
      target_score: number;
      priority: "high" | "medium" | "low";
      description: string;
    }>;
  };
  // Legacy fields (for backward compatibility)
  response_quality?: {
    consistency_level: string;
    random_response_risk: string;
    overthinking_indicator: string;
    confidence_note: string;
  };
  personality_snapshot?: Array<{
    trait_id: string;
    trait_name: string;
    band: string;
    score: number;
  }>;
  trait_insights?: Array<{
    trait_id: string;
    trait_name: string;
    description: string;
    your_tendency: string;
    strengths: string[];
    growth_suggestions: string[];
    real_life_example: string;
  }>;
  learning_style?: {
    primary_style: string;
    attention_pattern: string;
    feedback_preference: string;
    recommended_content_formats: string[];
    visual_percentage: number;
    auditory_percentage: number;
    kinesthetic_percentage: number;
  };
  work_style_preferences?: {
    environment: string;
    team_preference: string;
    pressure_handling: string;
    routine_tolerance: string;
  };
  career_orientation?: {
    aligned_role_clusters: Array<{
      role: string;
      score: number;
    }> | string[];
    workplace_fit_note: string;
  };
  growth_roadmap?: Array<{
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
  // Use enhanced data if available, otherwise fall back to legacy structure
  const identityData = data.identity_overview || {
    personality_archetype: {
      archetype_name: "Analytical Builder",
      archetype_description: "You demonstrate a thoughtful and balanced approach to challenges, with a preference for clarity, planning, and structured environments.",
      confidence_score: 75,
      emotional_stability: 72,
      adaptability_score: 78,
    },
    personality_snapshot: data.personality_snapshot || [],
    one_line_insight: data.ai_generated_summary?.summary_text || "You demonstrate a thoughtful and balanced approach to challenges.",
  };

  const traitInsights = data.enhanced_trait_insights || data.trait_insights || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
        {/* Header / Summary */}
        <HeaderSection meta={data.assessment_meta} />

        {/* 1. Identity & Personality Overview (Hero Section) */}
        <IdentityOverviewSection 
          data={identityData} 
          traitInsights={traitInsights}
        />

        {/* 2. Career Fitment Intelligence System */}
        {data.enhanced_career_fitment ? (
          <EnhancedCareerFitmentSection data={data.enhanced_career_fitment} />
        ) : data.career_orientation && (
          <CareerOrientationSection career={data.career_orientation} />
        )}

        {/* 2.1. Suitable Career Path - Job Profiles */}
        {data.enhanced_career_fitment && data.enhanced_career_fitment.career_paths && data.enhanced_career_fitment.career_paths.length > 0 && (
          <SuitableCareerProfilesSection profiles={data.enhanced_career_fitment.career_paths} />
        )}

        {/* 3. Personality Trait Deep Dive */}
        {data.enhanced_trait_insights && data.enhanced_trait_insights.length > 0 ? (
          <EnhancedTraitInsightsSection insights={data.enhanced_trait_insights} />
        ) : data.trait_insights && data.trait_insights.length > 0 ? (
          <TraitInsightsSection insights={data.trait_insights} />
        ) : null}

        {/* 4. Emotional, Social & Behavioral Intelligence */}
        {data.emotional_intelligence && (
          <EmotionalIntelligenceSection data={data.emotional_intelligence} />
        )}

        {/* 5. Cognitive & Work Style Analysis */}
        {data.cognitive_work_style ? (
          <CognitiveWorkStyleSection data={data.cognitive_work_style} />
        ) : data.work_style_preferences && (
          <WorkStyleSection preferences={data.work_style_preferences} />
        )}

        {/* 6. Socio-Economic & Environmental Factors */}
        {data.socio_economic_factors && (
          <SocioEconomicSection data={data.socio_economic_factors} />
        )}

        {/* 7. Strengths, Risks & Development Areas */}
        {data.strengths_risks && (
          <StrengthsRisksSection data={data.strengths_risks} />
        )}

        {/* 8. Growth Roadmap */}
        {data.growth_roadmap && data.growth_roadmap.length > 0 && (
          <GrowthRoadmapSection roadmap={data.growth_roadmap} />
        )}

        {/* Legacy Sections (for backward compatibility) */}
        {!data.identity_overview && data.personality_snapshot && (
          <PersonalitySnapshotSection traits={data.personality_snapshot} />
        )}

        {data.personality_snapshot && (
          <TraitScoresBarChart traits={data.personality_snapshot} />
        )}

        {/* Disclaimer */}
        <DisclaimerSection disclaimer={data.disclaimer} />
      </div>
    </div>
  );
}
