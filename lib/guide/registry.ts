import type { TourStep } from "@/components/community/TourProvider";

/**
 * Route-keyed page-guide content. Every module page renders a "?" in its header
 * (via ModulePageHeader) that opens a guide built from the entry for its route:
 * a title + subtitle, a list of "what you can do" features, an optional tip, and
 * an optional guided tour (only pages that have data-tour-id targets).
 *
 * Authoring lives here (one place) rather than inline per page, so all ~25 guides
 * are maintained together. Resolve with `resolveGuide(pathname)`.
 */

export interface GuideFeature {
  /** Iconify id, e.g. "mdi:plus-circle-outline". */
  icon: string;
  /** Hex accent for the icon badge. */
  color: string;
  title: string;
  text: string;
}

export interface PageGuideContent {
  /** Modal header title, e.g. "What you can do on Live Sessions". */
  headerTitle: string;
  /** One-line subtitle under the title. */
  headerSubtitle: string;
  features: GuideFeature[];
  /** Optional actionable pro-tip shown in the callout. */
  tip?: string;
  /** Optional guided spotlight tour (needs matching data-tour-id targets on the page). */
  tourSteps?: TourStep[];
}

/**
 * Anchored spotlight tour of the STUDENT DASHBOARD - each step highlights a real
 * component on /dashboard (via its data-tour-id, added in DashboardV2). Used both
 * as the dashboard's own tour and as the platform tour (the top-nav Guide starts it
 * on /dashboard). Steps whose target isn't rendered (e.g. leaderboard hidden for a
 * tenant) degrade to a centered card - TourProvider handles a missing target.
 */
export const DASHBOARD_TOUR: TourStep[] = [
  {
    title: "Welcome to your dashboard",
    narration:
      "This is your home base. Let me walk you through it - your AI briefing, your points and streak, your courses, and today's goal.",
    icon: "mdi:view-dashboard-outline",
    color: "#a78bfa",
  },
  {
    targetId: "dash-briefing",
    title: "Your AI briefing",
    narration:
      "Every day this greets you with a quick, personalized read on where you are and what to focus on next.",
    placement: "bottom",
    icon: "mdi:robot-happy-outline",
    color: "#7c3aed",
  },
  {
    targetId: "dash-stats",
    title: "Points, streak and progress",
    narration:
      "Your total points, your daily streak, and your overall progress live here - they tick up as you learn across every module.",
    placement: "bottom",
    icon: "mdi:lightning-bolt",
    color: "#f59e0b",
  },
  {
    targetId: "dash-courses",
    title: "Your courses",
    narration:
      "Pick up any course right where you left off. Your readiness and next step for the selected course show here.",
    placement: "top",
    icon: "mdi:book-education-outline",
    color: "#6366f1",
  },
  {
    targetId: "dash-goal",
    title: "Today's goal and streak",
    narration:
      "Three small daily habits - a lesson, fifteen minutes of practice, and a quiz. Complete any one to keep your streak alive; the flame lights up as you go.",
    placement: "left",
    icon: "mdi:target",
    color: "#22c55e",
  },
  {
    targetId: "dash-skills",
    title: "Your skill profile",
    narration:
      "See how your skills are developing across the course - your strengths and the areas to grow, updated as the AI learns how you do.",
    placement: "left",
    icon: "mdi:chart-donut",
    color: "#0ea5e9",
  },
  {
    targetId: "dash-leaderboard",
    title: "Leaderboard",
    narration:
      "See how you stack up against your cohort this week. A little friendly competition to keep you going.",
    placement: "left",
    icon: "mdi:trophy-outline",
    color: "#fbbf24",
  },
  {
    title: "You're all set",
    narration:
      "That's your dashboard. Explore each module from the sidebar, and open the Guide any time to take a tour of the page you're on.",
    icon: "mdi:rocket-launch-outline",
    color: "#a78bfa",
  },
];

/**
 * The platform-wide guide, opened from the "Guide" button in the top nav - a
 * bird's-eye overview of what AI Linc offers and where to find each area, plus an
 * anchored tour of the student dashboard (the Guide starts it on /dashboard).
 */
export const PLATFORM_GUIDE: PageGuideContent = {
  headerTitle: "Welcome to AI Linc",
  headerSubtitle: "Your learning platform at a glance - here's what you can do and where to find it.",
  tourSteps: DASHBOARD_TOUR,
  features: [
    {
      icon: "mdi:book-education-outline",
      color: "#6366f1",
      title: "Learn with adaptive courses",
      text: "Take courses that adjust to your level - articles, quizzes, coding, and videos with instant feedback.",
    },
    {
      icon: "mdi:clipboard-text-outline",
      color: "#0ea5e9",
      title: "Sit assessments",
      text: "Take quizzes and proctored tests assigned by your courses, then review your scored results.",
    },
    {
      icon: "mdi:account-voice",
      color: "#a78bfa",
      title: "Practice mock interviews",
      text: "Run AI-driven interviews and get instant, rubric-based feedback to sharpen your answers.",
    },
    {
      icon: "mdi:video",
      color: "#22c55e",
      title: "Join live sessions",
      text: "Attend live classes and webinars, or catch up later with recordings and AI recaps.",
    },
    {
      icon: "mdi:forum",
      color: "#ec4899",
      title: "Connect in the community",
      text: "Ask questions, share resources, join live rooms, and earn IP with your cohort.",
    },
    {
      icon: "mdi:briefcase-outline",
      color: "#f59e0b",
      title: "Explore jobs",
      text: "Browse and apply to roles curated for you from the Jobs board.",
    },
    {
      icon: "mdi:trophy-outline",
      color: "#fbbf24",
      title: "Points, streaks & scorecard",
      text: "Earn points for everything you do, keep your daily streak alive, and track your skills on your scorecard.",
    },
    {
      icon: "mdi:account-circle-outline",
      color: "#6366f1",
      title: "Profile & resume",
      text: "Build your profile and resume, and personalize your settings from the profile menu.",
    },
  ],
  tip: "Look for the '?' in any page's header for a guide specific to that page.",
};

// The community page keeps its rich guided tour: the steps target data-tour-id
// attributes already present on app/community/page.tsx.
const COMMUNITY_TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to the Community",
    narration:
      "This is your community hub - ask questions, share resources, vote on polls, and join live rooms with other learners. Let me show you around.",
    icon: "mdi:hand-wave-outline",
    color: "#a78bfa",
  },
  {
    targetId: "tour-create-post",
    title: "Create a Post",
    narration:
      "Start anything here - a question, a poll, a resource, a discussion, or just something fun. Every post you create earns you ten IP points.",
    placement: "bottom",
    icon: "mdi:plus-circle-outline",
    color: "#6366f1",
  },
  {
    targetId: "tour-bounties",
    title: "High-value Bounties",
    narration:
      "Top unanswered questions show up here with IP rewards. Click the High-Value Bounties heading to open the full bounty browser - see active, resolved, and unanswered, plus how much IP has been awarded.",
    placement: "bottom",
    icon: "mdi:fire",
    color: "#f59e0b",
  },
  {
    targetId: "tour-filters",
    title: "Filters and Search",
    narration:
      "Filter by post type, your own posts, what you've saved, or what people you follow are posting. Use Recent or Popular sort to find the best content fast.",
    placement: "bottom",
    icon: "mdi:filter-variant",
    color: "#10b981",
  },
  {
    targetId: "tour-milestones",
    title: "Your Milestones",
    narration:
      "Every activity in the community earns IP. Climb from Bronze through Silver and Gold all the way to Platinum, and unlock badges along the way.",
    placement: "left",
    icon: "mdi:trophy-outline",
    color: "#fbbf24",
  },
  {
    targetId: "tour-leaderboard",
    title: "Leaderboard",
    narration:
      "Tap the Leaderboard card on the right to see who's earned the most IP this week, this month, or all-time. It sits right above your milestones so you always know how close you are to the top contributors.",
    placement: "left",
    icon: "mdi:trophy-outline",
    color: "#fbbf24",
  },
  {
    title: "You're all set",
    narration:
      "That's the quick tour. Vote, comment, mark helpful answers, and rack up IP. You can replay this tour any time from the info button.",
    icon: "mdi:rocket-launch-outline",
    color: "#a78bfa",
  },
];

