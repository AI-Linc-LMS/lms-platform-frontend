import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The admin Emails list and job detail on a phone.
 *
 * The detail's four fixed-width tabs (90px minimum each, plus the tab row's padding) are wider
 * than a phone card, and the card clips its overflow, so the Email body tab was cut off at 390px.
 * On a phone the row scrolls; on a desktop it is the same fixed row as before.
 */

let phone = false;
const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: phone && /max-width:\s*599\.95px/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  phone = false;
  cleanup();
});

// A stable toast: the list's loaders depend on it, and a fresh function per render reloads forever.
const toast = vi.hoisted(() => ({ showToast: () => {} }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => toast }));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: () => null,
  HeaderActionButton: () => null,
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/adaptive-quiz/shared/AdaptiveSectionShell", () => ({
  AdaptiveSectionShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/adaptive-quiz/shared/AdaptiveSectionHero", () => ({ AdaptiveSectionHero: () => null }));
// Both animate on viewport entry, which needs an IntersectionObserver jsdom lacks.
vi.mock("@/components/scorecard/shared", () => ({ KpiRail: () => null }));
vi.mock("@/components/scorecard/shared/Reveal", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ jobId: "job-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const jobs = Array.from({ length: 14 }, (_, i) => ({
  task_id: `job-${i}`,
  status: i === 0 ? "failed" : "completed",
  subject: `Subject ${i}`,
  created_at: "2026-09-01T10:00:00Z",
}));
vi.mock("@/lib/services/admin/admin-email-jobs.service", () => ({
  adminEmailJobsService: {
    getEmailJobs: vi.fn(async () => jobs),
    getEmailJobDetail: vi.fn(async () => ({
      task_id: "job-1",
      status: "completed",
      subject: "Welcome",
      emails: [{ name: "Asha", email: "asha@x.com" }],
    })),
    resendEmailJob: vi.fn(),
  },
}));
vi.mock("@/lib/services/admin/admin-assessment-email-jobs.service", () => ({
  adminAssessmentEmailJobsService: { getAssessmentEmailJobs: vi.fn(async () => []) },
}));

import AdminEmailsPage from "./page";
import EmailJobDetailPage from "./[jobId]/page";

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("email job detail tabs", () => {
  it("scroll sideways on a phone", async () => {
    phone = true;
    render(<EmailJobDetailPage />);
    const tabs = (await screen.findByRole("tab", { name: /Email body|emailBody/ })).closest(".MuiTabs-root")!;
    expect(tabs.querySelector(".MuiTabs-scrollableX")).toBeTruthy();
    expect(tabs.querySelector(".MuiTabs-fixed")).toBeNull();
  });

  it("are the original fixed row on a desktop", async () => {
    render(<EmailJobDetailPage />);
    const tabs = (await screen.findByRole("tab", { name: /Email body|emailBody/ })).closest(".MuiTabs-root")!;
    expect(tabs.querySelector(".MuiTabs-fixed")).toBeTruthy();
    expect(tabs.querySelector(".MuiTabs-scrollableX")).toBeNull();
  });

  it("the back button is 44px on a phone only", async () => {
    render(<EmailJobDetailPage />);
    await screen.findAllByRole("tab");
    const back = screen.getByRole("button", { name: /back/i });
    expectPhoneOnly(back, /min-height:44px/);
  });
});

describe("emails list controls", () => {
  it("the tab switch, status filters, search and pagination are 44px on a phone only", async () => {
    render(<AdminEmailsPage />);
    await screen.findByText("Subject 1");
    expectPhoneOnly(screen.getByRole("button", { name: /All emails/ }).parentElement!, /\.MuiButtonBase-root\{min-height:44px/);
    expectPhoneOnly(screen.getByRole("button", { name: "Completed" }).parentElement!, /\.MuiButtonBase-root\{min-height:44px/);
    const search = screen.getByPlaceholderText(/Search by subject/).closest(".MuiTextField-root")!;
    expectPhoneOnly(search, /\.MuiInputBase-root\{min-height:44px/);
    // The desktop keeps its 260px floor; only a phone drops it.
    expect(cssByMedia(search).unscoped).toMatch(/min-width:260px/);
    const pager = document.querySelector(".MuiPagination-root")!.parentElement!;
    expectPhoneOnly(pager, /\.MuiPaginationItem-root\{min-width:44px;height:44px/);
  });
});
