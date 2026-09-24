/**
 * The Saved resumes tab.
 *
 * The report this was written for: "currently saved resume is appearing here on resume page - it
 * should be in saved resume tab and from there only it should be editable; currently there is
 * download and delete button, there should be edit that resume button too."
 *
 * Both halves fail on the previous build. The tab rendered ONLY rendered PDFs - Download, Delete
 * and a viewer - while the editable resumes were listed inside the builder on the Resume tab. So
 * the tab named after saved resumes had nothing editable in it, and the one list a learner could
 * act on was somewhere else.
 *
 * What is pinned here:
 *  - the editable resumes are listed in this tab, each with an Edit action;
 *  - Edit hands the builder THAT document's id, rather than opening one itself;
 *  - a rendered PDF gets no Edit - it is an image, there is nothing in it to edit - and keeps
 *    Download and Delete;
 *  - deleting a PDF says what it costs, because an application that used it links to that file.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
}));

const { list, update, duplicate, remove } = vi.hoisted(() => ({
  list: vi.fn(),
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
    resumeDocumentsService: { list, get: vi.fn(), create: vi.fn(), update, duplicate, remove },
  };
});

const { getSavedResumes, deleteResume, openDownload, getResumePdfBlobUrl } = vi.hoisted(() => ({
  getSavedResumes: vi.fn(),
  deleteResume: vi.fn(),
  openDownload: vi.fn(),
  getResumePdfBlobUrl: vi.fn(),
}));
vi.mock("@/lib/services/resume.service", () => ({
  resumeService: {
    getSavedResumes,
    deleteResume,
    openDownload,
    getResumePdfBlobUrl,
    uploadResume: vi.fn(),
    invalidateResumesCache: vi.fn(),
    getDownloadUrl: () => "",
    getResumePdfBlob: vi.fn(),
    fetchImageViaProxy: vi.fn(),
  },
}));

import { SavedResumesSection } from "./SavedResumesSection";

const BACKEND_CV = {
  id: 7,
  name: "Backend CV",
  template: "technical",
  ats_score: 72,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-20T10:00:00Z",
};
const PDF = { id: 41, display_name: "Backend CV.pdf", file_url: "https://x/y.pdf", created_at: "2026-09-20T10:00:00Z" };

const rows = () => screen.queryAllByTestId("saved-resume-row");

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue([BACKEND_CV]);
  getSavedResumes.mockResolvedValue([PDF]);
  getResumePdfBlobUrl.mockResolvedValue("blob:preview");
  // jsdom has no IntersectionObserver, and the PDF card lazy-loads its preview through one.
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

describe("the Saved resumes tab", () => {
  it("lists the editable resumes, each with an Edit action", async () => {
    render(<SavedResumesSection onEditDocument={vi.fn()} />);
    await waitFor(() => expect(rows()).toHaveLength(1));

    expect(screen.getByTestId("saved-resumes-panel")).toBeInTheDocument();
    expect(within(rows()[0]).getByText("Backend CV")).toBeInTheDocument();
    expect(within(rows()[0]).getByTestId("saved-resume-edit")).toHaveTextContent(/edit/i);
  });

  it("Edit asks for THAT resume by id, and does not open one itself", async () => {
    const onEditDocument = vi.fn();
    render(<SavedResumesSection onEditDocument={onEditDocument} />);
    await waitFor(() => expect(rows()).toHaveLength(1));

    fireEvent.click(within(rows()[0]).getByTestId("saved-resume-edit"));
    // The builder is the only thing that loads a document. The tab names the one to load.
    expect(onEditDocument).toHaveBeenCalledWith(7);
  });

  it("a rendered PDF gets Download and Delete, and no Edit", async () => {
    render(<SavedResumesSection onEditDocument={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Backend CV.pdf")).toBeInTheDocument());

    const card = screen.getByText("Backend CV.pdf").closest(".MuiPaper-root") as HTMLElement;
    expect(within(card).getByRole("button", { name: /download/i })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /delete/i })).toBeInTheDocument();
    // A PDF page is an image. An Edit here could only lie about what it would do.
    expect(within(card).queryByTestId("saved-resume-edit")).toBeNull();
    expect(within(card).queryByRole("button", { name: /^edit/i })).toBeNull();
    // And the tab says so, rather than leaving a learner hunting for the button.
    expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
  });

  it("downloading a PDF still works", async () => {
    render(<SavedResumesSection onEditDocument={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Backend CV.pdf")).toBeInTheDocument());
    const card = screen.getByText("Backend CV.pdf").closest(".MuiPaper-root") as HTMLElement;

    fireEvent.click(within(card).getByRole("button", { name: /download/i }));
    expect(openDownload).toHaveBeenCalledWith(41);
  });

  it("deleting a PDF asks first, and says what an application loses", async () => {
    deleteResume.mockResolvedValue(undefined);
    render(<SavedResumesSection onEditDocument={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Backend CV.pdf")).toBeInTheDocument());
    const card = screen.getByText("Backend CV.pdf").closest(".MuiPaper-root") as HTMLElement;

    fireEvent.click(within(card).getByRole("button", { name: /delete/i }));
    const dialog = await screen.findByRole("dialog");
    expect(deleteResume).not.toHaveBeenCalled();
    // The application stored a link to this very file, not a copy of it.
    expect(within(dialog).getByText(/leaves those applications with nothing to open/i)).toBeInTheDocument();
  });

  it("without a way into the builder it offers no documents list at all", async () => {
    // Rather than rows carrying an Edit button that goes nowhere.
    render(<SavedResumesSection />);
    await waitFor(() => expect(screen.getByText("Backend CV.pdf")).toBeInTheDocument());
    expect(screen.queryByTestId("saved-resumes-panel")).toBeNull();
  });
});
