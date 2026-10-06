import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Previewing the certificate before it is earned.
 *
 * The point is motivational: a learner who can almost read their own name on the document has
 * a reason to finish, where "complete 80% of the course" gives them nothing to want. So the
 * preview shows the REAL certificate - the same one the download captures - not a placeholder.
 *
 * The constraint that matters: the "Preview" scrim must never be painted into the document.
 * It carries `exclude-from-certificate-export`, the class the export pipeline filters on, so a
 * learner who later downloads the real thing does not find the word burned into their image.
 */

let canClaim = false;
vi.mock("@/components/certificate/useCertificateActions", () => ({
  useCertificateActions: () => ({
    available: true, ready: true, canClaim, checking: false, minPct: 80,
    downloading: false, sharing: false, hasUser: true,
    downloadCertificate: vi.fn(), shareOnLinkedIn: vi.fn(), addToLinkedInProfile: vi.fn(),
    portal: null,
  }),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { first_name: "Shubham", last_name: "Lal", email: "s@x.com" } }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useOptionalClientInfo: () => ({ id: 29, name: "Impacteers" }),
  useIsAiVoiceTutorEnabled: () => true,
}));
vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getCertificateLinkedInPost: vi.fn(), issueCertificate: vi.fn() },
}));

import { CertificateMilestone } from "./CertificateMilestone";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

const board = (completion: number): JourneyBoard =>
  ({
    course: {
      id: 14, title: "AI Mastery June 2026", description: "",
      certificateEnabled: true, certificateThreshold: 80, certificateTitle: "",
      certificateTemplateUrl: null, completionPct: completion,
    },
    progressCard: { completionPct: completion, nodesDone: 3, nodesTotal: 78,
                    pointsEarned: 0, pointsTotal: 1, onTimeRate: null },
  }) as unknown as JourneyBoard;

beforeEach(() => { canClaim = false; });

describe("previewing the certificate", () => {
  it("offers Preview even when the certificate is not earned", () => {
    render(<CertificateMilestone board={board(4)} />);
    expect(screen.getByRole("button", { name: /Preview/ })).toBeTruthy();
  });

  it("does not offer download or share before it is claimable", () => {
    // A greyed-out Download is an advert for something the learner cannot have. Preview is
    // the whole offer until the bar is cleared.
    render(<CertificateMilestone board={board(4)} />);
    expect(screen.queryByRole("button", { name: /Certificate$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Share/ })).toBeNull();
  });

  it("offers all three once the server says it is claimable", () => {
    canClaim = true;
    render(<CertificateMilestone board={board(92)} />);
    expect(screen.getByRole("button", { name: /Preview/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Certificate/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Share/ })).toBeTruthy();
  });

  it("opens the real certificate, with the learner's own name on it", () => {
    render(<CertificateMilestone board={board(4)} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(screen.getByText(/Shubham Lal/)).toBeTruthy();
  });

  it("says it is a preview, and at what point it issues", () => {
    render(<CertificateMilestone board={board(4)} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(screen.getByText(/Preview · issued at 80% complete/)).toBeTruthy();
    expect(screen.getByText("4% of 80%")).toBeTruthy();
  });

  it("keeps the scrim out of the exported document", () => {
    // THE constraint. The export pipeline filters on this class; without it the word
    // "Preview" would be rasterised into the certificate a learner later downloads.
    const { container } = render(<CertificateMilestone board={board(4)} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    const scrim = document.querySelector(".exclude-from-certificate-export");
    expect(scrim).toBeTruthy();
    expect(scrim?.textContent).toContain("Preview");
    expect(container).toBeTruthy();
  });

  it("drops the scrim and the progress bar once it is earned", () => {
    canClaim = true;
    render(<CertificateMilestone board={board(92)} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(document.querySelector(".exclude-from-certificate-export")).toBeNull();
    expect(screen.queryByText(/issued at 80%/)).toBeNull();
  });

  it("closes again", async () => {
    render(<CertificateMilestone board={board(4)} />);
    fireEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Close the certificate preview/ }));
    // The dialog stays mounted through MUI's close transition, so this waits for it to go
    // rather than asserting on the frame the click happened in.
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
