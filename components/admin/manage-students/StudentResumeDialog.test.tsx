import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * "[Resume][Admin] An admin can see that a student has a saved resume but cannot see the resume
 * from Manage Students."
 *
 * Pinned here: the "Yes" in the resume column opens the student's saved resumes (table row on a
 * desktop, card on a phone), the viewer has a loading, an empty and an error state, and a PDF is
 * opened in its own tab or downloaded, never embedded in the admin's page.
 */

// ---- viewport ---------------------------------------------------------------------------------
const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
const PHONE = 390;
const DESKTOP = 1440;

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getStudentResumes: vi.fn(),
  getStudentResumePdf: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, opts?: string | { defaultValue?: string; [k: string]: unknown }) => {
      const template = typeof opts === "string" ? opts : opts?.defaultValue;
      if (!template) return key;
      return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        typeof opts === "object" && opts && k in opts ? String(opts[k]) : "",
      );
    },
  }),
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getStudentResumes: mocks.getStudentResumes,
    getStudentResumePdf: mocks.getStudentResumePdf,
  },
}));

import { StudentResumeDialog } from "./StudentResumeDialog";
import { StudentsTable } from "./StudentsTable";

const TWO_RESUMES = {
  student_id: 7,
  student_name: "Asha Rao",
  has_saved_resume: true,
  resumes: [
    { id: 52, display_name: "Asha_Rao_Resume.pdf", created_at: "2026-09-20T10:00:00Z" },
    { id: 41, display_name: "Old CV", created_at: "2026-08-01T10:00:00Z" },
  ],
};
const NO_RESUMES = { student_id: 9, student_name: "Omar Khan", has_saved_resume: false, resumes: [] };

const createObjectURL = vi.fn(() => "blob:resume-52");
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  viewport(DESKTOP);
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  mocks.getStudentResumePdf.mockResolvedValue(new Blob(["%PDF-1.4"], { type: "application/pdf" }));
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

const sheetPaper = () => document.querySelector(".MuiDrawer-paperAnchorBottom");
const dialogPaper = () => document.querySelector(".MuiDialog-paper");
const noEmbeddedPdf = () =>
  expect(document.querySelector("iframe, embed, object")).toBeNull();

function renderDialog(studentId = 7) {
  const onClose = vi.fn();
  render(<StudentResumeDialog open onClose={onClose} studentId={studentId} studentName="Asha Rao" />);
  return onClose;
}

