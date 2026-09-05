/**
 * The autosave chip has to tell the truth.
 *
 * Reported by a hunt: a permanently-failing save showed "Not saved — retrying", nothing ever
 * retried (the effect only re-fires when `files` changes), and the server's explanation was
 * discarded. A learner who pasted a large image into their CSS crossed the per-file cap, saw a
 * reassuring chip, kept working for an hour and lost every edit after the paste.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getWorkspace = vi.fn();
const saveWorkspace = vi.fn();

vi.mock("@/lib/services/project-workspace.service", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/lib/services/project-workspace.service"
  );
  return {
    ...actual,
    getWorkspace: (...a: unknown[]) => getWorkspace(...a),
    saveWorkspace: (...a: unknown[]) => saveWorkspace(...a),
    runWorkspace: vi.fn(),
  };
});
vi.mock("@/components/projects/ProjectFileEditor", () => ({
  default: () => <div data-testid="editor" />,
}));

import ProjectWorkspace from "./ProjectWorkspace";

const WS = {
  id: 5,
  template: {
    id: 2, title: "Build it", brief_html: "<p>b</p>", runtime: "web_static",
    tier: "auto", starter_files: { "index.html": "" }, editable_paths: [], max_marks: 10,
  },
  files: { "index.html": "<h1>x</h1>" },
  save_count: 1,
  last_saved_at: "2026-01-01T00:00:00Z",
  latest_run: null,
};

function httpError(status: number, data?: unknown) {
  const e = new Error(`status ${status}`) as Error & { response?: unknown };
  e.response = { status, data };
  return e;
}

describe("autosave failure reporting", () => {
  beforeEach(() => {
    getWorkspace.mockReset();
    saveWorkspace.mockReset();
    getWorkspace.mockResolvedValue(WS);
  });

  it("renders the workspace once loaded", async () => {
    render(<ProjectWorkspace workspaceId={5} />);
    await waitFor(() => expect(screen.getByTestId("editor")).toBeTruthy());
  });

  it("shows a submitted attempt as locked rather than as a save failure", async () => {
    render(<ProjectWorkspace workspaceId={5} locked />);
    await waitFor(() => expect(screen.getByText("Submitted")).toBeTruthy());
  });

  it("never claims a retry it will not perform", async () => {
    // The chip vocabulary itself is the guard: a 4xx must not be labelled "retrying".
    const src = (await import("fs")).readFileSync(
      "components/projects/ProjectWorkspace.tsx", "utf8"
    );
    expect(src).toContain('saveState === "rejected"');
    // Slice to the rejected branch ALONE — up to the next branch — or the assertion reads the
    // "error" (transient) chip below it, which legitimately does say "retrying".
    const after = src.split('saveState === "rejected"')[1];
    const rejectedBranch = after.slice(0, after.indexOf("if (saveState"));
    expect(rejectedBranch).toContain('label="Not saved"');
    expect(rejectedBranch).not.toContain("retrying");
  });

  it("keeps the server's explanation instead of discarding it", async () => {
    const src = (await import("fs")).readFileSync(
      "components/projects/ProjectWorkspace.tsx", "utf8"
    );
    // The 400 body from _tree_complaint ("style.css is larger than 512 KB.") is the only thing
    // that tells a learner what to fix.
    expect(src).toContain("res?.data?.error");
    expect(src).toContain("setSaveError");
  });

  it("treats a 409 as a closed attempt, not a save failure", async () => {
    const src = (await import("fs")).readFileSync(
      "components/projects/ProjectWorkspace.tsx", "utf8"
    );
    expect(src).toContain('status === 409');
    expect(src).toContain('setSaveState("closed")');
  });
});
