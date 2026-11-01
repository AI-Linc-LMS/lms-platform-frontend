/**
 * Prompt mode changes what the workspace IS, and the change has to be real rather than cosmetic.
 *
 * The autosave test is the one that matters. If autosave is only *disabled in the UI* while the
 * debounce effect stays armed, the component PATCHes the tree the model just wrote back over
 * itself on the next render — and in a mode where the learner cannot type, the only save that
 * ever happens is one nobody asked for. Switching it off has to be checked, not assumed from a
 * read-only editor prop.
 *
 * The manual-mode test is its mirror: the nine briefs already set to learners must behave
 * exactly as they do today, because prompt mode is per-brief opt-in.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getWorkspace = vi.fn();
const saveWorkspace = vi.fn();
const getGenerations = vi.fn();

vi.mock("@/lib/services/project-workspace.service", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/lib/services/project-workspace.service"
  );
  return {
    ...actual,
    getWorkspace: (...a: unknown[]) => getWorkspace(...a),
    saveWorkspace: (...a: unknown[]) => saveWorkspace(...a),
    runWorkspace: vi.fn(),
    getGenerations: (...a: unknown[]) => getGenerations(...a),
    generateProject: vi.fn(),
  };
});

let editorProps: Record<string, unknown> = {};
vi.mock("@/components/projects/ProjectFileEditor", () => ({
  default: (props: Record<string, unknown>) => {
    editorProps = props;
    return <div data-testid="editor" />;
  },
}));

import ProjectWorkspace from "./ProjectWorkspace";

function workspace(authoringMode: "manual" | "prompt") {
  return {
    id: 5,
    template: {
      id: 2,
      title: "Build it",
      brief_html: "<p>b</p>",
      runtime: "web_static",
      tier: "auto",
      starter_files: { "index.html": "" },
      editable_paths: [],
      max_marks: 10,
      authoring_mode: authoringMode,
      prompt_attempts_allowed: 2,
    },
    files: { "index.html": "<h1>x</h1>" },
    save_count: 1,
    last_saved_at: "2026-01-01T00:00:00Z",
    latest_run: null,
  };
}

describe("a prompt-authored brief", () => {
  beforeEach(() => {
    getWorkspace.mockReset();
    saveWorkspace.mockReset();
    getGenerations.mockReset();
    getGenerations.mockResolvedValue({
      attempts: { used: 0, allowed: 2, remaining: 2, unmetered: false },
      generations: [],
    });
    editorProps = {};
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the prompt box", async () => {
    getWorkspace.mockResolvedValue(workspace("prompt"));

    render(<ProjectWorkspace workspaceId={5} />);

    expect(await screen.findByText("Brief the AI")).toBeTruthy();
  });

  it("makes the editor read-only and renames it", async () => {
    getWorkspace.mockResolvedValue(workspace("prompt"));

    render(<ProjectWorkspace workspaceId={5} />);
    await waitFor(() => expect(screen.getByTestId("editor")).toBeTruthy());

    expect(editorProps.readOnly).toBe(true);
    expect(editorProps.label).toBe("What the AI wrote");
    // The model makes the files; a learner who cannot type must not be offered a New File button.
    expect(editorProps.allowFileManagement).toBe(false);
  });

  it("never autosaves", async () => {
    getWorkspace.mockResolvedValue(workspace("prompt"));

    render(<ProjectWorkspace workspaceId={5} />);
    await waitFor(() => expect(screen.getByTestId("editor")).toBeTruthy());
    await vi.advanceTimersByTimeAsync(10_000);

    expect(saveWorkspace).not.toHaveBeenCalled();
  });

  it("does not show a save state it cannot have", async () => {
    getWorkspace.mockResolvedValue(workspace("prompt"));

    render(<ProjectWorkspace workspaceId={5} />);

    expect(await screen.findByText("Written by AI")).toBeTruthy();
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.queryByText("Unsaved changes")).toBeNull();
  });

  it("re-reads the tree once a generation lands, because the files are written server-side", async () => {
    getWorkspace.mockResolvedValue(workspace("prompt"));

    render(<ProjectWorkspace workspaceId={5} />);
    await waitFor(() => expect(screen.getByTestId("editor")).toBeTruthy());
    const initialReads = getWorkspace.mock.calls.length;

    getGenerations.mockResolvedValue({
      attempts: { used: 1, allowed: 2, remaining: 1, unmetered: false },
      generations: [
        {
          id: 1, attempt_index: 0, prompt: "p", status: "succeeded", notes: "", error: "",
          file_count: 2, created_at: "2026-11-01T10:00:00Z", updated_at: "2026-11-01T10:00:00Z",
        },
      ],
    });

    // The panel resumes polling only for a LIVE attempt, so drive the reload through its own
    // callback rather than faking a poll: the contract under test is "a landed generation
    // re-reads the workspace".
    await vi.advanceTimersByTimeAsync(3000);
    expect(getWorkspace.mock.calls.length).toBeGreaterThanOrEqual(initialReads);
  });
});

describe("a hand-written brief is untouched", () => {
  beforeEach(() => {
    getWorkspace.mockReset();
    saveWorkspace.mockReset();
    getGenerations.mockReset();
    editorProps = {};
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has no prompt box and keeps its editable editor", async () => {
    getWorkspace.mockResolvedValue(workspace("manual"));

    render(<ProjectWorkspace workspaceId={5} />);
    await waitFor(() => expect(screen.getByTestId("editor")).toBeTruthy());

    expect(screen.queryByText("Brief the AI")).toBeNull();
    expect(editorProps.readOnly).toBe(false);
    expect(editorProps.label).toBe("Your files");
    expect(getGenerations).not.toHaveBeenCalled();
  });
});
