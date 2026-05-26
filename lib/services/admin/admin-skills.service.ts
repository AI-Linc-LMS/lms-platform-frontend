/**
 * Admin skills service — per-row content-skill mapping + AI suggestions.
 *
 * Used by content editors (MCQ, video, assessment) to tag their item with
 * skills. The bulk grouped view used by /admin/scorecard config tabs lives in
 * admin-scorecard.service.ts.
 */
import apiClient from "../api";
import { config } from "../../config";

export type SkillContentType =
  | "mcq"
  | "coding_problem"
  | "video"
  | "article"
  | "course_subjective_question"
  | "assessment"
  | "assessment_subjective_question"
  | "interview_template";

export interface Skill {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  is_active: boolean;
  mapping_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AttachedSkill {
  id: number;
  name: string;
  category: string;
  source: "manual" | "ai" | "backfill";
  confidence: number | null;
}

export interface SkillSuggestion {
  name: string;
  confidence: number; // 0-1
  exists: boolean; // true if a Skill with this exact name already exists for the client
}

function baseUrl(): string {
  return `/admin-dashboard/api/clients/${config.clientId}`;
}

export const adminSkillsService = {
  async listSkills(params?: {
    search?: string;
    category?: string;
    includeInactive?: boolean;
  }): Promise<Skill[]> {
    const response = await apiClient.get<{ skills: Skill[] }>(
      `${baseUrl()}/skills/`,
      {
        params: {
          search: params?.search,
          category: params?.category,
          include_inactive: params?.includeInactive ? "1" : undefined,
        },
      }
    );
    return response.data?.skills ?? [];
  },

  async createSkill(input: {
    name: string;
    category?: string;
    description?: string;
  }): Promise<Skill> {
    const response = await apiClient.post<Skill>(`${baseUrl()}/skills/`, {
      name: input.name,
      category: input.category ?? "",
      description: input.description ?? "",
    });
    return response.data;
  },

  async updateSkill(
    skillId: number,
    input: Partial<{
      name: string;
      category: string;
      description: string;
      is_active: boolean;
    }>
  ): Promise<Skill> {
    const response = await apiClient.patch<Skill>(
      `${baseUrl()}/skills/${skillId}/`,
      input
    );
    return response.data;
  },

  async deleteSkill(skillId: number): Promise<void> {
    await apiClient.delete(`${baseUrl()}/skills/${skillId}/`);
  },

  /** Returns the currently-attached skills for one content row. */
  async getMappings(
    contentType: SkillContentType,
    contentId: number
  ): Promise<AttachedSkill[]> {
    const response = await apiClient.get<{ skills: AttachedSkill[] }>(
      `${baseUrl()}/skills/content-mappings/`,
      { params: { content_type: contentType, content_id: contentId } }
    );
    return response.data?.skills ?? [];
  },

  /** Replaces the skill set for one content row (manual source). */
  async setMappings(
    contentType: SkillContentType,
    contentId: number,
    skillIds: number[]
  ): Promise<number[]> {
    const response = await apiClient.post<{
      skill_ids: number[];
    }>(`${baseUrl()}/skills/content-mappings/`, {
      content_type: contentType,
      content_id: contentId,
      skill_ids: skillIds,
    });
    return response.data?.skill_ids ?? [];
  },

  /** AI-suggest skills for a content row. Does NOT persist — admin confirms via setMappings. */
  async suggestSkills(
    contentType: SkillContentType,
    contentId: number
  ): Promise<SkillSuggestion[]> {
    const response = await apiClient.post<{
      suggestions: SkillSuggestion[];
    }>(`${baseUrl()}/skills/ai-suggest/`, {
      content_type: contentType,
      content_id: contentId,
    });
    return response.data?.suggestions ?? [];
  },
};
