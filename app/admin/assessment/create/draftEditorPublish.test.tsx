import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * The draft editor's Publish made the SAVED draft live. The publish call carries no content, and
 * the server sends the email it has saved, so anything edited since the last save - a title, a
 * section, the email itself - silently did not go out while the author looked at it on screen.
 *
 * Now Publish checks for unsaved changes. Someone who may change the paper gets them saved
 * first, and nothing is published if that save fails. Someone who may publish it but not change
 * it (the save is refused, 403) is asked whether to publish the last saved version instead.
 */

const h = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  user: { role: "admin" } as { role: string },
  builderConfig: vi.fn(),
  getAssessmentById: vi.fn(),
  getQuestionsExportJson: vi.fn(),
  updateAssessment: vi.fn(),
  publishAssessment: vi.fn(),
  createAssessment: vi.fn(),
  /** Every setContent the email editor received, in order. */
  setContentCalls: [] as Array<[string | null, string | null]>,
}));

// Stable, as next/navigation's are: the draft loader's effect depends on the router, and a fresh
// object per render would cancel every load it starts.
const router = {
  push: (url: string) => h.push(url),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};
const search = new URLSearchParams("fromDraft=77");
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => search,
  usePathname: () => "/admin/assessment/create",
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
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: null }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/admin/assessment/BasicInfoSection", () => ({
  BasicInfoSection: (p: { onTitleChange: (v: string) => void }) => (
    <input aria-label="stub-title" onChange={(e) => p.onTitleChange(e.target.value)} />
  ),
}));
vi.mock("@/components/admin/assessment/MultipleSectionsSection", () => ({
  sectionTimeLimitExceedsOverallMessage: () => null,
  MultipleSectionsSection: () => null,
}));
vi.mock("@/components/admin/assessment/SectionBasedQuestionsInput", () => ({
  SectionBasedQuestionsInput: () => null,
}));
vi.mock("@/components/admin/assessment/AssessmentPreviewSection", () => ({
  AssessmentPreviewSection: () => null,
}));
// The editor's contract, not its Tiptap body: subject + body state, the "has content" callback,
// and the imperative handle the page drives (getValues / setContent / seedDefaults).
vi.mock("@/components/admin/assessment/EmailNotificationEditor", async () => {
  const React = await import("react");
  type Props = {
    initialSubject: string;
    initialBody: string;
    onEnabledChange?: (enabled: boolean) => void;
  };
  const EmailNotificationEditor = React.forwardRef(function StubEditor(p: Props, ref) {
    const [subject, setSubject] = React.useState(p.initialSubject);
    const [body, setBody] = React.useState(p.initialBody);
    const hasData = subject.trim() !== "" && body.trim() !== "";
    const { onEnabledChange } = p;
    React.useEffect(() => {
      onEnabledChange?.(hasData);
    }, [hasData, onEnabledChange]);
    React.useImperativeHandle(
      ref,
      () => ({
        getValues: () => ({
          enabled: hasData,
          subject: subject.trim(),
          body: hasData ? body.trim() : "",
          attachment: null,
          attachmentUrl: null,
        }),
        seedDefaults: () => {
          setSubject(p.initialSubject);
          setBody(p.initialBody);
        },
        setContent: (s: string | null, b: string | null) => {
          h.setContentCalls.push([s, b]);
          if (s != null) setSubject(s);
          if (b != null) setBody(b);
        },
      }),
      [subject, body, hasData, p.initialSubject, p.initialBody],
    );
    return (
      <input
        aria-label="stub-email-subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
    );
  });
  return { EmailNotificationEditor };
});
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
vi.mock("@/lib/services/admin/admin-assessment.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminAssessmentService: new Proxy(
      {},
      {
        get: (_t, key: string) => {
          const mocks: Record<string, unknown> = {
            getAssessmentBuilderConfig: h.builderConfig,
            getAssessmentById: h.getAssessmentById,
            getQuestionsExportJson: h.getQuestionsExportJson,
            updateAssessment: h.updateAssessment,
            publishAssessment: h.publishAssessment,
            createAssessment: h.createAssessment,
          };
          return mocks[key] ?? (() => Promise.resolve([]));
        },
      },
    ),
  };
});

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

/** Draft 77 as the server holds it. */
function draft(over: Record<string, unknown> = {}) {
  return {
    id: 77,
    is_draft: true,
    is_active: false,
    title: "Unit 3 check",
    instructions: "Answer everything",
    duration_minutes: 60,
    audience: { cohorts: [{ id: 5, name: "Batch A" }], courses: [] },
    ...over,
  };
}

