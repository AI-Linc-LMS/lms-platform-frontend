import type { ReactNode } from "react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * "When creating an assessment, there is no option to publish it directly." The final step of a
 * NEW paper offered only "Create Assessment", and for an instructor the server turns that create
 * into a draft; "Publish assessment" existed only on a reopened draft.
 *
 * A new paper now gets the same pair as a reopened draft. Publish saves the paper as a draft and
 * then makes the very publish call the draft editor makes, so the server runs the same checks.
 * If that call fails, the author is told what the server actually holds and lands where they can
 * finish it - never left with a paper whose state they have to guess.
 */

const h = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  user: { role: "instructor" } as { role: string },
  builderConfig: vi.fn(),
  createAssessment: vi.fn(),
  publishAssessment: vi.fn(),
  getAssessmentById: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/assessment/create",
}));
// Interpolates `defaultValue`, so a toast is asserted as the sentence the author reads.
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
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: null }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/admin/assessment/BasicInfoSection", () => ({
  BasicInfoSection: (p: {
    onTitleChange: (v: string) => void;
    onInstructionsChange: (v: string) => void;
  }) => (
    <div>
      <input aria-label="stub-title" onChange={(e) => p.onTitleChange(e.target.value)} />
      <input aria-label="stub-instructions" onChange={(e) => p.onInstructionsChange(e.target.value)} />
    </div>
  ),
}));
vi.mock("@/components/admin/assessment/MultipleSectionsSection", () => ({
  sectionTimeLimitExceedsOverallMessage: () => null,
  MultipleSectionsSection: (p: { onSectionsChange: (s: unknown[]) => void }) => (
    <button
      type="button"
      onClick={() =>
        p.onSectionsChange([{ id: "s1", type: "quiz", title: "S", description: "", order: 1 }])
      }
    >
      stub-add-section
    </button>
  ),
}));
vi.mock("@/components/admin/assessment/SectionBasedQuestionsInput", () => ({
  SectionBasedQuestionsInput: (p: {
    onManualMCQsChange: (sectionId: string, mcqs: unknown[]) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        p.onManualMCQsChange("s1", [
          {
            question_text: "q",
            option_a: "a",
            option_b: "b",
            option_c: "c",
            option_d: "d",
            correct_option: "A",
          },
        ])
      }
    >
      stub-add-question
    </button>
  ),
}));
vi.mock("@/components/admin/assessment/AssessmentPreviewSection", () => ({
  AssessmentPreviewSection: () => null,
}));
vi.mock("@/components/admin/assessment/EmailNotificationEditor", () => ({
  EmailNotificationEditor: forwardRef(function Stub() {
    return null;
  }),
}));
vi.mock("@/components/admin/certificates/CertificateRuleEditor", () => ({
  CertificateRuleEditor: () => null,
}));
vi.mock("@/components/admin/certificates/TemplatePickerField", () => ({
  useCertificateTemplates: () => ({ templates: [], loading: false }),
}));
vi.mock("@/lib/services/currencies.service", () => ({
  currenciesService: { list: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/admin/admin-projects.service", () => ({
  listProjects: () => Promise.resolve([]),
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: () => Promise.resolve([{ id: 5, name: "Batch A" }]) },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", () => ({
  adminAssessmentService: new Proxy(
    {},
    {
      get: (_t, key: string) => {
        if (key === "getAssessmentBuilderConfig") return h.builderConfig;
        if (key === "createAssessment") return h.createAssessment;
        if (key === "publishAssessment") return h.publishAssessment;
        if (key === "getAssessmentById") return h.getAssessmentById;
        return () => Promise.resolve([]);
      },
    },
  ),
}));

import CreateAssessmentPage from "./page";

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

const continueButton = () => screen.getByRole("button", { name: /continue/i });

/** Fill the wizard the way an instructor does and stop on "Review & Create". */
async function reachTheFinalStep() {
  const user = userEvent.setup();
  render(<CreateAssessmentPage />);
  await waitFor(() => expect(h.builderConfig).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("stub-title"), { target: { value: "Unit 3 check" } });
  fireEvent.change(screen.getByLabelText("stub-instructions"), {
    target: { value: "Answer everything" },
  });
  fireEvent.click(screen.getByRole("button", { name: "stub-add-section" }));
  await user.click(document.getElementById("assessment-batches-field") as HTMLElement);
  await user.click(await screen.findByRole("option", { name: "Batch A" }));
  await user.click(continueButton());
  await user.click(await screen.findByRole("button", { name: "stub-add-question" }));
  await user.click(continueButton());
  await screen.findByRole("button", { name: /^save assessment$/i });
  return user;
}

