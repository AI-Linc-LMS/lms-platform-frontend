import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/lib/i18n";

/**
 * Review finding 3: the apply route checked `status !== "active"` only. A role whose closing date
 * had passed is still `status: "active"`, so a bookmarked or emailed apply link showed the whole
 * form and failed only on submit (the server refuses it, 400). The route now refuses on the
 * server's `is_open` as well, and says why, in the words the job page uses.
 */

const h = vi.hoisted(() => ({ getJobById: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: "7" }),
  usePathname: () => "/jobs-v2/7/apply",
  useSearchParams: () => new URLSearchParams(""),
}));
// The page guide reads an app-shell provider no unit test mounts; no guide is the usual branch.
vi.mock("@/lib/guide/registry", () => ({ resolveGuide: () => undefined }));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({
    status: "ready",
    completion: null,
    skills: [],
    isComplete: true,
    percentage: 100,
    lockedModules: [],
    missingFields: [],
    refresh: async () => {},
    applyServerLock: () => {},
  }),
  useModuleLocked: () => ({ locked: false, ready: true, showLock: false, reportError: () => false }),
  useOutstandingFields: () => [],
}));
vi.mock("@/lib/services/jobs-v2.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/jobs-v2.service")>(
    "@/lib/services/jobs-v2.service",
  );
  return {
    ...actual,
    jobsV2Service: {
      ...actual.jobsV2Service,
      getJobById: (...args: unknown[]) => h.getJobById(...args),
      getMyApplications: () => Promise.resolve([]),
    },
  };
});
vi.mock("@/components/jobs-v2/apply/ApplyFlow", () => ({
  ApplyFlow: () => <form aria-label="application form" />,
}));

import ApplyJobRoutePage from "./page";

const job = (over: Record<string, unknown> = {}) => ({
  id: 7,
  job_title: "Backend Engineer",
  company_name: "Northwind",
  location: "Bengaluru",
  status: "active",
  is_open: true,
  has_applied: false,
  application_deadline: new Date(2026, 8, 12, 23, 59, 59, 999).toISOString(),
  ...over,
});

beforeEach(() => {
  h.getJobById.mockReset();
});

describe("the apply route on a closed role", () => {
  it("shows the closed page, not the form, when the closing date has passed", async () => {
    h.getJobById.mockResolvedValue(job({ is_open: false }));
    render(<ApplyJobRoutePage />);

    expect(await screen.findByText("Applications closed")).toBeInTheDocument();
    // The same sentence the job page's disabled Apply button gives.
    expect(screen.getByText(/^This role closed on .*12.*2026\.$/)).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "application form" })).toBeNull();
    expect(screen.getByRole("link", { name: /browse similar roles/i })).toHaveAttribute(
      "href",
      "/jobs-v2",
    );
  });

  it("still closes on the status alone, for a backend that sends no is_open", async () => {
    h.getJobById.mockResolvedValue(job({ is_open: undefined, status: "on_hold" }));
    render(<ApplyJobRoutePage />);
    expect(await screen.findByText("Applications closed")).toBeInTheDocument();
    expect(screen.getByText(/this role is on hold/i)).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "application form" })).toBeNull();
  });

  it("says closed, not 'apply on their site', for a closed role that applies elsewhere", async () => {
    h.getJobById.mockResolvedValue(
      job({ is_open: false, apply_link: "https://employer.example/apply" }),
    );
    render(<ApplyJobRoutePage />);
    expect(await screen.findByText("Applications closed")).toBeInTheDocument();
    expect(screen.queryByText(/takes applications on their own site/i)).toBeNull();
  });

  it("explains the closure even to a learner the role never targeted", async () => {
    h.getJobById.mockResolvedValue(job({ is_open: false, eligible_to_apply: false }));
    render(<ApplyJobRoutePage />);
    expect(await screen.findByText("Applications closed")).toBeInTheDocument();
    expect(screen.getByText(/^This role closed on /)).toBeInTheDocument();
    expect(screen.queryByText(/update your profile/i)).toBeNull();
  });

  it("keeps the form for an open role", async () => {
    h.getJobById.mockResolvedValue(job());
    render(<ApplyJobRoutePage />);
    expect(await screen.findByRole("form", { name: "application form" })).toBeInTheDocument();
    expect(screen.queryByText("Applications closed")).toBeNull();
  });

  it("still tells a learner who already applied that they applied", async () => {
    h.getJobById.mockResolvedValue(job({ is_open: false, has_applied: true }));
    render(<ApplyJobRoutePage />);
    expect(await screen.findByText(/you already applied/i)).toBeInTheDocument();
  });
});
