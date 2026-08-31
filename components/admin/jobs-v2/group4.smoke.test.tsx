import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JobsScope } from "@/components/jobs-v2/ui";
import { JobsTable } from "./list/JobsTable";
import { JobsToolbar, JOBS_FILTER_DEFAULTS, isJobsFiltered } from "./list/JobsToolbar";
import { JobsBulkActions } from "./list/JobsBulkActions";
import { ScrapedTable } from "./scraped/ScrapedTable";
import { ScrapedPreviewSheet } from "./scraped/ScrapedPreviewSheet";
import {
  ReportFunnel,
  aggregateApplications,
  emptyAggregate,
  median,
  mergeAggregates,
  reachedStages,
} from "./reports/ReportFunnel";
import { ReportJobsTable } from "./reports/ReportJobsTable";
import { ExportModal } from "./reports/ExportModal";
import type { JobV2, JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import type { ScrapedJob } from "@/lib/services/admin/admin-scraped-jobs.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/jobs-v2",
  useSearchParams: () => new URLSearchParams(),
}));

const job = (over: Partial<JobV2> = {}): JobV2 => ({
  id: 1,
  job_title: "Backend Engineer",
  company_name: "Acme",
  location: "Remote",
  status: "active",
  is_published: true,
  applications_count: 12,
  created_at: "2026-01-05T10:00:00Z",
  application_deadline: "2099-01-01T10:00:00Z",
  courses: [{ id: 3, title: "Python" }],
  source: "scraped",
  ...over,
});

const scraped = (over: Partial<ScrapedJob> = {}): ScrapedJob => ({
  id: 9,
  source_kind: "lever",
  source_name: "Lever · Acme",
  external_id: "x",
  job_title: "Data Analyst",
  company_name: "Acme",
  company_logo: null,
  location: "Pune",
  salary: null,
  employment_type: null,
  years_of_experience: "0-1",
  job_type: null,
  apply_url: "https://example.com/j",
  mandatory_skills: ["SQL"],
  key_skills: ["SQL", "Excel", "Python", "Tableau"],
  department: "Data",
  industry_type: "",
  role_category: "",
  education: "",
  description_preview: "A short preview",
  relevance: 0.82,
  relevance_reason: "",
  suggested_course_titles: [],
  status: "ready",
  first_seen_at: "2026-08-01T10:00:00Z",
  last_seen_at: "2026-08-20T10:00:00Z",
  enriched_at: null,
  decision: null,
  ...over,
});

const app = (over: Partial<JobApplicationV2> = {}): JobApplicationV2 => ({
  id: 1,
  job: 1,
  job_title: "Backend Engineer",
  company_name: "Acme",
  student: 1,
  student_name: "A",
  student_email: "a@b.c",
  status: "applied",
  applied_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-04T00:00:00Z",
  ...over,
});

const noop = () => undefined;

function inScope(node: React.ReactNode, theme: "light" | "dark" = "light") {
  return render(
    <JobsScope surface="admin" theme={theme}>
      {node}
    </JobsScope>,
  );
}

const tableProps = {
  loading: false,
  error: null,
  onRetry: noop,
  isFiltered: false,
  empty: <div>EMPTY</div>,
  emptyFiltered: <div>EMPTY-FILTERED</div>,
  sort: { key: "created", dir: "desc" as const, onSort: noop },
  selection: { selectedIds: new Set<number>(), onChange: noop, selectableIds: [] as number[] },
  updatingIds: new Set<number>(),
  rowErrors: {},
  onStatusChange: noop,
  onOpenMenu: noop,
};

