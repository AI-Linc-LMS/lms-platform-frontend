import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * A paper published as inactive has to be switchable on from the list. The card view - the
 * default on desktop - had no Activate at all (only the table's row menu did), and the switch
 * that did exist travelled as a content edit. Now both views send `{ is_active }` alone through
 * setAssessmentActive, which the server authorises like publish.
 */

const h = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  user: { role: "instructor" } as { role: string },
  getAssessments: vi.fn(),
  setAssessmentActive: vi.fn(),
  updateAssessment: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/assessment",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (typeof options === "string") return options;
      const o = (options ?? {}) as Record<string, unknown>;
      if (typeof o.defaultValue !== "string") return key;
      return o.defaultValue.replace(/{{(\w+)}}/g, (_m, name: string) => String(o[name] ?? ""));
    },
  }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: h.showToast }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: h.user, loading: false }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/services/admin/admin-assessment.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminAssessmentService: new Proxy(
      {},
      {
        get: (_t, key: string) => {
          if (key === "getAssessments") return h.getAssessments;
          if (key === "setAssessmentActive") return h.setAssessmentActive;
          if (key === "updateAssessment") return h.updateAssessment;
          return () => Promise.resolve([]);
        },
      },
    ),
  };
});
vi.mock("@/lib/services/admin/admin-assessment-email-jobs.service", () => ({
  adminAssessmentEmailJobsService: new Proxy({}, { get: () => () => Promise.resolve([]) }),
}));
vi.mock("@/lib/services/admin/admin-assessment-composer.service", () => ({
  startAssessmentComposer: vi.fn(),
  getAssessmentCompanyCatalog: () => Promise.resolve({ companies: [], presets: [] }),
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: () => Promise.resolve([]) },
}));

import AssessmentsPage from "./page";

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);
Element.prototype.scrollIntoView = vi.fn();

const paper = (over: Record<string, unknown>) => ({
  id: 41,
  title: "Unit 3 check",
  slug: "unit-3-check",
  description: "",
  duration_minutes: 30,
  is_active: false,
  is_draft: false,
  courses: [],
  created_at: "2026-09-20T10:00:00Z",
  ...over,
});

/** One paper on the list, so its card holds the only "More actions" button. */
async function openCardMenu() {
  const user = userEvent.setup();
  render(<AssessmentsPage />);
  await user.click(await screen.findByRole("button", { name: "More actions" }));
  return user;
}

beforeEach(() => {
  for (const fn of [h.showToast, h.push, h.getAssessments, h.setAssessmentActive, h.updateAssessment]) {
    fn.mockReset();
  }
  h.user = { role: "instructor" };
  h.setAssessmentActive.mockResolvedValue({ id: 41, is_active: true });
});

describe("assessment list: Activate from the card view", () => {
  it("offers Activate on an inactive paper's card and sends is_active alone", async () => {
    h.getAssessments.mockResolvedValue([paper({})]);
    const user = await openCardMenu();
    await user.click(await screen.findByRole("menuitem", { name: /activate assessment/i }));

    await waitFor(() => expect(h.setAssessmentActive).toHaveBeenCalledWith("1", 41, true));
    // Not a content edit: the old path PATCHed through updateAssessment.
    expect(h.updateAssessment).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith("Assessment activated", "success"),
    );
    // Re-read from the server rather than trusting a local flip.
    expect(h.getAssessments).toHaveBeenCalledTimes(2);
  });

  it("offers Deactivate on an active paper's card", async () => {
    h.getAssessments.mockResolvedValue([paper({ is_active: true })]);
    const user = await openCardMenu();
    await user.click(await screen.findByRole("menuitem", { name: /deactivate assessment/i }));
    await waitFor(() => expect(h.setAssessmentActive).toHaveBeenCalledWith("1", 41, false));
  });

  it("says why the server refused, instead of a generic line", async () => {
    h.getAssessments.mockResolvedValue([paper({})]);
    h.setAssessmentActive.mockRejectedValue(
      new Error("Cannot publish an assessment that has no questions."),
    );
    const user = await openCardMenu();
    await user.click(await screen.findByRole("menuitem", { name: /activate assessment/i }));
    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith(
        "Cannot publish an assessment that has no questions.",
        "error",
      ),
    );
  });

  it("offers no Activate on a draft: Publish is how a draft goes live", async () => {
    h.getAssessments.mockResolvedValue([paper({ is_draft: true })]);
    await openCardMenu();
    await screen.findByRole("menuitem", { name: /continue building/i });
    expect(screen.queryByRole("menuitem", { name: /activate assessment/i })).toBeNull();
  });
});
