/**
 * A learner has to be able to make the files their project needs, and a delete has to be real.
 *
 * Reported by an Agileology learner on the Week 8 React brief (ticket 652): she built the quiz app
 * in VS Code, and in the workspace she had the one `App.jsx` the brief started her with and no way
 * to add a second file. `ProjectFileEditor` had add and remove all along, behind a prop commented
 * "author-only" that the learner's workspace never passed.
 *
 * The companion defect: a save is a MERGE server-side, so a file removed from the local map stayed
 * on the server and came back on the next reload unless it is named in `deleted`.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

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

/** Stands in for the editor, and records the props the workspace handed it. */
interface EditorProps {
  files: Record<string, string>;
  onChange: (files: Record<string, string>) => void;
  allowFileManagement?: boolean;
  readOnly?: boolean;
}
let editorProps: EditorProps | null = null;
vi.mock("@/components/projects/ProjectFileEditor", () => ({
  default: (props: EditorProps) => {
    editorProps = props;
    return (
      <div
        data-testid="editor"
        data-management={String(Boolean(props.allowFileManagement))}
        data-readonly={String(Boolean(props.readOnly))}
      />
    );
  },
}));

import ProjectWorkspace from "./ProjectWorkspace";

const WS = {
  id: 5,
  template: {
    id: 20,
    title: "Rebuild the Quiz App in React",
    brief_html: "<p>Build it</p>",
    runtime: "react",
    tier: "rubric",
    starter_files: { "App.jsx": "" },
    editable_paths: [],
    max_marks: 100,
  },
  files: { "App.jsx": "export default () => null;", "notes.md": "scratch" },
  save_count: 2,
  last_saved_at: "2026-10-26T00:00:00Z",
  latest_run: null,
};

async function mount(props: { locked?: boolean } = {}) {
  render(<ProjectWorkspace workspaceId={5} {...props} />);
  // Let the workspace load before anything is asserted about it.
  await act(async () => {});
  return screen.getByTestId("editor");
}

describe("the learner's own files", () => {
  beforeEach(() => {
    editorProps = null;
    getWorkspace.mockReset();
    saveWorkspace.mockReset();
    getWorkspace.mockResolvedValue(WS);
    saveWorkspace.mockResolvedValue({ saved: true, save_count: 3, rejected_paths: [] });
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("can be added to and removed from while the attempt is open", async () => {
    const editor = await mount();
    expect(editor.getAttribute("data-management")).toBe("true");
    expect(editor.getAttribute("data-readonly")).toBe("false");
  });

  it("is read-only once the attempt is submitted", async () => {
    const editor = await mount({ locked: true });
    expect(editor.getAttribute("data-management")).toBe("false");
    expect(editor.getAttribute("data-readonly")).toBe("true");
  });

  it("names a deleted file to the server, so it does not come back on reload", async () => {
    await mount();
    act(() => {
      editorProps?.onChange({ "App.jsx": "export default () => null;" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(saveWorkspace).toHaveBeenCalledTimes(1);
    const [id, files, deleted] = saveWorkspace.mock.calls[0];
    expect(id).toBe(5);
    expect(Object.keys(files)).toEqual(["App.jsx"]);
    expect(deleted).toEqual(["notes.md"]);
  });

  it("sends a new file with no deletions at all", async () => {
    await mount();
    act(() => {
      editorProps?.onChange({ ...WS.files, "src/Question.jsx": "export const Q = () => null;" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    const [, files, deleted] = saveWorkspace.mock.calls[0];
    expect(Object.keys(files).sort()).toEqual(["App.jsx", "notes.md", "src/Question.jsx"]);
    expect(deleted).toEqual([]);
  });

  it("forgets a deletion the learner undoes before it is saved", async () => {
    await mount();
    act(() => {
      editorProps?.onChange({ "App.jsx": "export default () => null;" });
    });
    act(() => {
      editorProps?.onChange({ ...WS.files, "notes.md": "back again" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    const [, files, deleted] = saveWorkspace.mock.calls[0];
    expect(files["notes.md"]).toBe("back again");
    expect(deleted).toEqual([]);
  });

  it("keeps a deletion pending when the save fails, so the next save still carries it", async () => {
    saveWorkspace.mockRejectedValueOnce(new Error("network"));
    await mount();
    act(() => {
      editorProps?.onChange({ "App.jsx": "export default () => null;" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(saveWorkspace.mock.calls[0][2]).toEqual(["notes.md"]);

    // A further edit triggers the next save, which must still name the file.
    act(() => {
      editorProps?.onChange({ "App.jsx": "export default () => <p />;" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(saveWorkspace).toHaveBeenCalledTimes(2);
    expect(saveWorkspace.mock.calls[1][2]).toEqual(["notes.md"]);
  });
});
