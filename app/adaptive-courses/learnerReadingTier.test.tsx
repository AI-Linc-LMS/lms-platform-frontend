import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * "[Adaptive course] No matter the score is low or high in the assessment, the module is by
 * default coming intermediate."
 *
 * The module page's chip and the article reader both read `default_tier` - the tier the
 * article was BUILT at, "Intermediate" on 4554 of the 4591 live articles - so every learner
 * saw the same level however they scored, while the hero chip beside it showed the level
 * their calibration actually earned. Both now read `learner_tier`.
 */

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock("next/navigation", () => ({
  useParams: () => params.value,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({ useInstantNavigation: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/hooks/useReturnTo", () => ({ useReturnTo: (f: { href: string; label: string }) => f }));
vi.mock("@/components/layout/MainLayout", () => ({ MainLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/components/adaptive-course/NextStepCard", () => ({ NextStepCard: () => null, useNextStep: () => ({ next: null, alreadyCompleted: false }) }));
vi.mock("@/components/adaptive-journey/AdditionalPractice", () => ({ AdditionalPractice: () => null }));
vi.mock("@/lib/hooks/useArticleNarration", () => ({ useArticleNarration: () => ({ loading: false, playing: false, toggle: vi.fn() }) }));

const state = vi.hoisted(() => ({
  submodule: null as unknown,
  article: null as unknown,
  renderTier: vi.fn(),
}));
vi.mock("@/lib/services/adaptive-course.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveCourseService: {
    getSubmodule: () => Promise.resolve(state.submodule),
    getSubmodulePoints: () => Promise.reject(new Error("no points")),
    getArticle: () => Promise.resolve(state.article),
    completeArticle: () => Promise.resolve({}),
    renderArticleTier: (id: number, tier: string) => state.renderTier(id, tier),
    summarise: () => Promise.resolve({ summary_html: "", bullets: [] }),
  },
}));

import SubmodulePage from "./[courseId]/submodule/[submoduleId]/page";
import ArticlePage from "./[courseId]/submodule/[submoduleId]/article/[articleId]/page";

function submodule(learner_tier: string | null) {
  return {
    id: 1443, title: "Intro", description: "", order: 0,
    articles: [{
      article_id: 1963, title: "Intro to Python", default_tier: "Intermediate",
      learner_tier, available_tiers: ["Beginner", "Intermediate"],
      reading_time_minutes: 8, concepts: [], completed: false,
    }],
    quizzes: [], coding_sets: [], video_companions: [], attachments: [],
  };
}

function article(over: Record<string, unknown> = {}) {
  return {
    id: 1963, title: "Intro to Python", default_tier: "Intermediate",
    rendered_tier: "Intermediate", learner_tier: null,
    available_tiers: ["Beginner", "Intermediate"],
    content_html: "<p>The default rendering.</p>", reading_time_minutes: 8,
    summary: "", concepts: [], glossary: {}, explain_terms: [], ...over,
  };
}

describe("module list shows the learner's level, not the build level", () => {
  it("labels the article with the calibrated tier", async () => {
    params.value = { courseId: "33", submoduleId: "1443" };
    state.submodule = submodule("Advanced");
    render(<SubmodulePage />);
    // Before the fix this read "Intermediate · adapts" for every learner.
    expect(await screen.findByText("Advanced · adapts")).toBeTruthy();
    expect(screen.queryByText("Intermediate · adapts")).toBeNull();
  });

  it("falls back to the build tier for an uncalibrated learner", async () => {
    params.value = { courseId: "33", submoduleId: "1443" };
    state.submodule = submodule(null);
    render(<SubmodulePage />);
    expect(await screen.findByText("Intermediate · adapts")).toBeTruthy();
  });
});

/** The reader prints "Rendered at <tier> · ~N min" above the body. The prose itself is
 *  revealed word-by-word through a ref, which jsdom does not surface to findByText, so this
 *  line - which is exactly what the learner reads to know their level - is the assertion. */
async function renderedTier(): Promise<string> {
  const label = await screen.findByText(/Rendered at/);
  return label.querySelector("b")?.textContent ?? "";
}

describe("article reader opens at the learner's level", () => {
  it("renders what the server served when it is already the learner's tier", async () => {
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    state.renderTier.mockClear();
    state.article = article({
      rendered_tier: "Beginner", learner_tier: "Beginner",
      content_html: "<p>Plain words, small steps.</p>", reading_time_minutes: 4,
    });
    render(<ArticlePage />);
    expect(await renderedTier()).toBe("Beginner");
    // Nothing to fetch: the server already had that rendering.
    expect(state.renderTier).not.toHaveBeenCalled();
  });

  it("asks for the learner's tier when the server had no rendering of it", async () => {
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    state.renderTier.mockClear();
    state.renderTier.mockResolvedValue({
      tier: "Advanced", content_html: "<p>The deeper rendering.</p>", reading_time_minutes: 12,
    });
    state.article = article({ rendered_tier: "Intermediate", learner_tier: "Advanced" });
    render(<ArticlePage />);
    await waitFor(() => expect(state.renderTier).toHaveBeenCalledWith(1963, "Advanced"));
    await waitFor(async () => expect(await renderedTier()).toBe("Advanced"));
  });

  it("keeps the served tier for an uncalibrated learner and asks for nothing", async () => {
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    state.renderTier.mockClear();
    state.article = article();
    render(<ArticlePage />);
    expect(await renderedTier()).toBe("Intermediate");
    expect(state.renderTier).not.toHaveBeenCalled();
  });

  it("keeps the served tier when the upgrade fails - no toast, no blank page", async () => {
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    state.renderTier.mockClear();
    state.renderTier.mockRejectedValue(new Error("still generating"));
    state.article = article({ rendered_tier: "Intermediate", learner_tier: "Advanced" });
    render(<ArticlePage />);
    await waitFor(() => expect(state.renderTier).toHaveBeenCalled());
    await waitFor(async () => expect(await renderedTier()).toBe("Intermediate"));
  });
});
