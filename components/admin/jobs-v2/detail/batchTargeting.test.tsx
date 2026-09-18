/**
 * Posting a job to batches from the job's "Who can see this job" card.
 *
 * Requested as "there is an option to add students to a job but no option to add a cohort".
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2 } from "@/lib/services/jobs-v2.service";

const svc = vi.hoisted(() => ({
  getJobCohorts: vi.fn(),
  updateJobCohorts: vi.fn(),
}));

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, adminJobsV2Service: svc };
});

import { AudiencePanel } from "./AudiencePanel";

const BATCHES = [
  { id: 7, name: "8024-E", status: "active", member_count: 40 },
  { id: 8, name: "8022-M", status: "scheduled", member_count: 12 },
];

function job(overrides: Partial<JobV2> = {}): JobV2 {
  return { id: 5, job_title: "SRE", company_name: "Acme", is_published: true, cohorts: [], ...overrides } as JobV2;
}

beforeEach(() => {
  svc.getJobCohorts.mockReset().mockResolvedValue({ posted: [], available: BATCHES });
  svc.updateJobCohorts.mockReset();
});

describe("posting a job to batches", () => {
  it("posts the picked batches and shows them on the card", async () => {
    svc.updateJobCohorts.mockResolvedValue({ posted: [BATCHES[0]], available: [BATCHES[1]] });
    const onCohortsChange = vi.fn();
    render(<AudiencePanel job={job()} onCohortsChange={onCohortsChange} />);

    fireEvent.click(screen.getByTestId("post-to-batches"));
    const options = await screen.findByTestId("batch-options");
    fireEvent.click(within(options).getByLabelText("8024-E"));
    expect(screen.getByText(/1 batch\(es\), 40 student\(s\)/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("confirm-post-to-batches"));

    await waitFor(() => expect(svc.updateJobCohorts).toHaveBeenCalledWith(5, [7], "add"));
    expect(onCohortsChange).toHaveBeenCalledWith([{ id: 7, name: "8024-E" }]);
  });

  it("warns that the first batch narrows a job every student can see", async () => {
    render(<AudiencePanel job={job()} />);
    fireEvent.click(screen.getByTestId("post-to-batches"));
    expect(await screen.findByText(/visible to every student right now/)).toBeTruthy();
  });

  it("does not warn when something already narrows the job", async () => {
    render(<AudiencePanel job={job({ assigned_students: [{ id: 1, name: "Ada", email: "a@x" }] })} />);
    fireEvent.click(screen.getByTestId("post-to-batches"));
    await screen.findByTestId("batch-options");
    expect(screen.queryByText(/visible to every student right now/)).toBeNull();
  });

  it("counts batches in the audience sentence", () => {
    render(<AudiencePanel job={job({ cohorts: [{ id: 7, name: "8024-E" }] })} />);
    expect(screen.getByText(/members of 1 batch\(es\)/)).toBeTruthy();
    expect(screen.queryByText(/Visible to every student/)).toBeNull();
  });

  it("says removing the last batch opens the job to everyone, then removes it", async () => {
    svc.updateJobCohorts.mockResolvedValue({ posted: [], available: BATCHES });
    const onCohortsChange = vi.fn();
    render(<AudiencePanel job={job({ cohorts: [{ id: 7, name: "8024-E" }] })} onCohortsChange={onCohortsChange} />);

    fireEvent.click(screen.getByLabelText("Take this job off 8024-E"));
    expect(await screen.findByText(/becomes visible to every student again/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Take it off" }));

    await waitFor(() => expect(svc.updateJobCohorts).toHaveBeenCalledWith(5, [7], "remove"));
    expect(onCohortsChange).toHaveBeenCalledWith([]);
  });

  it("shows the server's refusal instead of closing", async () => {
    svc.updateJobCohorts.mockRejectedValue(new Error("A completed or archived batch cannot be given a new job."));
    render(<AudiencePanel job={job()} />);
    fireEvent.click(screen.getByTestId("post-to-batches"));
    fireEvent.click(within(await screen.findByTestId("batch-options")).getByLabelText("8022-M"));
    fireEvent.click(screen.getByTestId("confirm-post-to-batches"));
    expect(await screen.findByText(/archived batch cannot be given/)).toBeTruthy();
  });
});
