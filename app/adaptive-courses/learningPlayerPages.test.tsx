import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * The topic page and the article reader on a phone.
 *
 * Measured at 390px on the demo tenant:
 * - each learning-path card overflowed the screen and squeezed its title into a one-word column
 *   beside the points and the action button;
 * - the article's four reading-level pills ran off the right edge ("Expert" was cut off);
 * - "Summarise so far" opened a centred desktop dialog.
 *
 * Each fix is phone-only: the CSS asserts the value sits inside the max-width:599.95px block,
 * and the summary asserts the sheet on a phone and the original Dialog from 600px up.
 */

const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes.flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`))).join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

// ---- app seams --------------------------------------------------------------------------------
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

const submodule = {
  id: 1443, title: "Introduction to Python and Installation", description: "Overview.", order: 0,
  articles: [{ article_id: 1963, title: "Introduction to Python and Installation", default_tier: "Intermediate", available_tiers: ["Intermediate"], reading_time_minutes: 8, concepts: [], completed: false }],
  quizzes: [], coding_sets: [], video_companions: [], attachments: [],
};
const article = {
  id: 1963, title: "Introduction to Python and Installation", default_tier: "Intermediate", rendered_tier: "Intermediate",
  available_tiers: ["Intermediate"], content_html: "<p>Python is a language.</p>", reading_time_minutes: 8, summary: "About Python.",
  concepts: ["Syntax"], glossary: {}, explain_terms: [],
};
vi.mock("@/lib/services/adaptive-course.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveCourseService: {
    getSubmodule: () => Promise.resolve(submodule),
    getSubmodulePoints: () => Promise.reject(new Error("no points")),
    getArticle: () => Promise.resolve(article),
    completeArticle: () => Promise.resolve({}),
    summarise: () => Promise.resolve({ summary_html: "<p>Short recap.</p>", bullets: ["Python is readable."] }),
  },
}));

import SubmodulePage from "./[courseId]/submodule/[submoduleId]/page";
import ArticlePage from "./[courseId]/submodule/[submoduleId]/article/[articleId]/page";

describe("learning path on a phone", () => {
  it("drops the points and the action under the title, inside the phone block only", async () => {
    viewport(390);
    params.value = { courseId: "33", submoduleId: "1443" };
    render(<SubmodulePage />);
    const row = (await screen.findAllByTestId("path-row"))[0];
    const card = row.children[1] as HTMLElement;
    const inner = card.firstElementChild as HTMLElement;
    const action = screen.getByRole("button", { name: /Read now/ });

    expect(cssOf(card).phone).toMatch(/min-width:0/);
    expect(cssOf(inner).phone).toMatch(/flex-wrap:wrap/);
    expect(cssOf(action).phone).toMatch(/min-height:44px/);
    expect(cssOf(action).phone).toMatch(/margin-inline-start:auto/);
    // Desktop keeps the single-row card.
    expect(cssOf(inner).unscoped).not.toMatch(/flex-wrap:wrap/);
    expect(cssOf(action).unscoped).not.toMatch(/min-height:44px/);
  });
});

describe("article reader", () => {
  it("lays the reading levels out 2x2 on a phone only", async () => {
    viewport(390);
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    render(<ArticlePage />);
    const switcher = await screen.findByTestId("tier-switcher");
    expect(cssOf(switcher).phone).toMatch(/grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
    expect(cssOf(switcher).unscoped).not.toMatch(/grid-template-columns/);
    expect(cssOf(switcher).unscoped).toMatch(/display:flex/);
  });

  it("opens the summary as a bottom sheet on a phone", async () => {
    viewport(390);
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    render(<ArticlePage />);
    fireEvent.click(await screen.findByRole("button", { name: /Summarise so far/ }));
    expect(await screen.findByTestId("summary-sheet")).toBeInTheDocument();
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).not.toBeNull();
    expect(document.querySelector(".MuiDialog-paper")).toBeNull();
    expect(await screen.findByText("Python is readable.")).toBeInTheDocument();
  });

  it("keeps the original centred summary dialog from 600px up", async () => {
    viewport(1440);
    params.value = { courseId: "33", submoduleId: "1443", articleId: "1963" };
    render(<ArticlePage />);
    fireEvent.click(await screen.findByRole("button", { name: /Summarise so far/ }));
    expect(await screen.findByText("Summary so far")).toBeInTheDocument();
    expect(document.querySelector(".MuiDialog-paper")).not.toBeNull();
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeNull();
    expect(screen.queryByTestId("summary-sheet")).toBeNull();
  });
});
