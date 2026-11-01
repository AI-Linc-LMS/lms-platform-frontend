/**
 * The attempt count on this panel has to be the server's, and it has to say what it means.
 *
 * Two failures this pins, both already paid for elsewhere in this codebase:
 *
 * - A count derived on the client. `app/assessments/[slug]/page.tsx` renders "1 / 2" computed
 *   from a boolean; it is a fiction, and it cannot see the learner's other tab. Every number
 *   here comes from the response.
 * - A staff account shown "2 of 2 left" that never moves, which is indistinguishable from a
 *   meter that has stopped counting. That is how the AI Tutor minutes bug was reported.
 *
 * And the one that costs the learner: OUR ceiling (503) must never be rendered as THEIR limit
 * (429). A learner told they are out of attempts goes and asks an instructor for one they
 * already have.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getGenerations = vi.fn();
const generateProject = vi.fn();

vi.mock("@/lib/services/project-workspace.service", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/lib/services/project-workspace.service"
  );
  return {
    ...actual,
    getGenerations: (...a: unknown[]) => getGenerations(...a),
    generateProject: (...a: unknown[]) => generateProject(...a),
  };
});

import ProjectPromptPanel from "./ProjectPromptPanel";
import {
  AttemptsExhaustedError,
  GenerationUnavailableError,
} from "@/lib/services/project-workspace.service";

function attempts(over: Record<string, unknown> = {}) {
  return { used: 0, allowed: 2, remaining: 2, unmetered: false, ...over };
}

function generation(over: Record<string, unknown> = {}) {
  return {
    id: 1,
    attempt_index: 0,
    prompt: "build a pricing page",
    status: "succeeded",
    notes: "",
    error: "",
    file_count: 3,
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:20Z",
    ...over,
  };
}

describe("briefing the AI", () => {
  beforeEach(() => {
    getGenerations.mockReset();
    generateProject.mockReset();
    // Installed BEFORE render on purpose. Fake timers taken after mount do not control the
    // timers the component already scheduled, so a polling test that installs them late is
    // asserting on real time and proves nothing.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const typist = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("shows the count the server reported, not one it worked out", async () => {
    getGenerations.mockResolvedValue({
      attempts: attempts({ used: 1, remaining: 1 }),
      generations: [generation()],
    });

    render(<ProjectPromptPanel workspaceId={7} />);

    expect(await screen.findByText("1 of 2 generations left")).toBeTruthy();
  });

  it("says a staff account is not metered instead of printing a number that never moves", async () => {
    getGenerations.mockResolvedValue({
      attempts: attempts({ unmetered: true }),
      generations: [],
    });

    render(<ProjectPromptPanel workspaceId={7} />);

    expect(await screen.findByText(/not metered/i)).toBeTruthy();
    expect(screen.queryByText(/generations left/i)).toBeNull();
  });

  it("sends the prompt and polls until the project has landed", async () => {
    getGenerations
      .mockResolvedValueOnce({ attempts: attempts(), generations: [] })
      .mockResolvedValueOnce({
        attempts: attempts({ used: 1, remaining: 1 }),
        generations: [generation({ status: "running" })],
      })
      .mockResolvedValue({
        attempts: attempts({ used: 1, remaining: 1 }),
        generations: [generation({ status: "succeeded" })],
      });
    generateProject.mockResolvedValue({
      generation: generation({ status: "pending" }),
      attempts: attempts({ used: 1, remaining: 1 }),
    });
    const onGenerated = vi.fn();

    render(<ProjectPromptPanel workspaceId={7} onGenerated={onGenerated} />);
    await screen.findByText("2 of 2 generations left");

    await typist().type(screen.getByRole("textbox"), "build a pricing page");
    await typist().click(screen.getByRole("button", { name: /generate the project/i }));

    expect(generateProject).toHaveBeenCalledWith(7, "build a pricing page");

    await vi.advanceTimersByTimeAsync(3000);
    await waitFor(() => expect(onGenerated).toHaveBeenCalled());
  });

  it("will not generate on an empty prompt", async () => {
    getGenerations.mockResolvedValue({ attempts: attempts(), generations: [] });

    render(<ProjectPromptPanel workspaceId={7} />);
    await screen.findByText("2 of 2 generations left");

    expect(
      screen.getByRole("button", { name: /generate the project/i })
    ).toHaveProperty("disabled", true);
    expect(generateProject).not.toHaveBeenCalled();
  });

  it("stops offering a generation once they are used up", async () => {
    getGenerations.mockResolvedValue({
      attempts: attempts({ used: 2, remaining: 0 }),
      generations: [generation(), generation({ id: 2, attempt_index: 1 })],
    });

    render(<ProjectPromptPanel workspaceId={7} />);

    expect(await screen.findByText(/used 2 generations/i)).toBeTruthy();
    expect(screen.getByRole("textbox")).toHaveProperty("disabled", true);
  });

  it("reports OUR ceiling as ours, saying their attempts are intact", async () => {
    getGenerations.mockResolvedValue({ attempts: attempts(), generations: [] });
    generateProject.mockRejectedValue(
      new GenerationUnavailableError(
        "Project generation is paused for today while we look at usage. Your attempts have not been used."
      )
    );

    render(<ProjectPromptPanel workspaceId={7} />);
    await screen.findByText("2 of 2 generations left");
    await typist().type(screen.getByRole("textbox"), "build it");
    await typist().click(screen.getByRole("button", { name: /generate the project/i }));

    expect(await screen.findByText(/have not been used/i)).toBeTruthy();
    // The learner still has both. Telling them otherwise sends them to an instructor for
    // nothing.
    expect(screen.getByText("2 of 2 generations left")).toBeTruthy();
  });

  it("reports THEIR limit with the count the server sent back", async () => {
    // The panel reconciles with the server after any failure, so the follow-up read has to agree
    // with the 429 — as it necessarily does in production, where both come from the same rows.
    getGenerations
      .mockResolvedValueOnce({ attempts: attempts(), generations: [] })
      .mockResolvedValue({
        attempts: attempts({ used: 2, remaining: 0 }),
        generations: [generation(), generation({ id: 2, attempt_index: 1 })],
      });
    generateProject.mockRejectedValue(
      new AttemptsExhaustedError(
        "You have used both of your generations for this project.",
        attempts({ used: 2, remaining: 0 })
      )
    );

    render(<ProjectPromptPanel workspaceId={7} />);
    await screen.findByText("2 of 2 generations left");
    await typist().type(screen.getByRole("textbox"), "build it");
    await typist().click(screen.getByRole("button", { name: /generate the project/i }));

    expect(await screen.findByText(/used both of your generations/i)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText("0 of 2 generations left")).toBeTruthy()
    );
  });

  it("says plainly that a failed attempt did not count", async () => {
    getGenerations.mockResolvedValue({
      attempts: attempts(),
      generations: [generation({ status: "failed", error: "The provider was unavailable." })],
    });

    render(<ProjectPromptPanel workspaceId={7} />);

    expect(await screen.findByText(/did not count/i)).toBeTruthy();
    expect(screen.getByText("2 of 2 generations left")).toBeTruthy();
    expect(screen.getByText(/provider was unavailable/i)).toBeTruthy();
  });

  it("resumes a generation that was already running when the page opened", async () => {
    // A reload mid-run, or the learner's other tab. Without this the spinner never appears and
    // the files arrive with no explanation.
    getGenerations
      .mockResolvedValueOnce({
        attempts: attempts({ used: 1, remaining: 1 }),
        generations: [generation({ status: "running" })],
      })
      .mockResolvedValue({
        attempts: attempts({ used: 1, remaining: 1 }),
        generations: [generation({ status: "succeeded" })],
      });
    const onGenerated = vi.fn();

    render(<ProjectPromptPanel workspaceId={7} onGenerated={onGenerated} />);

    expect(await screen.findByText(/writing your project/i)).toBeTruthy();
    await vi.advanceTimersByTimeAsync(3000);
    await waitFor(() => expect(onGenerated).toHaveBeenCalled());
  });

  it("keeps polling when one poll fails", async () => {
    getGenerations
      .mockResolvedValueOnce({
        attempts: attempts({ used: 1, remaining: 1 }),
        generations: [generation({ status: "running" })],
      })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({
        attempts: attempts({ used: 1, remaining: 1 }),
        generations: [generation({ status: "succeeded" })],
      });
    const onGenerated = vi.fn();

    render(<ProjectPromptPanel workspaceId={7} onGenerated={onGenerated} />);
    await screen.findByText(/writing your project/i);

    await vi.advanceTimersByTimeAsync(9000);

    // A failed poll is not a failed generation: the work is server-side and carries on.
    await waitFor(() => expect(onGenerated).toHaveBeenCalled());
  });

  it("says so when the attempts cannot be read at all", async () => {
    getGenerations.mockRejectedValue(new Error("network"));

    render(<ProjectPromptPanel workspaceId={7} />);

    expect(await screen.findByText(/could not load your attempts/i)).toBeTruthy();
  });

  it("offers nothing to a submitted attempt but still shows the history", async () => {
    getGenerations.mockResolvedValue({
      attempts: attempts({ used: 1, remaining: 1 }),
      generations: [generation({ prompt: "what I asked for" })],
    });

    render(<ProjectPromptPanel workspaceId={7} locked />);

    expect(await screen.findByText("what I asked for")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /generate the project/i })
    ).toHaveProperty("disabled", true);
  });
});
