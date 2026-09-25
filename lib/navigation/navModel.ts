/**
 * ONE navigation model for every surface: the desktop sidebar, the phone's bottom bar and its
 * "More" sheet, and the mobile drawer.
 *
 * The items used to live inside Sidebar.tsx while BottomNavigation.tsx kept a second, shorter
 * copy of its own. The two drifted: the phone bar listed six modules and simply omitted the rest,
 * so a tenant with Roadmaps, Certificates, the AI tutor or the Resume builder had modules that
 * were unreachable on a phone unless the learner opened the drawer and scrolled.
 *
 * Feature gating is the SAME data either way: an item appears only when the client has its
 * feature, which is why this file exports the rules as pure functions rather than a component.
 */

export interface NavigationItem {
  label: string;
  labelKey: string;
  path: string;
  icon: string;
  featureName: string;
  /** If set, show when any listed client admin feature is enabled (OR). */
  featureNamesAny?: string[];
  /** If true, only org admins (admin / superadmin) see this link. */
  orgAdminOnly?: boolean;
  /**
   * Hide this item when any listed feature is also on: another entry has replaced it. A tenant
   * holding both the old and the rebuilt interview would otherwise get two "Interview" rows.
   */
  supersededBy?: string[];
  /** i18n key for the one-line module explainer shown via the (i) tooltip. */
  descKey?: string;
  /**
   * A shorter name for the phone dock, whose active tab has about 86px for its label on a 360px
   * screen. "Assessment Management" and "Manage Students" were cut to an ellipsis there; the
   * full name stays the tab's accessible name.
   */
  dockLabelKey?: string;
  dockLabel?: string;
  /**
   * Which profile-gated module this is ("resume" | "jobs" | "interview"), if any.
   * Compared against the server's `locked_modules` — never a hard-coded client list, so the
   * backend can change what it gates without a frontend release.
   */
  gateKey?: string;
}


/**
 * Student sidebar is grouped into collapsible sections (an accordion). Items are
 * matched into a section by `featureName`; a couple stay standalone (Dashboard on
 * top, My Tickets at the bottom). Anything that matches no section still renders
 * as a standalone row, so a newly-added nav item can never silently disappear.
 */
export interface NavSection {
  id: string;
  labelKey: string;
  label: string;
  icon: string;
  itemFeatures: string[];
}

export const STUDENT_SECTIONS: NavSection[] = [
  {
    id: "learn",
    labelKey: "navSection.learn",
    label: "Learn",
    icon: "mdi:school-outline",
    itemFeatures: [
      "course",
      "adaptive_quiz",
      "assessment",
      "certificates",
      "roadmaps",
      "ai_voice_tutor",
    ],
  },
  {
    id: "career",
    labelKey: "navSection.career",
    label: "Career",
    icon: "mdi:briefcase-outline",
    itemFeatures: ["mock_interview", "jobs_v2", "resume"],
  },
  {
    id: "engage",
    labelKey: "navSection.engage",
    label: "Engage",
    icon: "mdi:account-group-outline",
    itemFeatures: ["live_sessions", "community_forum"],
  },
];
export const STUDENT_STANDALONE_TOP = ["dashboard"];
export const STUDENT_STANDALONE_BOTTOM = ["support"];

// Admin nav gets the same collapsible-section treatment as the student side.
export const ADMIN_SECTIONS: NavSection[] = [
  {
    id: "admin_people",
    labelKey: "navSection.people",
    label: "People",
    icon: "mdi:account-group-outline",
    itemFeatures: ["admin_manage_students", "admin_manage_instructors", "admin_cohorts"],
  },
  {
    id: "admin_content",
    labelKey: "navSection.content",
    label: "Content",
    icon: "mdi:book-multiple-outline",
    itemFeatures: [
      "admin_adaptive_quizzes",
      "admin_certificates",
    ],
  },
  {
    id: "admin_assessments",
    labelKey: "navSection.assessments",
    label: "Assessments",
    icon: "mdi:file-document-check-outline",
    itemFeatures: ["admin_assessment", "admin_scorecard"],
  },
  {
    id: "admin_engagement",
    labelKey: "navSection.engagement",
    label: "Engagement",
    icon: "mdi:calendar-star",
    itemFeatures: ["admin_live_sessions", "admin_mock_interview", "admin_jobs_v2"],
  },
  {
    id: "admin_comms",
    labelKey: "navSection.communications",
    label: "Communications",
    icon: "mdi:email-outline",
    itemFeatures: ["admin_emails", "admin_notifications"],
  },
  // Admin Settings moved out of the sidebar into the profile menu (top-right).
];
export const ADMIN_STANDALONE_TOP = ["admin_dashboard"];
export const ADMIN_STANDALONE_BOTTOM = ["admin_tickets"];

