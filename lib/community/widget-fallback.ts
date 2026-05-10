import type { BountyThreadDto, TrendingKeywordDto } from "@/lib/community/widget-types";
import type { Thread } from "@/lib/services/community.service";

/** Mirrors Django `COMMUNITY_BOUNTY_TIERS` (hours threshold ascending in logic = pick highest min where age >=). */
const BOUNTY_TIERS: [number, number][] = [
  [48, 750],
  [24, 500],
  [12, 250],
  [0, 100],
];

export function bountyIpForAgeHours(ageHours: number): number {
  for (const [minH, ip] of [...BOUNTY_TIERS].sort((a, b) => b[0] - a[0])) {
    if (ageHours >= minH) return ip;
  }
  return 100;
}

export function bountyAgeLabel(ageHours: number): string {
  if (ageHours >= 48) return "48h+ unanswered";
  if (ageHours >= 24) return "24h unanswered";
  if (ageHours >= 12) return "12h unanswered";
  return `${Math.max(1, Math.floor(ageHours))}h unanswered`;
}

const TRENDING_KEYWORDS = [
  "Python",
  "C++",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Django",
  "Node",
  "DSA",
  "System Design",
  "Java",
  "Go",
  "Rust",
  "Kubernetes",
  "Docker",
];

export function trendingFromThreads(threads: Thread[], maxTopics = 12): TrendingKeywordDto[] {
  const counts: Record<string, number> = Object.fromEntries(TRENDING_KEYWORDS.map((k) => [k, 0]));
  const stripTags = (html: string) => html.replace(/<[^>]*>/g, " ");
  for (const th of threads.slice(0, 80)) {
    const blob = `${th.title}\n${stripTags(th.body || "")}`.toLowerCase();
    for (const kw of TRENDING_KEYWORDS) {
      const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase();
      const re = new RegExp(esc, "gi");
      const m = blob.match(re);
      if (m) counts[kw] += m.length;
    }
  }
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTopics);
}

export function bountiesFromThreads(threads: Thread[], max = 12): BountyThreadDto[] {
  const now = Date.now();
  const rows: BountyThreadDto[] = [];
  for (const th of threads) {
    if ((th.comments_count ?? 0) > 0) continue;
    const created = new Date(th.created_at).getTime();
    const ageHours = Math.max(0, (now - created) / 3600000);
    if (ageHours < 6) continue;
    const reward_ip = bountyIpForAgeHours(ageHours);
    rows.push({
      thread_id: th.id,
      title: th.title,
      author_name: th.author?.name || "?",
      age_hours: Math.round(ageHours * 100) / 100,
      reward_ip,
      age_label: bountyAgeLabel(ageHours),
    });
  }
  return rows.sort((a, b) => b.reward_ip - a.reward_ip).slice(0, max);
}
