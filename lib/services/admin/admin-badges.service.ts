/**
 * Admin badges service - Badge CRUD wrapping the Phase 8 backend endpoints.
 *
 * Used by /admin/scorecard/badges. Django admin also handles badges, so this
 * service is primarily for the in-app admin UI rather than a hard requirement.
 */
import apiClient from "../api";
import { config } from "../../config";

export type BadgeCriteriaType =
  | "streak"
  | "skill_score"
  | "assessments_completed"
  | "mock_interviews"
  | "course_complete"
  | "first_submission"
  | "overall_score";

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  days?: number;
  count?: number;
  skill_id?: number;
  min?: number;
  course_id?: number;
}

export interface Badge {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconSlug: string;
  criteriaJson: BadgeCriteria | Record<string, unknown>;
  points: number;
  isActive: boolean;
  awardedCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface BadgeApi {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_slug?: string;
  criteria_json?: Record<string, unknown>;
  points: number;
  is_active: boolean;
  awarded_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

function fromApi(b: BadgeApi): Badge {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description ?? "",
    iconSlug: b.icon_slug ?? "mdi:trophy-outline",
    criteriaJson: (b.criteria_json ?? {}) as Badge["criteriaJson"],
    points: b.points,
    isActive: b.is_active,
    awardedCount: b.awarded_count ?? 0,
    createdAt: b.created_at ?? null,
    updatedAt: b.updated_at ?? null,
  };
}

function baseUrl(): string {
  return `/admin-dashboard/api/clients/${config.clientId}`;
}

export const adminBadgesService = {
  async listBadges(includeInactive = false): Promise<Badge[]> {
    const response = await apiClient.get<{ badges: BadgeApi[] }>(`${baseUrl()}/badges/`, {
      params: { include_inactive: includeInactive ? "1" : undefined },
    });
    return (response.data?.badges ?? []).map(fromApi);
  },

  async createBadge(input: {
    name: string;
    description?: string;
    iconSlug?: string;
    criteriaJson?: Record<string, unknown>;
    points?: number;
  }): Promise<Badge> {
    const response = await apiClient.post<BadgeApi>(`${baseUrl()}/badges/`, {
      name: input.name,
      description: input.description ?? "",
      icon_slug: input.iconSlug ?? "mdi:trophy-outline",
      criteria_json: input.criteriaJson ?? {},
      points: input.points ?? 10,
    });
    return fromApi(response.data);
  },

  async updateBadge(
    badgeId: number,
    input: Partial<{
      name: string;
      description: string;
      iconSlug: string;
      criteriaJson: Record<string, unknown>;
      points: number;
      isActive: boolean;
    }>,
  ): Promise<Badge> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.iconSlug !== undefined) payload.icon_slug = input.iconSlug;
    if (input.criteriaJson !== undefined) payload.criteria_json = input.criteriaJson;
    if (input.points !== undefined) payload.points = input.points;
    if (input.isActive !== undefined) payload.is_active = input.isActive;
    const response = await apiClient.patch<BadgeApi>(`${baseUrl()}/badges/${badgeId}/`, payload);
    return fromApi(response.data);
  },

  async deleteBadge(badgeId: number): Promise<void> {
    await apiClient.delete(`${baseUrl()}/badges/${badgeId}/`);
  },
};
