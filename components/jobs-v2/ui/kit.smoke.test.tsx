/**
 * The kit's definition of done, as a test.
 *
 * The spec (section 9, Group 1) requires that **every component renders in isolation at light
 * and at `data-jobs-theme="dark"`**. That is a claim nobody can re-check by eye across 24
 * components on every future change, so it is asserted here instead: each component is mounted
 * inside both scopes, and a render that throws — a bad MUI slot, a recursive dialog, a missing
 * required prop path — fails the suite rather than a screen.
 *
 * It also pins the two invariants that are easy to regress silently:
 *   - the status maps are exhaustive over their unions;
 *   - `StatusPill` never renders an editable control.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

import { JobsScope } from "./JobsScope";
import { JButton } from "./JButton";
import { CountPill, DeadlineChip, MetaChip, SignalChip, SkillChip, StatusPill } from "./Chips";
import {
  DefinitionList,
  HairlineStrip,
  JCard,
  JPanel,
  MicroRuleList,
  Notice,
} from "./Surfaces";
import { BulletList } from "./BulletList";
import { HighlightStrip } from "./HighlightStrip";
import { EligibilityCard, EligibilityChecklist } from "./Eligibility";
import { JobsSplitLayout, useRailKeys } from "./Split";
import type { EligibilityCheck, EligibilitySummary } from "@/lib/jobs-v2/eligibility";
import { SectionHeader } from "./SectionHeader";
import {
  JCheckGroup,
  JDatePicker,
  JField,
  JFileDrop,
  JRadioGroup,
  JSelect,
  JSwitch,
  JTextArea,
  JTextField,
  RequiredLegend,
  StatusSelect,
} from "./Field";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import {
  ApplyStepSkeleton,
  AppliedListSkeleton,
  DataTableSkeleton,
  FormSkeleton,
  HairlineStripSkeleton,
  HeroSkeleton,
  JobCardSkeleton,
  JobDetailSkeleton,
  JobListSkeleton,
  JobRailCardSkeleton,
  JobRowSkeleton,
  PipelineSkeleton,
  ScrapedTableSkeleton,
  SplitSkeleton,
} from "./Skeletons";
import { JDataTable } from "./JDataTable";
import { JConfirm, JModal, JSheet } from "./JModal";
import { JStepper } from "./JStepper";
import { JTabPanel, JTabs } from "./JTabs";
import { SearchInput } from "./SearchInput";
import {
  ActiveFilters,
  FacetList,
  FilterBar,
  FilterPopover,
  FilterSheet,
  SegmentedToggle,
} from "./FilterBar";
import { JPagination } from "./JPagination";
import { CompanyLogo, JAvatar } from "./CompanyLogo";
import { MetaRow } from "./MetaRow";
import { BulkActionBar, Toolbar } from "./Toolbar";
import {
  APP_STATUS,
  APP_STATUS_ORDER,
  JOB_STATUS,
  JOB_STATUS_ORDER,
  SCRAPED_STATE,
  SCRAPED_STATE_ORDER,
  VISIBILITY,
  VISIBILITY_ORDER,
} from "./jobsTokens";
import {
  ApplicationsIllustration,
  CreateJobIllustration,
  EmptyJobsIllustration,
  JobDetailIllustration,
  JobSearchIllustration,
  ReportsIllustration,
} from "@/components/jobs-v2/illustrations";

// `next/link` needs an app-router context that a unit render does not have.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const noop = () => undefined;

interface Row {
  id: number;
  title: string;
}
const ROWS: Row[] = [
  { id: 1, title: "Frontend Engineer" },
  { id: 2, title: "Data Analyst" },
];

const ELIGIBILITY_CHECKS: EligibilityCheck[] = [
  {
    key: "course",
    label: "Enrolled course",
    requirement: "Python Full-Stack",
    yours: "You match this",
    status: "pass",
    enforced: true,
  },
  {
    key: "percentage_12",
    label: "Class 12",
    requirement: "70%",
    yours: null,
    status: "unknown",
    enforced: false,
    fixHref: "/profile#education",
  },
];

const ELIGIBLE: EligibilitySummary = {
  eligible: true,
  visibilityReason: "Open to your cohort",
  checks: ELIGIBILITY_CHECKS,
};

const FACETS = [
  { value: "remote", label: "Remote", count: 12 },
  { value: "hybrid", label: "Hybrid", count: 4 },
  { value: "onsite", label: "On-site", count: 0 },
];

/** Every component in the kit, mounted with a realistic prop set. */
const CASES: Array<[string, ReactNode]> = [
  ["JButton primary", <JButton key="a" variant="primary" startIcon="mdi:plus">Create</JButton>],
  ["JButton secondary", <JButton key="b" variant="secondary">Edit</JButton>],
  ["JButton ghost", <JButton key="c" variant="ghost">More</JButton>],
  ["JButton quiet", <JButton key="d" variant="quiet">Clear</JButton>],
  ["JButton danger", <JButton key="e" variant="danger">Delete</JButton>],
  ["JButton onDark", <JButton key="f" variant="onDark">Saved</JButton>],
  ["JButton loading", <JButton key="g" variant="primary" loading>Saving</JButton>],
  [
    "JButton disabledReason",
    <JButton key="h" variant="primary" disabledReason="Select a resume to continue">
      Next
    </JButton>,
  ],
  ["JButton href", <JButton key="i" variant="secondary" href="/jobs-v2">Back</JButton>],
  ["StatusPill job", <StatusPill key="j" kind="job" value="on_hold" />],
  ["StatusPill unknown", <StatusPill key="k" kind="job" value="something-new" />],
  [
    "StatusPill interactive",
    <StatusPill key="l" kind="application" value="applying" interactive pressed onClick={noop} count={4} />,
  ],
  ["MetaChip", <MetaChip key="m" icon="mdi:map-marker">Bengaluru</MetaChip>],
  ["SkillChip", <SkillChip key="n" selected onToggle={noop} count={12}>React</SkillChip>],
  ["CountPill", <CountPill key="o" value={137} tone="azure" />],
  ["JCard", <JCard key="p">Body</JCard>],
  ["JCard interactive accent", <JCard key="q" interactive accent="azure" href="/jobs-v2/1">Body</JCard>],
  ["JPanel", <JPanel key="r">Body</JPanel>],
  [
    "HairlineStrip",
    <HairlineStrip
      key="s"
      ariaLabel="Application stages"
      items={APP_STATUS_ORDER.map((status, i) => ({
        key: status,
        label: status,
        value: i * 3,
        onClick: noop,
        active: i === 0,
      }))}
    />,
  ],
  ["MicroRuleList", <MicroRuleList key="t" items={["One", "Two"]} />],
  ["SectionHeader", <SectionHeader key="u" icon="mdi:briefcase" title="Open roles" count={3} noun="jobs" />],
  ["RequiredLegend", <RequiredLegend key="v" />],
  ["JField", <JField key="w" label="Custom" required htmlFor="x"><input id="x" /></JField>],
  ["JTextField", <JTextField key="x" label="Job title" required value="" onChange={noop} />],
  [
    "JTextField error",
    <JTextField key="y" label="Email" value="nope" onChange={noop} error="Enter a valid email address" />,
  ],
  ["JTextArea", <JTextArea key="z" label="Description" value="" onChange={noop} showCount maxLength={500} />],
  [
    "JSelect",
    <JSelect
      key="aa"
      label="Experience"
      value="0-1"
      onChange={noop}
      placeholder="Any"
      options={[{ value: "0-1", label: "0-1 years" }]}
    />,
  ],
  ["StatusSelect", <StatusSelect key="ab" kind="job" label="Status" value="active" onChange={noop} busy />],
  [
    "JRadioGroup",
    <JRadioGroup
      key="ac"
      label="Type"
      required
      value="a"
      onChange={noop}
      options={[
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ]}
    />,
  ],
  [
    "JCheckGroup",
    <JCheckGroup
      key="ad"
      label="Skills"
      values={["a"]}
      onChange={noop}
      options={[
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ]}
    />,
  ],
  ["JDatePicker", <JDatePicker key="ae" label="Deadline" value="2026-09-30" onChange={noop} />],
  ["JFileDrop idle", <JFileDrop key="af" label="Drop your resume" onFile={noop} />],
  [
    "JFileDrop success",
    <JFileDrop
      key="ag"
      label="Drop your resume"
      onFile={noop}
      onClear={noop}
      state="success"
      value={{ name: "resume.pdf", size: 148_000 }}
    />,
  ],
  ["JFileDrop error", <JFileDrop key="ah" label="Drop" onFile={noop} state="error" error="Too large" />],
  ["JSwitch", <JSwitch key="ai" label="Publish" checked onChange={noop} description="Visible to students" />],
  [
    "EmptyState",
    <EmptyState
      key="aj"
      illustration={<EmptyJobsIllustration width={120} height={94} />}
      title="No jobs match these filters"
      body="Widen the search."
      hints={["Location: Remote", "Posted: last 7 days"]}
      primaryAction={<JButton variant="primary">Clear all filters</JButton>}
    />,
  ],
  ["ErrorState", <ErrorState key="ak" error="500 Internal Server Error" onRetry={noop} />],
  ["HeroSkeleton", <HeroSkeleton key="al" />],
  ["JobCardSkeleton", <JobCardSkeleton key="am" />],
  ["JobRowSkeleton", <JobRowSkeleton key="an" />],
  ["JobListSkeleton card", <JobListSkeleton key="ao" count={2} view="card" />],
  ["JobListSkeleton list", <JobListSkeleton key="ap" count={2} view="list" />],
  ["JobDetailSkeleton", <JobDetailSkeleton key="aq" />],
  ["AppliedListSkeleton", <AppliedListSkeleton key="ar" count={2} />],
  ["HairlineStripSkeleton", <HairlineStripSkeleton key="as" columns={4} />],
  ["DataTableSkeleton", <DataTableSkeleton key="at" columns={4} rows={3} />],
  ["ScrapedTableSkeleton", <ScrapedTableSkeleton key="au" rows={2} />],
  ["FormSkeleton", <FormSkeleton key="av" sections={1} fields={2} />],
  ["ApplyStepSkeleton", <ApplyStepSkeleton key="aw" />],
  ["PipelineSkeleton", <PipelineSkeleton key="ax" />],
  [
    "JDataTable",
    <JDataTable<Row>
      key="ay"
      caption="Jobs"
      rows={ROWS}
      getRowId={(row) => row.id}
      getRowHref={(row) => `/admin/jobs-v2/${row.id}`}
      getRowLabel={(row) => row.title}
      columns={[
        { key: "title", header: "Job", sortable: true, render: (row) => row.title },
        { key: "status", header: "Status", hideBelow: "md", render: () => <StatusPill kind="job" value="active" /> },
      ]}
      sort={{ key: "title", dir: "asc", onSort: noop }}
      selection={{ selectedIds: new Set([1]), onChange: noop, selectableIds: [1, 2] }}
      mobile={(row) => <JCard interactive>{row.title}</JCard>}
    />,
  ],
  [
    "JDataTable empty filtered",
    <JDataTable<Row>
      key="az"
      caption="Jobs"
      rows={[]}
      isFiltered
      emptyFiltered={<EmptyState title="Nothing matches" body="Clear the filters." />}
      empty={<EmptyState title="No jobs yet" body="Nothing posted." />}
      getRowId={(row) => row.id}
      columns={[{ key: "title", header: "Job", render: (row) => row.title }]}
      mobile={(row) => <JCard>{row.title}</JCard>}
    />,
  ],
  [
    "JDataTable error",
    <JDataTable<Row>
      key="ba"
      caption="Jobs"
      rows={[]}
      error="Network unreachable"
      onRetry={noop}
      getRowId={(row) => row.id}
      columns={[{ key: "title", header: "Job", render: (row) => row.title }]}
      mobile={(row) => <JCard>{row.title}</JCard>}
    />,
  ],
  [
    "JModal",
    <JModal key="bb" open onClose={noop} title="Add question" eyebrow="03 · FORM" description="Shared bank" icon="mdi:help" dirty footer={<JButton variant="primary">Save</JButton>}>
      Body
    </JModal>,
  ],
  ["JSheet", <JSheet key="bc" open onClose={noop} title="Preview">Body</JSheet>],
  [
    "JConfirm danger",
    <JConfirm
      key="bd"
      open
      title="Reject 200 applicants?"
      body="This notifies every one of them."
      confirmLabel="Reject"
      tone="danger"
      consequences={["200 applicants move to Rejected", "Each receives an email"]}
      onConfirm={noop}
      onCancel={noop}
    />,
  ],
  [
    "JStepper",
    <JStepper
      key="be"
      ariaLabel="Application steps"
      active={1}
      onStepChange={noop}
      steps={[
        { key: "resume", label: "Your resume", status: "done", enabled: true },
        { key: "questions", label: "Questions", status: "error", enabled: true },
        { key: "review", label: "Review", status: "todo", enabled: false },
      ]}
    />,
  ],
  [
    "JTabs + panel",
    <div key="bf">
      <JTabs
        ariaLabel="Job board views"
        idPrefix="board"
        value="browse"
        onChange={noop}
        tabs={[
          { value: "browse", label: "Browse", count: 137 },
          { value: "applied", label: "Applied", count: 4 },
        ]}
      />
      <JTabPanel idPrefix="board" value="browse" active>
        Panel
      </JTabPanel>
    </div>,
  ],
  ["SearchInput", <SearchInput key="bg" value="eng" onChange={noop} onSubmit={noop} ariaLabel="Search jobs" loading />],
  [
    "FilterBar + FilterPopover",
    <FilterBar key="bh">
      <FilterPopover label="Location" icon="mdi:map-marker" badge={2} onClear={noop}>
        <div>options</div>
      </FilterPopover>
    </FilterBar>,
  ],
  [
    "ActiveFilters",
    <ActiveFilters key="bi" onClearAll={noop} chips={[{ key: "loc", label: "Remote", onRemove: noop }]} />,
  ],
  [
    "JPagination",
    <JPagination key="bj" page={2} pageCount={7} total={137} pageSize={20} onPageChange={noop} onPageSizeChange={noop} />,
  ],
  ["CompanyLogo", <CompanyLogo key="bk" name="Acme" src="https://example.test/logo.png" />],
  ["CompanyLogo fallback", <CompanyLogo key="bl" name="Acme" />],
  ["JAvatar", <JAvatar key="bm" name="Priya" size={32} />],
  [
    "MetaRow",
    <MetaRow
      key="bn"
      max={2}
      items={[
        { key: "location", icon: "mdi:map-marker", label: "Remote" },
        { key: "salary", icon: "mdi:cash", label: "8-12 LPA" },
        { key: "posted", icon: "mdi:clock", label: "2 days ago" },
      ]}
    />,
  ],
  ["Toolbar", <Toolbar key="bo" start={<span>start</span>} end={<JButton>End</JButton>} />],
  [
    "BulkActionBar",
    <BulkActionBar
      key="bp"
      count={12}
      noun="jobs"
      onClear={noop}
      actions={[
        {
          key: "publish",
          label: "Publish",
          icon: "mdi:eye",
          onRun: async () => ({ ok: 12, failed: [] }),
          confirm: { title: "Publish 12 jobs?", consequences: ["12 jobs become visible"] },
        },
      ]}
    />,
  ],
  ["JobSearchIllustration", <JobSearchIllustration key="bq" tone="accent" />],
  ["EmptyJobsIllustration", <EmptyJobsIllustration key="br" />],
  ["CreateJobIllustration", <CreateJobIllustration key="bs" />],
  ["ApplicationsIllustration", <ApplicationsIllustration key="bt" />],
  ["ReportsIllustration", <ReportsIllustration key="bu" />],
  ["JobDetailIllustration", <JobDetailIllustration key="bv" tone="accent" />],

  /* ---- the job-site kit ------------------------------------------------- */
  ["BulletList rule", <BulletList key="ca" items={["Ship the service", "Own the model"]} />],
  ["BulletList check", <BulletList key="cb" variant="check" items={["4 years of Python"]} />],
  ["BulletList plus muted", <BulletList key="cc" variant="plus" tone="muted" items={["Kafka"]} />],
  ["BulletList cross", <BulletList key="cd" variant="cross" items={["No relocation"]} />],
  [
    "BulletList numbered",
    <BulletList key="ce" variant="numbered" items={["Screening call", "Take-home", "Onsite"]} />,
  ],
  [
    "BulletList disclosed",
    <BulletList key="cf" max={2} items={["One", "Two", "Three", "Four"]} />,
  ],
  [
    "HighlightStrip",
    <HighlightStrip
      key="cg"
      items={[
        { key: "workMode", icon: "mdi:home-city-outline", label: "Hybrid" },
        { key: "salary", icon: "mdi:cash-multiple", label: "18-24 LPA" },
      ]}
    />,
  ],
  ["EligibilityCard eligible", <EligibilityCard key="ch" summary={ELIGIBLE} />],
  [
    "EligibilityCard blocked",
    <EligibilityCard
      key="ci"
      summary={{
        eligible: false,
        reason: "This role is open to specific courses you are not enrolled in.",
        checks: [{ ...ELIGIBILITY_CHECKS[0], status: "fail" }],
      }}
    />,
  ],
  ["EligibilityChecklist", <EligibilityChecklist key="cj" checks={ELIGIBILITY_CHECKS} />],
  [
    "SignalChip",
    <SignalChip
      key="ck"
      icon="mdi:school-outline"
      fg="var(--j-azure-deep)"
      bg="var(--j-azure-soft)"
      bd="var(--j-azure-border)"
      explain="You are enrolled in Python Full-Stack, which this role is open to."
    >
      Internship
    </SignalChip>,
  ],
  ["DeadlineChip", <DeadlineChip key="cl" value="2099-01-01" />],
  [
    "FacetList",
    <FacetList key="cm" options={FACETS} selected={["remote"]} onToggle={noop} initialVisible={2} />,
  ],
  [
    "SegmentedToggle",
    <SegmentedToggle
      key="cn"
      label="Only jobs I'm eligible for"
      icon="mdi:check-decagram-outline"
      checked
      onChange={noop}
      count={42}
    />,
  ],
  [
    "FilterSheet",
    <FilterSheet
      key="co"
      open
      onClose={noop}
      resultCount={84}
      activeCount={2}
      onApply={noop}
      onClearAll={noop}
      groups={[
        {
          key: "wm",
          label: "Work mode",
          node: <FacetList options={FACETS} selected={[]} onToggle={noop} />,
        },
      ]}
    />,
  ],
  [
    "JobsSplitLayout",
    <JobsSplitLayout
      key="cp"
      showBelowLg="rail"
      railLabel="Search results"
      paneLabel="Job posting"
      rail={<div>rail</div>}
      pane={<div>pane</div>}
    />,
  ],
  ["JobRailCardSkeleton", <JobRailCardSkeleton key="cq" />],
  ["SplitSkeleton", <SplitSkeleton key="cr" railCount={2} />],
  [
    "DefinitionList two columns",
    <DefinitionList
      key="cs"
      layout="columns"
      columns={2}
      emptyValue="Not disclosed"
      items={[
        { key: "salary", label: "Salary", value: "" },
        { key: "openings", label: "Openings", value: 3 },
        { key: "exp", label: "Experience", value: null, emptyValue: null },
      ]}
    />,
  ],
  [
    "Notice quiet",
    <Notice
      key="ct"
      tone="quiet"
      icon="mdi:shield-check-outline"
      title="A note on applying"
      body="AI Linc never asks for money for a job or an interview."
    />,
  ],
];