export const PAGE_GUIDES: Record<string, PageGuideContent> = {
  "/community": {
    headerTitle: "What you can do in the Community",
    headerSubtitle: "Everything in one place. Take a quick guided tour or browse the list.",
    tourSteps: COMMUNITY_TOUR_STEPS,
    features: [
      {
        icon: "mdi:plus-circle-outline",
        color: "#6366f1",
        title: "Five post types",
        text: "Question, Poll, Resource, Discussion, Humor - each with its own template.",
      },
      {
        icon: "mdi:fire",
        color: "#f59e0b",
        title: "Bounties on questions",
        text: "Set IP rewards on your questions, claim them by accepting a helpful answer.",
      },
      {
        icon: "mdi:thumb-up-outline",
        color: "#22c55e",
        title: "Up to 3 helpful marks",
        text: "Thread author and moderators can mark up to three answers as helpful.",
      },
      {
        icon: "mdi:bookmark-outline",
        color: "#0ea5e9",
        title: "Bookmarks & Following",
        text: "Save posts for later, follow users and tags to build a personalized feed.",
      },
      {
        icon: "mdi:at",
        color: "#a78bfa",
        title: "Mentions and hashtags",
        text: "@username notifies them, #hashtag auto-creates a clickable filter.",
      },
      {
        icon: "mdi:flag-outline",
        color: "#ef4444",
        title: "Report & moderate",
        text: "Flag posts or comments - moderators see them in the admin panel.",
      },
      {
        icon: "mdi:trophy-outline",
        color: "#fbbf24",
        title: "IP, tiers, badges, leaderboard",
        text: "Earn IP for every action, climb through Silver/Gold/Platinum tiers.",
      },
    ],
    tip: "The guided tour reads aloud and highlights each feature on the page. Press the speaker toggle to read silently.",
  },
  "/adaptive-courses": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Adaptive Courses overview",
        narration: "Welcome to your Adaptive Courses. These AI-personalised courses adjust to your level in real time, giving you instant feedback as you practice. Let me walk you through the page.",
        placement: "bottom",
        icon: "mdi:book-education-outline",
        color: "#a78bfa",
      },
      {
        targetId: "adaptive-stats",
        title: "Your catalogue at a glance",
        narration: "This strip sums up everything available to you - how many courses, modules, adaptive articles and quizzes are ready for you to dive into.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#6366f1",
      },
      {
        targetId: "adaptive-levels",
        title: "Filter by difficulty",
        narration: "Use these level tabs to narrow the catalogue to a difficulty that suits you. Each tab shows a live count so you know how many courses match.",
        placement: "bottom",
        icon: "mdi:tune-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "adaptive-search",
        title: "Search, sort and switch views",
        narration: "Type here to search courses by title, description or audience, reorder them by recency, title or amount of content, and toggle between card and list layouts.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#f59e0b",
      },
      {
        targetId: "adaptive-grid",
        title: "Browse your courses",
        narration: "Every adaptive course lives here as a card. Click one to jump straight in - hovering quietly prefetches it so it opens instantly.",
        placement: "top",
        icon: "mdi:view-grid-outline",
        color: "#ec4899",
      },
      {
        title: "You're all set",
        narration: "That's the tour! Pick a course that matches your goals and start learning - the content adapts to you as you go. Good luck!",
        icon: "mdi:rocket-launch-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "Learn with courses that adapt to you",
    headerSubtitle: "Browse your adaptive courses, find the right level, and jump into practice that adjusts as you go.",
    features: [
      {
        icon: "mdi:book-education-outline",
        color: "#6366f1",
        title: "Browse your courses",
        text: "Every adaptive course you're enrolled in shows up as a card with its module, submodule, article, quiz, coding, and video counts.",
      },
      {
        icon: "mdi:rocket-launch-outline",
        color: "#a78bfa",
        title: "Open a course to practice",
        text: "Click any course to jump in and start learning content that adapts to your level in real time with instant feedback.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter by difficulty",
        text: "Use the level tabs to narrow the catalog to a specific difficulty, each showing a live count of matching courses.",
      },
      {
        icon: "mdi:magnify",
        color: "#ec4899",
        title: "Search the catalog",
        text: "Type in the search bar to find a course by its title, description, or intended audience.",
      },
      {
        icon: "mdi:sort",
        color: "#f59e0b",
        title: "Sort the list",
        text: "Reorder courses by most recently updated, title A-Z, or the ones packed with the most content.",
      },
      {
        icon: "mdi:view-grid-outline",
        color: "#22c55e",
        title: "Switch card or list view",
        text: "Toggle between roomy visual cards and a compact list to scan your courses however you prefer.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#fbbf24",
        title: "See the catalog at a glance",
        text: "The stats rail at the top totals the courses, modules, adaptive articles, and quizzes available to you.",
      },
    ],
    tip: "New to a topic? Start with the difficulty tab that matches your level - the course keeps adjusting as you go, so you're never stuck too easy or too hard.",
  },
  "/admin/adaptive-courses": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Adaptive Course Builder overview",
        narration: "This is your adaptive course library. Everything you generate from a prompt lives here, and you can spin up a brand-new AI course with the Generate button in the header.",
        placement: "bottom",
        icon: "mdi:robot-excited-outline",
        color: "#a78bfa",
      },
      {
        targetId: "adaptive-courses-stats",
        title: "Library at a glance",
        narration: "This strip sums up your whole catalogue - total courses, how many are published versus draft, and the adaptive quizzes and coding mentors baked into them.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#6366f1",
      },
      {
        targetId: "adaptive-courses-jobs",
        title: "Live generation progress",
        narration: "When the engine is building a course, its progress shows up here in real time. Click a job to jump into the detailed generation view and watch it fill in.",
        placement: "bottom",
        icon: "mdi:progress-clock",
        color: "#f59e0b",
      },
      {
        targetId: "adaptive-courses-view",
        title: "Switch your view",
        narration: "Flip between roomy cards and a compact list here, depending on whether you want visuals or a quick scan of every course.",
        placement: "left",
        icon: "mdi:view-grid-outline",
        color: "#0ea5e9",
      },
      {
        targetId: "adaptive-courses-list",
        title: "Your course library",
        narration: "Each card is a generated course - open it to edit the module tree, toggle publish so learners can see it, or delete it. The metrics show modules, quizzes, articles and more at a glance.",
        placement: "top",
        icon: "mdi:cards-outline",
        color: "#ec4899",
      },
      {
        title: "You're all set",
        narration: "That's the Adaptive Course Builder. Describe a course, let the engine assemble it, then publish it to your learners when it's ready.",
        icon: "mdi:check-circle-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "What you can do in the Adaptive Course Builder",
    headerSubtitle: "Generate AI-personalised courses from a prompt, then publish, organise, and track your whole library here.",
    features: [
      {
        icon: "mdi:auto-fix",
        color: "#a78bfa",
        title: "Generate an adaptive course",
        text: "Describe a course in a prompt and the engine builds the full module tree with an adaptive quiz per submodule.",
      },
      {
        icon: "mdi:progress-clock",
        color: "#0ea5e9",
        title: "Watch builds run live",
        text: "Active generations show a live progress bar with status and item count that refreshes as the AI works, and clicking one opens its job detail.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#ec4899",
        title: "Track your library at a glance",
        text: "A KPI rail tallies total courses, published, drafts, adaptive quizzes, and coding mentors across everything you've built.",
      },
      {
        icon: "mdi:cloud-upload-outline",
        color: "#22c55e",
        title: "Publish or unpublish",
        text: "Toggle each course between draft and published so learners only ever see the ones you've marked ready.",
      },
      {
        icon: "mdi:folder-open-outline",
        color: "#6366f1",
        title: "Open and edit any course",
        text: "Open a course to review and refine its modules, submodules, articles, quizzes, and coding and video content.",
      },
      {
        icon: "mdi:view-grid-outline",
        color: "#f59e0b",
        title: "Switch cards or list view",
        text: "Flip between a card grid and a compact list to scan or hunt through your courses quickly.",
      },
      {
        icon: "mdi:trash-can-outline",
        color: "#ef4444",
        title: "Delete safely",
        text: "Remove a course from the library while learner attempts on its quizzes stay fully intact.",
      },
    ],
    tip: "You can leave this page while a course is generating - the build keeps running on the server, and its live progress bar picks right back up the moment you return.",
  },
  "/admin/admin-mock-interview": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Mock Interview overview",
        narration: "Welcome to the AI mock interview admin console. From here you can review interview activity, drill into individual students, and inspect topic performance across your courses.",
        placement: "bottom",
        icon: "mdi:account-voice",
        color: "#ec4899",
      },
      {
        targetId: "mock-interview-tabs",
        title: "Switch between views",
        narration: "Use these tabs to move between the Overview dashboard, the full Interviews log, per-Student breakdowns, and Topic analytics. Each view refreshes its own data as you open it.",
        placement: "bottom",
        icon: "mdi:view-dashboard",
        color: "#6366f1",
      },
      {
        targetId: "mock-interview-published",
        title: "Published interviews",
        narration: "Jump to your interview templates to manage the published mock interviews students can take. This is where you configure the questions behind every session.",
        placement: "bottom",
        icon: "mdi:book-open-variant",
        color: "#a78bfa",
      },
      {
        targetId: "mock-interview-course",
        title: "Filter by course",
        narration: "Scope every tab to a single course with this dropdown. Pick a course to focus the dashboard, interviews, students, and topics on just that cohort, or leave it on all courses.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "mock-interview-timerange",
        title: "Choose your time range",
        narration: "Toggle between the last 7, 14, 30, or 90 days to reshape the overview metrics below. The stats and trends update instantly to match the window you select.",
        placement: "top",
        icon: "mdi:calendar-range",
        color: "#f59e0b",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Start on the Overview for a health check, then dive into Interviews, Students, or Topics whenever you need the details.",
        icon: "mdi:check-circle",
        color: "#22c55e",
      },
    ],
    headerTitle: "What you can do with AI mock interviews",
    headerSubtitle: "Track how students perform on AI mock interviews across your courses - from overall trends down to a single answer.",
    features: [
      {
        icon: "mdi:view-dashboard",
        color: "#6366f1",
        title: "Performance overview",
        text: "See total interviews, unique students, completion rate and average score alongside a daily created-vs-completed trend, difficulty split and top-performer leaderboard for your chosen time range.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter & search interviews",
        text: "Narrow the interview log by search text, status, difficulty, topic and date range, then sort by created date, duration, student, difficulty or status.",
      },
      {
        icon: "mdi:file-document-outline",
        color: "#a78bfa",
        title: "Open a full report",
        text: "Click View on any interview to drill into its detailed scorecard and question-by-question performance for that student.",
      },
      {
        icon: "mdi:account-group",
        color: "#ec4899",
        title: "Track each student",
        text: "Review every student's completed count, average and highest score, completion rate, topics attempted and last-interview date, then open their individual report.",
      },
      {
        icon: "mdi:book-open-variant",
        color: "#22c55e",
        title: "Topic analytics",
        text: "Break interviews down by topic and subtopic to compare attempts, unique students, average scores and the mix of Easy, Medium and Hard difficulty.",
      },
      {
        icon: "mdi:download",
        color: "#f59e0b",
        title: "Export to CSV",
        text: "Download the filtered interview list as a CSV to analyse or report on results outside the platform.",
      },
      {
        icon: "mdi:playlist-check",
        color: "#fbbf24",
        title: "Published interviews",
        text: "Jump to Published interviews to view and manage the interview templates students can take.",
      },
    ],
    tip: "Set the course filter at the top first - it carries across the Overview, Interviews, Students and Topics tabs, so every metric and CSV export reflects just that course.",
  },
  "/admin/certificates": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Certificate Uploads overview",
        narration: "Welcome to the Certificate Uploads hub. From here you attach and manage completion certificates for both your assessments and your courses in one place.",
        placement: "bottom",
        icon: "mdi:certificate",
        color: "#f59e0b",
      },
      {
        title: "Assessment certificates",
        narration: "This left panel lists every assessment you can attach a certificate to. Click any row to open its upload page and manage the certificate students receive on completion.",
        icon: "mdi:clipboard-text-outline",
        color: "#6366f1",
      },
      {
        targetId: "certificates-search",
        title: "Search to filter",
        narration: "Have a long list? Type here to filter by title or slug and jump straight to the assessment you need. The course panel has the same quick search.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#0ea5e9",
      },
      {
        title: "Course certificates",
        narration: "The right panel does the same for your courses. Pick a course to upload or update the certificate learners earn when they finish it.",
        icon: "mdi:school-outline",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Choose an assessment or course from either panel to start uploading and managing its completion certificates.",
        icon: "mdi:check-circle-outline",
        color: "#fbbf24",
      },
    ],
    headerTitle: "What you can do on Certificate Uploads",
    headerSubtitle: "Pick an assessment or course, then upload and manage the completion certificates your learners receive.",
    features: [
      {
        icon: "mdi:certificate-outline",
        color: "#6366f1",
        title: "Assessment certificates",
        text: "Browse all your assessments and open one to upload and manage the certificates awarded on completion.",
      },
      {
        icon: "mdi:school-outline",
        color: "#22c55e",
        title: "Course certificates",
        text: "Pick any course to manage the certificates learners earn when they finish it.",
      },
      {
        icon: "mdi:magnify",
        color: "#0ea5e9",
        title: "Instant search",
        text: "Filter the assessment list by title or slug and the course list by title or description to find the right one fast.",
      },
      {
        icon: "mdi:folder-open-outline",
        color: "#a78bfa",
        title: "Open a certificate manager",
        text: "Click any row to jump into that assessment's or course's dedicated certificate upload page.",
      },
      {
        icon: "mdi:lock-outline",
        color: "#f59e0b",
        title: "Module-aware panels",
        text: "The assessment and course panels appear only for the modules your workspace has enabled.",
      },
    ],
    tip: "Use the search box at the top of each panel to jump straight to the right assessment or course instead of scrolling the whole list.",
  },
  "/admin/certificates/assessment": {
    headerTitle: "Uploading assessment certificates",
    headerSubtitle: "Attach Participation and Excellence certificate files to this assessment so learners receive them on completion.",
    features: [
      {
        icon: "mdi:certificate-outline",
        color: "#6366f1",
        title: "Confirm the target",
        text: "See the assessment title and its slug at the top so you always upload to the right exam.",
      },
      {
        icon: "mdi:trophy-outline",
        color: "#fbbf24",
        title: "Participation or Excellence",
        text: "Toggle between a Participation certificate for completers and an Excellence certificate for top performers.",
      },
      {
        icon: "mdi:cloud-upload-outline",
        color: "#0ea5e9",
        title: "Drag, drop, or browse",
        text: "Drop a certificate onto the dropzone or click Select File to pick one from your computer.",
      },
      {
        icon: "mdi:file-document-outline",
        color: "#a78bfa",
        title: "PDF and image formats",
        text: "Upload the certificate as a PDF, PNG, JPEG, GIF, or WebP file, then remove and re-pick it anytime before committing.",
      },
      {
        icon: "mdi:upload",
        color: "#22c55e",
        title: "Upload and publish",
        text: "Click Upload to attach the file to the selected assessment and tier for learners to receive.",
      },
      {
        icon: "mdi:arrow-left",
        color: "#ec4899",
        title: "Back to the hub",
        text: "Return to the certificates hub to switch to another assessment or course.",
      },
    ],
    tip: "Switching the certificate type clears your selected file, so choose Participation or Excellence first, then pick the file you want to upload.",
  },
  "/admin/certificates/course": {
    headerTitle: "Uploading a certificate for this course",
    headerSubtitle: "Attach a completion or branding certificate file to this specific course and store it in your organization's space.",
    features: [
      {
        icon: "mdi:bookmark-check-outline",
        color: "#6366f1",
        title: "Confirm the destination",
        text: "The Upload destination card shows the course title and Course ID so you can confirm you're attaching the file to the right course before uploading.",
      },
      {
        icon: "mdi:cloud-upload-outline",
        color: "#a78bfa",
        title: "Drag and drop or browse",
        text: "Drop a file straight onto the upload zone or click Choose file to pick one from your computer, one file per upload.",
      },
      {
        icon: "mdi:file-document-outline",
        color: "#0ea5e9",
        title: "Supported file types",
        text: "Upload a PDF or an image (PNG, JPEG, GIF, or WebP) that stays within the size limit.",
      },
      {
        icon: "mdi:file-check-outline",
        color: "#f59e0b",
        title: "Review before you send",
        text: "Your selected file appears as a chip you can remove and re-pick until it looks right, keeping the Upload button disabled until a file is chosen.",
      },
      {
        icon: "mdi:certificate-outline",
        color: "#22c55e",
        title: "Upload to this course",
        text: "Click Upload to store the certificate asset for this course under your organization's server space, with a toast confirming success or flagging an error.",
      },
      {
        icon: "mdi:folder-multiple-outline",
        color: "#ec4899",
        title: "Back to the hub",
        text: "Use Certificate uploads in the header to return to the hub and manage assets for other courses and assessments.",
      },
    ],
    tip: "Double-check the course title on the Upload destination card before you hit Upload - the file is tied to this exact Course ID, so uploading under the wrong course means the intended students won't see it.",
  },
  "/admin/cohorts": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Cohorts overview",
        narration: "Welcome to Cohorts. This is where you group students into batches and manage their whole journey - from here you can spin up a new cohort with the button in the header.",
        placement: "bottom",
        icon: "mdi:account-group",
        color: "#a78bfa",
      },
      {
        targetId: "cohorts-stats",
        title: "At-a-glance stats",
        narration: "This strip gives you the pulse of your program: how many cohorts you have, how many are active, total members, and assignments mapped across them all.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#6366f1",
      },
      {
        targetId: "cohorts-tabs",
        title: "Filter by status",
        narration: "Use these tabs to slice cohorts by lifecycle stage - All, Active, Scheduled, Drafts, Completed, or Archived - with live counts so you can jump straight to what you need.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "cohorts-list",
        title: "Your cohorts",
        narration: "Every cohort lives here as a card. Click any one to open it and enroll students or map assessments, interviews, courses, and live sessions - or use the toggle to switch to a compact list view.",
        placement: "top",
        icon: "mdi:view-grid-outline",
        color: "#ec4899",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Create a cohort, filter to the stage you care about, and open a card to manage everyone inside. Your batches are just a click away.",
        icon: "mdi:check-circle-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "What you can do on Cohorts",
    headerSubtitle: "Group students into batches and run their assessments, interviews, courses and live sessions together.",
    features: [
      {
        icon: "mdi:plus-circle-outline",
        color: "#6366f1",
        title: "Create a cohort",
        text: "Click New cohort to spin up a batch with a name, optional code, status and start/end dates.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
        title: "See totals at a glance",
        text: "The stat strip totals your cohorts, active batches, enrolled members and mapped assignments across the page.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter by status",
        text: "Switch between All, Active, Scheduled, Drafts, Completed and Archived tabs, each showing a live count.",
      },
      {
        icon: "mdi:magnify",
        color: "#f59e0b",
        title: "Search cohorts",
        text: "Type in the search bar to find a batch by its name or code.",
      },
      {
        icon: "mdi:account-group",
        color: "#a78bfa",
        title: "Open a cohort to manage it",
        text: "Click any card or row to enroll students and map assessments, interviews, courses and live sessions to that batch.",
      },
      {
        icon: "mdi:view-grid-outline",
        color: "#ec4899",
        title: "Cards or list view",
        text: "Use the view toggle to see cohorts as rich cards or a compact list of rows.",
      },
      {
        icon: "mdi:archive-outline",
        color: "#ef4444",
        title: "Archive a cohort",
        text: "Archive a batch to remove it from the working set while keeping its member and assignment history.",
      },
    ],
    tip: "Give each cohort a stable Code like DS-2025-JAN when you create it - it makes the batch easy to find by search later and keeps your integrations mapped reliably.",
  },
  "/admin/dashboard": {
    tourSteps: [
      {
        title: "Admin Dashboard overview",
        narration: "Welcome to your Admin Dashboard. This is your command center for platform activity, engagement, and the key metrics that tell you how your learners are doing at a glance.",
        icon: "mdi:view-dashboard",
        color: "#6366f1",
      },
      {
        targetId: "dashboard-filters",
        title: "Filter and export",
        narration: "Narrow everything on this page to a single course, then switch between weekly, bi-monthly, and monthly windows. When you have the view you want, hit Download PDF to export a shareable report.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "dashboard-metrics",
        title: "Key metrics",
        narration: "These four cards give you the headline numbers: total students, active students, time spent, and average daily logins. Hover any card for a plain-language explanation of what it counts.",
        placement: "bottom",
        icon: "mdi:card-multiple-outline",
        color: "#22c55e",
      },
      {
        targetId: "dashboard-engagement",
        title: "Engagement and leaderboard",
        narration: "Track how much time your students spend over the selected period on the left, and see your top-ranked learners on the leaderboard to the right.",
        placement: "top",
        icon: "mdi:chart-line",
        color: "#a78bfa",
      },
      {
        targetId: "dashboard-attendance",
        title: "Attendance and sessions",
        narration: "Here you can follow attendance trends and see the times of day your live sessions typically start, so you can spot patterns in participation.",
        placement: "top",
        icon: "mdi:calendar-check",
        color: "#f59e0b",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Use the filters to focus on any course or time range, and export a PDF whenever you need to share the story behind these numbers.",
        icon: "mdi:rocket-launch",
        color: "#ec4899",
      },
    ],
    headerTitle: "What you can do on the Admin Dashboard",
    headerSubtitle: "Track platform activity, engagement, and student performance from one overview.",
    features: [
      {
        icon: "mdi:chart-box-outline",
        color: "#6366f1",
        title: "Key metrics at a glance",
        text: "See total students, active students, time spent, and average daily logins in four summary cards.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter by course",
        text: "Pick a specific course or view all courses together to scope every metric and chart on the page.",
      },
      {
        icon: "mdi:calendar-clock",
        color: "#a78bfa",
        title: "Switch the time window",
        text: "Toggle between weekly, bimonthly, and monthly to recalculate all totals, averages, and trends.",
      },
      {
        icon: "mdi:trophy-outline",
        color: "#fbbf24",
        title: "Student leaderboard",
        text: "Review your top-ranked students by activity and points in the ranking card beside the charts.",
      },
      {
        icon: "mdi:chart-line",
        color: "#22c55e",
        title: "Engagement charts",
        text: "Explore time-spent, daily activity, daily logins, and active-days charts to spot participation trends.",
      },
      {
        icon: "mdi:calendar-check-outline",
        color: "#ec4899",
        title: "Attendance analytics",
        text: "Track live-session attendance over time and see when sessions typically start.",
      },
      {
        icon: "mdi:file-pdf-box",
        color: "#f59e0b",
        title: "Export as PDF",
        text: "Download the full dashboard for your current filters as a shareable PDF report.",
      },
    ],
    tip: "Set your course and time window first - every metric, chart, and the PDF export all follow those two filters.",
  },
  "/admin/emails": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Emails overview",
        narration: "Welcome to your Emails hub. From here you can track every notification and reminder your platform has sent to students and cohorts, and jump straight to assessments to compose new ones.",
        placement: "bottom",
        icon: "mdi:email-multiple",
        color: "#0ea5e9",
      },
      {
        targetId: "emails-tabs",
        title: "Switch email streams",
        narration: "Use these tabs to flip between all outgoing emails and the assessment-specific ones. Each view loads its own jobs, so you can zero in on exactly the stream you care about.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#6366f1",
      },
      {
        targetId: "emails-stats",
        title: "Delivery at a glance",
        narration: "This summary strip tallies your total jobs alongside completed, pending, and failed counts, plus recipients on assessment emails, so you can gauge deliverability in a single glance.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#a78bfa",
      },
      {
        targetId: "emails-filters",
        title: "Search and filter",
        narration: "Type a subject or assessment name to find a specific send, and tap the status chips to narrow the list to just completed, pending, or failed jobs.",
        placement: "top",
        icon: "mdi:magnify",
        color: "#f59e0b",
      },
      {
        targetId: "emails-list",
        title: "Your email jobs",
        narration: "Every send lands here as a card showing its status and timing. Open any card to inspect the details, or retry a job that failed to reach its recipients.",
        placement: "top",
        icon: "mdi:email-multiple-outline",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the Emails hub. Keep an eye on the status counts, retry anything that failed, and head to assessments whenever you're ready to send the next round.",
        icon: "mdi:email-fast-outline",
        color: "#ec4899",
      },
    ],
    headerTitle: "Track every email your platform sends",
    headerSubtitle: "Monitor delivery of your student and assessment emails, spot failures at a glance, and re-send in one click.",
    features: [
      {
        icon: "mdi:email-multiple-outline",
        color: "#6366f1",
        title: "Two email streams",
        text: "Switch between the All emails and Assessment emails tabs to review general sends or assessment notifications separately.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#0ea5e9",
        title: "Delivery at a glance",
        text: "Read the KPI rail for a live count of total, completed, pending, and failed jobs, plus total recipients on the assessment tab.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#a78bfa",
        title: "Search and filter jobs",
        text: "Find a specific send by subject or assessment name, or tap a status chip to show only completed, pending, or failed jobs.",
      },
      {
        icon: "mdi:bell-ring-outline",
        color: "#f59e0b",
        title: "See what triggered each send",
        text: "Every card carries a provenance chip so you know whether it went out as a reminder, on publish, on create, or manually.",
      },
      {
        icon: "mdi:account-group",
        color: "#22c55e",
        title: "Per-job recipient counts",
        text: "Assessment email cards break down how many recipients were targeted, how many sent, and how many failed.",
      },
      {
        icon: "mdi:refresh",
        color: "#ef4444",
        title: "Retry failed sends",
        text: "Any job that failed shows a Retry button that re-queues the email without leaving the list.",
      },
      {
        icon: "mdi:eye-outline",
        color: "#fbbf24",
        title: "Open the full delivery detail",
        text: "Hit View on any card to drill into that job's complete status and recipient-level delivery record.",
      },
    ],
    tip: "Use the Failed status chip to surface every stuck send at once, then tap Retry right on each card to re-queue it-no need to open jobs one by one.",
  },
  "/admin/instructors": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Instructors overview",
        narration: "Welcome to the Instructors console. This is where you review instructor applications, approve or reject them, assign courses, and promote your team.",
        placement: "bottom",
        icon: "mdi:account-tie",
        color: "#6366f1",
      },
      {
        targetId: "instructors-stats",
        title: "Status at a glance",
        narration: "These cards show how many instructors are pending, approved, or rejected. Click any card to jump straight to that group.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#f59e0b",
      },
      {
        targetId: "instructors-tabs",
        title: "Switch between queues",
        narration: "Use these tabs to move between Pending, Approved, and Rejected instructors. The badge on each tab keeps a live count so you always know what needs attention.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#a78bfa",
      },
      {
        targetId: "instructors-search",
        title: "Find anyone fast",
        narration: "Type a name or email here to instantly filter the current list. Clear it with the X to see everyone again.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#0ea5e9",
      },
      {
        targetId: "instructors-table",
        title: "The instructor table",
        narration: "Every instructor in the selected queue appears here with their contact details, CV, and assigned courses. Use the row actions to approve, reject, assign courses, or promote.",
        placement: "top",
        icon: "mdi:table-account",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the Instructors workflow end to end. Start in Pending to clear new applications, then manage access from the Approved queue.",
        icon: "mdi:check-circle",
        color: "#fbbf24",
      },
    ],
    headerTitle: "Managing your instructors",
    headerSubtitle: "Review instructor applications, then approve, assign courses, and set access for your teaching team.",
    features: [
      {
        icon: "mdi:account-clock-outline",
        color: "#f59e0b",
        title: "Review applicants",
        text: "Approve or reject people in the Pending tab, adding an optional reason when you decline.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#6366f1",
        title: "Track by status",
        text: "Click the Pending, Approved, and Rejected cards to jump to each list with live counts.",
      },
      {
        icon: "mdi:file-pdf-box",
        color: "#0ea5e9",
        title: "Open applicant CVs",
        text: "Open each instructor's uploaded CV in a new tab to vet their background before you decide.",
      },
      {
        icon: "mdi:book-plus-multiple-outline",
        color: "#22c55e",
        title: "Assign courses",
        text: "Give approved instructors one or more courses through a searchable, multi-select picker with select-all.",
      },
      {
        icon: "mdi:shield-account-outline",
        color: "#a78bfa",
        title: "Promote to a role",
        text: "Elevate an approved instructor to Course Manager or Admin from their row menu.",
      },
      {
        icon: "mdi:refresh",
        color: "#ec4899",
        title: "Reopen rejected",
        text: "Move a rejected applicant back to Pending to give them another review.",
      },
      {
        icon: "mdi:magnify",
        color: "#fbbf24",
        title: "Search instructors",
        text: "Filter the current tab by name or email as you type to find someone fast.",
      },
    ],
    tip: "Assigning courses and promoting to a role only appear once an applicant is approved, so review the Pending tab first, then use the Approved row actions to grant course access.",
  },
  "/admin/jobs-v2": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Jobs overview",
        narration: "Welcome to Jobs. This is your hub for posting openings and curating opportunities for students. Let's walk through the key controls.",
        placement: "bottom",
        icon: "mdi:briefcase-search",
        color: "#0ea5e9",
      },
      {
        targetId: "jobs-v2-filter",
        title: "Filter by status",
        narration: "Use this dropdown to narrow the list to active, inactive, closed, completed, or on-hold jobs. Pick a status to instantly refine what you see below.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#6366f1",
      },
      {
        targetId: "jobs-v2-reports",
        title: "Jobs reports",
        narration: "Jump to detailed reports here to review applicant analytics and hiring outcomes across all your postings.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#a78bfa",
      },
      {
        targetId: "jobs-v2-list",
        title: "Your jobs list",
        narration: "Every job lives here with its status, visibility, courses, and applicant count. Click a row to open it, use the checkboxes to select several jobs for bulk status or visibility changes, or open the menu for quick edit and delete actions.",
        placement: "top",
        icon: "mdi:table-large",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Create a job from the header button, filter and manage everything from this list, and dive into reports whenever you need the numbers.",
        icon: "mdi:check-circle-outline",
        color: "#fbbf24",
      },
    ],
    headerTitle: "What you can do on Jobs",
    headerSubtitle: "Post roles, curate them for your students, and track who applies.",
    features: [
      {
        icon: "mdi:briefcase-plus-outline",
        color: "#6366f1",
        title: "Post a new job",
        text: "Use Create Job to open the builder and add a role with company details, courses, and an application deadline.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter by status",
        text: "Narrow the list to Active, Inactive, Closed, Completed, or On Hold roles from the status dropdown.",
      },
      {
        icon: "mdi:swap-horizontal",
        color: "#f59e0b",
        title: "Update status inline",
        text: "Change any job's status right from its row without opening the edit screen.",
      },
      {
        icon: "mdi:eye-outline",
        color: "#22c55e",
        title: "Publish or keep as draft",
        text: "Each job shows a Published or Draft badge so you control exactly when it becomes visible to students.",
      },
      {
        icon: "mdi:checkbox-multiple-marked-outline",
        color: "#a78bfa",
        title: "Bulk edit selected jobs",
        text: "Tick several jobs, then set a status and/or visibility and apply the change to all of them at once.",
      },
      {
        icon: "mdi:account-group",
        color: "#ec4899",
        title: "Track applicants",
        text: "See each job's applicant count and click through to review everyone who applied.",
      },
      {
        icon: "mdi:chart-line",
        color: "#fbbf24",
        title: "Open reports",
        text: "Jump to the Reports view for a broader look at hiring activity across your jobs.",
      },
    ],
    tip: "Jobs closing within 7 days show a \"days left\" badge on their closing date - publish drafts well before then so students have time to apply.",
  },
  "/admin/live-sessions": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Live Sessions overview",
        narration: "Welcome to Live Sessions, where you schedule and run your live classes and webinars. Use the Create Live Session button up here anytime to spin up a new meeting.",
        placement: "bottom",
        icon: "mdi:video-box",
        color: "#6366f1",
      },
      {
        targetId: "live-sessions-integrations",
        title: "Integrations & tools",
        narration: "Expand this strip to connect Zoom or Google Meet, and to manage your meeting presets and virtual backgrounds. The status dots tell you at a glance which providers are ready to go.",
        placement: "bottom",
        icon: "mdi:connection",
        color: "#0ea5e9",
      },
      {
        targetId: "live-sessions-stats",
        title: "Session stats",
        narration: "This summary strip gives you a quick pulse of your sessions: how many are upcoming, live right now, already completed, and how many are webinars.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#a78bfa",
      },
      {
        targetId: "live-sessions-filters",
        title: "Filter & switch views",
        narration: "Narrow the list to All, Upcoming, Live, or Past sessions here, and toggle between a card list and a full calendar month view on the right.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#f59e0b",
      },
      {
        targetId: "live-sessions-list",
        title: "Your sessions",
        narration: "Every scheduled class and webinar shows up here as a card. Click one to open its details, start or join the meeting, copy the passcode, or watch the recording.",
        placement: "top",
        icon: "mdi:calendar-clock",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Create a session, connect your provider, and manage everything from this one screen whenever you're ready.",
        icon: "mdi:check-circle-outline",
        color: "#ec4899",
      },
    ],
    headerTitle: "Run your live classes and webinars",
    headerSubtitle: "Schedule, connect, and run live classes and webinars, then track attendance and recordings from one place.",
    features: [
      {
        icon: "mdi:video-plus-outline",
        color: "#6366f1",
        title: "Create sessions & webinars",
        text: "Use Create Live Session to open the wizard and schedule a one-time or recurring class or webinar.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
        title: "Track at a glance",
        text: "The stat rail shows how many sessions are upcoming, live now, completed, and running as webinars.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#a78bfa",
        title: "Filter & switch views",
        text: "Filter by all, upcoming, live, or past, and flip between card grid, compact rows, or a month calendar.",
      },
      {
        icon: "mdi:video",
        color: "#ec4899",
        title: "Start, join & share",
        text: "Generate a Zoom or Google Meet link, start or join the call, and copy the passcode straight from a session card.",
      },
      {
        icon: "mdi:play-circle-outline",
        color: "#f59e0b",
        title: "Watch recordings in-app",
        text: "Play Zoom cloud and Google Meet Drive recordings in a built-in player without leaving the page.",
      },
      {
        icon: "mdi:connection",
        color: "#0ea5e9",
        title: "Connect Zoom & Google Meet",
        text: "In Integrations & tools, configure or one-click connect your providers and attach imported meetings from the inbox.",
      },
      {
        icon: "mdi:image-outline",
        color: "#fbbf24",
        title: "Presets & backgrounds",
        text: "Save reusable meeting presets and manage virtual backgrounds to keep every session consistent.",
      },
    ],
    tip: "Set up a provider first: the Integrations & tools strip auto-expands when Zoom isn't configured, so connect Zoom or Google Meet there before creating your first session and join links will generate automatically.",
  },
  "/admin/manage-students": {
    tourSteps: [
      {
        title: "Manage Students overview",
        narration: "Welcome to your student directory. From here you can search, filter, and act on every learner in your organisation, plus track bulk-enrolment jobs.",
        icon: "mdi:account-group",
        color: "#6366f1",
      },
      {
        targetId: "students-filters",
        title: "Search & filter",
        narration: "Start here to narrow the roster. Search by name or email, scope to specific courses, and filter by active status or whether a student has a saved resume.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "students-segments",
        title: "Health segments",
        narration: "Tap a segment chip to instantly surface at-risk, inactive, low-completion, or high-performing students. Use the info icon to see exactly how each segment is calculated.",
        placement: "bottom",
        icon: "mdi:heart-pulse",
        color: "#ec4899",
      },
      {
        targetId: "students-table",
        title: "Student directory",
        narration: "This is your main roster. Sort by marks, streak, completion, or attendance, page through results, and select rows to run bulk course actions.",
        placement: "top",
        icon: "mdi:table-account",
        color: "#a78bfa",
      },
      {
        targetId: "students-enrollment-jobs",
        title: "Enrolment job history",
        narration: "After a bulk enrolment, track its progress here. Each job shows its status so you can confirm students were added successfully.",
        placement: "top",
        icon: "mdi:clipboard-flow-outline",
        color: "#f59e0b",
      },
      {
        title: "You're all set",
        narration: "That's the Manage Students page. Filter down to the learners you care about, watch the health segments, and enrol students in a few clicks.",
        icon: "mdi:check-circle-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "Your student roster, all in one place",
    headerSubtitle: "Find, filter, enroll, and track every learner in your workspace - then act on many at once.",
    features: [
      {
        icon: "mdi:account-plus",
        color: "#22c55e",
        title: "Add a student",
        text: "Use Add student to create a learner by name, email, and phone and enroll them into courses right away.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#6366f1",
        title: "Filter and search",
        text: "Narrow the roster by enrolled course, active status, or saved-resume, or type a name or email to search instantly.",
      },
      {
        icon: "mdi:heart-pulse",
        color: "#f59e0b",
        title: "Engagement segments",
        text: "Tap At risk, Inactive 30d, Low completion, or High performers to surface the students who need attention.",
      },
      {
        icon: "mdi:sort",
        color: "#a78bfa",
        title: "Sort the directory",
        text: "Sort the table by marks, last activity, time spent, streak, completion %, or attendance % to rank learners any way you need.",
      },
      {
        icon: "mdi:checkbox-multiple-marked-outline",
        color: "#0ea5e9",
        title: "Bulk manage students",
        text: "Select multiple rows to enroll or unenroll them from courses, activate, deactivate, or reset progress in one action.",
      },
      {
        icon: "mdi:history",
        color: "#ec4899",
        title: "Enrollment job history",
        text: "Watch background bulk-enrollment jobs run and expand any job to review its per-student results.",
      },
      {
        icon: "mdi:file-export-outline",
        color: "#fbbf24",
        title: "Export to CSV",
        text: "Export your selected students to a CSV with their name, email, status, and enrollment counts.",
      },
    ],
    tip: "Your filters, sort, and page are saved right in the URL - copy the address bar to hand a teammate the exact same filtered view, and hitting Back from a student keeps your list exactly where it was.",
  },
  "/admin/notifications": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Notifications overview",
        narration: "This is where you compose and send in-app notifications to your learners. Walk through it once and you'll be broadcasting messages in seconds.",
        placement: "bottom",
        icon: "mdi:bell-badge",
        color: "#0ea5e9",
      },
      {
        targetId: "notifications-recipients",
        title: "Choose your recipients",
        narration: "Start here by picking who receives the notification: a handful of individual students, everyone enrolled in a course, or every learner in your client.",
        placement: "bottom",
        icon: "mdi:account-group",
        color: "#6366f1",
      },
      {
        targetId: "notifications-audience",
        title: "Audience summary",
        narration: "This chip always shows exactly who's targeted right now, so you can confirm the reach before you hit send.",
        placement: "bottom",
        icon: "mdi:target-account",
        color: "#a78bfa",
      },
      {
        targetId: "notifications-content",
        title: "Write your message",
        narration: "Give your notification a title and body, add an optional action URL, and use the quick-link chips to point learners straight at a course, jobs, or their dashboard.",
        placement: "top",
        icon: "mdi:message-text",
        color: "#ec4899",
      },
      {
        targetId: "notifications-send",
        title: "Send it out",
        narration: "When everything checks out, click here to deliver the notification instantly to your chosen audience. The button stays disabled until the required fields are filled.",
        placement: "top",
        icon: "mdi:send",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the full flow: choose recipients, confirm the audience, craft your message, and send. Come back anytime you need to reach your learners.",
        icon: "mdi:check-circle",
        color: "#fbbf24",
      },
    ],
    headerTitle: "Reach your students with in-app notifications",
    headerSubtitle: "Compose a notification and push it to specific students, a whole course, or everyone in your client.",
    features: [
      {
        icon: "mdi:account-group",
        color: "#6366f1",
        title: "Choose your recipients",
        text: "Toggle between sending to individual students, everyone in a course, or all students in your client.",
      },
      {
        icon: "mdi:format-list-checks",
        color: "#a78bfa",
        title: "Pick specific students",
        text: "Search the student list and tick individuals, or use Select all to reach everyone at once.",
      },
      {
        icon: "mdi:message-text-outline",
        color: "#0ea5e9",
        title: "Write title and message",
        text: "Add a title (up to 100 characters) and a message (up to 500) with live character counters as you type.",
      },
      {
        icon: "mdi:link-variant",
        color: "#f59e0b",
        title: "Add a click-through link",
        text: "Set an optional Action URL so tapping the notification opens the right page, or use a quick-link chip like Courses or Jobs.",
      },
      {
        icon: "mdi:eye-outline",
        color: "#22c55e",
        title: "Preview before you send",
        text: "See exactly how the title and message will appear to students in a live preview card.",
      },
      {
        icon: "mdi:send",
        color: "#ec4899",
        title: "Send in one click",
        text: "The recipient chip confirms who will receive it, then Send Notification delivers it instantly.",
      },
    ],
    tip: "Tap a quick-link chip (Dashboard, Courses, Jobs, and more) to fill the Action URL instantly, so students land exactly where you want when they click the notification.",
  },
  "/admin/scorecard": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Scorecard overview",
        narration: "Welcome to the Scorecard workspace. From here you can review any student's performance and readiness in one place, and tailor what appears on their scorecard.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
      },
      {
        targetId: "scorecard-stats",
        title: "At-a-glance stats",
        narration: "This rail keeps you oriented: how many students you can pull up, how many scorecard sections exist, and how many modules are currently visible to students.",
        placement: "bottom",
        icon: "mdi:view-dashboard-outline",
        color: "#6366f1",
      },
      {
        targetId: "scorecard-tabs",
        title: "Switch views",
        narration: "Toggle between the Scorecard view for inspecting a student and the Config view where you choose which sections show. Your current tab is highlighted here.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#0ea5e9",
      },
      {
        targetId: "scorecard-search",
        title: "Find a student",
        narration: "Search by name or email to pull up any student's full scorecard. Once selected, their overview, trends, skills, and more render right below.",
        placement: "top",
        icon: "mdi:account-search",
        color: "#a78bfa",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Pick a student to explore their scorecard, or head to Config to control which sections everyone sees.",
        icon: "mdi:check-circle",
        color: "#fbbf24",
      },
    ],
    headerTitle: "What you can do on the Scorecard",
    headerSubtitle: "Search any student and open a full readiness scorecard - skills, assessments, activity, and next steps - then tune which sections show.",
    features: [
      {
        icon: "mdi:account-search",
        color: "#6366f1",
        title: "Find a student",
        text: "Search by name or email to pull up any student's readiness scorecard.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
        title: "Full readiness scorecard",
        text: "Open a student to read their overview, achievements, and a recommended action panel in one scroll.",
      },
      {
        icon: "mdi:bullseye-arrow",
        color: "#a78bfa",
        title: "Skills and weak areas",
        text: "See a skill-by-skill scorecard alongside the weak areas that need the most attention.",
      },
      {
        icon: "mdi:clipboard-check-outline",
        color: "#0ea5e9",
        title: "Assessment and mock interview",
        text: "Track assessment scores and mock-interview performance trends for the selected student.",
      },
      {
        icon: "mdi:calendar-heart",
        color: "#f59e0b",
        title: "Activity and consistency",
        text: "Review a year-long activity heatmap plus behavioral and consistency metrics.",
      },
      {
        icon: "mdi:chart-line",
        color: "#ec4899",
        title: "Comparative insights",
        text: "Benchmark a student against their cohort with performance-trend and comparative-insight sections.",
      },
      {
        icon: "mdi:eye-settings-outline",
        color: "#fbbf24",
        title: "Configure visible modules",
        text: "Switch to the Configuration tab to toggle sections on or off and drag to reorder them across every scorecard.",
      },
    ],
    tip: "Your Configuration-tab choices apply to every student's scorecard - drag the sections that matter most to the top so they read first, then hit Save Module Settings.",
  },
  "/admin/scorecard/badges": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Achievement Badges overview",
        narration: "Welcome to the Achievement Badges workspace. Here you author badges with the criteria DSL, and learners auto-earn them through post-save signals throttled to every five minutes. Use New badge in the top right to start one from scratch.",
        placement: "bottom",
        icon: "mdi:trophy-award",
        color: "#f59e0b",
      },
      {
        targetId: "badges-subnav",
        title: "Scorecard sections",
        narration: "Jump between the scorecard admin sections from this sub-nav. You're currently on Badges, but you can hop to the other scorecard tools without leaving the workspace.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#6366f1",
      },
      {
        targetId: "badges-stats",
        title: "Program at a glance",
        narration: "These chips give you the live totals: how many badges exist, how many awards have been handed out, and the combined point value across every badge. Watch them shift as you create or deactivate badges.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
      },
      {
        targetId: "badges-list",
        title: "Your badge catalog",
        narration: "Every badge lives in this table with its criteria summary, point value, and how many learners have earned it. Use the row actions to edit a badge or deactivate it while keeping the earned history intact.",
        placement: "top",
        icon: "mdi:medal-outline",
        color: "#a78bfa",
      },
      {
        title: "You're all set",
        narration: "That's the badges workspace. Create a new badge, tune its criteria, and let the automatic signals reward your learners as they hit each milestone.",
        icon: "mdi:check-decagram",
        color: "#fbbf24",
      },
    ],
    headerTitle: "Design and award achievement badges",
    headerSubtitle: "Author badge rules, set their points, and let learners earn them automatically as they hit milestones.",
    features: [
      {
        icon: "mdi:plus-circle-outline",
        color: "#f59e0b",
        title: "Create a badge",
        text: "Click \"New badge\" to author one with a name, description, icon, and point value in the editor dialog.",
      },
      {
        icon: "mdi:target-variant",
        color: "#6366f1",
        title: "Set the award criteria",
        text: "Pick from seven rule types - active-day streak, assessments completed, mock interviews, skill proficiency, course completion, first submission, or overall score - and fill in its thresholds.",
      },
      {
        icon: "mdi:medal-outline",
        color: "#a78bfa",
        title: "Choose an icon and points",
        text: "Paste any MDI/Iconify slug for the badge glyph and set how many points earning it awards the learner.",
      },
      {
        icon: "mdi:lightning-bolt-outline",
        color: "#0ea5e9",
        title: "Auto-awards to learners",
        text: "Saved badges fire on post-save signals so qualifying learners earn them automatically, throttled to every 5 minutes.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
        title: "Track program totals",
        text: "Three chips summarise your total badges, awards given, and total points across the whole catalog.",
      },
      {
        icon: "mdi:counter",
        color: "#fbbf24",
        title: "See awards per badge",
        text: "The roster table shows each badge's criteria summary and how many learners have earned it so far.",
      },
      {
        icon: "mdi:archive-outline",
        color: "#ef4444",
        title: "Edit or deactivate",
        text: "Update a badge's rule anytime, or deactivate it while keeping every already-earned award intact.",
      },
    ],
    tip: "Awards run on a throttled signal roughly every 5 minutes, so a brand-new badge won't appear on learner scorecards instantly - give it a few minutes before assuming the rule isn't matching. For skill or course rules, grab the exact Skill ID or Course ID from those admin pages before you save.",
  },
  "/admin/scorecard/skills": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Skill Catalog overview",
        narration: "Welcome to the Skill Catalog. This is where you manage every skill and tag content across the platform so it can feed each learner's Scorecard, Weak Areas, and Action Panel. Use the header buttons to tag content or spin up a brand-new skill.",
        placement: "bottom",
        icon: "mdi:label-multiple-outline",
        color: "#6366f1",
      },
      {
        targetId: "skills-stats",
        title: "Catalog at a glance",
        narration: "This strip gives you a live pulse of the catalog: how many skills and categories exist, the total content mappings, and how many skills are still untagged. Watch the Untagged count turn amber when there is tagging work to do.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#0ea5e9",
      },
      {
        targetId: "skills-filters",
        title: "Search and filter",
        narration: "Narrow the list fast here. Type to search skills by name or category, or tap a category chip to focus on just that group. Everything below updates instantly as you refine.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#a78bfa",
      },
      {
        targetId: "skills-table",
        title: "Your skills, row by row",
        narration: "Every skill lives in this table with its category, mapping count, and last-updated date. Hover a mapping chip to see how much content it covers, and use the archive action to soft-delete a skill while keeping its history.",
        placement: "top",
        icon: "mdi:table-large",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the Skill Catalog. Create skills, tag content to them, and keep an eye on the untagged count to make sure every learner's scorecard stays rich and accurate.",
        icon: "mdi:check-decagram",
        color: "#fbbf24",
      },
    ],
    headerTitle: "Managing your Skill Catalog",
    headerSubtitle: "Create skills, tag content to them, and see everything that feeds each learner's Scorecard.",
    features: [
      {
        icon: "mdi:plus-circle-outline",
        color: "#22c55e",
        title: "Create a skill",
        text: "Add a new skill with a name and an optional category like Frontend, DSA, or Behavioral.",
      },
      {
        icon: "mdi:tag-text-outline",
        color: "#6366f1",
        title: "Tag content with skills",
        text: "Open Tag content to browse MCQs, coding problems, videos, articles, and assessments, then click any row to attach skills.",
      },
      {
        icon: "mdi:counter",
        color: "#0ea5e9",
        title: "Track coverage at a glance",
        text: "Summary chips show your total skills, categories, mappings, and how many skills are still untagged.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#a78bfa",
        title: "Search and filter",
        text: "Find skills by name or category, or narrow the catalog with the category filter chips.",
      },
      {
        icon: "mdi:link-variant",
        color: "#f59e0b",
        title: "See mapping counts",
        text: "Each row shows how many content items are tagged with that skill and when it was last updated.",
      },
      {
        icon: "mdi:archive-outline",
        color: "#ef4444",
        title: "Archive safely",
        text: "Soft-delete a skill to hide it from learners and admins while keeping its existing mappings and history.",
      },
      {
        icon: "mdi:gauge",
        color: "#fbbf24",
        title: "Powers the Scorecard",
        text: "Everything you tag here feeds the Skill Scorecard, Weak Areas, and Action Panel that every learner sees.",
      },
    ],
    tip: "Watch the Untagged stat: a skill with zero mappings contributes nothing to any learner's Scorecard, so use Tag content to attach it to real MCQs, problems, videos, or assessments.",
  },
  "/admin/settings": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Settings overview",
        narration: "Welcome to your workspace Settings. From here you shape how your app looks to learners and admins, then use the Save changes button in this header to apply everything at once.",
        placement: "bottom",
        icon: "mdi:cog-outline",
        color: "#6366f1",
      },
      {
        title: "App logo",
        narration: "Paste a hosted image URL here to set the logo that appears in the sidebar and on the login page. A small preview shows up as soon as you add a valid link.",
        icon: "mdi:image-outline",
        color: "#a78bfa",
      },
      {
        title: "Favicon",
        narration: "Upload the little square icon that shows in the browser tab. A PNG, ICO, or SVG of 32x32 or larger works best.",
        icon: "mdi:star-circle-outline",
        color: "#f59e0b",
      },
      {
        title: "Login page text",
        narration: "Write the tagline that sits beside your logo on the sign-in screen. Keep it short and welcoming to greet learners as they arrive.",
        icon: "mdi:text-box-outline",
        color: "#ec4899",
      },
      {
        targetId: "settings-preview",
        title: "Live preview",
        narration: "Watch your branding come together in real time here. As you type, this panel mirrors the browser tab and login screen so you know exactly what learners will see.",
        placement: "left",
        icon: "mdi:eye-outline",
        color: "#0ea5e9",
      },
      {
        title: "You're all set",
        narration: "That's the Settings page. Tweak your logo, favicon, and login text, glance at the live preview, then hit Save changes to publish your branding.",
        icon: "mdi:check-circle-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "Make the app look like yours",
    headerSubtitle: "Set your logo, favicon, and login tagline, preview them live, and control what students see - all for this tenant.",
    features: [
      {
        icon: "mdi:image-outline",
        color: "#6366f1",
        title: "App logo",
        text: "Paste a hosted image URL (PNG, SVG, JPG) to set the logo shown in the sidebar and on the login page.",
      },
      {
        icon: "mdi:star-circle-outline",
        color: "#f59e0b",
        title: "Favicon",
        text: "Upload a square PNG, ICO, or SVG to set the small icon that appears in the browser tab.",
      },
      {
        icon: "mdi:text-box-outline",
        color: "#0ea5e9",
        title: "Login page text",
        text: "Write the tagline that appears beside your logo on the login screen.",
      },
      {
        icon: "mdi:eye-outline",
        color: "#a78bfa",
        title: "Live preview",
        text: "Watch a mock browser tab and login screen update as you type, so you see exactly how your branding lands.",
      },
      {
        icon: "mdi:eye-off-outline",
        color: "#ec4899",
        title: "Student course visibility",
        text: "Toggle whether students see the Available Courses tab or only their enrolled courses, applied to every student in this tenant.",
      },
      {
        icon: "mdi:content-save-outline",
        color: "#22c55e",
        title: "Save changes",
        text: "Use the Save changes button in the header to apply your logo, favicon, and tagline all at once.",
      },
    ],
    tip: "Nothing goes live until you click Save changes in the header - even an uploaded favicon waits for a save. Note that colours are set platform-wide and can't be changed per client.",
  },
  "/admin/tickets": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Ticket Management overview",
        narration: "Welcome to your support desk. This is where you triage and resolve every student ticket, and if you're an org admin the Assignees button up here lets you choose which mailboxes get notified.",
        placement: "bottom",
        icon: "mdi:ticket-confirmation-outline",
        color: "#f59e0b",
      },
      {
        targetId: "tickets-stats",
        title: "Status at a glance",
        narration: "These tiles count your Open, In Progress, and Resolved tickets, plus an All total. Tap any tile to instantly filter the queue below to just that status.",
        placement: "bottom",
        icon: "mdi:counter",
        color: "#6366f1",
      },
      {
        targetId: "tickets-filters",
        title: "Search and filter",
        narration: "Narrow things down here: search by subject, description, or student email, filter by status or category, and flip the Reopened-only toggle to surface tickets that were reopened.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "tickets-table",
        title: "The ticket queue",
        narration: "Every matching ticket lands in this table with its sender, category, status, and date. Click any row to open the full conversation and reply, and use the pager below to move through pages.",
        placement: "top",
        icon: "mdi:format-list-bulleted",
        color: "#a78bfa",
      },
      {
        title: "You're all set",
        narration: "That's the ticket dashboard end to end. Pick a status tile, search for what you need, and dive into any ticket to keep your students unblocked.",
        icon: "mdi:check-circle-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "Working the support ticket queue",
    headerSubtitle: "Triage, filter, and resolve the support tickets your students raise, all from one dashboard.",
    features: [
      {
        icon: "mdi:ticket-confirmation-outline",
        color: "#f59e0b",
        title: "Triage by status",
        text: "Tap the Open, In Progress, Resolved, or All cards to see live counts and instantly filter the queue to that status.",
      },
      {
        icon: "mdi:magnify",
        color: "#0ea5e9",
        title: "Search any ticket",
        text: "Find a ticket fast by typing part of its subject, description, or the student's email address.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#6366f1",
        title: "Filter by category",
        text: "Narrow the list to a specific ticket category alongside the status filter to zero in on what you need.",
      },
      {
        icon: "mdi:lock-reset",
        color: "#ef4444",
        title: "Catch reopened tickets",
        text: "Toggle the Reopened only chip to surface tickets a student has reopened so nothing slips through.",
      },
      {
        icon: "mdi:open-in-app",
        color: "#a78bfa",
        title: "Open and resolve",
        text: "Click any row to open the full ticket thread where you can reply and move it toward resolved.",
      },
      {
        icon: "mdi:account-group",
        color: "#22c55e",
        title: "Manage assignees",
        text: "Add or remove the email addresses that get notified every time a student raises a new ticket.",
      },
    ],
    tip: "Add a shared inbox like support@yourcompany.com under Assignees so every new ticket reaches your whole team, not just one person.",
  },
  "/assessments": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Assessments overview",
        narration: "Welcome to your assessment center. This is where every quiz and test assigned across your courses lives, so you can take them and review your scores in one place.",
        placement: "bottom",
        icon: "mdi:file-document-edit",
        color: "#6366f1",
      },
      {
        targetId: "assessments-nextup",
        title: "Your next move",
        narration: "This smart band always surfaces the single most important thing to do right now - resume an attempt already in progress or start the assessment that's closing soonest. Hit the button to jump straight in.",
        placement: "bottom",
        icon: "mdi:star-four-points",
        color: "#a78bfa",
      },
      {
        targetId: "assessments-stats",
        title: "Progress at a glance",
        narration: "These tiles keep a running count of what's available now, what's under review, what you've completed, and your total assessments - a quick pulse on where you stand.",
        placement: "bottom",
        icon: "mdi:lightning-bolt",
        color: "#22c55e",
      },
      {
        targetId: "assessments-tabs",
        title: "Filter by status",
        narration: "Switch between All, Available, Under review, Completed, and Expired to zero in on exactly the assessments you care about. Each tab shows its own live count.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#0ea5e9",
      },
      {
        targetId: "assessments-search",
        title: "Search and sort",
        narration: "Type here to find an assessment by title or description, and use the Sort control on the right to reorder by most recent, oldest, or title A-Z.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#f59e0b",
      },
      {
        targetId: "assessments-grid",
        title: "Your assessment grid",
        narration: "Every assessment matching your filters appears here as a card. Open one to see the details, start your attempt, or review your results and feedback.",
        placement: "top",
        icon: "mdi:view-grid",
        color: "#ec4899",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Check your next-up band whenever you land here, filter down to what you need, and keep an eye on those status counts as you work through your assessments.",
        icon: "mdi:check-circle",
        color: "#fbbf24",
      },
    ],
    headerTitle: "Take and track every assessment",
    headerSubtitle: "Every quiz and test assigned across your courses, with your scores and feedback in one place.",
    features: [
      {
        icon: "mdi:star-four-points-outline",
        color: "#6366f1",
        title: "Jump to what's next",
        text: "The highlighted banner surfaces the one thing to do now - resume an attempt in progress or start the assessment closing soonest - with a single tap.",
      },
      {
        icon: "mdi:counter",
        color: "#0ea5e9",
        title: "See your progress",
        text: "A stat strip shows how many assessments are available now, under review, completed, and total at a glance.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#a78bfa",
        title: "Filter by status",
        text: "Switch between All, Available, Under review, Completed, and Expired tabs to focus on exactly what matters.",
      },
      {
        icon: "mdi:magnify",
        color: "#f59e0b",
        title: "Search and sort",
        text: "Find an assessment by title or description and sort by most recent, oldest first, or title A-Z.",
      },
      {
        icon: "mdi:clipboard-text-outline",
        color: "#ec4899",
        title: "Check the details first",
        text: "Each card shows the question count, duration, sections, deadline, and badges like Proctored, Manual eval, or Psychometric.",
      },
      {
        icon: "mdi:play-circle-outline",
        color: "#22c55e",
        title: "Start, resume, or review",
        text: "Begin a new attempt, pick up where you left off, open your scored results, or re-attempt when it's allowed.",
      },
      {
        icon: "mdi:calendar-clock",
        color: "#ef4444",
        title: "Stay ahead of deadlines",
        text: "A days-left countdown and red \"Due soon\" flags warn you before an open assessment expires.",
      },
    ],
    tip: "Finished a manually-graded assessment? It stays under \"Under review\" until your instructor publishes the score - then it moves to Completed with your full results and feedback.",
  },
  "/courses": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Courses overview",
        narration: "Welcome to your course catalog. This is where you browse every course, jump back into what you're enrolled in, and discover something new to learn.",
        placement: "bottom",
        icon: "mdi:book-open-variant",
        color: "#6366f1",
      },
      {
        targetId: "courses-stats",
        title: "Your catalog at a glance",
        narration: "These cards give you a quick snapshot: how many courses exist in total, how many you're already enrolled in, and how many are still available to join.",
        placement: "bottom",
        icon: "mdi:chart-box",
        color: "#22c55e",
      },
      {
        targetId: "courses-tabs",
        title: "Filter by enrollment",
        narration: "Use these tabs to switch between all courses, just the ones you're enrolled in, or everything still available to you. The counts update as you go.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#a78bfa",
      },
      {
        targetId: "courses-search",
        title: "Search, sort and switch views",
        narration: "Type here to search by title or description, reorder results by most recent or alphabetically, and toggle between card and list layouts to suit how you browse.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#0ea5e9",
      },
      {
        targetId: "courses-filters",
        title: "Narrow it down",
        narration: "Open the advanced filters to drill into specific categories or filter by free versus paid courses. Hit Clear all whenever you want to start fresh.",
        placement: "top",
        icon: "mdi:filter-variant",
        color: "#f59e0b",
      },
      {
        targetId: "courses-grid",
        title: "Your courses",
        narration: "Every matching course shows up here. Click any card to dive into its lessons, or enroll right from the tile if you haven't joined yet.",
        placement: "top",
        icon: "mdi:view-grid",
        color: "#ec4899",
      },
      {
        title: "Happy learning!",
        narration: "That's the tour. Explore the catalog, enroll in what excites you, and pick up right where you left off any time.",
        icon: "mdi:rocket-launch",
        color: "#fbbf24",
      },
    ],
    headerTitle: "Find, enroll in, and track your courses",
    headerSubtitle: "Browse the full catalog, join new courses, and pick up every enrolled course right where you left off.",
    features: [
      {
        icon: "mdi:magnify",
        color: "#6366f1",
        title: "Search the catalog",
        text: "Type in the search bar to find any course instantly by its title or description.",
      },
      {
        icon: "mdi:plus-circle-outline",
        color: "#22c55e",
        title: "Enroll or check out",
        text: "Join free courses in a single tap, or open secure checkout to unlock a paid one.",
      },
      {
        icon: "mdi:play-circle-outline",
        color: "#a78bfa",
        title: "Continue where you left off",
        text: "Enrolled courses show a live progress percentage and a Continue Learning button to jump back in.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter by status",
        text: "Switch the All, Enrolled, and Available tabs to focus on courses you're taking or ones still open to join.",
      },
      {
        icon: "mdi:tag-multiple-outline",
        color: "#f59e0b",
        title: "Refine by category and price",
        text: "Narrow the grid with the advanced category and Free/Paid filters, then clear them all in one click.",
      },
      {
        icon: "mdi:view-grid-outline",
        color: "#ec4899",
        title: "Switch view and sort",
        text: "Toggle between card and list layouts and sort by most recent, oldest, or title A-Z.",
      },
      {
        icon: "mdi:chart-box-outline",
        color: "#fbbf24",
        title: "See your totals at a glance",
        text: "The summary cards up top count your total, enrolled, and still-available courses.",
      },
    ],
    tip: "Filters stack - combine the Available tab, a category, and the Free price option to surface every no-cost course you haven't started yet.",
  },
  "/jobs-v2": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Jobs overview",
        narration: "Welcome to your Jobs board. Here you can discover roles matched to you, filter by what matters, and track every application in one place.",
        placement: "bottom",
        icon: "mdi:briefcase-search",
        color: "#fbbf24",
      },
      {
        targetId: "jobs-search",
        title: "Search roles",
        narration: "Start here to search by title, company, or keyword, and narrow by location and experience. Hit search and the board updates instantly.",
        placement: "bottom",
        icon: "mdi:magnify",
        color: "#0ea5e9",
      },
      {
        targetId: "jobs-filters",
        title: "Refine results",
        narration: "Use this sidebar to fine-tune your results by job type, employment type, and skills. Clear everything anytime to start fresh.",
        placement: "right",
        icon: "mdi:filter-variant",
        color: "#6366f1",
      },
      {
        targetId: "jobs-tabs",
        title: "Browse or track",
        narration: "Switch between Browse Jobs to explore new openings and Applied Jobs to keep an eye on the roles you have already applied to.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#a78bfa",
      },
      {
        targetId: "jobs-results",
        title: "Your matched jobs",
        narration: "Your matched roles appear here. Flip between card and list views, choose how many to show per page, and page through the results.",
        placement: "top",
        icon: "mdi:view-list",
        color: "#22c55e",
      },
      {
        title: "You are all set",
        narration: "That is the Jobs board in a nutshell. Search, refine, and apply, then come back to the Applied tab to track your progress.",
        icon: "mdi:check-circle",
        color: "#ec4899",
      },
    ],
    headerTitle: "Find your next role on Jobs",
    headerSubtitle: "Browse curated openings, filter to what fits you, and track every application from one board.",
    features: [
      {
        icon: "mdi:briefcase-search",
        color: "#0ea5e9",
        title: "Browse matched roles",
        text: "Scroll job cards showing company, location, experience, passout year, salary, required skills, and how recently each was posted.",
      },
      {
        icon: "mdi:magnify",
        color: "#6366f1",
        title: "Search precisely",
        text: "Search by role, company, or skill and narrow it down by location and years of experience right from the top search bar.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#a78bfa",
        title: "Refine with filters",
        text: "Filter the list by job type, employment type, location, and specific skills, then hit Clear All to reset in one tap.",
      },
      {
        icon: "mdi:heart-outline",
        color: "#ec4899",
        title: "Save your favourites",
        text: "Tap the heart on any job card to save that role to your favourites and come back to it later.",
      },
      {
        icon: "mdi:file-document-outline",
        color: "#f59e0b",
        title: "Open full details",
        text: "Click View Details on any job to read the complete description and apply for the position.",
      },
      {
        icon: "mdi:progress-check",
        color: "#22c55e",
        title: "Track your applications",
        text: "Switch to the Applied Jobs tab to watch each application's live status move from Applied through Shortlisted, Interview Stage, and Selected.",
      },
      {
        icon: "mdi:trophy-outline",
        color: "#fbbf24",
        title: "Celebrate placements",
        text: "Any role you're selected for is spotlighted at the top in a Final Placement banner.",
      },
    ],
    tip: "In the Applied Jobs tab, use the status chips to filter and the Sort menu (Newest, Oldest, Company A-Z) to zero in on the applications that are actually moving. Prefer a denser list? Use the card/list view toggle above the results.",
  },
  "/live-sessions": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Live Sessions overview",
        narration: "Welcome to Live Sessions. This is your hub for joining upcoming live classes and webinars and catching up on past recordings whenever you like.",
        placement: "bottom",
        icon: "mdi:video-box",
        color: "#6366f1",
      },
      {
        targetId: "live-sessions-stats",
        title: "Your session snapshot",
        narration: "This rail gives you an at-a-glance count of what's upcoming, what's live right now, and how many sessions you've already completed.",
        placement: "bottom",
        icon: "mdi:chart-box",
        color: "#a78bfa",
      },
      {
        targetId: "live-sessions-filters",
        title: "Filter and switch views",
        narration: "Use these chips to focus on All, Upcoming, Live, or Past sessions, and flip between card and list layouts with the view toggle on the right.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
      },
      {
        targetId: "live-sessions-list",
        title: "Browse your sessions",
        narration: "Here's every session as a card. Click one to join a live or upcoming class, watch its recording, or open the AI summary once it's over.",
        placement: "top",
        icon: "mdi:view-grid",
        color: "#22c55e",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Jump into a live class or revisit a recording anytime, all from this page.",
        icon: "mdi:check-circle",
        color: "#fbbf24",
      },
    ],
    headerTitle: "What you can do on Live Sessions",
    headerSubtitle: "Join live classes and webinars, catch up on recordings, and revisit AI recaps of past sessions.",
    features: [
      {
        icon: "mdi:video",
        color: "#22c55e",
        title: "Join in one click",
        text: "Open a live or upcoming session card and jump straight into its Zoom, Google Meet, or webinar in a new tab.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#6366f1",
        title: "Track upcoming, live and past",
        text: "See counts at a glance in the top rail and tap the chips to filter sessions by Upcoming, Live, or Past.",
      },
      {
        icon: "mdi:play-circle-outline",
        color: "#0ea5e9",
        title: "Watch recordings anytime",
        text: "Replay any past class on the platform, with Zoom and Google Meet recordings streamed right here.",
      },
      {
        icon: "mdi:text-box-search-outline",
        color: "#a78bfa",
        title: "AI summary and transcript",
        text: "Open an ended session to read its AI recap and search the full transcript for the exact moment you need.",
      },
      {
        icon: "mdi:key-variant",
        color: "#f59e0b",
        title: "Copy the passcode",
        text: "Grab a Zoom session's passcode with one tap so you're ready the moment you join.",
      },
      {
        icon: "mdi:view-grid-outline",
        color: "#ec4899",
        title: "Cards or compact list",
        text: "Switch between roomy cards and a tidy list view to browse your sessions the way you prefer.",
      },
    ],
    tip: "Missed a class? Filter to Past, open the session, and use the transcript search box to jump to the exact topic you need instead of rewatching the whole recording.",
  },
  "/mock-interview": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "Interview overview",
        narration: "Welcome to your AI-driven mock interview hub. Practice realistic interviews and get instant, rubric-based feedback to sharpen every answer.",
        placement: "bottom",
        icon: "mdi:account-voice",
        color: "#ec4899",
      },
      {
        targetId: "mock-stats",
        title: "Your interview stats",
        narration: "This strip tracks your progress at a glance - total interviews, how many you've completed, what's scheduled, and your average score.",
        placement: "bottom",
        icon: "mdi:chart-box-outline",
        color: "#22c55e",
      },
      {
        targetId: "mock-tabs",
        title: "Switch between views",
        narration: "Use these tabs to jump between a New Interview, your Previous attempts, assigned Courses interviews, and anything you've Scheduled. A badge flags pending items waiting for you.",
        placement: "bottom",
        icon: "mdi:tab",
        color: "#6366f1",
      },
      {
        targetId: "mock-modes",
        title: "Pick an interview mode",
        narration: "Choose how you want to practice here - select a mode to launch a fresh mock interview tailored to what you want to work on.",
        placement: "top",
        icon: "mdi:play-circle-outline",
        color: "#a78bfa",
      },
      {
        title: "You're all set",
        narration: "That's the tour! Check your stats, pick a mode, and start practicing whenever you're ready to level up your interview skills.",
        icon: "mdi:rocket-launch-outline",
        color: "#f59e0b",
      },
    ],
    headerTitle: "What you can do with Mock Interviews",
    headerSubtitle: "Practice AI-driven mock interviews and get instant, rubric-based feedback to sharpen your answers.",
    features: [
      {
        icon: "mdi:lightning-bolt",
        color: "#22c55e",
        title: "Quick Start an interview",
        text: "Jump straight into an AI-driven interview with auto-generated questions and no setup - the recommended way to practice fast.",
      },
      {
        icon: "mdi:calendar-clock",
        color: "#6366f1",
        title: "Schedule an interview",
        text: "Plan ahead by tailoring questions to a resume or job description and picking a time that works for you.",
      },
      {
        icon: "mdi:chart-line",
        color: "#a78bfa",
        title: "Track your progress",
        text: "See your total interviews, how many you've completed and scheduled, and your average score at a glance.",
      },
      {
        icon: "mdi:school-outline",
        color: "#f59e0b",
        title: "Interviews from your courses",
        text: "Open the Courses tab to find interviews assigned by your enrolled courses, with a badge showing how many are waiting.",
      },
      {
        icon: "mdi:history",
        color: "#0ea5e9",
        title: "Revisit previous interviews",
        text: "Browse your completed interviews under the Previous tab to review answers, scores, and feedback.",
      },
      {
        icon: "mdi:calendar-check-outline",
        color: "#ec4899",
        title: "See what's scheduled",
        text: "Check the Scheduled tab to keep an eye on upcoming interviews you've booked.",
      },
      {
        icon: "mdi:star-circle-outline",
        color: "#fbbf24",
        title: "Rubric-based feedback",
        text: "Every completed interview is scored against a clear rubric so you know exactly what to improve next.",
      },
    ],
    tip: "New to practicing? Hit Quick Start to jump straight in, then switch to Schedule mode when you want questions tailored to a specific resume or job description.",
  },
  "/tickets": {
    tourSteps: [
      {
        targetId: "page-header",
        title: "My Tickets overview",
        narration: "This is your support hub. Here you can raise new requests and follow every ticket you've opened all the way through to resolution. Use the New ticket button in the header whenever you need help.",
        placement: "bottom",
        icon: "mdi:ticket-confirmation-outline",
        color: "#f59e0b",
      },
      {
        targetId: "tickets-tabs",
        title: "Filter by status",
        narration: "Switch between these tabs to focus on tickets in a particular state - All, Open, In Progress, Resolved, or Reopened. The list below updates instantly to match.",
        placement: "bottom",
        icon: "mdi:filter-variant",
        color: "#6366f1",
      },
      {
        targetId: "tickets-list",
        title: "Your tickets",
        narration: "Every ticket you've raised shows up here with its ID, subject, category, and status. Click any row to open the full conversation and reply to our support team.",
        placement: "top",
        icon: "mdi:format-list-bulleted",
        color: "#0ea5e9",
      },
      {
        targetId: "tickets-pagination",
        title: "Browse more",
        narration: "When you have more tickets than fit on one screen, use these page controls to move through the rest of your history.",
        placement: "top",
        icon: "mdi:page-next-outline",
        color: "#a78bfa",
      },
      {
        title: "You're all set",
        narration: "That's the tour. Raise a ticket whenever you hit a snag, and check back here anytime to track our response - usually within one business day.",
        icon: "mdi:check-circle-outline",
        color: "#22c55e",
      },
    ],
    headerTitle: "What you can do in My Tickets",
    headerSubtitle: "Raise support requests, attach evidence, and follow each one through to resolution.",
    features: [
      {
        icon: "mdi:plus-circle-outline",
        color: "#6366f1",
        title: "Raise a support ticket",
        text: "Tap New ticket to pick a category, describe your question or issue, and send it straight to the support team.",
      },
      {
        icon: "mdi:paperclip",
        color: "#a78bfa",
        title: "Attach screenshots and docs",
        text: "Add up to five images or PDFs to a ticket so support can see exactly what went wrong.",
      },
      {
        icon: "mdi:filter-variant",
        color: "#0ea5e9",
        title: "Filter by status",
        text: "Switch between the All, Open, In Progress, Resolved, and Reopened tabs to find the tickets you care about.",
      },
      {
        icon: "mdi:clipboard-text-outline",
        color: "#f59e0b",
        title: "See every ticket at a glance",
        text: "Your tickets list shows each one's ID, subject, category, status, and when it was created and last updated.",
      },
      {
        icon: "mdi:message-text-outline",
        color: "#22c55e",
        title: "Open a ticket to follow the thread",
        text: "Click any row to open its detail page, read the support team's replies, and continue the conversation.",
      },
      {
        icon: "mdi:lock-reset",
        color: "#ec4899",
        title: "Reopen if it isn't fixed",
        text: "If a resolution doesn't fully solve your problem, reopen the ticket from its detail page to get more help.",
      },
      {
        icon: "mdi:email-fast-outline",
        color: "#fbbf24",
        title: "Stay notified",
        text: "You're alerted by email and in-app the moment the team responds, usually within one business day.",
      },
    ],
    tip: "Before starting a new ticket, check the Resolved tab - you can reopen an existing one instead, keeping all the context and past replies in a single thread.",
  },
};

