// @vitest-environment jsdom
/**
 * The learner half of the recurring window.
 *
 * A paper open 10:00-22:00 is SHUT at 08:00, and the card had no way to know: it read only
 * start_time/end_time, so inside the campaign it offered "Start", the click returned 403, and the
 * learner was told no by an error toast with no idea when to come back.
 *
 * The distinction that matters most here is "shut right now" versus "Ended". A recurring paper
 * that is closed for the evening is not over, and labelling it "Ended" would tell a learner they
 * had missed it entirely.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The card reaches for toast, purchase, claim, router and i18n context. None of them are what is
// under test here, and rendering it bare fails inside useToast before any window logic runs.
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/hooks/useAssessmentPurchase", () => ({
  useAssessmentPurchase: () => ({ buy: vi.fn(), buyingSlug: null }),
}));
vi.mock("@/hooks/useB2CClaim", () => ({
  useB2CClaim: () => ({ claim: vi.fn(), claiming: false, remaining: null }),
}));
vi.mock("@/hooks/usePrefetchOnHover", () => ({ usePrefetchOnHover: () => ({}) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k }),
  // lib/i18n.ts calls i18n.use(initReactI18next) at module load, reached transitively through
  // MainLayout. Omitting it makes the whole file fail to collect rather than fail a test.
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { AssessmentCard } from "./AssessmentCard";
import type { Assessment } from "@/lib/services/assessment.service";

const WINDOW = {
  recurrence: "daily" as const,
  start_local: "10:00",
  end_local: "22:00",
  weekdays: [],
  timezone: "Asia/Kolkata",
  timezone_source: "tenant",
  crosses_midnight: false,
  window_minutes: 720,
  closes_attempt: true,
  last_admission_minutes: 60,
  is_open_now: true,
  opens_at: null as string | null,
  closes_at: null as string | null,
  minutes_left: 300,
  can_start_now: true,
  reason: null as string | null,
};

const paper = (over: Partial<Assessment> = {}): Assessment =>
  ({
    id: 1,
    title: "Midterm",
    description: "d",
    slug: "midterm",
    duration_minutes: 60,
    is_paid: false,
    price: null,
    is_active: true,
    number_of_questions: 10,
    created_at: "2026-09-01T00:00:00Z",
    is_attempted: false,
    status: "not_started",
    ...over,
  }) as Assessment;

describe("a recurring paper that is shut right now", () => {
  it("says when it opens instead of offering a Start that 403s", () => {
    render(
      <AssessmentCard
        assessment={paper({
          window: {
            ...WINDOW,
            is_open_now: false,
            can_start_now: false,
            reason: "outside_window",
            opens_at: "2026-09-26T10:00:00+05:30",
            minutes_left: null,
          },
        })}
      />,
    );
    expect(screen.getByText(/Opens/)).toBeInTheDocument();
    // It has NOT ended. Saying so would tell the learner they missed it for good.
    expect(screen.queryByText("Ended")).toBeNull();
  });

  it("distinguishes 'too late to finish today' from 'ended'", () => {
    render(
      <AssessmentCard
        assessment={paper({
          window: {
            ...WINDOW,
            is_open_now: true,
            can_start_now: false,
            reason: "past_last_admission",
            opens_at: "2026-09-26T10:00:00+05:30",
            minutes_left: 5,
          },
        })}
      />,
    );
    expect(screen.getByText(/Too late today/)).toBeInTheDocument();
    expect(screen.queryByText("Ended")).toBeNull();
  });

  it("an open window is not labelled at all, so nothing changes for a paper mid-window", () => {
    render(<AssessmentCard assessment={paper({ window: { ...WINDOW } })} />);
    expect(screen.queryByText(/Opens/)).toBeNull();
    expect(screen.queryByText(/Too late/)).toBeNull();
  });

  it("a paper with no window behaves exactly as before", () => {
    render(<AssessmentCard assessment={paper({ window: null })} />);
    expect(screen.queryByText(/Opens/)).toBeNull();
  });
});
