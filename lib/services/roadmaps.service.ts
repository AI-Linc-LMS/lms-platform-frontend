import apiClient from "./api";

const BASE = "/roadmaps/api";

/**
 * Roadmaps: a navigation layer over the verified content library.
 *
 * The graph and the progress overlay are deliberately two calls. The graph is identical for
 * every learner in the tenant and cacheable per (slug, version); the overlay is per learner.
 * Do not merge them.
 */

export type RoadmapKind = "role" | "skill" | "beginner" | "practice" | "company";
export type NodeKind = "topic" | "subtopic" | "milestone" | "label" | "note";
export type SelfState = "pending" | "learning" | "done" | "skipped";
export type EdgeKind = "sequence" | "contains" | "depends";

/** The few company fields a catalog card needs: enough to draw a logo tile, no more. */
export interface RoadmapCompanyCard {
  companySlug: string;
  displayName: string;
  logoUrl: string;
  badge: string;
  difficulty: string;
  packageRange: string;
  rounds: number;
}

export interface RoadmapHiringStage {
  stage: string;
  detail: string;
}

export interface RoadmapSyllabusRound {
  round: string;
  info: string;
  type: "Elimination" | "Final" | string;
}

/**
 * Dated hiring estimates.
 *
 * The server sends `null` for the whole object rather than an undated figure, so there is no
 * code path in which a number renders without the date it was true on. Do not "helpfully"
 * default `asOf` on the client.
 */
export interface RoadmapCompanyEstimates {
  applicants: string | null;
  openRoles: string | null;
  asOf: string;
  sourceUrl: string | null;
}

/**
 * The employer half of a company roadmap.
 *
 * Note what is absent: there is no `readiness` / `competitiveness` field. The source system
 * carried a static per-company literal under that name and its UI rendered it as though it
 * were measured. Readiness here comes from `RoadmapProgress.mastery`, which is derived from
 * the learner's own submissions.
 */
export interface RoadmapCompany extends RoadmapCompanyCard {
  examType: string;
  /** Free text, NOT a boolean: real answers are qualified per drive and per section. */
  negativeMarking: string;
  hiringProcess: RoadmapHiringStage[];
  syllabus: RoadmapSyllabusRound[];
  introVideoUrl: string;
  introVideoTitle: string;
  estimates: RoadmapCompanyEstimates | null;
}

/** How much practice the map actually reaches. Counted server-side from real bindings. */
export interface RoadmapContentTotals {
  questions: number;
  codingProblems: number;
  articles: number;
  steps: number;
}

export interface RoadmapCard {
  slug: string;
  cardTitle: string;
  pageTitle: string;
  kind: RoadmapKind;
  summary: string;
  isNew: boolean;
  isRevamped: boolean;
  topicCount: number;
  /** Present only on `kind === "company"`. */
  company?: RoadmapCompanyCard | null;
}

export interface RoadmapCategorySection {
  title: string;
  /** Slugs, not card objects: one roadmap legitimately appears in several sections. */
  roadmaps: string[];
}

export interface RoadmapCategory {
  slug: string;
  title: string;
  sections: RoadmapCategorySection[];
}

export interface RoadmapCatalog {
  categories: RoadmapCategory[];
  roadmaps: RoadmapCard[];
}

export interface RoadmapNode {
  id: number;
  slug: string;
  title: string;
  kind: NodeKind;
  order: number;
  parentId: number | null;
  isRequired: boolean;
  isTrackable: boolean;
  legendId: number | null;
  summary?: string;
  /** `note` nodes only: prose blocks such as project ideas. */
  items?: { title: string; text: string }[];
}

export interface RelatedRoadmap {
  slug: string;
  cardTitle: string;
  pageTitle: string;
  kind: RoadmapKind;
}

export interface RoadmapEdge {
  from: number;
  to: number;
  kind: EdgeKind;
}

export interface RoadmapLegend {
  id: number;
  label: string;
  color: string;
}

