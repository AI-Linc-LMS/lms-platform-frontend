/**
 * Which column each part of an admin job page sits in.
 *
 * Reported as "the right-side column is disproportionately long while the left has much less
 * content". The left held only the prose, which on a scraped posting is often three lines; the
 * right held six blocks. The split is now by KIND: what the job is on the left (prose, skills,
 * classification, links), who and when on the right (publishing, audience, eligibility).
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2 } from "@/lib/services/jobs-v2.service";

const { JOB } = vi.hoisted(() => ({ JOB: {
  id: 1,
  job_title: "Site Reliability Engineer",
  company_name: "GitLab",
  location: "Remote",
  status: "active",
  is_published: true,
  created_at: "2026-09-01T10:00:00Z",
  job_description: "GitLab is an open-core company.",
  key_skills: ["Kubernetes", "Linux"],
  apply_link: "https://job-boards.greenhouse.io/gitlab/jobs/1",
} as JobV2 }));

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminJobsV2Service: {
      getJob: vi.fn().mockResolvedValue(JOB),
      getJobApplications: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "1" }),
  usePathname: () => "/admin/jobs-v2/1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
// The header's "?" guide reads tenant info from a provider too, and is not what this is about.
vi.mock("@/components/common/PageGuide", () => ({ PageGuide: () => null }));

// The app layout needs tenant providers a unit render does not have; the columns are inside it.
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { JobsScope } from "@/components/jobs-v2/ui";
import { JobDetailView } from "./JobDetailView";

const column = (name: "job" | "access") =>
  document.querySelector<HTMLElement>(`[data-column="${name}"]`)!;

async function renderPage() {
  render(
    <JobsScope surface="admin">
      <JobDetailView jobId={1} />
    </JobsScope>,
  );
  await waitFor(() => expect(column("job")).toBeTruthy());
}

describe("the admin job page's two columns", () => {
  it("keeps what the job IS on the left", async () => {
    await renderPage();
    const left = column("job");
    for (const heading of ["About this role", "Key skills", "Classification", "Eligibility", "Attachments and links"]) {
      expect(left.textContent).toContain(heading);
    }
  });

  it("keeps who and when on the right, and nothing else", async () => {
    await renderPage();
    const right = column("access");
    for (const heading of ["Publishing", "Who can see this job"]) {
      expect(right.textContent).toContain(heading);
    }
    // Eligibility moved left too: on a short posting the right column was still 2.6x the left.
    for (const heading of ["Key skills", "Classification", "Eligibility", "Attachments and links"]) {
      expect(right.textContent).not.toContain(heading);
    }
  });

  it("shows every section exactly once - moved, not copied", async () => {
    await renderPage();
    for (const heading of ["Key skills", "Classification", "Eligibility", "Attachments and links"]) {
      expect(screen.getAllByRole("heading", { name: heading })).toHaveLength(1);
    }
  });
});
