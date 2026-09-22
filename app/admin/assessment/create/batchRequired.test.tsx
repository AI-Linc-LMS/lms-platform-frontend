import type { ReactNode } from "react";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * The builder said a targeting field was optional, then the final "Create Assessment" click
 * failed with the server's refusal, after every section had been built.
 *
 * The rule now comes from the server (builder-config `batch_required`), the field is marked
 * required for the roles it applies to, and Continue on the step that holds the field stops
 * with an inline error instead of letting the author reach the end first.
 */

const h = vi.hoisted(() => ({
  t: (k: string, o?: unknown) => (typeof o === "string" ? o : k),
  showToast: vi.fn(),
  user: { role: "instructor" } as { role: string },
  builderConfig: vi.fn(),
  createAssessment: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/assessment/create",
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: h.t }) }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: h.showToast }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: h.user, loading: false }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: null }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// Step-0 neighbours, stubbed to the least that lets Continue become enabled.
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
  SectionBasedQuestionsInput: () => <div>stub-questions-step</div>,
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
        return () => Promise.resolve([]);
      },
    },
  ),
}));

import CreateAssessmentPage from "./page";

const BATCH_MESSAGE =
  "Select at least one batch. An assessment you create is for the batches you teach, not for the whole institute.";

// fireEvent, not userEvent.type: a real per-keystroke timer made each test take seconds.
function fillTheRestOfStepZero() {
  fireEvent.change(screen.getByLabelText("stub-title"), { target: { value: "Unit test" } });
  fireEvent.change(screen.getByLabelText("stub-instructions"), {
    target: { value: "Answer everything" },
  });
  fireEvent.click(screen.getByRole("button", { name: "stub-add-section" }));
}

const batchesLabel = () =>
  document.querySelector('label[for="assessment-batches-field"]') as HTMLLabelElement;

const continueButton = () => screen.getByRole("button", { name: /continue/i });

// jsdom has no IntersectionObserver; framer-motion's in-view feature needs one to mount.
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);
// Nor scrollIntoView, which Continue uses to bring the failing field into view.
Element.prototype.scrollIntoView = vi.fn();

beforeEach(() => {
  h.showToast.mockReset();
  h.createAssessment.mockReset();
  h.builderConfig.mockReset();
});

describe("create assessment: the batch field", () => {
  it("is required for an instructor, and Continue stops on it with an inline error", async () => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    const user = userEvent.setup();
    render(<CreateAssessmentPage />);

    await waitFor(() => expect(h.builderConfig).toHaveBeenCalled());
    await waitFor(() => expect(batchesLabel().textContent).toContain("*"));
    expect(batchesLabel().textContent).not.toMatch(/optional/i);

    fillTheRestOfStepZero();
    await user.click(continueButton());

    // Still on step 0, told why, inline and not only in a toast.
    expect(screen.queryByText("stub-questions-step")).toBeNull();
    expect(h.showToast).toHaveBeenCalledWith(BATCH_MESSAGE, "error");
    expect(await screen.findByText(BATCH_MESSAGE)).toBeInTheDocument();
    expect(document.getElementById("assessment-batches-field")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(h.createAssessment).not.toHaveBeenCalled();
  });

  it("lets an instructor continue once a batch is picked", async () => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    const user = userEvent.setup();
    render(<CreateAssessmentPage />);
    await waitFor(() => expect(batchesLabel().textContent).toContain("*"));

    fillTheRestOfStepZero();
    await user.click(document.getElementById("assessment-batches-field") as HTMLElement);
    await user.click(await screen.findByRole("option", { name: "Batch A" }));
    await user.click(continueButton());

    expect(await screen.findByText("stub-questions-step")).toBeInTheDocument();
    expect(h.showToast).not.toHaveBeenCalledWith(BATCH_MESSAGE, "error");
  });

  it("keeps the payload shape: the batch as cohort_ids, and no course tag", async () => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    h.createAssessment.mockResolvedValue({ id: 99 });
    const user = userEvent.setup();
    render(<CreateAssessmentPage />);
    await waitFor(() => expect(batchesLabel().textContent).toContain("*"));

    fillTheRestOfStepZero();
    await user.click(document.getElementById("assessment-batches-field") as HTMLElement);
    await user.click(await screen.findByRole("option", { name: "Batch A" }));
    await user.click(screen.getAllByRole("button", { name: /save draft/i })[0]);

    await waitFor(() => expect(h.createAssessment).toHaveBeenCalledTimes(1));
    const payload = h.createAssessment.mock.calls[0][1];
    expect(payload.cohort_ids).toEqual([5]);
    expect(payload).not.toHaveProperty("course_ids");
  });

  it("does not create a new draft the server would refuse", async () => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    const user = userEvent.setup();
    render(<CreateAssessmentPage />);
    await waitFor(() => expect(batchesLabel().textContent).toContain("*"));

    fillTheRestOfStepZero();
    await user.click(screen.getAllByRole("button", { name: /save draft/i })[0]);

    expect(h.showToast).toHaveBeenCalledWith(BATCH_MESSAGE, "error");
    expect(h.createAssessment).not.toHaveBeenCalled();
  });

  it("stays optional for an admin, who may continue without one", async () => {
    h.user = { role: "admin" };
    h.builderConfig.mockResolvedValue({ batch_required: false, course_required: false });
    const user = userEvent.setup();
    render(<CreateAssessmentPage />);
    await waitFor(() => expect(h.builderConfig).toHaveBeenCalled());

    expect(batchesLabel().textContent).toMatch(/\(optional\)/);
    expect(within(batchesLabel()).queryByText("*")).toBeNull();

    fillTheRestOfStepZero();
    await user.click(continueButton());
    expect(await screen.findByText("stub-questions-step")).toBeInTheDocument();
  });

  it("follows the server over the role string", async () => {
    // A course_manager was the gap: the old check read "instructor" only, the server refuses
    // every non-admin.
    h.user = { role: "course_manager" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    render(<CreateAssessmentPage />);
    await waitFor(() => expect(batchesLabel().textContent).toContain("*"));
  });

  it("falls back to the same rule when the server cannot say", async () => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue(null);
    render(<CreateAssessmentPage />);
    await waitFor(() => expect(h.builderConfig).toHaveBeenCalled());
    await waitFor(() => expect(batchesLabel().textContent).toContain("*"));
  });
});