describe.each(["light", "dark"] as const)("kit renders in %s", (theme) => {
  it.each(CASES)("%s", (_name, node) => {
    const { container } = render(
      <JobsScope theme={theme} surface="student">
        {node}
      </JobsScope>,
    );
    const scope = container.querySelector(".jobs-scope");
    expect(scope).not.toBeNull();
    expect(scope?.getAttribute("data-jobs-theme")).toBe(theme);
  });
});

describe("status maps are exhaustive", () => {
  it("every ordered status has a tone, and every tone is ordered", () => {
    expect(JOB_STATUS_ORDER).toHaveLength(Object.keys(JOB_STATUS).length);
    expect(APP_STATUS_ORDER).toHaveLength(Object.keys(APP_STATUS).length);
    expect(VISIBILITY_ORDER).toHaveLength(Object.keys(VISIBILITY).length);
    expect(SCRAPED_STATE_ORDER).toHaveLength(Object.keys(SCRAPED_STATE).length);
    // The `on_hold` bug: it went missing from the create/edit stepper's short list.
    expect(JOB_STATUS_ORDER).toContain("on_hold");
    // `applying` was missing from every stat strip, so the counts never summed to the total.
    expect(APP_STATUS_ORDER[0]).toBe("applying");
  });

  it("gives every tone an i18n key and an icon", () => {
    for (const map of [JOB_STATUS, APP_STATUS, VISIBILITY, SCRAPED_STATE]) {
      for (const tone of Object.values(map)) {
        expect(tone.labelKey).toMatch(/^jobsV2\./);
        expect(tone.icon).toBeTruthy();
      }
    }
  });
});

