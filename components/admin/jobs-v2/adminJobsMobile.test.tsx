/**
 * The ADMIN jobs screens on a phone.
 *
 * Measured at 390px against a signed-in tenant: the count strip filled the first screen (five
 * counts stacked three rows deep) and on the applicant pipeline pushed every applicant below the
 * fold; status pills and strip labels were 10-11px; every job card's kebab was 30px and its
 * applicants link 22px; the form's Save/Next bar was pinned under the floating dock; and a job's
 * long apply URL pushed every detail card 32px past the screen edge.
 *
 * The student board shares these primitives and already shipped its own phone pass, so every
 * admin rule is scoped twice: to the phone media query AND to `data-jobs-surface="admin"`. The
 * tests read the emitted CSS (jsdom has no layout) and check both halves: the phone value exists
 * where it should, and nothing a desktop - or the student board - can see has changed.
 */
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { HairlineStrip, JModal, JobsScope, StatusPill } from "@/components/jobs-v2/ui";
import { DESKTOP, PHONE, styleAt } from "@/components/jobs-v2/responsiveSx.testutil";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { JobsTable } from "./list/JobsTable";
import { JobForm } from "./form/JobForm";
import { ApplicationsTable } from "./applications/ApplicationsTable";

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, adminJobsV2Service: { getQuestions: vi.fn().mockResolvedValue([]), createQuestion: vi.fn() } };
});
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { getManageStudents: vi.fn().mockResolvedValue({ students: [], pagination: {} }) },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/jobs-v2",
  useSearchParams: () => new URLSearchParams(),
}));

const ADMIN = { within: '[data-jobs-surface="admin"]' };
const noop = () => undefined;

function admin(node: ReactNode) {
  return render(<JobsScope surface="admin">{node}</JobsScope>);
}

/** Every declaration outside the phone block - what any desktop browser sees. */
function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

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
  ...over,
});

describe("the count strip (and applicant stage selector)", () => {
  const items = ["Applied", "Shortlisted", "Interview", "Selected", "Rejected", "Applying"].map((label, i) => ({
    key: label,
    label,
    value: String(i),
    onClick: noop,
  }));

  it("is one sideways-scrolling row on an admin phone, the grid it was on a desktop", () => {
    admin(<HairlineStrip items={items} ariaLabel="Filter by application status" />);
    const strip = screen.getByRole("group", { name: "Filter by application status" });
    expect(styleAt(strip, PHONE, "display", ADMIN)).toBe("flex");
    expect(styleAt(strip, PHONE, "overflow-x", ADMIN)).toBe("auto");
    expect(styleAt(strip, DESKTOP, "display", ADMIN)).toBeNull();
    // The desktop grid is untouched.
    expect(styleAt(strip, DESKTOP, "display")).toBe("grid");
    expect(styleAt(strip, DESKTOP, "grid-template-columns")).toBe("repeat(6, minmax(0, 1fr))");
  });

  it("gives every cell a fixed 124px width and a 12px label on a phone only", () => {
    admin(<HairlineStrip items={items} ariaLabel="Filter by application status" />);
    const cell = screen.getByRole("button", { name: /Shortlisted/ });
    expect(styleAt(cell, PHONE, "width", ADMIN)).toBe("124px");
    expect(styleAt(cell, DESKTOP, "width", ADMIN)).toBeNull();
    expectPhoneOnly(cell, /width:124px/);
    const label = screen.getByText("Shortlisted");
    expect(styleAt(label, PHONE, "font-size", ADMIN)).toBe("0.75rem");
    expect(styleAt(label, DESKTOP, "font-size")).toBe("0.6875rem");
  });

  it("does not reach the student board: the phone row only exists under the admin surface", () => {
    render(
      <JobsScope surface="student">
        <HairlineStrip items={items} ariaLabel="Student strip" />
      </JobsScope>,
    );
    const strip = screen.getByRole("group", { name: "Student strip" });
    // Unscoped, the phone never sees a flex row - only an admin ancestor turns it on.
    expect(styleAt(strip, PHONE, "display")).toBe("grid");
    expect(strip.closest('[data-jobs-surface="admin"]')).toBeNull();
  });
});

describe("status pills", () => {
  it("read at 12px on an admin phone and keep 11px on a desktop", () => {
    admin(<StatusPill kind="job" value="active" />);
    const pill = screen.getByText(/active/i).parentElement!;
    expect(styleAt(pill, PHONE, "font-size", ADMIN)).toBe("0.75rem");
    expect(styleAt(pill, DESKTOP, "font-size", ADMIN)).toBeNull();
    expect(styleAt(pill, DESKTOP, "font-size")).toBe("0.6875rem");
  });
});