const SIDEBAR_SECTIONS_STORAGE_KEY = "sidebar_open_sections";

// scoped to what they teach.
export const INSTRUCTOR_NAV_ITEMS: NavigationItem[] = [
  { label: "Dashboard", labelKey: "instructorNav.dashboard", path: "/instructor/dashboard", icon: "mdi:view-dashboard", featureName: "instructor" },
  { label: "My Batches", labelKey: "instructorNav.cohorts", path: "/instructor/cohorts", icon: "mdi:account-group", featureName: "instructor" },
  { label: "Course Content", labelKey: "instructorNav.courses", dockLabelKey: "navDock.content", dockLabel: "Content", path: "/instructor/courses", icon: "mdi:book-education", featureName: "instructor" },
  { label: "Students", labelKey: "instructorNav.students", path: "/instructor/students", icon: "mdi:account-school", featureName: "instructor" },
  { label: "Gradebook", labelKey: "instructorNav.gradebook", path: "/instructor/assessments", icon: "mdi:clipboard-check-outline", featureName: "instructor" },
  // Authoring, not marking. Gradebook above READS submissions; this is where a trainer writes
  // the paper, maps it to their batches and publishes it. It points at the admin builder
  // deliberately: it is the same tool admins use, already scoped per object on the server, and a
  // second instructor-only copy of a 1,700-line editor would drift from it within a release.
  { label: "Assessments", labelKey: "instructorNav.assessments", path: "/admin/assessment", icon: "mdi:clipboard-edit-outline", featureName: "instructor" },
  // The briefs an assessment's project questions draw from. Same reasoning as Assessments above:
  // one screen, scoped per object on the server. An instructor sees their own batches' briefs plus
  // the tenant's shared ones, and can only rewrite the former - the server decides that, and sends
  // `can_edit` per brief so the screen can say so before anyone starts typing.
  { label: "Project Library", labelKey: "instructorNav.projects", dockLabelKey: "navDock.projects", dockLabel: "Projects", path: "/admin/projects", icon: "mdi:hammer-wrench", featureName: "instructor" },
  { label: "Live Sessions", labelKey: "instructorNav.live", path: "/instructor/live-sessions", icon: "mdi:video-outline", featureName: "instructor" },
  { label: "Analytics", labelKey: "instructorNav.analytics", path: "/instructor/analytics", icon: "mdi:chart-box-outline", featureName: "instructor" },
];

