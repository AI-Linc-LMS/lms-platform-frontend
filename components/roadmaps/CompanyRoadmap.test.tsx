import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyQuickStats } from "./CompanyQuickStats";
import { CompanyHiringProcess } from "./CompanyHiringProcess";
import type {
  RoadmapCard,
  RoadmapCompany,
  RoadmapContentTotals,
} from "@/lib/services/roadmaps.service";

/**
 * The company surface, rendered with the SHAPE the backend really sends.
 *
 * The values here were taken from the seeded Accenture and Wipro payloads rather than invented,
 * because the two things most likely to break this surface are both properties of the real
 * data: a `negativeMarking` that is a qualified sentence rather than "No", and an `estimates`
 * object that is null whenever it cannot be dated.
 */

const ACCENTURE: RoadmapCompany = {
  companySlug: "accenture",
  displayName: "Accenture",
  logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg",
  badge: "Top Recruiter",
  difficulty: "Medium",
  packageRange: "4.5 - 6.5 LPA",
  rounds: 5,
  examType: "Cognitive + Technical + Coding + Communication",
  negativeMarking: "No",
  hiringProcess: [
    { stage: "Application / Eligibility", detail: "B.E/B.Tech/MCA/MSc with ~65%" },
    { stage: "Coding Round", detail: "2-3 coding problems in a timed window" },
    { stage: "HR Interview", detail: "Communication, attitude, role fit and offer" },
  ],
  syllabus: [
    { round: "Coding Round", info: "2-3 problems · ~45-60 min", type: "Elimination" },
    { round: "Technical & HR Interview", info: "Two-panel", type: "Final" },
  ],
  estimates: {
    applicants: "~8-10 lakh/year",
    openRoles: "~40,000-50,000/year (India)",
    asOf: "2026-08-12",
    sourceUrl: null,
  },
};

const CONTENT: RoadmapContentTotals = {
  questions: 952,
  codingProblems: 40,
  articles: 0,
  steps: 45,
};

describe("CompanyQuickStats", () => {
  it("shows the practice it really reaches, not a fabricated competitiveness score", () => {
    render(<CompanyQuickStats company={ACCENTURE} content={CONTENT} />);
    // One cell, "952 questions · 40 coding": the strip abbreviates to fit a grid cell.
    expect(screen.getByText(/952 questions/)).toBeInTheDocument();
    expect(screen.getByText(/40 coding/)).toBeInTheDocument();
    expect(screen.queryByText(/competitiveness/i)).not.toBeInTheDocument();
  });

  it("renders a qualified negative-marking rule verbatim instead of a yes/no chip", () => {
    const wipro: RoadmapCompany = {
      ...ACCENTURE,
      displayName: "Wipro",
      negativeMarking:
        "Generally No (some drives apply -0.25 only in the quantitative section)",
    };
    render(<CompanyQuickStats company={wipro} content={CONTENT} />);
    expect(screen.getByText(/-0.25 only in the quantitative section/)).toBeInTheDocument();
  });

  it("shows hiring estimates only alongside the date they were true on", () => {
    const { rerender } = render(
      <CompanyQuickStats company={ACCENTURE} content={CONTENT} />
    );
    expect(screen.getByText(/Estimates, as of/)).toBeInTheDocument();
    expect(screen.getByText(/~8-10 lakh\/year/)).toBeInTheDocument();

    // The server withholds the whole object when it cannot date it; nothing may leak through.
    rerender(
      <CompanyQuickStats
        company={{ ...ACCENTURE, estimates: null }}
        content={CONTENT}
      />
    );
    expect(screen.queryByText(/~8-10 lakh\/year/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Market estimates/)).not.toBeInTheDocument();
  });
});

describe("CompanyHiringProcess", () => {
  it("numbers every published stage in order", () => {
    render(
      <CompanyHiringProcess stages={ACCENTURE.hiringProcess} syllabus={ACCENTURE.syllabus} />
    );
    expect(screen.getByText("Application / Eligibility")).toBeInTheDocument();
    expect(screen.getByText("HR Interview")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("attaches a round's format only to the stage it belongs to", () => {
    render(
      <CompanyHiringProcess stages={ACCENTURE.hiringProcess} syllabus={ACCENTURE.syllabus} />
    );
    expect(screen.getByText("2-3 problems · ~45-60 min")).toBeInTheDocument();
    // "Application / Eligibility" matches no syllabus round, so it gets no elimination chip.
    expect(screen.getAllByText("Elimination")).toHaveLength(1);
  });

  it("renders nothing rather than an empty frame when no funnel is published", () => {
    const { container } = render(<CompanyHiringProcess stages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});