const publishButton = () => screen.getByRole("button", { name: /^publish assessment$/i });
const saveButton = () => screen.getByRole("button", { name: /^save assessment$/i });

beforeEach(() => {
  for (const fn of [
    h.showToast,
    h.push,
    h.builderConfig,
    h.createAssessment,
    h.publishAssessment,
    h.getAssessmentById,
  ]) {
    fn.mockReset();
  }
  h.user = { role: "instructor" };
  h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
  h.createAssessment.mockResolvedValue({ id: 99 });
  h.publishAssessment.mockResolvedValue({ id: 99 });
});

describe("create assessment: publish from the creation page", () => {
  it("offers Publish beside Save on a new paper, not only on a reopened draft", async () => {
    await reachTheFinalStep();
    expect(publishButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create assessment/i })).toBeNull();
  });

  it("saves the paper as a draft, then makes the draft editor's own publish call", async () => {
    const user = await reachTheFinalStep();
    await user.click(publishButton());

    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.createAssessment).toHaveBeenCalledTimes(1);
    const payload = h.createAssessment.mock.calls[0][1];
    expect(payload.is_draft).toBe(true);
    expect(payload.is_active).toBe(false);
    expect(payload.cohort_ids).toEqual([5]);
    // Created first, published second: the publish is of the paper that now exists.
    expect(h.createAssessment.mock.invocationCallOrder[0]).toBeLessThan(
      h.publishAssessment.mock.invocationCallOrder[0],
    );
    const [, publishedId, body, attachment] = h.publishAssessment.mock.calls[0];
    expect(publishedId).toBe(99);
    expect(body.is_active).toBe(true);
    // The attachment already went up with the create; resending it would make the request
    // multipart, where the server reads no is_active at all.
    expect(attachment).toBeUndefined();

    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/admin/assessment/99/edit"));
    expect(h.showToast).toHaveBeenCalledWith("Assessment published.", "success");
  });

  it("leaves a plain draft when publishing fails, says so, and opens that draft", async () => {
    h.publishAssessment.mockRejectedValue(
      new Error("Cannot publish an assessment that has no questions."),
    );
    h.getAssessmentById.mockResolvedValue({ id: 99, is_draft: true });
    const user = await reachTheFinalStep();
    await user.click(publishButton());

    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith(
        "Saved as a draft, but not published: Cannot publish an assessment that has no questions.",
        "error",
      ),
    );
    // The draft editor, where Publish is one click once the problem is fixed.
    expect(h.push).toHaveBeenCalledWith("/admin/assessment/create?fromDraft=99");
    expect(h.push).not.toHaveBeenCalledWith("/admin/assessment/99/edit");
  });

  it("reports what the server holds: a publish that errored after saving is called published", async () => {
    h.publishAssessment.mockRejectedValue(new Error("Network Error"));
    h.getAssessmentById.mockResolvedValue({ id: 99, is_draft: false });
    const user = await reachTheFinalStep();
    await user.click(publishButton());

    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith(
        "The assessment was published, but the server also reported: Network Error",
        "warning",
      ),
    );
    expect(h.push).toHaveBeenCalledWith("/admin/assessment/99/edit");
  });

  it("publishes nothing when the create itself is refused", async () => {
    h.createAssessment.mockRejectedValue(new Error("Select at least one batch."));
    const user = await reachTheFinalStep();
    await user.click(publishButton());

    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith("Select at least one batch.", "error"),
    );
    expect(h.publishAssessment).not.toHaveBeenCalled();
    expect(h.push).not.toHaveBeenCalled();
  });

  it("keeps Save a save: a draft, and no publish call", async () => {
    const user = await reachTheFinalStep();
    await user.click(saveButton());

    await waitFor(() => expect(h.createAssessment).toHaveBeenCalledTimes(1));
    expect(h.createAssessment.mock.calls[0][1].is_draft).toBe(true);
    expect(h.publishAssessment).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(h.push).toHaveBeenCalledWith("/admin/assessment/create?fromDraft=99"),
    );
    expect(h.showToast).toHaveBeenCalledWith(
      "Saved as a draft. Learners cannot see it until you publish it.",
      "success",
    );
  });

  it("gives an admin the same pair and the same single path", async () => {
    h.user = { role: "admin" };
    h.builderConfig.mockResolvedValue({ batch_required: false, course_required: false });
    const user = await reachTheFinalStep();
    await user.click(publishButton());

    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.createAssessment.mock.calls[0][1].is_draft).toBe(true);
    expect(h.publishAssessment.mock.calls[0][1]).toBe(99);
  });
});