export const STUDENT_NAV_ITEMS: NavigationItem[] = [
  {
    label: "Dashboard",
    labelKey: "nav.dashboard",
    path: "/dashboard",
    icon: "mdi:view-dashboard",
    featureName: "dashboard", // Regular dashboard, not admin
    descKey: "navDesc.dashboard",
  },
  // Adaptive is the primary courses experience now (courses→adaptive migration), so it
  // leads; the legacy structured catalogue follows. Labels stay feature-scoped via i18n so
  // a traditional-only tenant (no adaptive_quiz) still sees its catalogue as "Courses".
  {
    label: "Courses",
    labelKey: "nav.adaptiveCourses",
    path: "/adaptive-courses",
    icon: "mdi:book-education-outline",
    featureName: "adaptive_quiz",
    descKey: "navDesc.adaptiveCourses",
  },
  // Roadmaps sits directly under Adaptive Courses because it is the layer ABOVE them: it is
  // how you choose what to learn and see where you are across several courses, while the
  // journey board is how you actually do one. Gated on its own feature so it is opt-in per
  // tenant, matching the default-deny grant model on the backend (a tenant with no published
  // roadmap mapping would otherwise land on an empty page).
  {
    label: "Roadmaps",
    labelKey: "nav.roadmaps",
    path: "/roadmaps",
    icon: "mdi:map-marker-path",
    featureName: "roadmaps",
    descKey: "navDesc.roadmaps",
  },
  // Live spoken tutoring. Gated on `ai_voice_tutor`, NOT the older `ai_tutor` key: that
  // one was a text chat box and a backend migration renamed the legacy row into it in
  // place, so tenants still hold it. This costs real money per minute, so it stays
  // default-deny and is switched on per tenant. See the backend's ai_tutor/permissions.py.
  {
    label: "AI Tutor",
    labelKey: "nav.aiTutor",
    path: "/ai-tutor",
    icon: "mdi:robot-happy-outline",
    featureName: "ai_voice_tutor",
    descKey: "navDesc.aiTutor",
  },
  {
    label: "Assessments",
    labelKey: "nav.assessments",
    path: "/assessments",
    icon: "mdi:file-document-edit",
    featureName: "assessment",
    descKey: "navDesc.assessments",
  },
  {
    // The learner's own certificates: what they hold, and the points ladder
    // showing what is still locked.
    //
    // The OR list is deliberate. Certificates are not earned from one module:
    // a learner gets them from courses, from assessments, and from a points
    // total that adds up across everything they do, so gating on a single
    // feature would hide the page from tenants whose learners can plainly earn
    // one. `certificates` leads the list so that once tenants carry an
    // explicit flag for the module, this can shrink to just that key and an
    // admin gets a real off switch.
    //
    // `course` (the classic catalogue) is deliberately not in the list: no certificate has
    // ever been issued for a classic course, and keeping it would let the retiring key hold
    // this page open on its own. Every tenant that holds `course` also holds `assessment`.
    label: "Certificates",
    labelKey: "nav.certificates",
    path: "/certificates",
    icon: "mdi:certificate-outline",
    featureName: "certificates",
    featureNamesAny: ["certificates", "adaptive_quiz", "assessment"],
    descKey: "navDesc.certificates",
  },
  {
    // The rebuilt interview. Gated on `interview_realtime`, a key no tenant holds by
    // default, so this entry is invisible until someone is deliberately switched on. Both
    // entries coexist until the old module is deleted at cutover; a tenant sees exactly one
    // of them, because the flags are mutually exclusive in practice.
    label: "Mock Interview",
    labelKey: "nav.interviewRealtime",
    path: "/interview",
    icon: "mdi:microphone-message",
    featureName: "interview_realtime",
    descKey: "navDesc.interviewRealtime",
    gateKey: "interview",
  },
  {
    // Superseded by the rebuilt interview above: four tenants now hold BOTH keys (the rebuilt one
    // was switched on for them without the old one being switched off), and they were getting two
    // entries with the same name pointing at two different products.
    label: "Mock Interview",
    labelKey: "nav.mockInterview",
    path: "/mock-interview",
    icon: "mdi:video-plus",
    featureName: "mock_interview",
    descKey: "navDesc.mockInterview",
    gateKey: "interview",
    supersededBy: ["interview_realtime"],
  },
  {
    label: "Jobs",
    labelKey: "nav.jobsV2",
    path: "/jobs-v2",
    icon: "mdi:briefcase-search",
    featureName: "jobs_v2",
    descKey: "navDesc.jobsV2",
    gateKey: "jobs",
  },
  {
    label: "Resume",
    labelKey: "nav.resume",
    path: "/resume",
    icon: "mdi:file-account-outline",
    featureName: "resume",
    descKey: "navDesc.resume",
    gateKey: "resume",
  },
  {
    label: "Live Sessions",
    labelKey: "nav.liveSessions",
    path: "/live-sessions",
    icon: "mdi:video-box",
    featureName: "live_sessions",
    descKey: "navDesc.liveSessions",
  },
  {
    label: "Community",
    labelKey: "nav.community",
    path: "/community",
    icon: "mdi:forum",
    featureName: "community_forum",
    descKey: "navDesc.community",
  },
  {
    label: "Support",
    labelKey: "nav.support",
    path: "/tickets",
    icon: "mdi:ticket-confirmation-outline",
    featureName: "support",
    descKey: "navDesc.support",
  },
];