describe("StatusPill is never an editable control", () => {
  it("renders a span when not interactive, and a button when it is a filter toggle", () => {
    const { container, rerender } = render(
      <JobsScope>
        <StatusPill kind="job" value="active" />
      </JobsScope>,
    );
    expect(container.querySelector("button")).toBeNull();

    rerender(
      <JobsScope>
        <StatusPill kind="job" value="active" interactive pressed={false} onClick={noop} />
      </JobsScope>,
    );
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("JDataTable accessibility", () => {
  it("gives the table a caption, sortable headers with aria-sort, and labelled checkboxes", () => {
    render(
      <JobsScope surface="admin">
        <JDataTable<Row>
          caption="Jobs on this page"
          rows={ROWS}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.title}
          getRowHref={(row) => `/admin/jobs-v2/${row.id}`}
          columns={[{ key: "title", header: "Job", sortable: true, render: (row) => row.title }]}
          sort={{ key: "title", dir: "desc", onSort: noop }}
          selection={{ selectedIds: new Set(), onChange: noop, selectableIds: [1, 2] }}
          mobile={(row) => <JCard>{row.title}</JCard>}
        />
      </JobsScope>,
    );

    const table = screen.getByRole("table", { name: "Jobs on this page" });
    const header = within(table).getByRole("columnheader", { name: /job/i });
    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(screen.getAllByLabelText("Select Frontend Engineer").length).toBeGreaterThan(0);
    // The primary cell is a real link, not an onClick on the row.
    expect(within(table).getByRole("link", { name: "Frontend Engineer" })).toBeTruthy();
  });
});

/* =========================================================================
 * The job-site kit's own invariants.
 *
 * Each of these is a rule the spec states as a non-negotiable and which is invisible on a
 * screenshot, so it is asserted rather than eyeballed.
 * ======================================================================= */

describe("a missing field is omitted, never a dash or an empty slot", () => {
  it("BulletList and HighlightStrip render NOTHING rather than an empty section", () => {
    const { container, rerender } = render(
      <JobsScope>
        <BulletList items={[]} />
      </JobsScope>,
    );
    expect(container.querySelector("ul")).toBeNull();

    rerender(
      <JobsScope>
        <HighlightStrip items={[]} />
      </JobsScope>,
    );
    expect(container.querySelector(".jobs-scope")?.textContent).toBe("");
  });

  it("DefinitionList DROPS a valueless row by default and prints the opt-in fallback", () => {
    render(
      <JobsScope>
        <DefinitionList
          layout="columns"
          columns={2}
          emptyValue="Not disclosed"
          items={[
            { key: "salary", label: "Salary", value: "" },
            // An unstated experience range is not "not disclosed", it is ABSENT — printing a
            // row for it would imply we asked.
            { key: "exp", label: "Experience", value: null, emptyValue: null },
            { key: "openings", label: "Openings", value: 3 },
          ]}
        />
      </JobsScope>,
    );
    expect(screen.getByText("Salary")).toBeTruthy();
    expect(screen.getByText("Not disclosed")).toBeTruthy();
    expect(screen.queryByText("Experience")).toBeNull();
  });
});

describe("BulletList disclosure", () => {
  it("shows the first N and reveals the rest without losing any", () => {
    render(
      <JobsScope>
        <BulletList max={2} items={["One", "Two", "Three", "Four"]} />
      </JobsScope>,
    );
    expect(screen.queryByText("Three")).toBeNull();
    const toggle = screen.getByRole("button", { name: /show all 4/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByText("Three")).toBeTruthy();
    expect(screen.getByText("Four")).toBeTruthy();
  });
});

describe("EligibilityCard never lies about enforcement", () => {
  it("renders nothing when the verdict is unknown, or when there is nothing behind it", () => {
    const { container, rerender } = render(
      <JobsScope>
        <EligibilityCard summary={{ eligible: null, checks: ELIGIBILITY_CHECKS }} />
      </JobsScope>,
    );
    expect(container.querySelector(".jobs-scope")?.textContent).toBe("");

    rerender(
      <JobsScope>
        <EligibilityCard summary={{ eligible: true, checks: [] }} />
      </JobsScope>,
    );
    expect(container.querySelector(".jobs-scope")?.textContent).toBe("");
  });

  it("labels the non-enforced gates and says we do not block on them", () => {
    render(
      <JobsScope>
        <EligibilityCard summary={ELIGIBLE} />
      </JobsScope>,
    );
    expect(screen.getByText(/stated by the employer/i)).toBeTruthy();
    expect(screen.getByText(/we do not block your application on it/i)).toBeTruthy();
    // A gate the student can act on carries the way to act on it.
    expect(screen.getByRole("link", { name: /add it to your profile/i })).toBeTruthy();
  });

  it("names the blocking criterion when the student cannot apply", () => {
    render(
      <JobsScope>
        <EligibilityCard
          summary={{
            eligible: false,
            reason: "This role is open to specific courses you are not enrolled in.",
            checks: [{ ...ELIGIBILITY_CHECKS[0], status: "fail" }],
          }}
        />
      </JobsScope>,
    );
    expect(screen.getByText(/you cannot apply to this role yet/i)).toBeTruthy();
    expect(screen.getByText(/open to specific courses/i)).toBeTruthy();
  });
});

describe("FacetList counts", () => {
  it("DISABLES a zero-count option instead of hiding it, so the list stops shifting", () => {
    render(
      <JobsScope>
        <FacetList options={FACETS} selected={[]} onToggle={noop} initialVisible={4} />
      </JobsScope>,
    );
    const onsite = screen.getByRole("button", { name: /on-site/i });
    expect(onsite.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /remote/i }).hasAttribute("disabled")).toBe(false);
  });

  it("windows at `initialVisible` and discloses the rest", () => {
    render(
      <JobsScope>
        <FacetList options={FACETS} selected={[]} onToggle={noop} initialVisible={2} />
      </JobsScope>,
    );
    expect(screen.queryByRole("button", { name: /on-site/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /view more/i }));
    expect(screen.getByRole("button", { name: /on-site/i })).toBeTruthy();
  });

  it("reports selection as aria-pressed, not only as a tint", () => {
    render(
      <JobsScope>
        <FacetList options={FACETS} selected={["remote"]} onToggle={noop} />
      </JobsScope>,
    );
    expect(screen.getByRole("button", { name: /remote/i }).getAttribute("aria-pressed")).toBe("true");
  });
});

describe("FilterSheet states its outcome", () => {
  it("names the count on the footer button, and names the way out at zero", () => {
    const { rerender } = render(
      <JobsScope>
        <FilterSheet
          open
          onClose={noop}
          resultCount={84}
          onApply={noop}
          onClearAll={noop}
          groups={[{ key: "wm", label: "Work mode", node: <div /> }]}
        />
      </JobsScope>,
    );
    expect(screen.getAllByText(/show 84 jobs/i).length).toBeGreaterThan(0);

    rerender(
      <JobsScope>
        <FilterSheet
          open
          onClose={noop}
          resultCount={0}
          onApply={noop}
          onClearAll={noop}
          groups={[{ key: "wm", label: "Work mode", node: <div /> }]}
        />
      </JobsScope>,
    );
    // A disabled button in this module must always say why.
    expect(screen.getAllByText(/try removing a filter/i).length).toBeGreaterThan(0);
  });
});

describe("the split is CSS, and it is the module's one nested scroller", () => {
  it("keeps BOTH children in the tree at every breakpoint", () => {
    render(
      <JobsScope>
        <JobsSplitLayout
          showBelowLg="rail"
          railLabel="Search results"
          paneLabel="Job posting"
          rail={<div data-tour-id="jobs-results">rail</div>}
          pane={<div>pane</div>}
        />
      </JobsScope>,
    );
    // The desktop/mobile fork is what dropped `onFavoriteChange`, drifted two empty states and
    // left four of six tour ids on one branch only. There is one tree now.
    expect(screen.getByText("rail")).toBeTruthy();
    expect(screen.getByText("pane")).toBeTruthy();
    expect(document.querySelector('[data-tour-id="jobs-results"]')).not.toBeNull();
  });

  it("makes both panes focusable, labelled scroll regions", () => {
    render(
      <JobsScope>
        <JobsSplitLayout
          showBelowLg="pane"
          railLabel="Search results"
          paneLabel="Job posting"
          rail={<div>rail</div>}
          pane={<div>pane</div>}
        />
      </JobsScope>,
    );
    for (const label of ["Search results", "Job posting"]) {
      const region = screen.getByRole("region", { name: label });
      // A scroll region a keyboard user cannot focus is one they cannot scroll.
      expect(region.getAttribute("tabindex")).toBe("0");
    }
  });
});

describe("useRailKeys", () => {
  function Rail({ onSelect }: { onSelect: (id: number) => void }) {
    useRailKeys({ ids: [1, 2, 3], selectedId: 1, onSelect });
    return (
      <JobsSplitLayout
        showBelowLg="rail"
        railLabel="Search results"
        paneLabel="Job posting"
        rail={
          <>
            <input aria-label="Search jobs" role="searchbox" />
            {[1, 2, 3].map((id) => (
              <div key={id} data-rail-id={id} tabIndex={-1}>
                Job {id}
              </div>
            ))}
          </>
        }
        pane={<div>pane</div>}
      />
    );
  }

  it("moves focus with j/k and opens with Enter, from inside the rail", () => {
    const onSelect = vi.fn();
    render(
      <JobsScope>
        <Rail onSelect={onSelect} />
      </JobsScope>,
    );
    const first = document.querySelector<HTMLElement>('[data-rail-id="1"]')!;
    first.focus();

    fireEvent.keyDown(document, { key: "j" });
    expect(document.activeElement?.getAttribute("data-rail-id")).toBe("2");

    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("data-rail-id")).toBe("3");

    fireEvent.keyDown(document, { key: "k" });
    expect(document.activeElement?.getAttribute("data-rail-id")).toBe("2");

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("is SUPPRESSED while focus is in a text field — 'j' is a letter first", () => {
    const onSelect = vi.fn();
    render(
      <JobsScope>
        <Rail onSelect={onSelect} />
      </JobsScope>,
    );
    const search = screen.getByRole("searchbox");
    search.focus();

    fireEvent.keyDown(search, { key: "j" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(search);
  });

  it("returns focus to the search input on Esc", () => {
    render(
      <JobsScope>
        <Rail onSelect={noop} />
      </JobsScope>,
    );
    document.querySelector<HTMLElement>('[data-rail-id="1"]')!.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByRole("searchbox"));
  });

  it("ignores a keystroke that is not in the rail at all", () => {
    const onSelect = vi.fn();
    render(
      <JobsScope>
        <Rail onSelect={onSelect} />
      </JobsScope>,
    );
    document.body.focus();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("MicroRuleList keeps its name and signature", () => {
  it("still renders its items, now through BulletList", () => {
    render(
      <JobsScope>
        <MicroRuleList items={["First consequence", "Second consequence"]} />
      </JobsScope>,
    );
    expect(screen.getByText("First consequence")).toBeTruthy();
    expect(screen.getByText("Second consequence")).toBeTruthy();
  });
});