describe("a job card's controls", () => {
  const props = {
    loading: false,
    error: null,
    onRetry: noop,
    isFiltered: false,
    empty: <div />,
    emptyFiltered: <div />,
    sort: { key: "created", dir: "desc" as const, onSort: noop },
    selection: { selectedIds: new Set<number>(), onChange: noop, selectableIds: [1] },
    updatingIds: new Set<number>(),
    rowErrors: {},
    onStatusChange: noop,
    onOpenMenu: noop,
  };

  it("has a 44px kebab and a 44px applicants link on a phone, and neither size on a desktop", () => {
    admin(<JobsTable {...props} rows={[job()]} />);
    for (const kebab of screen.getAllByRole("button", { name: "Actions for Backend Engineer" })) {
      expect(styleAt(kebab, PHONE, "width")).toBe("44px");
      expect(styleAt(kebab, DESKTOP, "width")).toBeNull();
      expectPhoneOnly(kebab, /width:44px/);
    }
    for (const link of screen.getAllByRole("link", { name: /View 12 applicants/ })) {
      expect(styleAt(link, PHONE, "min-height")).toBe("44px");
      expectPhoneOnly(link, /min-height:44px/);
    }
  });
});

describe("an applicant card", () => {
  const props = {
    loading: false,
    error: null,
    onRetry: noop,
    isFiltered: false,
    empty: <div />,
    emptyFiltered: <div />,
    selection: { selectedIds: new Set<string | number>(), onChange: noop, selectableIds: [11] },
    sort: { key: "applied_at", dir: "desc" as const, onSort: noop },
    updatingIds: new Set<number>(),
    rowErrors: {},
    onOpen: noop,
    onOpenResume: noop,
    onStatusChange: noop,
  };

  it("drops its empty fact lines on a phone and keeps the ones with a value", () => {
    admin(
      <ApplicationsTable
        {...props}
        rows={[
          {
            id: 11,
            job: 1,
            job_title: "Backend Engineer",
            company_name: "Acme",
            student: 4,
            student_name: "Rita Roy",
            student_email: "rita@example.com",
            student_college: "IIT Bombay",
            status: "applied",
            applied_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-04T00:00:00Z",
          },
        ]}
      />,
    );
    const empty = screen.getByText(/^Phone: —$/);
    expect(styleAt(empty, PHONE, "display")).toBe("none");
    expect(styleAt(empty, 700, "display")).toBeNull();
    expectPhoneOnly(empty, /display:none/);
    const filled = screen.getAllByText(/College: IIT Bombay/)[0];
    expect(styleAt(filled, PHONE, "display")).toBeNull();
  });
});

describe("admin job sheets", () => {
  it("have a 44px close button on an admin phone", () => {
    admin(
      <JModal open title="Post to batches" onClose={noop}>
        body
      </JModal>,
    );
    const close = screen.getByRole("button", { name: /close/i });
    expect(styleAt(close, PHONE, "width")).toBe("44px");
    expect(styleAt(close, DESKTOP, "width")).toBeNull();
    expectPhoneOnly(close, /width:44px/);
    // Portalled out of the scope, the sheet carries the surface itself, so the admin phone
    // floors (12px status pills, the eyebrow) reach what is inside it.
    expect(document.querySelector(".MuiDialog-paper")!.getAttribute("data-jobs-surface")).toBe("admin");
  });

  it("keep the student board's close button as it was", () => {
    render(
      <JobsScope surface="student">
        <JModal open title="Apply" onClose={noop}>
          body
        </JModal>
      </JobsScope>,
    );
    expect(styleAt(screen.getByRole("button", { name: /close/i }), PHONE, "width")).toBeNull();
  });
});

describe("the job form's Save / Next bar", () => {
  const formProps = {
    mode: "create" as const,
    initialKey: "new",
    draftId: "admin-mobile-form",
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: noop,
    saveLabel: "Create job",
  };

  it("sits in the flow on a phone, where the fixed bar was hidden under the dock", async () => {
    admin(<JobForm {...formProps} />);
    await screen.findByRole("navigation", { name: /job form steps/i });
    const bar = screen.getByRole("button", { name: /create job/i }).parentElement!.parentElement!;
    expect(styleAt(bar, PHONE, "position")).toBe("static");
    expect(styleAt(bar, PHONE, "display")).toBe("grid");
    // A tablet keeps the pinned bar and a desktop the static card, exactly as before.
    expect(styleAt(bar, 700, "position")).toBe("fixed");
    expect(styleAt(bar, DESKTOP, "position")).toBe("static");
    expect(styleAt(bar, DESKTOP, "display")).toBe("flex");
    expectPhoneOnly(bar, /display:grid/);
  });
});
