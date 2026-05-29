/**
 * Single source of truth for what features the setup wizard offers to a new
 * tenant, how each one reads (label + tagline), and which learner/admin
 * pairs cascade together when toggled.
 *
 * The backend's `AppFeatures` table only stores `{id, name}` — no labels,
 * no descriptions, no pairing. The wizard resolves API rows against this
 * catalogue by exact `name → key` match. Rows the backend exposes but the
 * catalogue doesn't curate are silently ignored in the wizard (they may
 * still be toggled by the super-admin portal).
 *
 * Mutation rules:
 * - Adding a new AppFeatures row server-side? Add a matching entry here
 *   (and seed the row via a data migration in accounts/migrations/).
 * - Renaming a key? Update `key` here AND data-migrate the existing
 *   `AppFeatures.name` to match.
 * - Retiring a legacy key? Mark `visibility: "deprecated"` so it stops
 *   appearing in the wizard without breaking tenants that already enabled it.
 */

export type FeatureSide = "learner" | "admin";

export interface WizardFeatureEntry {
  /** Exact AppFeatures.name on the backend. Case-sensitive. */
  key: string;
  /** Which section the card renders in. */
  side: FeatureSide;
  /** Product name shown to the tenant. Never a raw key. */
  label: string;
  /** One-line plain-language description rendered on the card. */
  tagline: string;
  /** Compact glyph name for the card's icon tile. Used by the FeaturesStep
   *  icon renderer; falls back to a neutral square if unrecognised. */
  icon: FeatureIconName;
  /** Feature keys that auto-enable when this entry is turned on. Set only
   *  on the LEARNER "parent" of a module group. May include admin keys
   *  (admin tools that manage the module) AND/OR other learner keys
   *  (sub-features the module includes, e.g. `scorecard` rides with
   *  `Assessment`). Child entries derive their parent from the inverse
   *  lookup below. */
  pairsWithAdmin?: string[];
  /** Default "visible". "deprecated" hides the card from the wizard while
   *  still allowing super-admin to toggle the underlying row. */
  visibility?: "visible" | "deprecated";
}

/** Glyph hints — keep this list small and intentional; the FeaturesStep
 *  renderer maps each one to an inline SVG. New icons require a matching
 *  case in `featureIconSvg()` in FeaturesStep.tsx. */
export type FeatureIconName =
  | "book"
  | "checklist"
  | "live"
  | "chat"
  | "interview"
  | "shield"
  | "robot"
  | "briefcase"
  | "dashboard"
  | "users"
  | "builder"
  | "scorecard"
  | "calendar"
  | "presence"
  | "bell"
  | "mail"
  | "certificate"
  | "paint"
  | "approve"
  | "sparkles"
  | "verify";

