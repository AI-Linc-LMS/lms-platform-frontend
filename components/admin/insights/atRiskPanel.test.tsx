import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AtRiskPanel } from "./PulseSection";
import {
  normalizeAtRisk,
  type AtRiskPayload,
} from "@/lib/services/admin/admin-insights.service";

/**
 * "Needs attention" on the admin dashboard.
 *
 * The bug: Manage Students' "At risk" chip listed dozens of students while this panel showed a
 * handful or none. Both now read one server rule; the panel lists the top rows, states the TRUE
 * total, and links to the segment that lists all of them.
 */

const payload: AtRiskPayload = {
  results: [
    {
      student_id: 11,
      name: "Asha Rao",
      email: "asha@x.com",
      rules: ["never_started"],
      reason: "no activity yet, 40 days after joining",
      severity: 1,
      last_active: null,
    },
    {
      student_id: 12,
      name: "Ben Ito",
      email: "ben@x.com",
      rules: ["gone_quiet", "behind_peers"],
      reason: "no activity for 30 days · 1 activities done, below most of the cohort",
      severity: 2,
      last_active: "2026-08-23T10:00:00Z",
    },
  ],
  total: 86,
  rules: {
    never_started: "Enrolled for 21+ days with no activity recorded yet.",
    gone_quiet: "No activity for 14 days or more.",
  },
  eligibility: "Checked: active student accounts enrolled in a course.",
};

describe("AtRiskPanel", () => {
  it("lists every student in the payload with their reason", () => {
    render(<AtRiskPanel atRisk={payload} loading={false} />);
    expect(screen.getByText("Asha Rao")).toBeTruthy();
    expect(screen.getByText("Ben Ito")).toBeTruthy();
    expect(screen.getByText("no activity yet, 40 days after joining")).toBeTruthy();
  });

  it("states the true total, not the length of the capped list", () => {
    render(<AtRiskPanel atRisk={payload} loading={false} />);
    expect(screen.getByText("86 students at risk · top 2 shown")).toBeTruthy();
  });

  it("'View all' opens Manage Students on the at-risk segment", () => {
    render(<AtRiskPanel atRisk={payload} loading={false} />);
    const link = screen.getByTestId("at-risk-view-all");
    expect(link.getAttribute("href")).toBe("/admin/manage-students?segment=at_risk");
    expect(within(link).getByText("View all 86 in Manage Students")).toBeTruthy();
  });

  it("carries the dashboard's course filter so both lists are one set", () => {
    render(<AtRiskPanel atRisk={payload} loading={false} courseId={42} />);
    expect(screen.getByTestId("at-risk-view-all").getAttribute("href")).toBe(
      "/admin/manage-students?segment=at_risk&riskCourse=42"
    );
  });

  it("shows the empty state, not a link, when nobody is at risk", () => {
    render(
      <AtRiskPanel atRisk={{ results: [], total: 0, rules: {} }} loading={false} />
    );
    expect(screen.getByText("Nobody is falling behind right now")).toBeTruthy();
    expect(screen.queryByTestId("at-risk-view-all")).toBeNull();
  });
});

describe("normalizeAtRisk (the contract with the server)", () => {
  it("keeps the server's total", () => {
    expect(normalizeAtRisk(payload).total).toBe(86);
  });

  it("falls back to the row count when an older server sends no total", () => {
    const older = { results: payload.results, rules: payload.rules };
    expect(normalizeAtRisk(older).total).toBe(2);
  });

  it("never hands the panel undefined for a degraded response", () => {
    expect(normalizeAtRisk({ degraded: true } as Partial<AtRiskPayload>)).toEqual({
      results: [],
      total: 0,
      rules: {},
      eligibility: undefined,
      degraded: true,
    });
  });
});
