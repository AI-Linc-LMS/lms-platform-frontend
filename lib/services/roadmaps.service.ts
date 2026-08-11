import apiClient from "./api";

const BASE = "/roadmaps/api";

/**
 * Roadmaps: a navigation layer over the verified content library.
 *
 * The graph and the progress overlay are deliberately two calls. The graph is identical for
 * every learner in the tenant and cacheable per (slug, version); the overlay is per learner.
 * Do not merge them.
 */

export type RoadmapKind = "role" | "skill" | "beginner" | "practice";
export type NodeKind = "topic" | "subtopic" | "milestone" | "label";
export type SelfState = "pending" | "learning" | "done" | "skipped";
export type EdgeKind = "sequence" | "contains";

export interface RoadmapCard {
  slug: string;
  cardTitle: string;
  pageTitle: string;
  kind: RoadmapKind;
  summary: string;
  isNew: boolean;
  isRevamped: boolean;
  topicCount: number;
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
