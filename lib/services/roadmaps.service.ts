import apiClient from "./api";

const BASE = "/roadmaps/api";
/** The forge lives under the adaptive-quiz mount, beside the courses it creates. */
const BASE_ADAPTIVE = "/adaptive-quiz/api";

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

/**
 * What a step's mark says, before the learner clicks it.
 *
 * Mutually exclusive, most-blocking first. `locked` is not a progress state: it is a priced
 * course the learner has not paid for, so there is no progress to report.
 */
export type OwnedState = "locked" | "ready" | "inProgress" | "done";

export interface RoadmapOwnedNode {
  /** The course they already have. The mark carries it so a click need not ask the server. */
  courseId: number;
  state: OwnedState;
  unitsComplete: number;
  unitsTotal: number;
}

/**
 * Which steps on this map the learner ALREADY has a course for.
 *
 * SPARSE on purpose: absent means "not built". The biggest shipped map is 210 nodes and the
 * biggest real holding is 10, so a row per node would be 200 rows of "no".
 *
 * A THIRD call beside the graph and the progress overlay, and deliberately not folded into
 * either: the graph is identical for every learner and cached hard, and the progress overlay
 * measures the library submodules a node binds, which is a different question from how far
 * through the course you BUILT you are. One request for the whole map, never one per node.
 */
export interface RoadmapOwned {
  nodes: Record<number, RoadmapOwnedNode>;
}

export interface RoadmapTargetContent {
  article?: boolean;
  articleTitle?: string;
  articleSummary?: string;
  readingMinutes?: number | null;
  questions?: number;
  codingProblems?: number;
  /** Ids of the units themselves, so the roadmap can open one on its OWN route rather than
   *  handing the learner to the adaptive course's submodule page. Always present, null when
   *  the step has no unit of that kind. */
  articleId?: number | null;
  quizConfigId?: number | null;
  codingConfigId?: number | null;
  /** The coding player is addressed by problem, not by config. */
  codingProblemId?: number | null;
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

  /** One request for the whole map. See RoadmapOwned. */
  owned: async (slug: string): Promise<RoadmapOwned> => {
    const { data } = await apiClient.get(`${BASE}/${slug}/owned/`);
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
  owned: (slug: string) => ["roadmaps", "owned", slug] as const,
  node: (slug: string, nodeId: number) => ["roadmaps", "node", slug, nodeId] as const,
};

/* ------------------------------------------------------------------ course forge ------ */

export type ForgeStatus =
  | "queued"
  | "resolving"
  | "building"
  | "completed"
  | "failed"
  | "cancelled";

export interface ForgeJobItem {
  order: number;
  title: string;
  moduleTitle: string;
  status: "pending" | "running" | "done" | "failed";
}

export interface ForgeJob {
  id: number;
  status: ForgeStatus;
  title: string;
  sourceKind: "roadmap_node" | "prompt";
  totalItems: number;
  completedItems: number;
  failedItems: number;
  percent: number;
  courseId: number | null;
  isStalled: boolean;
  items: ForgeJobItem[];
  errors: { at: string; where: string; message: string }[];
  /** Set when the learner already had this course: nothing was rebuilt. */
  alreadyBuilt?: boolean;
  /**
   * Set when a build that had stopped was picked up again instead of a new one starting.
   * The job this describes is the OLD one, so the title may not be the topic just clicked.
   */
  resumed?: boolean;
}

/**
 * A refusal the learner can be told about.
 *
 * Every refusal the build endpoint documents arrives here, not only the 422 this used to
 * translate. That gap WAS the reported bug: a 402 (free build spent), a 429 (another build
 * running, or the daily ceiling) and a 404 all fell through as bare axios errors, and the
 * roadmap page turned them into one generic sentence which it then rendered *behind* the
 * still-open build drawer. The learner pressed "Yes, build it" and nothing happened at all --
 * no course, and no offer to pay either.
 *
 * `paymentRequired` is deliberately narrower than "the server said 402". It is true only when
 * there is an amount that can actually be charged; a tenant that has priced nothing answers
 * `not_for_sale`, and offering checkout over a null price is how a paywall becomes a dead end.
 */
export class ForgeUnavailableError extends Error {
  code: string;
  status: number;
  paymentRequired: boolean;
  /** Major units, exactly as the server wrote it. Null when nothing is on sale. */
  price: string | null;
  currency: string;

  constructor(
    message: string,
    code: string,
    extra: {
      status?: number;
      paymentRequired?: boolean;
      price?: string | null;
      currency?: string;
    } = {}
  ) {
    super(message);
    this.code = code;
    this.status = extra.status ?? 422;
    this.paymentRequired = Boolean(extra.paymentRequired);
    this.price = extra.price ?? null;
    this.currency = extra.currency || "INR";
  }
}

/** The refusal bodies the build endpoint emits, all of which carry a learner-facing `detail`. */
interface ForgeRefusalBody {
  detail?: string;
  code?: string;
  payment_required?: boolean;
  price?: string | null;
  currency?: string;
}

/**
 * Statuses this endpoint refuses with, and what to say when the body carries no `detail`.
 *
 * 401 and 403 are deliberately absent: those are the auth interceptor's, and dressing an expired
 * session up as a build problem would send the learner looking for the wrong fix.
 */
const FORGE_REFUSALS: Record<number, { code: string; fallback: string }> = {
  400: { code: "bad_request", fallback: "We could not read that request." },
  402: { code: "payment_required", fallback: "Your free course build has been used." },
  404: { code: "not_found", fallback: "We could not find that topic." },
  409: { code: "conflict", fallback: "We could not start the build. Please try again." },
  422: { code: "no_material", fallback: "We do not have material for that yet." },
  429: { code: "rate_limited", fallback: "Too many builds just now. Try again shortly." },
};

export const forgeService = {
  /** Ask for a course. Pass a roadmap node id OR free text, never both. */
  create: async (body: { nodeId?: number; prompt?: string }): Promise<ForgeJob> => {
    try {
      const { data } = await apiClient.post(`${BASE_ADAPTIVE}/forge/`, body);
      return data;
    } catch (err) {
      const res = (err as { response?: { status?: number; data?: ForgeRefusalBody } }).response;
      const status = res?.status ?? 0;
      const known = FORGE_REFUSALS[status];
      if (known) {
        const data = res?.data ?? {};
        throw new ForgeUnavailableError(data.detail || known.fallback, data.code || known.code, {
          status,
          // The server decides whether money can change hands. `payment_required` is false on a
          // 402 from a tenant that has put nothing on sale.
          paymentRequired: status === 402 && Boolean(data.payment_required) && Boolean(data.price),
          price: data.price ?? null,
          currency: data.currency,
        });
      }
      throw err;
    }
  },

  job: async (id: number): Promise<ForgeJob> => {
    const { data } = await apiClient.get(`${BASE_ADAPTIVE}/forge/${id}/`);
    return data;
  },
};

export const forgeKeys = {
  job: (id: number) => ["forge", "job", id] as const,
};