describe("Group 4 — admin jobs list", () => {
  it("renders a row with title, location, status control, visibility pill and applicants", () => {
    inScope(
      <JobsTable
        {...tableProps}
        rows={[job()]}
        selection={{ selectedIds: new Set(), onChange: noop, selectableIds: [1] }}
      />,
    );
    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Remote").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Published/i).length).toBeGreaterThan(0);
    // The Job cell is a real link, not a row onClick.
    const links = screen.getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href") === "/admin/jobs-v2/1")).toBe(true);
    // The Company column is gone: the caption carries it once, not twice.
    expect(screen.queryByRole("columnheader", { name: /company/i })).toBeNull();
  });

  it("renders the filtered empty state, not the never-posted one, when filtered", () => {
    inScope(<JobsTable {...tableProps} rows={[]} isFiltered />);
    expect(screen.getByText("EMPTY-FILTERED")).toBeInTheDocument();
  });

  it("renders ErrorState with a retry instead of an empty table on failure", () => {
    inScope(<JobsTable {...tableProps} rows={[]} error="boom" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.queryByText("EMPTY")).toBeNull();
  });

  it("marks only the updating row busy", () => {
    inScope(
      <JobsTable
        {...tableProps}
        rows={[job(), job({ id: 2, job_title: "Frontend Engineer" })]}
        updatingIds={new Set([1])}
      />,
    );
    const selects = screen.getAllByRole("combobox");
    const disabled = selects.filter((el) => el.getAttribute("aria-disabled") === "true");
    expect(disabled.length).toBeGreaterThan(0);
    expect(disabled.length).toBeLessThan(selects.length);
  });

  it("renders identically in the dark scope (tokens, not hardcoded colours)", () => {
    const { container } = inScope(<JobsTable {...tableProps} rows={[job()]} />, "dark");
    expect(container.querySelector('[data-jobs-theme="dark"]')).not.toBeNull();
    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThan(0);
  });

  it("the toolbar shows a removable chip per active filter", () => {
    inScope(
      <JobsToolbar
        searchInput="eng"
        onSearchInput={noop}
        onSearchSubmit={noop}
        state={{ ...JOBS_FILTER_DEFAULTS, search: "eng", status: "active", closingSoon: true }}
        onChange={noop}
        onClearFilters={noop}
      />,
    );
    const region = screen.getByRole("region", { name: /active filters/i });
    expect(within(region).getAllByRole("button").length).toBeGreaterThanOrEqual(4);
  });

  it("isJobsFiltered is false only at the defaults", () => {
    expect(isJobsFiltered(JOBS_FILTER_DEFAULTS)).toBe(false);
    expect(isJobsFiltered({ ...JOBS_FILTER_DEFAULTS, visibility: "draft" })).toBe(true);
  });

  it("the bulk bar exposes two separate named actions once targets are picked", () => {
    inScope(<JobsBulkActions selectedIds={[1, 2]} rows={[job()]} onClear={noop} onDone={noop} />);
    expect(screen.getByRole("region", { name: /bulk actions/i })).toBeInTheDocument();
    // Two pickers; the apply buttons appear only once a target value is chosen.
    expect(screen.getAllByRole("combobox").length).toBe(2);
    expect(screen.queryByRole("button", { name: /change status/i })).toBeNull();
  });
});

