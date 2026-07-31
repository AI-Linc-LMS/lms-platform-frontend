import { UserProfile } from "@/lib/services/accounts.service";

/**
 * The name to show for a user.
 *
 * The previous rule required BOTH first and last name and otherwise fell through to `user_name`.
 * For social sign-ins the provider often supplies a single given name, and `user_name` IS the
 * email address — so 2,187 of 18,357 production profiles rendered as
 * `poorva.shrivastava256@gmail.com` (usually truncated mid-address) while their actual first
 * name sat unused one field away. Some rendered as the literal "User".
 *
 * The chain now degrades one step at a time instead of falling off a cliff:
 *   "First Last" -> "First" -> a username that is not an email -> the email's local part -> "User"
 */
export const getUserDisplayName = (user: UserProfile | null): string => {
  if (!user) return "User";

  const first = (user.first_name || "").trim();
  const last = (user.last_name || "").trim();
  if (first && last) return `${first} ${last}`;
  // A single given name is a perfectly good name. This is the case the old rule dropped.
  if (first) return first;
  if (last) return last;

  const username = (user.user_name || "").trim();
  // For social logins user_name is the email, and an email address is not a name.
  if (username && !username.includes("@")) return username;

  const email = (user.email || username || "").trim();
  const local = email.split("@")[0];
  if (local) {
    // "poorva.shrivastava256" -> "Poorva Shrivastava". Imperfect, but recognisably the person,
    // which a raw address is not.
    const pretty = local
      .replace(/[._-]+/g, " ")
      .replace(/\d+/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    if (pretty) return pretty;
  }

  return "User";
};

/**
 * Initials for the avatar. Mirrors the display-name chain so the two cannot disagree — an avatar
 * reading "U" beside a name reading "Poorva" looks like a bug even when the name is right.
 */
export const getUserInitials = (user: UserProfile | null): string => {
  if (!user) return "U";

  const first = (user.first_name || "").trim();
  const last = (user.last_name || "").trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();

  const name = getUserDisplayName(user);
  if (name && name !== "User") {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }
  return "U";
};

/** Human label for a role slug. `course_manager` should never render as "course_manager". */
export const getRoleLabel = (role: string | null | undefined): string => {
  const key = (role || "").trim().toLowerCase();
  const LABELS: Record<string, string> = {
    student: "Student",
    admin: "Admin",
    superadmin: "Super Admin",
    instructor: "Instructor",
    course_manager: "Course Manager",
  };
  if (LABELS[key]) return LABELS[key];
  if (!key) return "Student";
  // Unknown role: still make it presentable rather than leaking a raw slug.
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/**
 * Text colour for the role pill.
 *
 * These are the 300/400 tints, not the 500s, because the only place a role is shown is the
 * sidebar footer — which sits on the tenant's dark shell. The saturated 500s were legible but
 * loud: an indigo-500 on dark navy also lands near 3:1, which is thin for 11px text.
 *
 * The pill puts colour in the TEXT only, on a neutral tint of the tenant's own nav colour. That
 * is the platform's convention for a pill on a dark ground (`BandPill dark` in the dashboard),
 * and it keeps the sidebar in the tenant's palette instead of introducing a fixed hue that
 * belongs to no brand.
 */
export const getRoleAccent = (role: string | null | undefined): string => {
  switch ((role || "").trim().toLowerCase()) {
    case "superadmin":
      return "#fbbf24";
    case "admin":
      return "#f472b6";
    case "instructor":
      return "#34d399";
    case "course_manager":
      return "#a5b4fc";
    default:
      // Student is the default role; it should read as a label, not as a badge.
      return "#cbd5e1";
  }
};

/**
 * Get user's profile picture URL
 */
export const getUserProfilePicture = (user: UserProfile | null): string | undefined => {
  if (!user) return undefined;
  return user.profile_picture || undefined;
};