export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  {
    label: "Dashboard",
    labelKey: "nav.dashboard",
    path: "/admin/dashboard",
    icon: "mdi:view-dashboard",
    featureName: "admin_dashboard",
    descKey: "navDesc.admin_dashboard",
    // Admin-only, matching the server. The insights endpoints behind this page aggregate every
    // student on the tenant, and on an adaptive tenant a scoped instructor/course_manager
    // already saw a fully zeroed dashboard here because the student resolver is legacy-only.
    // They keep /instructor/*.
    orgAdminOnly: true,
  },
  {
    label: "Manage Students",
    labelKey: "nav.manageStudents", dockLabelKey: "navDock.students", dockLabel: "Students",
    path: "/admin/manage-students",
    icon: "mdi:account-group",
    featureName: "admin_manage_students",
    descKey: "navDesc.admin_manage_students",
  },
  {
    label: "Instructors",
    labelKey: "nav.instructors",
    path: "/admin/instructors",
    icon: "mdi:account-tie",
    featureName: "admin_manage_instructors",
    descKey: "navDesc.admin_manage_instructors",
    orgAdminOnly: true,
  },
  // "Settings" (admin logo / favicon / login-page text) now lives in the
  // profile menu (AppBar), not the sidebar.
  {
    label: "Cohorts",
    labelKey: "nav.adminCohorts",
    path: "/admin/cohorts",
    icon: "mdi:account-group",
    featureName: "admin_cohorts",
    descKey: "navDesc.admin_cohorts",
  },
  // {
  //   label: "Workshop Registration",
  //   path: "/admin/workshop-registration",
  //   icon: "mdi:calendar-edit",
  //   featureName: "admin_workshop_reg",
  // },
  // {
  //   label: "Assessment Results",
  //   path: "/admin/assessment-results",
  //   icon: "mdi:chart-box",
  //   featureName: "admin_assessment_result",
  // },
  // {
  //   label: "Referral",
  //   path: "/admin/referral",
  //   icon: "mdi:account-arrow-right",
  //   featureName: "admin_referral",
  // },
  {
    label: "Emails",
    labelKey: "nav.emails",
    path: "/admin/emails",
    icon: "mdi:email-multiple",
    featureName: "admin_emails",
    descKey: "navDesc.admin_emails",
  },
  {
    label: "Notifications",
    labelKey: "nav.notifications",
    path: "/admin/notifications",
    icon: "mdi:bell-badge",
    featureName: "admin_notifications",
    descKey: "navDesc.admin_notifications",
  },
  {
    label: "Tickets",
    labelKey: "nav.adminTickets", dockLabelKey: "navDock.tickets", dockLabel: "Tickets",
    path: "/admin/tickets",
    icon: "mdi:ticket-confirmation-outline",
    featureName: "admin_tickets",
    descKey: "navDesc.admin_tickets",
  },
  // {
  //   label: "Payment",
  //   path: "/admin/payment",
  //   icon: "mdi:credit-card-multiple",
  //   featureName: "admin_payment",
  // },
  // {
  //   label: "Webinar Management",
  //   path: "/admin/webinar-management",
  //   icon: "mdi:video",
  //   featureName: "admin_webinar_management",
  // },
  
  {
    label: "Live Sessions",
    labelKey: "nav.adminLiveSessions",
    path: "/admin/live-sessions",
    icon: "mdi:video-box",
    featureName: "admin_live_sessions",
    descKey: "navDesc.admin_live_sessions",
  },
  {
    // The rebuilt module's review surface. Its own entry rather than a button inside the
    // legacy hub: that hub reads the OLD attempt model, which is empty for every realtime
    // sitting, so an admin looking for a candidate's interview found nothing and concluded
    // the admin side did not exist. Gated on interview_realtime, so it appears exactly for
    // the tenants whose learners can sit one.
    label: "Interview Attempts",
    labelKey: "nav.adminInterviewSessions", dockLabelKey: "navDock.attempts", dockLabel: "Attempts",
    path: "/admin/admin-mock-interview/sessions",
    icon: "mdi:clipboard-account",
    featureName: "interview_realtime",
    descKey: "navDesc.adminInterviewSessions",
  },
  {
    label: "Mock Interview",
    labelKey: "nav.adminMockInterview",
    path: "/admin/admin-mock-interview",
    icon: "mdi:account-voice",
    featureName: "admin_mock_interview",
    descKey: "navDesc.admin_mock_interview",
  },
  {
    // The page where interviews are actually BUILT: status and schedule, who is assigned,
    // who has not started, how the cohort did, and the roster download.
    //
    // It had no entry here. The only way in was a button on the hub page above, so an admin
    // looking for the interview admin surface reached the hub, saw attempts, and concluded
    // it did not exist - the same failure the comment on "Interview Attempts" describes,
    // one level deeper. Reported from client 5 as "I cannot see the interview admin side".
    label: "Interview Setup",
    labelKey: "nav.adminInterviewSetup", dockLabelKey: "navDock.interviews", dockLabel: "Interviews",
    path: "/admin/admin-mock-interview/templates",
    icon: "mdi:calendar-check-outline",
    featureName: "admin_mock_interview",
    descKey: "navDesc.adminInterviewSetup",
  },
  {
    label: "Assessment Management",
    labelKey: "nav.assessmentManagement", dockLabelKey: "nav.assessments", dockLabel: "Assessments",
    path: "/admin/assessment",
    icon: "mdi:file-document-edit",
    featureName: "admin_assessment",
    descKey: "navDesc.admin_assessment",
  },
  {
    label: "Project Library",
    labelKey: "nav.projectLibrary", dockLabelKey: "navDock.projects", dockLabel: "Projects",
    path: "/admin/projects",
    icon: "mdi:hammer-wrench",
    // Same gate as assessment management: a project brief is only ever used by an assessment,
    // so anyone who can build one of those can write the briefs it draws from.
    featureName: "admin_assessment",
    descKey: "navDesc.projectLibrary",
  },
  {
    label: "Adaptive Course Builder",
    labelKey: "nav.adminAdaptiveQuizzes", dockLabelKey: "nav.adaptiveCourses", dockLabel: "Courses",
    path: "/admin/adaptive-courses",
    icon: "mdi:robot-excited-outline",
    featureName: "admin_adaptive_quizzes",
    descKey: "navDesc.admin_adaptive_quizzes",
  },
  {
    label: "Scorecard",
    labelKey: "nav.adminScorecard",
    path: "/admin/scorecard",
    icon: "mdi:chart-box-outline",
    featureName: "admin_scorecard",
    descKey: "navDesc.admin_scorecard",
  },
  {
    // Renamed from "Certificate uploads": the module is no longer a file
    // dropbox. It owns templates, the points ladder, award rules and every
    // issued credential, and an admin looking for any of those would not
    // think to click something called uploads.
    //
    // "Management" rather than the bare noun because the learner surface
    // shipped alongside this one also lands in the sidebar, and an admin who
    // is also enrolled would otherwise read "Certificates" twice, in Learn
    // and in Content, with no way to tell which is which. This is the same
    // split the assessments module already makes with nav.assessments and
    // nav.assessmentManagement.
    label: "Certificate Management",
    labelKey: "nav.certificateManagement", dockLabelKey: "nav.certificates", dockLabel: "Certificates",
    path: "/admin/certificates",
    icon: "mdi:certificate",
    featureName: "admin_certificates",
    descKey: "navDesc.admin_certificates",
  },
 
  {
    label: "Jobs",
    labelKey: "nav.adminJobsV2",
    path: "/admin/jobs-v2",
    icon: "mdi:briefcase-search",
    featureName: "admin_jobs_v2",
    descKey: "navDesc.admin_jobs_v2",
  },
  // {
  //   label: "E-Book",
  //   path: "/admin/ebook",
  //   icon: "mdi:book-open-page-variant",
  //   featureName: "admin_ebook",
  // },
];

