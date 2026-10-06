import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * White text must land on a dark panel.
 *
 * Reported: the section headings were unreadable - "A tutor for every module of this course"
 * in white, on what rendered as a near-white page. The cause was a CSS shorthand:
 *
 *     background: "linear-gradient(... dark ...)",   // sets background-image
 *     backgroundImage: "radial-gradient(... faint bloom ...)",   // REPLACES it
 *
 * `background` is a shorthand that sets background-image, so the line after it silently threw
 * the dark gradient away and left the faint bloom over a transparent background. Nothing
 * catches that: it type-checks, it renders, and every assertion about the text still passes.
 * It is only visible to an eye, or to these two tests.
 */

vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useIsAiVoiceTutorEnabled: () => true,
  useIsInterviewV2Enabled: () => false,
}));
vi.mock("@/lib/services/mock-interview.service", () => ({ default: { startTemplateInterview: vi.fn() } }));
vi.mock("@/lib/hooks/useInterviewerVoice", () => ({ prefetchInterviewerClip: vi.fn() }));

import { TutorPanel } from "./TutorPanel";
import { InterviewPanel } from "./InterviewPanel";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

const board = {
  course: { id: 1, title: "C", fieldTier: null, certificateEnabled: false, certificateThreshold: 80 },
  progressCard: { completionPct: 0, nodesDone: 0, nodesTotal: 1, pointsEarned: 0, pointsTotal: 1, onTimeRate: null },
  interview: { card: { templateId: 5, title: "Mock", topic: "DSA", difficulty: "Easy",
                       durationMinutes: 10, configured: true, status: "not_started" } },
  weeks: [{ weekNo: 1, nodes: [] }],
} as unknown as JourneyBoard;

function injectedCss(): string {
  return Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
}

describe("a panel heading is readable", () => {
  it("gives the tutor panel a dark surface under its white text", () => {
    render(<TutorPanel board={board} />);
    const css = injectedCss();
    // The dark gradient must SURVIVE into the emitted CSS, not be replaced by the bloom.
    expect(css).toContain("#1b0f38");
    expect(css).toContain("background-color:#1b0f38");
  });

  it("gives the interview panel one too", () => {
    render(<InterviewPanel board={board} courseId={1} />);
    const css = injectedCss();
    expect(css).toContain("#0b1f33");
    expect(css).toContain("background-color:#0b1f33");
  });
});

describe("the shorthand that silently throws a gradient away", () => {
  it("is not used anywhere in the course page's panels", () => {
    // A guard rather than a one-off fix. `background:` followed by `backgroundImage:` in the
    // same sx object is always a bug, and always an invisible one.
    const dir = join(process.cwd(), "components/adaptive-journey");
    const offenders: string[] = [];

    const walk = (d: string) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, entry.name);
        if (entry.isDirectory()) { walk(p); continue; }
        if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) continue;
        const src = readFileSync(p, "utf8");
        for (const m of src.matchAll(/\bbackground:\s*"[^"]*gradient/g)) {
          // Walk to the end of this object literal and look for the key that would kill it.
          const after = src.slice(m.index ?? 0, (m.index ?? 0) + 600);
          let depth = 0, end = after.length;
          for (let i = 0; i < after.length; i++) {
            if (after[i] === "{") depth++;
            else if (after[i] === "}") { if (depth === 0) { end = i; break; } depth--; }
          }
          if (/\bbackgroundImage:/.test(after.slice(0, end))) {
            offenders.push(`${p}:${src.slice(0, m.index).split("\n").length}`);
          }
        }
      }
    };
    walk(dir);
    expect(offenders).toEqual([]);
  });
});
