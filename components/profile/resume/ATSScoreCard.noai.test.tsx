/**
 * The ATS dialog must show the learner their score even where the model is unavailable.
 *
 * `/api/ats-analyze` answers 501 on any tenant with no OPENAI_API_KEY -- 14 of 19 live tenant
 * deployments. The handler treats that as a missing capability rather than an error, so it sets
 * `aiUnavailable` and deliberately does NOT set `aiError`. But the dialog's three big sections
 * were gated on `(aiResult || aiError)`, and both are null in exactly that case, so the entire
 * body disappeared: the gauge, the breakdown, the "ATS Score - N/100" band, the deductions, the
 * quality checks -- and the "AI feedback is not available" notice itself, which sits inside one
 * of those very blocks.
 *
 * The score is computed LOCALLY from `report`. It never needed the model.
 *
 * This is a render test, not a unit test, on purpose: the bug is a JSX gate, and no amount of
 * testing the scoring functions would have caught it. They were all working perfectly.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("@/components/common/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

import { ATSScoreCard } from "./ATSScoreCard";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";

function mockAnalyze(status: number, body: unknown = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/ats-analyze")) {
        return new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

describe("the ATS dialog on a tenant with no AI configured", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("still renders the locally computed score", async () => {
    // 501 is what a tenant without OPENAI_API_KEY actually returns.
    mockAnalyze(501, { error: "AI analysis is not configured" });
    render(<ATSScoreCard resumeData={SAMPLE_RESUME_DATA} dialogOpen />);

    await waitFor(() => {
      // Before the fix the dialog's ENTIRE text content was the untranslated key
      // "profile.atsScoreTitle" -- nothing else rendered at all.
      expect(document.body.textContent || "").toMatch(/\d+\s*\/\s*100/);
    });
  });

  it("tells the learner why AI commentary is missing", async () => {
    mockAnalyze(501, { error: "AI analysis is not configured" });
    render(<ATSScoreCard resumeData={SAMPLE_RESUME_DATA} dialogOpen />);
    // The notice lived INSIDE the block it was meant to explain, so it never appeared.
    await waitFor(() => {
      expect(screen.getByText(/AI written feedback is not available/i)).toBeInTheDocument();
    });
  });

  it("renders the score when the route is reachable too", async () => {
    mockAnalyze(200, { atsScore: 24, overallScore: 24, tips: [], feedback: "" });
    render(<ATSScoreCard resumeData={SAMPLE_RESUME_DATA} dialogOpen />);
    await waitFor(() => {
      expect(document.body.textContent || "").toMatch(/\d+\s*\/\s*100/);
    });
  });

  it("does not claim AI is unavailable when it worked", async () => {
    mockAnalyze(200, { atsScore: 24, overallScore: 24, tips: [], feedback: "" });
    render(<ATSScoreCard resumeData={SAMPLE_RESUME_DATA} dialogOpen />);
    await waitFor(() => expect(document.body.textContent || "").toMatch(/\d+\s*\/\s*100/));
    expect(screen.queryByText(/AI written feedback is not available/i)).toBeNull();
  });
});