export interface RoadmapGraph {
  slug: string;
  cardTitle: string;
  pageTitle: string;
  kind: RoadmapKind;
  summary: string;
  version: number;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  legends: RoadmapLegend[];
  /** Only the ones this tenant can actually reach. */
  related?: RelatedRoadmap[];
  faqs?: { question: string; answer: string }[];
  /** Present only on `kind === "company"`. */
  company?: RoadmapCompany | null;
  content?: RoadmapContentTotals;
}

export interface RoadmapNodeProgress {
  selfState: SelfState;
  /** False for a spine node that derives from its branches; only leaves count in the totals. */
  isLeaf?: boolean;
  /** Derived from real submissions. Nothing self-declared can set this. */
  verifiedComplete: boolean;
  unitsComplete: number;
  unitsTotal: number;
  hasContentGap: boolean;
}

export interface RoadmapProgress {
  total: number;
  done: number;
  skipped: number;
  learning: number;
  mastered: number;
  /** (done + skipped) / total. Self-declared: the bar the learner sees. */
  coverage: number;
  /** mastered / total. Derived: the only number that may gate anything we certify. */
  mastery: number;
  contentGaps: number;
  nodes: Record<number, RoadmapNodeProgress>;
}

export interface RoadmapTargetContent {
  article?: boolean;
  articleTitle?: string;
  articleSummary?: string;
  readingMinutes?: number | null;
  questions?: number;
  codingProblems?: number;
}

export interface RoadmapNodeTarget {
  type: "submodule" | "course";
  courseId: number;
  courseTitle: string;
  submoduleId?: number;
  title: string;
  description?: string;
  /** Answered by the same gate the course surfaces use. Roadmaps add no second grant path. */
  accessible: boolean;
  selfEnrollable: boolean;
  /** What is actually inside, so the learner knows what they are committing to. */
  content?: RoadmapTargetContent;
}

export interface RoadmapChildStep {
  id: number;
  title: string;
  selfState: SelfState;
  accessible: boolean;
  courseId: number | null;
  submoduleId: number | null;
  summary: string;
  questions: number;
  codingProblems: number;
  readingMinutes: number;
}

export interface RoadmapNodeTotals {
  steps?: number;
  questions?: number;
  codingProblems?: number;
  readingMinutes?: number;
}

export interface RoadmapNodeDetail {
  id: number;
  slug: string;
  title: string;
  kind: NodeKind;
  summary: string;
  isRequired: boolean;
  resources: { type: string; title: string; url: string }[];
  opens: RoadmapNodeTarget[];
  /** Present on a spine node: its branch steps, each with its own size and state. */
  steps?: RoadmapChildStep[];
  totals?: RoadmapNodeTotals;
}

export const roadmapsService = {
  catalog: async (): Promise<RoadmapCatalog> => {
    const { data } = await apiClient.get(`${BASE}/catalog/`);
    return data;
  },

  graph: async (slug: string): Promise<RoadmapGraph> => {
    const { data } = await apiClient.get(`${BASE}/${slug}/`);
    return data;
  },

  progress: async (slug: string): Promise<RoadmapProgress> => {
    const { data } = await apiClient.get(`${BASE}/${slug}/progress/`);
    return data;
  },

  node: async (slug: string, nodeId: number): Promise<RoadmapNodeDetail> => {
    const { data } = await apiClient.get(`${BASE}/${slug}/nodes/${nodeId}/`);
    return data;
  },

  setNodeState: async (slug: string, nodeId: number, state: SelfState) => {
    const { data } = await apiClient.post(`${BASE}/${slug}/nodes/${nodeId}/state/`, { state });
    return data as { nodeId: number; selfState: SelfState };
  },

  follow: async (slug: string, following: boolean) => {
    const { data } = await apiClient.post(`${BASE}/${slug}/follow/`, { following });
    return data as { slug: string; following: boolean };
  },
};

/** Query keys, so the graph and the overlay can be invalidated independently. */
export const roadmapKeys = {
  catalog: ["roadmaps", "catalog"] as const,
  graph: (slug: string) => ["roadmaps", "graph", slug] as const,
  progress: (slug: string) => ["roadmaps", "progress", slug] as const,
  node: (slug: string, nodeId: number) => ["roadmaps", "node", slug, nodeId] as const,
};