/** Features a course manager may see in ADMIN mode, mirrored from instructor scope rules. */
export function filterNavigationItems(params: {
  items: NavigationItem[];
  featureNames: Set<string>;
  effectiveAdminMode: boolean;
  isOrgAdmin: boolean;
  hideCertificatesFromStudents?: boolean;
  /** Role-scoped allow-lists; pass undefined when the role has no extra restriction. */
  allowOnly?: readonly string[];
}): NavigationItem[] {
  const { items: all, featureNames, effectiveAdminMode, isOrgAdmin, hideCertificatesFromStudents, allowOnly } = params;
  let items: NavigationItem[];
  if (featureNames.size > 0) {
    items = all.filter((item) => {
      // A tenant with features configured still always gets these: the dashboard is the home
      // route, Support is how anyone reports a problem, and the resume builder has no per-tenant
      // flag. Admin tickets is the same promise on the admin side.
      if (!effectiveAdminMode && item.featureName === "dashboard") return true;
      if (!effectiveAdminMode && item.featureName === "support") return true;
      if (!effectiveAdminMode && item.featureName === "resume") return true;
      if (effectiveAdminMode && item.featureName === "admin_tickets") return true;
      const any = item.featureNamesAny;
      if (any?.length) return any.some((n) => featureNames.has(n));
      return featureNames.has(item.featureName);
    });
  } else {
    // No features configured at all means default-allow, which is how a brand-new tenant works.
    items = all;
  }

  if (allowOnly) {
    const allow = new Set(allowOnly);
    items = items.filter((item) => {
      const any = item.featureNamesAny;
      if (any?.length) return any.some((f) => allow.has(f));
      return allow.has(item.featureName);
    });
  }

  // An institution can switch the STUDENT certificates surface off; admin certificate
  // management is a separate entry with its own gate and is deliberately untouched.
  if (hideCertificatesFromStudents) {
    items = items.filter((item) => item.path !== "/certificates");
  }

  // An item replaced by a newer module drops out when that module is also on. A tenant with no
  // features configured at all counts as holding everything (default-allow above), so the newer
  // entry wins there too rather than showing both.
  const holds = (name: string) => featureNames.size === 0 || featureNames.has(name);
  items = items.filter((item) => !item.supersededBy?.some(holds));

  return items.filter((item) => !item.orgAdminOnly || isOrgAdmin);
}