describe("Group 4 — scraped queue", () => {
  const scrapedProps = {
    tab: "review" as const,
    loading: false,
    error: null,
    onRetry: noop,
    isFiltered: false,
    empty: <div>EMPTY</div>,
    emptyFiltered: <div>EMPTY-FILTERED</div>,
    onOpenMenu: noop,
    onPreview: noop,
  };

  it("renders the relevance meter with an accessible value", () => {
    inScope(
      <ScrapedTable
        {...scrapedProps}
        rows={[scraped()]}
        selection={{ selectedIds: new Set(), onChange: noop, selectableIds: [9] }}
      />,
    );
    const meters = screen.getAllByRole("meter");
    expect(meters[0]).toHaveAttribute("aria-valuenow", "82");
    expect(screen.getAllByText("82%").length).toBeGreaterThan(0);
  });

  it("explains the missing checkbox column on the non-review tabs", () => {
    inScope(<ScrapedTable {...scrapedProps} tab="imported" rows={[scraped()]} />);
    expect(screen.getByText(/bulk actions apply to the review queue/i)).toBeInTheDocument();
  });

  it("keeps an error visible instead of showing the tab's empty copy", () => {
    inScope(<ScrapedTable {...scrapedProps} rows={[]} error="down" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("EMPTY")).toBeNull();
  });

  it("the preview sheet renders the scorer's fallback reasoning", async () => {
    inScope(
      <ScrapedPreviewSheet
        row={scraped()}
        onClose={noop}
        onImportDraft={noop}
        onReviewAndImport={noop}
      />,
    );
    expect(await screen.findByText(/No reason recorded by the scorer/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Group 4 — reports", () => {
  it("reads the furthest stage reached from the pipeline fields, not the status word", () => {
    const rejectedAfterRound3 = app({ status: "rejected", round_1: "pass", round_3: "fail" });
    const reached = reachedStages(rejectedAfterRound3);
    expect(reached.applied).toBe(true);
    expect(reached.shortlisted).toBe(true);
    expect(reached.interview_stage).toBe(true);
    expect(reached.selected).toBe(false);
  });

  it("never counts an unmoved application as an instant response", () => {
    const agg = aggregateApplications([app({ status: "applied" })]);
    expect(agg.responseDays).toHaveLength(0);
    expect(median(agg.responseDays)).toBeNull();
  });

  it("times a real response in whole days", () => {
    const agg = aggregateApplications([app({ status: "shortlisted" })]);
    expect(agg.responseDays).toEqual([3]);
  });

  it("does not count an applying record as applied", () => {
    const agg = aggregateApplications([app({ status: "applying" })]);
    expect(agg.applying).toBe(1);
    expect(agg.reached.applied).toBe(0);
  });

  it("merges per-job aggregates without losing response times", () => {
    const merged = mergeAggregates([
      aggregateApplications([app({ status: "shortlisted" })]),
      aggregateApplications([app({ id: 2, status: "selected", offered: "yes" })]),
      emptyAggregate(),
    ]);
    expect(merged.total).toBe(2);
    expect(merged.reached.selected).toBe(1);
    expect(merged.responseDays).toHaveLength(2);
  });

  it("renders the funnel with stage-to-stage conversion and no chart library", () => {
    const aggregate = mergeAggregates([
      aggregateApplications([
        app({ status: "applied" }),
        app({ id: 2, status: "shortlisted" }),
        app({ id: 3, status: "selected", offered: "yes" }),
        app({ id: 4, status: "rejected", round_1: "no" }),
      ]),
    ]);
    inScope(<ReportFunnel aggregate={aggregate} scopeLabel="all jobs" />);
    expect(screen.getByRole("region", { name: /applicant funnel/i })).toBeInTheDocument();
    expect(screen.getAllByText(/from the step before/i).length).toBe(3);
  });

  it("says 'counting' rather than zero while a job's applications are still loading", () => {
    inScope(
      <ReportJobsTable
        rows={[{ job: job(), stats: null }]}
        loading={false}
        error={null}
        onRetry={noop}
        isFiltered={false}
        empty={<div>EMPTY</div>}
        emptyFiltered={<div>EMPTY-FILTERED</div>}
        sort={{ key: "applicants", dir: "desc", onSort: noop }}
        selectedJobId={null}
        onSelectJob={noop}
      />,
    );
    expect(screen.getAllByText(/counting/i).length).toBeGreaterThan(0);
  });

  it("the export modal states the date range is not supported rather than faking it", () => {
    inScope(
      <ExportModal
        open
        onClose={noop}
        jobs={[job()]}
        estimateRows={() => 12}
        defaultJobId=""
      />,
    );
    expect(screen.getByText(/does not accept a date range yet/i)).toBeInTheDocument();
    expect(screen.getByText(/About 12 rows/i)).toBeInTheDocument();
  });
});
