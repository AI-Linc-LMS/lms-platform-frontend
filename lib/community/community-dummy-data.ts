/**
 * Rich placeholder data for the community dashboard when APIs return empty
 * or for local UI checks. Enable with `NEXT_PUBLIC_COMMUNITY_DUMMY_DATA=true`
 * or automatically in `NODE_ENV === "development"` (see `config.communityDummyData`).
 */
import type { LivePodItem } from "@/components/community/LivePods";
import type {
  ArenaActiveDto,
  BountyThreadDto,
  DailyQuestDto,
  TrendingKeywordDto,
} from "@/lib/community/widget-types";
import type {
  Author,
  Comment,
  Thread,
  ThreadDetail,
} from "@/lib/services/community.service";

/** Thread IDs used only for local UI preview (no backend row). */
export const COMMUNITY_DUMMY_THREAD_ID_MIN = 88000;
export const COMMUNITY_DUMMY_THREAD_ID_MAX = 89999;

export function isCommunityDummyThreadId(id: number): boolean {
  return (
    Number.isFinite(id) &&
    id >= COMMUNITY_DUMMY_THREAD_ID_MIN &&
    id <= COMMUNITY_DUMMY_THREAD_ID_MAX
  );
}

function dummyCommentsForThread(threadId: number): Comment[] {
  const now = new Date().toISOString();
  return [
    {
      id: threadId * 100 + 1,
      body: "<p>We use <code>route groups</code> for (marketing) vs (app) and colocate feature modules under each segment.</p>",
      author: author(99001, "Alex Rivera", "alex_r"),
      parent: null,
      upvotes: 8,
      downvotes: 0,
      user_vote: null,
      replies: [],
      created_at: now,
      updated_at: now,
      helpful_marked: false,
    },
    {
      id: threadId * 100 + 2,
      body: "<p>+1 on co-locating — we also add a short README per segment for onboarding.</p>",
      author: author(99002, "Priya N.", "priya_n"),
      parent: null,
      upvotes: 4,
      downvotes: 0,
      user_vote: null,
      replies: [],
      created_at: now,
      updated_at: now,
      helpful_marked: false,
    },
  ];
}

function buildSyntheticDummyThreadDetail(id: number): ThreadDetail {
  const now = new Date().toISOString();
  const bounty = dummyBounties().find((b) => b.thread_id === id);
  const title = bounty
    ? bounty.title
    : `Preview thread #${id}`;
  const safeBountyTitle = bounty
    ? bounty.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";
  const body = bounty
    ? `<p><em>Bounty preview</em> — ${safeBountyTitle}. Open a real thread on the server to persist answers.</p>`
    : "<p>Placeholder thread for local UI preview. There is no matching row on the server for this id.</p>";
  return {
    id,
    title,
    body,
    author: author(90000 + (id % 1000), "Demo learner", `demo_${id}`),
    tags: [
      { id: 1, name: "Help" },
      { id: 2, name: "Preview" },
    ],
    upvotes: 5,
    downvotes: 0,
    bookmarks_count: 2,
    user_bookmarked: false,
    comments_count: 2,
    created_at: now,
    updated_at: now,
    user_vote: null,
    comments: dummyCommentsForThread(id),
  };
}

/**
 * Full thread detail for preview ids (88000–89999). Known rows from {@link dummyThreads}
 * are enriched with comments; any other id in range gets a synthetic thread (optionally
 * titled from {@link dummyBounties} when `thread_id` matches).
 */
export function dummyThreadDetailById(id: number): ThreadDetail | null {
  if (!isCommunityDummyThreadId(id)) return null;
  const base = dummyThreads().find((t) => t.id === id);
  if (base) {
    return {
      ...base,
      comments: dummyCommentsForThread(id),
      user_vote: base.user_vote ?? null,
      user_bookmarked: base.user_bookmarked ?? false,
    };
  }
  return buildSyntheticDummyThreadDetail(id);
}

/**
 * When demo mode is on and the API has no thread for this id (e.g. deleted or wrong link),
 * use this so the detail page still renders for layout checks.
 */
export function genericPreviewThreadDetail(id: number): ThreadDetail | null {
  if (!Number.isFinite(id) || id <= 0) return null;
  const now = new Date().toISOString();
  return {
    id,
    title: `Community preview #${id}`,
    body: "<p>The server did not return this thread. Showing placeholder content because demo data is enabled.</p>",
    author: author(91000 + (id % 999), "Preview learner", `preview_${id}`),
    tags: [
      { id: 99, name: "Preview" },
      { id: 100, name: "Help" },
    ],
    upvotes: 2,
    downvotes: 0,
    bookmarks_count: 0,
    user_bookmarked: false,
    comments_count: 2,
    created_at: now,
    updated_at: now,
    user_vote: null,
    comments: dummyCommentsForThread(id),
  };
}