export interface GroupedNav {
  top: NavigationItem[];
  sections: (NavSection & { items: NavigationItem[] })[];
  bottom: NavigationItem[];
}

/**
 * Display grouping only - never a second filter. Anything matching no section still renders, so a
 * newly added nav item can never silently disappear from a surface.
 */
export function groupNavigation(items: NavigationItem[], effectiveAdminMode: boolean): GroupedNav {
  const activeSections = effectiveAdminMode ? ADMIN_SECTIONS : STUDENT_SECTIONS;
  const standaloneTop = effectiveAdminMode ? ADMIN_STANDALONE_TOP : STUDENT_STANDALONE_TOP;
  const standaloneBottom = effectiveAdminMode ? ADMIN_STANDALONE_BOTTOM : STUDENT_STANDALONE_BOTTOM;

  const map = new Map<string, NavigationItem[]>();
  activeSections.forEach((s) => map.set(s.id, []));
  const top: NavigationItem[] = [];
  const bottom: NavigationItem[] = [];
  const used = new Set<string>();

  items.forEach((item) => {
    if (standaloneTop.includes(item.featureName)) {
      top.push(item);
      used.add(item.path);
      return;
    }
    if (standaloneBottom.includes(item.featureName)) {
      bottom.push(item);
      used.add(item.path);
      return;
    }
    const sec = activeSections.find((s) => s.itemFeatures.includes(item.featureName));
    if (sec) {
      map.get(sec.id)!.push(item);
      used.add(item.path);
    }
  });

  const leftovers = items.filter((i) => !used.has(i.path));
  const sections = activeSections
    .map((s) => ({ ...s, items: map.get(s.id) as NavigationItem[] }))
    .filter((s) => s.items.length > 0);

  return { top, sections, bottom: [...bottom, ...leftovers] };
}

/**
 * Does `path` cover `pathname` at all? Exact for the dashboards, prefix elsewhere — and the
 * prefix always stops at a segment boundary, so `/interview` never claims `/interview-setup`.
 *
 * This is the CANDIDATE test, not the answer: several entries can cover one route at once.
 * `resolveActiveNavPath` picks between them.
 */
function navPathCovers(pathname: string, path: string): boolean {
  if (path === "/dashboard" || path === "/admin/dashboard") return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Which ONE of `paths` owns `pathname` — the longest match, never every prefix of it.
 *
 * The sidebar used to ask each entry "are you a prefix of the current route?" independently, so
 * a nested entry lit its parent too: on `/admin/admin-mock-interview/templates` both "Interview"
 * (`/admin/admin-mock-interview`) and "Interview Setup" (`.../templates`) were highlighted, and
 * the nav stopped saying where you are. The same held for "Interview Attempts"
 * (`.../sessions`) on the tenants that have it.
 *
 * Longest-match is what fixes it WITHOUT blanking deep routes: `/admin/admin-mock-interview/
 * interviews/12` still resolves to "Interview", because no more specific entry covers it.
 */
export function resolveActiveNavPath(
  pathname: string | null,
  paths: Iterable<string>,
): string | null {
  if (!pathname) return null;
  let best: string | null = null;
  for (const path of paths) {
    if (!navPathCovers(pathname, path)) continue;
    if (best === null || path.length > best.length) best = path;
  }
  return best;
}

/**
 * There is deliberately no per-item `isNavItemActive(pathname, path)` any more. That signature
 * can only answer "does this entry COVER the route", which every surface then took for "is this
 * entry the active one" - and a nested entry covers its parent's route as well as its own. The
 * question has to be asked once, against the whole list, which is what the resolver above does.
 */
