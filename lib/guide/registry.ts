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
