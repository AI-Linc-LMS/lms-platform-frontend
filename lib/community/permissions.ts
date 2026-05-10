/**
 * Community moderation permissions.
 *
 * Single source of truth for "who can do what" on threads and comments.
 * Mirrors the backend role check in `community_forum/impact.py:is_community_admin_role`
 * and `community_forum/widget_views.py:_can_manage_arena` (those should converge —
 * see Phase 3 backend fix).
 */

function normalizeRole(role: string | undefined | null): string {
  return (role || "").toLowerCase().replace(/\s+/g, "");
}

/** Admin tier — can do anything: pin, lock, delete-any, resolve reports. */
export function isAdminRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "superadmin";
}

/** Moderator tier — can delete-any, hide, lock, but not pin or change roles. */
export function isModeratorRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "moderator" || isAdminRole(role);
}

/** Instructor — author equivalent powers + can host live rooms; not a moderator. */
export function isInstructorRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === "instructor" || isAdminRole(role);
}

interface AuthorRef {
  id: number;
  user_name?: string;
}

interface CurrentUserRef {
  id: number;
  user_name?: string;
  role?: string;
}

function isSameUser(a: AuthorRef, b: CurrentUserRef): boolean {
  if (a.id > 0 && b.id > 0 && a.id === b.id) return true;
  const u1 = (a.user_name || "").trim().toLowerCase();
  const u2 = (b.user_name || "").trim().toLowerCase();
  return Boolean(u1 && u2 && u1 === u2);
}

export interface ThreadPermissionFlags {
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  canLock: boolean;
  canReport: boolean;
}

export interface CommentPermissionFlags {
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
}

interface ThreadLike {
  author: AuthorRef;
  is_locked?: boolean;
  is_pinned?: boolean;
}

interface CommentLike {
  author: AuthorRef;
}

/** Role-aware permission flags for a single thread. Locked threads bar author edits. */
export function threadPermissions(
  thread: ThreadLike | null | undefined,
  user: CurrentUserRef | null | undefined
): ThreadPermissionFlags {
  if (!thread || !user || user.id <= 0) {
    return {
      canEdit: false,
      canDelete: false,
      canPin: false,
      canLock: false,
      canReport: false,
    };
  }
  const owns = isSameUser(thread.author, user);
  const admin = isAdminRole(user.role);
  const mod = isModeratorRole(user.role);
  const locked = Boolean(thread.is_locked);
  return {
    canEdit: (owns && !locked) || admin,
    canDelete: owns || mod,
    canPin: admin,
    canLock: mod,
    canReport: !owns,
  };
}

/** Role-aware permission flags for a single comment. */
export function commentPermissions(
  comment: CommentLike | null | undefined,
  thread: ThreadLike | null | undefined,
  user: CurrentUserRef | null | undefined
): CommentPermissionFlags {
  if (!comment || !user || user.id <= 0) {
    return { canEdit: false, canDelete: false, canReport: false };
  }
  const owns = isSameUser(comment.author, user);
  const mod = isModeratorRole(user.role);
  const threadLocked = Boolean(thread?.is_locked);
  return {
    canEdit: owns && !threadLocked,
    canDelete: owns || mod,
    canReport: !owns,
  };
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "off_topic"
  | "misinformation"
  | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or self-promotion" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech or discrimination" },
  { value: "off_topic", label: "Off-topic" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Something else" },
];
