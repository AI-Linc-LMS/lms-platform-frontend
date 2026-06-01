"use client";

// Tenant-wide toggle for hiding "Available" (non-enrolled) courses from the
// student course module. Backed by the Client model field
// `hide_available_courses_from_students` and exposed via:
//   - GET via the existing /api/clients/<id>/client-info/ endpoint
//     (consumed through ClientInfoContext)
//   - PATCH via /admin-dashboard/api/clients/<id>/course-settings/
//     (tenant admins or superadmins only)
//
// Flipping the toggle in the admin course builder updates the backend; the
// student courses page reads it from ClientInfoContext, so every student gets
// the change on their next client-info refresh.

import apiClient from "@/lib/services/api";
import { config } from "@/lib/config";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

const clientId = () => Number(config.clientId);

interface CourseSettingsResponse {
  hide_available_courses_from_students: boolean;
  message?: string;
}

/** Reactive read of the tenant flag, sourced from ClientInfoContext. */
export function useHideAvailableCourses(): boolean {
  const { clientInfo } = useClientInfo();
  return Boolean(clientInfo?.hide_available_courses_from_students);
}

/** Persist the new value on the server. Caller is responsible for refreshing
 *  ClientInfoContext afterwards (e.g. via `refreshClientInfo()`) so the UI
 *  picks up the change without a hard reload. */
export async function updateHideAvailableCourses(
  next: boolean
): Promise<boolean> {
  const { data } = await apiClient.patch<CourseSettingsResponse>(
    `/admin-dashboard/api/clients/${clientId()}/course-settings/`,
    { hide_available_courses_from_students: next }
  );
  return data.hide_available_courses_from_students;
}