export const WIZARD_FEATURE_CATALOGUE: WizardFeatureEntry[] = [
  // ──────────── Learner-facing ────────────
  // All learner keys are lowercase snake_case to match what
  // components/layout/Sidebar.tsx gates on. Renames from the legacy
  // title-cased keys ("LMS", "Assessment", "Live Class", "Community
  // Forum", "Mock Interview", "Proctoring", "AI Tutor") landed in
  // backend migration accounts/0035_normalize_learner_feature_keys.
  {
    key: "course",
    side: "learner",
    label: "Learning hub",
    tagline:
      "Courses, modules, and lessons your students work through day to day.",
    icon: "book",
    pairsWithAdmin: [
      "admin_course_builder",
      "admin_manage_students",
      "admin_dashboard",
    ],
  },
  {
    key: "assessment",
    side: "learner",
    label: "Quizzes & tests",
    tagline:
      "Timed quizzes, exams, and graded assignments inside any course.",
    icon: "checklist",
    // Cascade includes the learner `scorecard` (so students see their own
    // results) alongside the two admin tools (Assessment editor + Scorecard).
    pairsWithAdmin: ["scorecard", "admin_assessment", "admin_scorecard"],
  },
  {
    key: "scorecard",
    side: "learner",
    label: "My scorecard",
    tagline:
      "Personal performance dashboard — quiz scores, course progress, and weak spots at a glance.",
    icon: "scorecard",
  },
  {
    key: "live_sessions",
    side: "learner",
    label: "Live classes",
    tagline:
      "Scheduled Zoom sessions with attendance tracked automatically.",
    icon: "live",
    // Cascade learner `attendance` (so students see their record) alongside
    // the admin tools.
    pairsWithAdmin: ["attendance", "admin_live_sessions", "admin_attendance"],
  },
  {
    key: "attendance",
    side: "learner",
    label: "My attendance",
    tagline:
      "Personal attendance log across every live class — present, late, absent.",
    icon: "presence",
  },
  {
    key: "community_forum",
    side: "learner",
    label: "Discussion forum",
    tagline:
      "Threaded conversations where learners help each other between classes.",
    icon: "chat",
  },
  {
    key: "mock_interview",
    side: "learner",
    label: "Mock interviews",
    tagline:
      "AI-powered practice interviews with feedback on every answer.",
    icon: "interview",
    pairsWithAdmin: ["admin_mock_interview"],
  },
  {
    key: "proctoring",
    side: "learner",
    label: "Browser proctoring",
    tagline:
      "Webcam + screen monitoring for high-stakes exams. Activates only on assessments you mark as proctored.",
    icon: "shield",
  },
  {
    key: "ai_tutor",
    side: "learner",
    label: "AI tutor",
    tagline:
      "Per-lesson chat tutor that answers questions in your course's context.",
    icon: "robot",
    pairsWithAdmin: ["admin_ai_course_builder"],
  },
  {
    key: "jobs_v2",
    side: "learner",
    label: "Jobs board",
    tagline:
      "A curated job feed your learners can browse and apply to in-app.",
    icon: "briefcase",
    pairsWithAdmin: ["admin_jobs_v2"],
  },

  // ──────────── Admin-portal modules ────────────
  {
    key: "admin_dashboard",
    side: "admin",
    label: "Org dashboard",
    tagline:
      "Org-wide KPIs, recent activity, and quick actions for tenant admins.",
    icon: "dashboard",
  },
  {
    key: "admin_manage_students",
    side: "admin",
    label: "Student management",
    tagline: "Add, edit, segment, and export learner accounts.",
    icon: "users",
  },
  {
    key: "admin_manage_instructors",
    side: "admin",
    label: "Instructor management",
    tagline:
      "Add or remove instructors, assign them to courses, manage permissions.",
    icon: "users",
  },
  {
    key: "admin_course_builder",
    side: "admin",
    label: "Course builder",
    tagline: "Author courses, modules, and lessons from one editor.",
    icon: "builder",
  },
  {
    key: "admin_assessment",
    side: "admin",
    label: "Assessment editor",
    tagline: "Build, schedule, and proctor quizzes and exams.",
    icon: "checklist",
  },
  {
    key: "admin_mock_interview",
    side: "admin",
    label: "Mock interview studio",
    tagline:
      "Configure interview prompts, rubrics, and AI feedback templates.",
    icon: "interview",
  },
  {
    key: "admin_scorecard",
    side: "admin",
    label: "Scorecard",
    tagline:
      "Cohort-level performance dashboards with drill-down per learner.",
    icon: "scorecard",
  },
  {
    key: "admin_jobs_v2",
    side: "admin",
    label: "Jobs management",
    tagline: "Post roles, screen applicants, and manage the job board.",
    icon: "briefcase",
  },
  {
    key: "admin_live_sessions",
    side: "admin",
    label: "Live session scheduler",
    tagline: "Plan, reschedule, and review live classes across cohorts.",
    icon: "calendar",
  },
  {
    key: "admin_attendance",
    side: "admin",
    label: "Attendance",
    tagline:
      "Live-class attendance records with export and bulk-mark tools.",
    icon: "presence",
  },
  {
    key: "admin_notifications",
    side: "admin",
    label: "Announcements",
    tagline: "Broadcast messages, banners, and push pings to your learners.",
    icon: "bell",
  },
  {
    key: "admin_emails",
    side: "admin",
    label: "Email templates",
    tagline:
      "Customise transactional and marketing emails sent on your behalf.",
    icon: "mail",
  },
  {
    key: "admin_certificates",
    side: "admin",
    label: "Certificates",
    tagline:
      "Issue, revoke, and manage completion certificates for your courses.",
    icon: "certificate",
  },
  {
    key: "admin_branding",
    side: "admin",
    label: "Branding",
    tagline: "Theme colours, logos, and white-label settings.",
    icon: "paint",
  },
  {
    key: "admin_pending_instructors",
    side: "admin",
    label: "Instructor approvals",
    tagline: "Review and approve instructor sign-up requests.",
    icon: "approve",
  },
  {
    key: "admin_ai_course_builder",
    side: "admin",
    label: "AI course builder",
    tagline: "Draft course outlines and lessons with AI assistance.",
    icon: "sparkles",
  },
  {
    key: "admin_verify_content",
    side: "admin",
    label: "Content moderation",
    tagline: "Review user-submitted content before it goes live.",
    icon: "verify",
  },
];

