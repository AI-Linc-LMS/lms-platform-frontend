import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
// The mode pills are translated now, so the panel needs the English bundle loaded or every
// label renders as its key and every assertion below is vacuous.
import "@/lib/i18n";

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

/**
 * Report 42, second half: "remove plain english and formal and keep 1 as they both are not
 * adding much value". Formal is the one removed — it and Plain English are the two ends of one
 * register axis, and Formal sits on the end the lecture already tried.
 *
 * Deleting a button is the easy half. The half that breaks learners is the one mid-session with
 * the removed mode selected, or a tab opened before the deploy: the server answers those in
 * "plain", and the panel must show that answer rather than an empty box or a dead badge.
 */
describe("the retired Formal mode", () => {
  it("is not offered any more", () => {
    render(<ReExplainPanel onReExplain={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /^Formal$/ })).not.toBeInTheDocument();
    for (const label of ["Plain English", "Analogies", "Code"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}$`) })).toBeInTheDocument();
    }
  });

  it("shows the answer the server substituted, never an empty panel", async () => {
    // The server remaps style=formal to style=plain and says so in the response. The panel
    // must render that content and badge it with a mode it still has.
    const onReExplain = vi.fn().mockResolvedValue(
      result({ style: "plain", content: "A reference is just the address of the object." }),
    );
    render(<ReExplainPanel onReExplain={onReExplain} />);
    await userEvent.click(screen.getByRole("button", { name: /Re-explain this clip/i }));
    await waitFor(() =>
      expect(
        screen.getByText("A reference is just the address of the object."),
      ).toBeInTheDocument(),
    );
    // The badge used to print the raw server token. Assert on the badge, not on
    // document.body.textContent: MUI concatenates adjacent labels ("CodeFormal"), so a
    // \b-anchored search over the whole body silently matches nothing and proves nothing.
    expect(screen.queryByText("plain")).not.toBeInTheDocument();
    expect(screen.getAllByText("Plain English").length).toBeGreaterThan(0);
  });

  it("does not print a raw style token when the server names a mode this build dropped", async () => {
    // Belt and braces for a rolling deploy in the other direction: an old server answering a
    // new bundle. An unknown style must degrade to a real label, not to "formal" on screen.
    const stale = result({ content: "Same material, simpler words." }) as unknown as Record<
      string,
      unknown
    >;
    stale.style = "formal";
    render(<ReExplainPanel onReExplain={vi.fn().mockResolvedValue(stale)} />);
    await userEvent.click(screen.getByRole("button", { name: /Re-explain this clip/i }));
    await waitFor(() =>
      expect(screen.getByText("Same material, simpler words.")).toBeInTheDocument(),
    );
    // Nothing on screen — badge or pill — may say "Formal" any more.
    expect(screen.queryByText(/^formal$/i)).not.toBeInTheDocument();
  });
});
