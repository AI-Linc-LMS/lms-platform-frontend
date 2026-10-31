/**
 * The trainer's files, in one list, grouped by the class they came from.
 *
 * Agileology's complaint was that the files were only reachable by remembering which past
 * session they hung off. The two things worth pinning are therefore: the panel groups by
 * session so a learner can scan by class, and it does it in ONE request. A fan-out over the
 * per-session endpoint would be forty round trips on a forty-week batch, which is the
 * implementation this panel exists to avoid.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mine = vi.fn();
const list = vi.fn();

vi.mock("@/lib/services/live-session-materials.service", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/lib/services/live-session-materials.service"
  );
  return {
    ...actual,
    liveSessionMaterialsService: {
      mine: (...a: unknown[]) => mine(...a),
      list: (...a: unknown[]) => list(...a),
    },
  };
});

import { TrainerNotesPanel } from "./TrainerNotesPanel";

function material(over: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Week 1 slides",
    description: "",
    file_url: "https://example.test/a.pdf",
    file_type: "pdf",
    file_size: 1024,
    original_filename: "a.pdf",
    mime_type: "application/pdf",
    uploaded_by_label: "INS-01",
    uploaded_by_name: null,
    occurrence_id: null,
    occurrence_datetime: null,
    created_at: "2026-10-30T10:00:00Z",
    updated_at: "2026-10-30T10:00:00Z",
    live_class_id: 10,
    session_title: "Week 1 - Recursion",
    ...over,
  };
}

describe("the trainer's shared files", () => {
  beforeEach(() => {
    mine.mockReset();
    list.mockReset();
  });

  it("groups them under the class they were shared in", async () => {
    mine.mockResolvedValue({
      count: 3,
      results: [
        material({ id: 1, title: "Trees handout", live_class_id: 20, session_title: "Week 2 - Trees" }),
        material({ id: 2, title: "Recursion slides", live_class_id: 10, session_title: "Week 1 - Recursion" }),
        material({ id: 3, title: "Recursion exercises", live_class_id: 10, session_title: "Week 1 - Recursion" }),
      ],
    });

    render(<TrainerNotesPanel />);

    await screen.findByText("Week 2 - Trees");
    expect(screen.getByText("Week 1 - Recursion")).toBeInTheDocument();
    expect(screen.getByText("1 file")).toBeInTheDocument();
    expect(screen.getByText("2 files")).toBeInTheDocument();
  });

  it("asks the server once, never once per session", async () => {
    mine.mockResolvedValue({
      count: 2,
      results: [
        material({ id: 1, live_class_id: 10, session_title: "A" }),
        material({ id: 2, live_class_id: 20, session_title: "B" }),
      ],
    });

    render(<TrainerNotesPanel />);

    await screen.findByText("A");
    expect(mine).toHaveBeenCalledTimes(1);
    expect(list).not.toHaveBeenCalled();
  });

  it("reports how many there are, so the tab can show a count", async () => {
    const onCountChange = vi.fn();
    mine.mockResolvedValue({ count: 2, results: [material({ id: 1 }), material({ id: 2 })] });

    render(<TrainerNotesPanel onCountChange={onCountChange} />);

    await waitFor(() => expect(onCountChange).toHaveBeenCalledWith(2));
  });

  it("says so when a trainer has shared nothing yet", async () => {
    mine.mockResolvedValue({ count: 0, results: [] });

    render(<TrainerNotesPanel />);

    expect(
      await screen.findByText(/have not shared any files yet/i)
    ).toBeInTheDocument();
  });

  it("fails visibly and offers a retry, rather than spinning forever", async () => {
    mine.mockRejectedValueOnce(new Error("network"));

    render(<TrainerNotesPanel />);

    expect(await screen.findByText(/could not load the shared files/i)).toBeInTheDocument();

    mine.mockResolvedValue({ count: 1, results: [material({ title: "Back online" })] });
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Week 1 - Recursion")).toBeInTheDocument();
  });
});