/**
 * Resolve the guide for a pathname: exact match first, else the longest registry
 * key that is a path-prefix (so dynamic detail routes like
 * /admin/certificates/course/123 fall back to /admin/certificates/course).
 */
export function resolveGuide(pathname: string | null | undefined): PageGuideContent | undefined {
  if (!pathname) return undefined;
  const exact = PAGE_GUIDES[pathname];
  if (exact) return exact;
  let best: { key: string; guide: PageGuideContent } | null = null;
  for (const key of Object.keys(PAGE_GUIDES)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      if (!best || key.length > best.key.length) best = { key, guide: PAGE_GUIDES[key] };
    }
  }
  return best?.guide;
}

/**
 * The guided tour for a page. Pages with explicit tourSteps (e.g. community, which
 * anchors to data-tour-id targets on the page) use those; every other page gets a
 * narrated walkthrough synthesized from its features - an intro card, one card per
 * feature, and an outro - so "Take a tour" works on every page and the platform guide.
 */
export function buildTour(content: PageGuideContent): TourStep[] {
  if (content.tourSteps && content.tourSteps.length > 0) return content.tourSteps;
  const intro: TourStep = {
    title: content.headerTitle,
    narration: content.headerSubtitle,
    icon: "mdi:compass-outline",
    color: "#a78bfa",
  };
  const featureSteps: TourStep[] = content.features.map((f) => ({
    title: f.title,
    narration: f.text,
    icon: f.icon,
    color: f.color,
  }));
  const outro: TourStep = {
    title: "You're all set",
    narration: content.tip ?? "That's the tour. Explore the page - and open this guide any time from the header.",
    icon: "mdi:rocket-launch-outline",
    color: "#a78bfa",
  };
  return [intro, ...featureSteps, outro];
}