/** Escape minimal HTML for safe preview comment bodies (demo threads only). */
export function escapeHtmlPreview(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isoHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function author(id: number, name: string, user_name: string, role = "student"): Author {
  return {
    id,
    user_name,
    name,
    profile_pic_url: "",
    role,
  };
}

export function dummyLivePods(): LivePodItem[] {
  return [
    {
      id: "dummy-live-1",
      title: "Live: System design mock interviews",
      meet_url: "https://meet.google.com/lookup/mock-interview-room",
      active_count: 14,
      imageSeed: "dl1",
    },
    {
      id: "dummy-live-2",
      title: "Office hours — React performance",
      meet_url: "https://meet.google.com/lookup/react-perf",
      active_count: 9,
      imageSeed: "dl2",
    },
    {
      id: "dummy-live-3",
      title: "DSA walkthrough: graphs & trees",
      meet_url: "https://meet.google.com/lookup/dsa-graphs",
      active_count: 22,
      imageSeed: "dl3",
    },
  ];
}

export function dummyBounties(): BountyThreadDto[] {
  return [
    {
      thread_id: 88005,
      title: "Help: JWT refresh rotation with Django + Next.js",
      author_name: "Sam K.",
      age_hours: 30,
      reward_ip: 500,
      age_label: "24h unanswered",
    },
    {
      thread_id: 88006,
      title: "Prisma vs raw SQL for analytics tables?",
      author_name: "Jordan Lee",
      age_hours: 52,
      reward_ip: 750,
      age_label: "48h+ unanswered",
    },
    {
      thread_id: 88007,
      title: "Best way to stream SSE from FastAPI to the browser?",
      author_name: "Casey",
      age_hours: 18,
      reward_ip: 250,
      age_label: "12h unanswered",
    },
  ];
}

export function dummyTrending(): TrendingKeywordDto[] {
  return [
    { keyword: "Next.js", count: 14 },
    { keyword: "TypeScript", count: 11 },
    { keyword: "Django", count: 9 },
    { keyword: "React", count: 8 },
    { keyword: "Docker", count: 6 },
    { keyword: "DSA", count: 5 },
  ];
}

export function dummyDailyQuest(): DailyQuestDto {
  const ends = new Date(Date.now() + 20 * 3600000).toISOString();
  const starts = new Date(Date.now() - 4 * 3600000).toISOString();
  return {
    id: 900001,
    title: "Bug Hunt: Find 3 issues in this Express snippet",
    description: "Review the snippet in the quest thread and post concrete fixes.",
    starts_at: starts,
    ends_at: ends,
    participant_count: 128,
    progress_percent: 62,
    joined_today: false,
    active: true,
  };
}

export function dummyThreads(): Thread[] {
  const t = (id: number, title: string, body: string, votes: [number, number], comments: number, hours: number): Thread => ({
    id,
    title,
    body,
    author: author(88000 + id, `Learner ${id}`, `learner_${id}`),
    tags: [
      { id: 1, name: "Next.js" },
      { id: 2, name: "Help" },
    ],
    upvotes: votes[0],
    downvotes: votes[1],
    bookmarks_count: Math.floor(3 + (id % 5)),
    user_bookmarked: false,
    comments_count: comments,
    created_at: isoHoursAgo(hours),
    updated_at: isoHoursAgo(hours - 0.5),
  });

  const base = (
    id: number,
    title: string,
    body: string,
    votes: [number, number],
    comments: number,
    hours: number,
    tagList: { id: number; name: string }[]
  ): Thread => ({
    ...t(id, title, body, votes, comments, hours),
    tags: tagList,
  });

  return [
    base(
      88001,
      "How do you structure a large Next.js App Router codebase?",
      "<p>We are splitting LMS features across route groups. Any conventions that worked well for your team?</p>",
      [24, 1],
      7,
      2,
      [
        { id: 10, name: "Help" },
        { id: 11, name: "Next.js" },
      ]
    ),
    base(
      88002,
      "Poll: ORM for a read-heavy Django API?",
      "<p><strong>POLL</strong></p><ul><li>Prisma</li><li>Django ORM only</li><li>Raw SQL</li></ul>",
      [18, 2],
      12,
      5,
      [
        { id: 12, name: "Poll" },
        { id: 13, name: "Django" },
      ]
    ),
    base(
      88003,
      "Humor: my CI passed but production is on fire",
      "<p>Green checks, red users. What is your favorite false sense of security?</p>",
      [41, 0],
      20,
      8,
      [{ id: 14, name: "Humor" }]
    ),
    base(
      88004,
      "System design: rate limiting across regions",
      "<p>How do you coordinate limits with Redis + sticky sessions?</p>",
      [15, 1],
      4,
      12,
      [
        { id: 15, name: "Help" },
        { id: 16, name: "System design" },
      ]
    ),
    base(
      88005,
      "Help: JWT refresh rotation with Django + Next.js",
      "<p>Access token in httpOnly cookie, refresh in DB — how do you rotate without logging everyone out?</p>",
      [12, 0],
      3,
      6,
      [
        { id: 20, name: "Help" },
        { id: 21, name: "Django" },
      ]
    ),
    base(
      88006,
      "Prisma vs raw SQL for analytics tables?",
      "<p>We have a read-heavy reporting API. Team is split between Prisma convenience and hand-written SQL.</p>",
      [9, 1],
      5,
      10,
      [
        { id: 22, name: "Help" },
        { id: 23, name: "Database" },
      ]
    ),
    base(
      88007,
      "Best way to stream SSE from FastAPI to the browser?",
      "<p>Need live progress for long jobs. Considering SSE vs WebSockets for a simple one-way feed.</p>",
      [11, 0],
      2,
      4,
      [
        { id: 24, name: "Help" },
        { id: 25, name: "Python" },
      ]
    ),
  ];
}

export function dummyArenaActive(): ArenaActiveDto {
  return {
    topic: {
      id: 88001,
      title: "Next.js SSR vs React SPA",
      side_a_label: "Next.js SSR",
      side_b_label: "React SPA",
      ends_at: null,
      side_a_total_votes: 42,
      side_b_total_votes: 28,
      side_a_percent: 60,
    },
    top_side_a: {
      id: 1,
      side: "a",
      body: "Streaming HTML and smaller JS bundles for content-heavy LMS pages.",
      upvotes: 12,
      author_name: "Jamie",
    },
    top_side_b: {
      id: 2,
      side: "b",
      body: "Predictable client routing and simpler edge caching for dashboards.",
      upvotes: 9,
      author_name: "Riley",
    },
  };
}

/** Demo IP balance when the ledger API is unavailable (sidebar milestones). */
export const DUMMY_IMPACT_BALANCE = 640;
