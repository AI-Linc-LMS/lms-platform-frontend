import type { ReactNode } from "react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * The edit page's Active switch used to ride inside the settings PATCH. The server treats a PATCH
 * that carries content as an edit, so an instructor who may publish (and so activate) a paper but
 * not change it was refused, and a paper they had published as inactive stayed inactive. The
 * switch is its own `{ is_active }` request now, sent after the settings save and only when it
 * moved.
 */

const h = vi.hoisted(() => ({
  showToast: vi.fn(),
  getAssessmentById: vi.fn(),
  updateAssessment: vi.fn(),
  setAssessmentActive: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: "41" }),
  useSearchParams: () => new URLSearchParams("tab=details"),
  usePathname: () => "/admin/assessment/41/edit",
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
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { role: "instructor" }, loading: false }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: null }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/admin/assessment/EmailNotificationEditor", () => ({
  EmailNotificationEditor: forwardRef(function Stub() {
    return null;
  }),
}));
vi.mock("@/lib/services/currencies.service", () => ({
  currenciesService: { list: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminAssessmentService: new Proxy(
      {},
      {
        get: (_t, key: string) => {
          if (key === "getAssessmentById") return h.getAssessmentById;
          if (key === "updateAssessment") return h.updateAssessment;
          if (key === "setAssessmentActive") return h.setAssessmentActive;
          if (key === "getQuestionsExportJson") {
            return () => Promise.resolve({ assessment: { id: 41 }, sections: [] });
          }
          return () => Promise.resolve([]);
        },
      },
    ),
  };
});

import AssessmentEditPage from "./page";

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

const detail = (over: Record<string, unknown> = {}) => ({
  id: 41,
  title: "Unit 3 check",
  slug: "unit-3-check",
  instructions: "Answer everything",
  description: "",
  duration_minutes: 30,
  is_active: false,
  is_draft: false,
  submissions_count: 0,
  audience: { cohorts: [], courses: [] },
  ...over,
});

/**
 * The Details tab's Active switch. Found through its row: the switch input carries no accessible
 * name of its own (the row's `inputProps` label is not applied), so a label query cannot reach it.
 */
async function openDetails() {
  render(<AssessmentEditPage />);
  const hint = await screen.findByText("Inactive assessments stay out of the catalog.");
  const input = hint.closest("li")?.querySelector('input[type="checkbox"]');
  if (!input) throw new Error("the Active switch row has no input");
  return input as HTMLInputElement;
}

const save = () => screen.getByRole("button", { name: /save/i });

beforeEach(() => {
  for (const fn of [h.showToast, h.getAssessmentById, h.updateAssessment, h.setAssessmentActive]) {
    fn.mockReset();
  }
  h.getAssessmentById.mockResolvedValue(detail());
  h.updateAssessment.mockResolvedValue(detail());
  h.setAssessmentActive.mockResolvedValue(detail({ is_active: true }));
});

describe("assessment edit page: the Active switch", () => {
  it("activates in its own request, after a settings save that does not carry it", async () => {
    const active = await openDetails();
    expect(active.checked).toBe(false);
    fireEvent.click(active);
    fireEvent.click(save());

    await waitFor(() => expect(h.setAssessmentActive).toHaveBeenCalledWith("1", 41, true));
    const [, id, content] = h.updateAssessment.mock.calls[0];
    expect(id).toBe(41);
    expect(content).not.toHaveProperty("is_active");
    expect(content).toMatchObject({ title: "Unit 3 check" });
    expect(h.updateAssessment.mock.invocationCallOrder[0]).toBeLessThan(
      h.setAssessmentActive.mock.invocationCallOrder[0],
    );
    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith("Assessment updated successfully", "success"),
    );
  });

  it("sends no switch request when the switch did not move", async () => {
    await openDetails();
    fireEvent.click(save());
    await waitFor(() => expect(h.updateAssessment).toHaveBeenCalledTimes(1));
    expect(h.updateAssessment.mock.calls[0][2]).not.toHaveProperty("is_active");
    expect(h.setAssessmentActive).not.toHaveBeenCalled();
  });

  it("does not switch a paper whose settings save was refused", async () => {
    h.updateAssessment.mockRejectedValue(
      new Error("You do not have permission to update this assessment."),
    );
    const active = await openDetails();
    fireEvent.click(active);
    fireEvent.click(save());
    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith(
        "You do not have permission to update this assessment.",
        "error",
      ),
    );
    expect(h.setAssessmentActive).not.toHaveBeenCalled();
  });

  it("says the settings saved but the switch did not, and why", async () => {
    h.setAssessmentActive.mockRejectedValue(
      new Error("Cannot publish an assessment that has no questions."),
    );
    const active = await openDetails();
    fireEvent.click(active);
    fireEvent.click(save());
    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith(
        "Your changes were saved, but the assessment was not activated. Cannot publish an assessment that has no questions.",
        "error",
      ),
    );
  });
});