const EXPORT = {
  assessment: { id: 77 },
  sections: [
    {
      section_id: 1,
      section_type: "quiz",
      section_title: "S",
      order: 1,
      number_of_questions: 1,
      questions: [
        {
          id: 501,
          question_text: "q",
          option_a: "a",
          option_b: "b",
          option_c: "c",
          option_d: "d",
          correct_option: "A",
        },
      ],
    },
  ],
};

const continueButton = () => screen.getByRole("button", { name: /continue/i });
const publishButton = () => screen.getByRole("button", { name: /^publish assessment$/i });

/** Open draft 77, optionally change something on step 0, and walk to the final step. */
async function openDraftAndReachFinalStep(edit?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>) {
  const user = userEvent.setup();
  render(<CreateAssessmentPage />);
  await waitFor(() => expect(h.getQuestionsExportJson).toHaveBeenCalled());
  await screen.findByLabelText("stub-title");
  if (edit) await edit(user);
  await waitFor(() => expect(continueButton()).not.toBeDisabled());
  await user.click(continueButton());
  await waitFor(() => expect(continueButton()).not.toBeDisabled());
  await user.click(continueButton());
  await screen.findByRole("button", { name: /^publish assessment$/i });
  return user;
}

const renameTo = (title: string) => async () => {
  fireEvent.change(screen.getByLabelText("stub-title"), { target: { value: title } });
};

beforeEach(() => {
  for (const fn of [
    h.showToast,
    h.push,
    h.builderConfig,
    h.getAssessmentById,
    h.getQuestionsExportJson,
    h.updateAssessment,
    h.publishAssessment,
    h.createAssessment,
  ]) {
    fn.mockReset();
  }
  h.setContentCalls = [];
  h.user = { role: "admin" };
  h.builderConfig.mockResolvedValue({ batch_required: false, course_required: false });
  h.getAssessmentById.mockResolvedValue(draft());
  h.getQuestionsExportJson.mockResolvedValue(EXPORT);
  h.updateAssessment.mockResolvedValue({ id: 77 });
  h.publishAssessment.mockResolvedValue({ id: 77 });
});

describe("draft editor: Publish with nothing changed", () => {
  it("publishes the saved draft and saves nothing", async () => {
    const user = await openDraftAndReachFinalStep();
    await user.click(publishButton());
    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.publishAssessment.mock.calls[0][1]).toBe(77);
    expect(h.updateAssessment).not.toHaveBeenCalled();
    expect(h.createAssessment).not.toHaveBeenCalled();
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/admin/assessment/77/edit"));
  });
});

describe("draft editor: Publish with unsaved changes, by someone who may change the paper", () => {
  it("saves the changes first, then publishes that paper", async () => {
    const user = await openDraftAndReachFinalStep(renameTo("Unit 3 final check"));
    await user.click(publishButton());

    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.updateAssessment).toHaveBeenCalledTimes(1);
    const [, savedId, payload] = h.updateAssessment.mock.calls[0];
    expect(savedId).toBe(77);
    expect(payload.title).toBe("Unit 3 final check");
    // Saved as a draft: the publish, not the save, is what makes it live.
    expect(payload).not.toHaveProperty("is_draft");
    expect(h.updateAssessment.mock.invocationCallOrder[0]).toBeLessThan(
      h.publishAssessment.mock.invocationCallOrder[0],
    );
    expect(h.publishAssessment.mock.calls[0][1]).toBe(77);
    // The attachment, if any, went up with the save; the publish is plain JSON.
    expect(h.publishAssessment.mock.calls[0][3]).toBeNull();
    expect(h.createAssessment).not.toHaveBeenCalled();
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/admin/assessment/77/edit"));
  });

  it("publishes nothing when that save fails", async () => {
    h.updateAssessment.mockRejectedValue(
      Object.assign(new Error("title: Ensure this field has no more than 255 characters."), {
        status: 400,
      }),
    );
    const user = await openDraftAndReachFinalStep(renameTo("x".repeat(300)));
    await user.click(publishButton());

    await waitFor(() =>
      expect(h.showToast).toHaveBeenCalledWith(
        "Your changes could not be saved, so nothing was published: title: Ensure this field has no more than 255 characters.",
        "error",
      ),
    );
    expect(h.publishAssessment).not.toHaveBeenCalled();
    // And it does not offer to publish the old version either: this author may save, so the
    // right move is to fix the change.
    expect(screen.queryByText("Publish the last saved version?")).toBeNull();
  });

  it("gives an instructor with edit rights the same save-then-publish", async () => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    const user = await openDraftAndReachFinalStep(renameTo("Unit 3 final check"));
    await user.click(publishButton());
    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.updateAssessment).toHaveBeenCalledTimes(1);
    expect(h.updateAssessment.mock.invocationCallOrder[0]).toBeLessThan(
      h.publishAssessment.mock.invocationCallOrder[0],
    );
  });
});

