/**
 * Saved resumes in the builder.
 *
 * Every one of these fails on the previous build, because "Save" there rendered a PDF and
 * uploaded it: there was no list in the builder, nothing to open, and no difference between
 * saving over a resume and saving a new one.
 *
 * What is pinned:
 *  - the list of saved resumes appears in the builder;
 *  - opening one restores its content AND its template, not just its text;
 *  - Save updates the resume that is open; Save as new leaves it alone and creates another;
 *  - deleting asks first, and the request only goes out after the learner confirms.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/resume",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({ percentage: 100, completion: 100, missingFields: [] }),
}));
vi.mock("./ATSScoreCard", () => ({ ATSScoreCard: () => <div data-testid="ats-card" /> }));
vi.mock("./ATSQuickFixes", () => ({ ATSQuickFixes: () => null }));
vi.mock("html-to-image", () => ({ toPng: vi.fn() }));

// Hoisted: `vi.mock` is lifted above every const in the file, so the factory below would
// otherwise close over bindings that do not exist yet.
const { list, get, create, update, duplicate, remove } = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  duplicate: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/services/resumeDocuments.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/resumeDocuments.service")>(
    "@/lib/services/resumeDocuments.service",
  );
  return {
    ...actual,
    resumeDocumentsService: { list, get, create, update, duplicate, remove },
  };
});

import { ResumeBuilder } from "./ResumeBuilder";
import { ResumeDocumentsUnavailable } from "@/lib/services/resumeDocuments.service";

const BACKEND_CV = {
  id: 7,
  name: "Backend CV",
  template: "technical",
  ats_score: 72,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-20T10:00:00Z",
};
const STARTUP_CV = { ...BACKEND_CV, id: 9, name: "Startup CV", template: "creative", ats_score: 64 };

const FULL_BACKEND_CV = {
  ...BACKEND_CV,
  content: {
    basicInfo: {
      firstName: "Ada",
      lastName: "Lovelace",
      professionalTitle: "Backend Engineer",
      email: "ada@example.com",
      phone: "",
      location: "",
      summary: "Ten years of shipping payment systems.",
    },
    workExperience: [
      {
        id: "1",
        position: "Staff Engineer",
        company: "Analytical Engines Ltd",
        location: "London",
        startDate: "2020",
        endDate: "",
        current: true,
        description: ["Cut p99 latency by 62 percent"],
      },
    ],
    education: [],
    skills: [{ id: "1", name: "Python" }],
    projects: [],
    certifications: [],
  },
  layout: {
    v: 1,
    order: ["skills", "summary", "workExperience", "education", "projects", "certifications"],
    hidden: ["certifications"],
    columns: {},
  },
};

const panel = () => screen.getByTestId("saved-resumes-panel");
const rows = () => screen.queryAllByTestId("saved-resume-row");

/** Renders and waits for the first list call to settle, so no assertion races the fetch. */
async function renderBuilder() {
  const view = render(<ResumeBuilder />);
  await waitFor(() => expect(list).toHaveBeenCalled());
  await act(async () => {});
  return view;
}

