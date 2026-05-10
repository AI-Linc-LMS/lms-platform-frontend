/** Roles allowed to schedule a community live room (Meet/Zoom link). */
export function canHostCommunityLive(role: string | undefined | null): boolean {
  const r = (role || "").toLowerCase().replace(/\s+/g, "");
  return r === "admin" || r === "superadmin" || r === "instructor";
}