describe("draft editor: Publish with unsaved changes, by someone who may publish but not change it", () => {
  beforeEach(() => {
    h.user = { role: "instructor" };
    h.builderConfig.mockResolvedValue({ batch_required: true, course_required: false });
    h.updateAssessment.mockRejectedValue(
      Object.assign(new Error("You do not have permission to update this assessment."), {
        status: 403,
      }),
    );
  });

  it("asks before publishing the last saved version, and publishes it on yes", async () => {
    const user = await openDraftAndReachFinalStep(renameTo("Unit 3 final check"));
    await user.click(publishButton());

    expect(await screen.findByText("Publish the last saved version?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your unsaved changes will not be included. Learners get the assessment, and its notification email, exactly as they were last saved.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your changes could not be saved: You do not have permission to update this assessment.",
      ),
    ).toBeInTheDocument();
    expect(h.publishAssessment).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Publish last saved version" }));
    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.publishAssessment.mock.calls[0][1]).toBe(77);
    expect(h.updateAssessment).toHaveBeenCalledTimes(1);
  });

  it("publishes nothing when they choose to keep editing", async () => {
    const user = await openDraftAndReachFinalStep(renameTo("Unit 3 final check"));
    await user.click(publishButton());
    await user.click(await screen.findByRole("button", { name: "Keep editing" }));
    await waitFor(() =>
      expect(screen.queryByText("Publish the last saved version?")).toBeNull(),
    );
    expect(h.publishAssessment).not.toHaveBeenCalled();
    expect(publishButton()).not.toBeDisabled();
  });
});

describe("draft editor: the notification email is part of what is saved", () => {
  const withEmail = () =>
    draft({
      email_notification_enabled: true,
      email_subject: "Mid-term reminder",
      email_body: "<p>Bring a calculator.</p>",
    });

  it("opens the editor on the saved email, not the defaults", async () => {
    h.getAssessmentById.mockResolvedValue(withEmail());
    render(<CreateAssessmentPage />);
    await waitFor(() =>
      expect(h.setContentCalls).toContainEqual(["Mid-term reminder", "<p>Bring a calculator.</p>"]),
    );
    expect(await screen.findByLabelText("stub-email-subject")).toHaveValue("Mid-term reminder");
  });

  it("counts an untouched saved email as nothing to save", async () => {
    h.getAssessmentById.mockResolvedValue(withEmail());
    const user = await openDraftAndReachFinalStep();
    await user.click(publishButton());
    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.updateAssessment).not.toHaveBeenCalled();
  });

  it("counts an edited subject as a change, and saves it before publishing", async () => {
    h.getAssessmentById.mockResolvedValue(withEmail());
    const user = await openDraftAndReachFinalStep(async () => {
      fireEvent.change(await screen.findByLabelText("stub-email-subject"), {
        target: { value: "Mid-term: bring a calculator" },
      });
    });
    await user.click(publishButton());
    await waitFor(() => expect(h.publishAssessment).toHaveBeenCalledTimes(1));
    expect(h.updateAssessment).toHaveBeenCalledTimes(1);
    const payload = h.updateAssessment.mock.calls[0][2];
    expect(payload.email_subject).toBe("Mid-term: bring a calculator");
    expect(payload.email_body).toBe("<p>Bring a calculator.</p>");
  });
});

describe("draft editor: a save sends back what the paper holds", () => {
  it("keeps the timezone, the reminder schedule and the batches instead of clearing them", async () => {
    h.getAssessmentById.mockResolvedValue(
      draft({
        timezone: "Asia/Riyadh",
        email_notification_enabled: true,
        email_subject: "Mid-term reminder",
        email_body: "<p>Bring a calculator.</p>",
        email_reminders_enabled: true,
        email_reminder_offsets: [60, 1440],
      }),
    );
    const user = await openDraftAndReachFinalStep(renameTo("Unit 3 final check"));
    await user.click(publishButton());
    await waitFor(() => expect(h.updateAssessment).toHaveBeenCalledTimes(1));
    const payload = h.updateAssessment.mock.calls[0][2];
    expect(payload.timezone).toBe("Asia/Riyadh");
    expect(payload.email_reminders_enabled).toBe(true);
    expect(payload.email_reminder_offsets).toEqual([60, 1440]);
    expect(payload.cohort_ids).toEqual([5]);
  });
});
