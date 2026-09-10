/**
 * The split pane must be re-measured when it REMOUNTS, not just when its value changes.
 *
 * At lg+ the board is a fixed-height split sized `calc(100dvh - var(--j-split-top) - 16px)`,
 * where `--j-split-top` is a 216px placeholder in CSS and the real number is measured at
 * runtime and written inline onto the split wrapper.
 *
 * Applying a filter that matches nothing unmounts that wrapper entirely (the board renders
 * its empty state instead). Clearing the filter mounts a BRAND NEW node. The measurement is
 * unchanged, so a throttle that caches the last VALUE concluded "already written" and skipped
 * the new node, which then fell back to the 216px placeholder while sitting ~560px down the
 * page. The pane ran off the bottom of the screen, and with `overflow: hidden` on the wrapper
 * and `overscroll-behavior: contain` on the panes its tail was unreachable -- reported as
 * "after applying a job filter the page stops scrolling, and removing the filter does not
 * restore it".
 */

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2 } from "@/lib/services/jobs-v2.service";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/jobs-v2",
  useSearchParams: () => new URLSearchParams(search),
}));

const getJobs = vi.fn();
const getMyApplications = vi.fn();
vi.mock("@/lib/services/jobs-v2.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/jobs-v2.service")>(
    "@/lib/services/jobs-v2.service",
  );
  return {
    ...actual,
    jobsV2Service: {
      getJobs: (...a: unknown[]) => getJobs(...a),
      getMyApplications: (...a: unknown[]) => getMyApplications(...a),
      toggleFavorite: vi.fn(),
      confirmApplied: vi.fn(),
    },
  };
});

vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useModuleLocked: () => ({ locked: false, ready: true, showLock: false, reportError: () => false }),
  useProfileGate: () => ({ percentage: 40, status: "ready", lockedModules: [], skills: [] }),
  useOutstandingFields: () => [],
}));
vi.mock("@/components/common/ProfileLock", () => ({
  ProfileLockBanner: () => <div />,
  ProfileLockCard: ({ preview }: { preview?: ReactNode }) => <div>{preview}</div>,
}));
vi.mock("@/components/common/PageGuide", () => ({ PageGuide: () => null }));
vi.mock("@/lib/contexts/AdminModeContext", () => ({ useAdminMode: () => ({ isAdminMode: false }) }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { JobBoard } from "./JobBoard";

const JOB: JobV2 = {
  id: 1,
  job_title: "Frontend Engineer",
  company_name: "Acme",
  location: "Bengaluru",
  job_type: "job",
  years_of_experience: "1-3",
  tags: ["React", "TypeScript"],
  created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
};

/** Where the split sits on a 1440x900 viewport once the rail and filters are drawn. */
const TOP = 560;
const EXPECTED = `${TOP}px`;

/** The node currently carrying the inline measurement, if any. */
const measured = () => document.querySelector<HTMLElement>('[style*="--j-split-top"]');

let origRect: typeof Element.prototype.getBoundingClientRect;

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  getJobs.mockResolvedValue({ results: [JOB], count: 1 });
  getMyApplications.mockResolvedValue({ results: [], count: 0 });
  origRect = Element.prototype.getBoundingClientRect;
  // jsdom lays nothing out, so every rect is zeros and the measure would bail on `top <= 0`.
  Element.prototype.getBoundingClientRect = function () {
    return { top: TOP, bottom: TOP, left: 0, right: 0, width: 800, height: 0, x: 0, y: TOP,
      toJSON: () => ({}) } as DOMRect;
  };
  Object.defineProperty(window, "innerHeight", { value: 900, configurable: true, writable: true });
});

afterEach(() => {
  Element.prototype.getBoundingClientRect = origRect;
});

/** Let the queued requestAnimationFrame measure run. */
const settle = async () => {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 0));
};

describe("the split pane's measured height survives an empty-state round trip", () => {
  it("measures the split on first mount", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(getJobs).toHaveBeenCalled());
    await settle();
    await waitFor(() => expect(measured()).not.toBeNull());
    expect(measured()!.style.getPropertyValue("--j-split-top")).toBe(EXPECTED);
  });

  it("re-measures the NEW node after a filter empties the board and is cleared", async () => {
    const view = render(<JobBoard />);
    await waitFor(() => expect(getJobs).toHaveBeenCalled());
    await settle();
    const first = measured();
    expect(first).not.toBeNull();

    // A filter that matches nothing: the board swaps the split for its empty state.
    getJobs.mockResolvedValue({ results: [], count: 0 });
    search = "q=nothing-matches-this";
    view.rerender(<JobBoard />);
    await waitFor(() =>
      expect(screen.queryByText(/No jobs match these filters/i)).toBeInTheDocument(),
    );
    await settle();

    // Clearing it mounts a brand new split node.
    getJobs.mockResolvedValue({ results: [JOB], count: 1 });
    search = "";
    view.rerender(<JobBoard />);
    await waitFor(() =>
      expect(screen.queryByText(/No jobs match these filters/i)).not.toBeInTheDocument(),
    );
    await settle();

    const second = measured();
    expect(
      second,
      "the remounted split carries no inline --j-split-top, so it falls back to the 216px " +
        "placeholder and runs off the bottom of the screen",
    ).not.toBeNull();
    expect(second!.style.getPropertyValue("--j-split-top")).toBe(EXPECTED);
    expect(second).not.toBe(first); // it really is a new node -- otherwise this proves nothing
  });
});