describe("the student resume viewer", () => {
  it("loads the student's saved resumes, newest first", async () => {
    let resolve: (v: unknown) => void = () => {};
    mocks.getStudentResumes.mockReturnValue(new Promise((r) => (resolve = r)));
    renderDialog();
    expect(screen.getByText("Loading resume…")).toBeTruthy();
    expect(mocks.getStudentResumes).toHaveBeenCalledWith(7);

    resolve(TWO_RESUMES);
    const items = await screen.findAllByTestId("student-resume-item");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Asha_Rao_Resume.pdf")).toBeTruthy();
    expect(within(items[0]).getByText("Latest")).toBeTruthy();
    expect(within(items[1]).getByText("Old CV")).toBeTruthy();
    expect(screen.getByText("Asha Rao")).toBeTruthy();
    noEmbeddedPdf();
  });

  it("says plainly when the student has not saved a resume", async () => {
    mocks.getStudentResumes.mockResolvedValue(NO_RESUMES);
    renderDialog(9);
    expect(await screen.findByText("Omar Khan has not saved a resume yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Open PDF/ })).toBeNull();
  });

  it("shows an error with a retry when the list cannot load", async () => {
    mocks.getStudentResumes.mockRejectedValueOnce(new Error("404")).mockResolvedValueOnce(TWO_RESUMES);
    renderDialog();
    expect(await screen.findByText("Couldn't load this student's resume.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findAllByTestId("student-resume-item")).toHaveLength(2);
    expect(mocks.getStudentResumes).toHaveBeenCalledTimes(2);
  });

  it("opens the PDF in a new tab that cannot reach back into the admin's", async () => {
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    const tab = { opener: {} as unknown, closed: false, location: { href: "" }, close: vi.fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    renderDialog();
    const [latest] = await screen.findAllByTestId("student-resume-item");
    fireEvent.click(within(latest).getByRole("button", { name: /Open PDF/ }));

    // Opened synchronously inside the click, so a popup blocker lets it through.
    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(tab.opener).toBeNull();
    await waitFor(() => expect(tab.location.href).toBe("blob:resume-52"));
    expect(mocks.getStudentResumePdf).toHaveBeenCalledWith(7, 52);
    noEmbeddedPdf();
  });

  it("closes the blank tab and says so when the PDF cannot be fetched", async () => {
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    mocks.getStudentResumePdf.mockRejectedValue(new Error("boom"));
    const tab = { opener: null, closed: false, location: { href: "" }, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    renderDialog();
    const [latest] = await screen.findAllByTestId("student-resume-item");
    fireEvent.click(within(latest).getByRole("button", { name: /Open PDF/ }));
    expect(await screen.findByText("Couldn't open this resume. Try again.")).toBeTruthy();
    expect(tab.close).toHaveBeenCalled();
  });

  it("downloads the PDF under its saved name", async () => {
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    renderDialog();
    await screen.findAllByTestId("student-resume-item");
    fireEvent.click(screen.getByRole("button", { name: "Download Old CV" }));
    await waitFor(() => expect(clicked).toHaveLength(1));
    expect(mocks.getStudentResumePdf).toHaveBeenCalledWith(7, 41);
    expect(clicked[0].download).toBe("Old CV.pdf");
    expect(clicked[0].href).toBe("blob:resume-52");
  });

  it("is a centred dialog on a desktop and a bottom sheet on a phone", async () => {
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    const { unmount } = render(<StudentResumeDialog open onClose={vi.fn()} studentId={7} />);
    await screen.findAllByTestId("student-resume-item");
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
    unmount();

    viewport(PHONE);
    render(<StudentResumeDialog open onClose={vi.fn()} studentId={7} />);
    await screen.findAllByTestId("student-resume-item");
    expect(sheetPaper()).toBeTruthy();
    expect(dialogPaper()).toBeNull();
  });
});

// ---- entry points in Manage Students --------------------------------------------------------------

const student = (id: number, name: string, has_saved_resume: boolean) =>
  ({
    id,
    user_id: id + 1000,
    name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@example.com`,
    is_active: true,
    enrollment_count: 1,
    most_active_course: "",
    has_saved_resume,
    cohorts: [],
    total_marks: 0,
    current_streak: 0,
  }) as never;

function renderTable() {
  render(
    <StudentsTable
      students={[student(7, "Asha Rao", true), student(9, "Omar Khan", false)]}
      completionStats={{}}
      loading={false}
      loadingStats={false}
      sortBy="name"
      sortOrder="asc"
      onSort={vi.fn()}
    />,
  );
}

describe("opening a resume from Manage Students", () => {
  it("opens from the resume column of a table row", async () => {
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    renderTable();
    expect(screen.queryByTestId("view-resume-9")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "View Asha Rao's resume" }));
    expect(await screen.findAllByTestId("student-resume-item")).toHaveLength(2);
    expect(mocks.getStudentResumes).toHaveBeenCalledWith(7);
  });

  it("opens from the card on a phone, as a bottom sheet", async () => {
    viewport(PHONE);
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    renderTable();
    expect(screen.queryByTestId("view-resume-9")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "View Asha Rao's resume" }));
    expect(await screen.findAllByTestId("student-resume-item")).toHaveLength(2);
    expect(sheetPaper()).toBeTruthy();
  });

  it("opens from the card's menu on a phone", async () => {
    viewport(PHONE);
    mocks.getStudentResumes.mockResolvedValue(TWO_RESUMES);
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Asha Rao" }));
    fireEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: /View resume/ }));
    expect(await screen.findAllByTestId("student-resume-item")).toHaveLength(2);
    expect(mocks.getStudentResumes).toHaveBeenCalledWith(7);
  });

  it("offers the menu item only for a student who has a resume", () => {
    viewport(PHONE);
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Omar Khan" }));
    expect(within(screen.getByRole("menu")).queryByRole("menuitem", { name: /View resume/ })).toBeNull();
  });
});
