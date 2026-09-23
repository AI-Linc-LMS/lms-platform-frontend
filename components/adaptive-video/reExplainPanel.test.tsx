import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReExplainPanel } from "./ReExplainPanel";
import type { ReExplainResult } from "@/lib/services/adaptive-video.service";

/**
 * Reported: "the Code re-explanation is generating code that was not discussed in the selected
 * last 30 seconds of the video".
 *
 * Half of the fix is on the server, which now widens to the surrounding chapter rather than
 * letting the model fill a near-empty 30 seconds with something invented. The other half is
 * here: a widened answer that does not SAY it widened is the same bug wearing a better window.
 * `context_note` must reach the screen.
 */
const result = (over: Partial<ReExplainResult> = {}): ReExplainResult => ({
  content: "Counting steps tells you how the work grows.",
  style: "plain",
  clip_start: 26,
  clip_end: 300,
  requested_start: 0,
  requested_end: 25,
  source: "chapter",
  context_note: "",
  language: "",
  cached: false,
  ...over,
});

describe("the re-explain panel", () => {
  it("says when the answer came from wider context than the last 30s", async () => {
    const note =
      "The last 25 seconds (00:00–00:25) had little in it, so this re-explains the chapter it " +
      "sits in — “Why Complexity Analysis Matters” (00:26–05:00).";
    render(<ReExplainPanel onReExplain={vi.fn().mockResolvedValue(result({ context_note: note }))} />);
    await userEvent.click(screen.getByRole("button", { name: /Re-explain this clip/i }));
    await waitFor(() => expect(screen.getByText(note)).toBeInTheDocument());
  });

  it("says nothing extra when the exact clip was enough", async () => {
    render(<ReExplainPanel onReExplain={vi.fn().mockResolvedValue(result({ source: "clip" }))} />);
    await userEvent.click(screen.getByRole("button", { name: /Re-explain this clip/i }));
    await waitFor(() =>
      expect(screen.getByText("Counting steps tells you how the work grows.")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/re-explains the chapter/i)).not.toBeInTheDocument();
  });

  it("shows the server's reason when the clip cannot be re-explained", async () => {
    // A companion with no transcript now answers 400 with a specific detail rather than
    // letting the model invent a paragraph. The panel is gated off for those videos, but a
    // transcript can also go missing between load and click, so the branch still matters.
    const rejection = {
      response: { status: 400, data: { detail: "This video has no transcript yet, so there's nothing to re-explain." } },
    };
    render(<ReExplainPanel onReExplain={vi.fn().mockRejectedValue(rejection)} />);
    await userEvent.click(screen.getByRole("button", { name: /Re-explain this clip/i }));
    await waitFor(() =>
      expect(screen.getByText(/no transcript yet, so there's nothing to re-explain/)).toBeInTheDocument(),
    );
  });

  it("falls back to its own wording when the server sends no reason", async () => {
    render(<ReExplainPanel onReExplain={vi.fn().mockRejectedValue(new Error("network"))} />);
    await userEvent.click(screen.getByRole("button", { name: /Re-explain this clip/i }));
    await waitFor(() => expect(screen.getByText(/Couldn't re-explain this clip just now/)).toBeInTheDocument());
  });

  it("renders the Code mode's snippet as code, not as prose with backticks", async () => {
    const content = "```java\nfor (int i = 0; i < n; i++) {}\n```\nTakeaway: this loop runs n times.";
    render(
      <ReExplainPanel
        onReExplain={vi.fn().mockResolvedValue(result({ style: "code", content, language: "Java" }))}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /^Code$/ }));
    await waitFor(() =>
      expect(screen.getByText(/Takeaway: this loop runs n times\./)).toBeInTheDocument(),
    );
    const block = screen.getByText(/for \(int i = 0/);
    expect(block.tagName).toBe("PRE");
    // The fence's info string is a language tag, not a line of the snippet.
    expect(block.textContent).not.toContain("java\n");
    expect(document.body.textContent).not.toContain("```");
  });
});