// ──────────── Lookups + helpers ────────────

const CATALOGUE_BY_KEY = new Map<string, WizardFeatureEntry>(
  WIZARD_FEATURE_CATALOGUE.map((e) => [e.key, e])
);

/** Reverse index: child key → parent learner key. A "parent" is a learner
 *  entry that lists other features in its `pairsWithAdmin`. Children can
 *  be admin entries (e.g. `admin_scorecard`) or other learner entries
 *  (e.g. `scorecard` is a child of `Assessment`). Used to render the
 *  "Part of the X module" caption on child cards and to resolve full
 *  cascade groups from any side. The parent itself is intentionally NOT
 *  in this map — `parentLearnerKey("Assessment")` returns undefined. */
const CHILD_TO_PARENT = (() => {
  const m = new Map<string, string>();
  for (const e of WIZARD_FEATURE_CATALOGUE) {
    if (e.side !== "learner" || !e.pairsWithAdmin) continue;
    for (const childKey of e.pairsWithAdmin) {
      // Don't overwrite: first parent to claim a key wins. (Today there's
      // no overlap, but this guards future authoring mistakes.)
      if (!m.has(childKey)) m.set(childKey, e.key);
    }
  }
  return m;
})();

export function lookupFeatureByKey(
  key: string
): WizardFeatureEntry | undefined {
  return CATALOGUE_BY_KEY.get(key);
}

function isVisible(entry: WizardFeatureEntry): boolean {
  return entry.visibility !== "deprecated";
}

/** Visible learner entries, in catalogue order. */
export function learnerEntries(): WizardFeatureEntry[] {
  return WIZARD_FEATURE_CATALOGUE.filter(
    (e) => e.side === "learner" && isVisible(e)
  );
}

/** Visible admin entries, in catalogue order. */
export function adminEntries(): WizardFeatureEntry[] {
  return WIZARD_FEATURE_CATALOGUE.filter(
    (e) => e.side === "admin" && isVisible(e)
  );
}

/**
 * Return every feature key that should toggle together with `key`. Works
 * from any side of the cascade:
 *   - parent learner → [parent, ...its declared children]
 *   - child (admin or sibling-learner) → [parent, ...all of parent's children]
 *   - unpaired key → [key] alone
 *
 * Always includes `key` itself so callers can treat the result as the full
 * set to flip without checking "did we include the source?".
 */
export function pairedKeys(key: string): string[] {
  const entry = CATALOGUE_BY_KEY.get(key);
  if (!entry) return [key];

  // Parent learner with declared children — straightforward.
  if (entry.side === "learner" && entry.pairsWithAdmin?.length) {
    return [key, ...entry.pairsWithAdmin];
  }

  // Child — find the parent, then include the parent + all siblings so
  // untoggling any child clears the whole module group.
  const parentKey = CHILD_TO_PARENT.get(key);
  if (!parentKey) return [key];
  const parent = CATALOGUE_BY_KEY.get(parentKey);
  if (!parent || !parent.pairsWithAdmin) return [key];
  return [parentKey, ...parent.pairsWithAdmin];
}

/** For a child entry (admin tool or sibling learner sub-feature), the
 *  parent learner key it cascades from. Returns undefined for top-level
 *  learner entries and for orphan admin entries like `admin_branding`
 *  that aren't tied to a learner module. */
export function learnerKeyForAdmin(childKey: string): string | undefined {
  return CHILD_TO_PARENT.get(childKey);
}