describe("Saved resumes in the resume builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue([BACKEND_CV, STARTUP_CV]);
    get.mockResolvedValue(FULL_BACKEND_CV);
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  // --- the list ------------------------------------------------------------------

  it("lists the resumes the learner has saved", async () => {
    await renderBuilder();
    expect(rows()).toHaveLength(2);
    expect(within(panel()).getByText("Backend CV")).toBeInTheDocument();
    expect(within(panel()).getByText("Startup CV")).toBeInTheDocument();
    // A row has to be worth choosing between: which template, when it was last touched, its score.
    expect(within(panel()).getByText(/technical/i)).toBeInTheDocument();
    expect(within(panel()).getByText(/ATS 72/)).toBeInTheDocument();
  });

  it("tells a first-time learner what saving will do", async () => {
    list.mockResolvedValue([]);
    await renderBuilder();
    expect(rows()).toHaveLength(0);
    expect(within(panel()).getByText(/nothing saved yet/i)).toBeInTheDocument();
    expect(within(panel()).getByText(/template and section order/i)).toBeInTheDocument();
  });

  it("hides itself where the API does not offer saved resumes yet", async () => {
    list.mockRejectedValue(new ResumeDocumentsUnavailable());
    await renderBuilder();
    expect(screen.queryByTestId("saved-resumes-panel")).toBeNull();
    // And Save is still the button it always was, rather than a control that 404s.
    expect(screen.getByRole("button", { name: /^save resume$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more save options/i })).toBeNull();
  });

  // --- opening one ---------------------------------------------------------------

  it("opens a saved resume back into the builder with its content and its template", async () => {
    await renderBuilder();
    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^open$/i }));
    await waitFor(() => expect(get).toHaveBeenCalledWith(7));
    await act(async () => {});

    // The content is in the form, not merely fetched.
    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Backend Engineer")).toBeInTheDocument();
    // The template came back too. Before this, the template was never stored at all, so a
    // reopened resume would always have rendered as Modern.
    expect(screen.getByRole("button", { name: /technical/i })).toHaveAttribute("aria-pressed", "true");
    // The builder says which resume is being edited, so the next Save is never a guess.
    expect(screen.getByRole("heading", { name: "Backend CV" })).toBeInTheDocument();
    expect(within(panel()).getByText(/editing now/i)).toBeInTheDocument();
  });

  it("restores the section arrangement the resume was saved with", async () => {
    await renderBuilder();
    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^open$/i }));
    await waitFor(() => expect(get).toHaveBeenCalled());
    await act(async () => {});

    const stored = JSON.parse(window.localStorage.getItem("resume_layout_v1_1") ?? "{}");
    expect(stored.order[0]).toBe("skills");
    expect(stored.hidden).toEqual(["certifications"]);
  });

  // --- save updates vs save as new -----------------------------------------------

  it("saves over the resume that is open, and creates nothing new", async () => {
    update.mockResolvedValue({ ...BACKEND_CV, ...FULL_BACKEND_CV });
    await renderBuilder();
    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^open$/i }));
    await waitFor(() => expect(get).toHaveBeenCalled());
    await act(async () => {});

    // With a resume open the action says which one it writes to.
    const save = screen.getByRole("button", { name: /^update$/i });
    fireEvent.click(save);
    await waitFor(() => expect(update).toHaveBeenCalled());

    expect(update.mock.calls[0][0]).toBe(7);
    expect(update.mock.calls[0][1].template).toBe("technical");
    expect(create).not.toHaveBeenCalled();
  });

  it("save as new asks for a name and leaves the open resume untouched", async () => {
    create.mockResolvedValue({ ...STARTUP_CV, id: 11, name: "Tailored CV", content: {}, layout: {} });
    await renderBuilder();
    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^open$/i }));
    await waitFor(() => expect(get).toHaveBeenCalled());
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /more save options/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /save as new resume/i }));

    // Scoped to the dialog: the form behind it has its own "Name" fields (every skill has one).
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^name$/i), { target: { value: "Tailored CV" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^save resume$/i }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].name).toBe("Tailored CV");
    // The whole point: the resume that was open is not written to.
    expect(update).not.toHaveBeenCalled();
  });

  it("with nothing open, Save asks for a name rather than overwriting anything", async () => {
    create.mockResolvedValue({ ...BACKEND_CV, id: 12, name: "My resume", content: {}, layout: {} });
    await renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(await screen.findByText(/name this resume/i)).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  // --- delete --------------------------------------------------------------------

  it("asks before deleting, and only deletes once confirmed", async () => {
    remove.mockResolvedValue(undefined);
    await renderBuilder();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^delete$/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/delete this resume\?/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Backend CV/)).toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(remove).not.toHaveBeenCalled();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^delete$/i }));
    const again = await screen.findByRole("dialog");
    fireEvent.click(within(again).getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith(7));
  });

  it("cannot be dismissed while the delete is in flight", async () => {
    let release: () => void = () => {};
    remove.mockImplementation(() => new Promise<void>((resolve) => (release = () => resolve())));
    await renderBuilder();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^delete$/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(remove).toHaveBeenCalled());

    // Mid-request both actions are unavailable, so a second tap cannot fire a second DELETE and
    // the learner cannot walk away from a half-finished one.
    await waitFor(() => expect(within(dialog).getByRole("button", { name: /^cancel$/i })).toBeDisabled());
    expect(within(dialog).getByRole("button", { name: /^delete$/i })).toBeDisabled();

    await act(async () => {
      release();
    });
    expect(remove).toHaveBeenCalledTimes(1);
  });

  // --- rename and duplicate ------------------------------------------------------

  it("renames a resume without touching its contents", async () => {
    update.mockResolvedValue({ ...BACKEND_CV, name: "Payments CV" });
    await renderBuilder();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^rename$/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^name$/i), { target: { value: "Payments CV" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^save name$/i }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, { name: "Payments CV" }));
  });

  it("duplicates a resume so the next one starts from the last", async () => {
    duplicate.mockResolvedValue({ ...BACKEND_CV, id: 13, name: "Backend CV (copy)", content: {}, layout: {} });
    await renderBuilder();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: /^duplicate$/i }));
    await waitFor(() => expect(duplicate).toHaveBeenCalledWith(7));
    expect(update).not.toHaveBeenCalled();
  });
});
