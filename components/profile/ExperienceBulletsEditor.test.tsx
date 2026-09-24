/**
 * The profile's work-experience points editor.
 *
 * Replaces one "Description" textarea whose text reached the resume as whatever the builder could
 * guess from it. Pinned here: each point is its own field and its own item; add, edit, reorder
 * and remove work on one point without touching the others; Enter and Backspace split and join
 * points instead of putting a newline inside one; a pasted list arrives as separate points; and
 * on a phone the targets are 44px and the text at least 12px, without a pixel of that reaching a
 * desktop.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import "@/lib/i18n";

import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { ExperienceBulletsEditor } from "./ExperienceBulletsEditor";

/** The editor, controlled, with the list it holds written out where a test can read it. */
function Harness({ initial }: { initial: string[] }) {
  const [points, setPoints] = useState(initial);
  return (
    <>
      <ExperienceBulletsEditor value={points} onChange={setPoints} />
      <output data-testid="points">{JSON.stringify(points)}</output>
    </>
  );
}
const points = (): string[] => JSON.parse(screen.getByTestId("points").textContent || "[]");

const field = (n: number, total: number) =>
  screen.getByRole("textbox", { name: `Point ${n} of ${total}` }) as HTMLTextAreaElement;

function paste(target: Element, text: string) {
  fireEvent.paste(target, {
    clipboardData: { getData: (type: string) => (type === "text/plain" ? text : "") },
  });
}

describe("editing points", () => {
  it("shows one field per point", () => {
    render(<Harness initial={["Built X", "Led Y"]} />);
    expect(field(1, 2).value).toBe("Built X");
    expect(field(2, 2).value).toBe("Led Y");
    expect(screen.getAllByTestId("experience-point")).toHaveLength(2);
  });

  it("edits one point and leaves the others alone", () => {
    render(<Harness initial={["Built X", "Led Y"]} />);
    fireEvent.change(field(2, 2), { target: { value: "Led Y & Z" } });
    expect(points()).toEqual(["Built X", "Led Y & Z"]);
  });

  it("adds an empty point and puts the caret in it, but never a second empty one", () => {
    render(<Harness initial={["Built X"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a point" }));
    expect(points()).toEqual(["Built X", ""]);
    expect(document.activeElement).toBe(field(2, 2));
    fireEvent.click(screen.getByRole("button", { name: "Add a point" }));
    expect(points()).toEqual(["Built X", ""]);
  });

  it("removes one point, and keeps one field to type in when the last goes", () => {
    render(<Harness initial={["Built X", "Led Y"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove point 1" }));
    expect(points()).toEqual(["Led Y"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove point 1" }));
    expect(points()).toEqual([""]);
    expect(field(1, 1)).toBeInTheDocument();
  });

  it("folds a newline that reaches a point some other way into a space", () => {
    render(<Harness initial={["Built X"]} />);
    fireEvent.change(field(1, 1), { target: { value: "Built X\nfor Y" } });
    expect(points()).toEqual(["Built X for Y"]);
  });
});

describe("reordering", () => {
  it("moves a point up and down, and the pressed button keeps focus", () => {
    render(<Harness initial={["A", "B", "C"]} />);
    const down = screen.getByRole("button", { name: "Move point 1 down" });
    down.focus();
    fireEvent.click(down);
    expect(points()).toEqual(["B", "A", "C"]);
    // "A" is point 2 now; focus followed it.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Move point 2 down" }));

    fireEvent.click(screen.getByRole("button", { name: "Move point 2 up" }));
    expect(points()).toEqual(["A", "B", "C"]);
  });

  it("hands focus to the other arrow when a point reaches either end", () => {
    render(<Harness initial={["A", "B"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Move point 2 up" }));
    expect(points()).toEqual(["B", "A"]);
    // Point 1's "up" is disabled now, and a disabled button cannot hold focus.
    expect(screen.getByRole("button", { name: "Move point 1 up" })).toBeDisabled();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Move point 1 down" }));
  });

  it("keeps each point's text with its own field when points swap", () => {
    render(<Harness initial={["A", "B"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Move point 1 down" }));
    expect(field(1, 2).value).toBe("B");
    expect(field(2, 2).value).toBe("A");
  });
});

describe("keyboard", () => {
  it("Enter splits a point at the caret and moves to the new one", () => {
    render(<Harness initial={["Built X Led Y"]} />);
    const input = field(1, 1);
    input.focus();
    input.setSelectionRange(8, 8);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(points()).toEqual(["Built X", "Led Y"]);
    expect(document.activeElement).toBe(field(2, 2));
    expect(field(2, 2).selectionStart).toBe(0);
  });

  it("Enter on an empty point does not make another", () => {
    render(<Harness initial={[""]} />);
    fireEvent.keyDown(field(1, 1), { key: "Enter" });
    expect(points()).toEqual([""]);
  });

  it("Backspace at the start joins a point onto the one above", () => {
    render(<Harness initial={["Built X", "Led Y"]} />);
    const second = field(2, 2);
    second.focus();
    second.setSelectionRange(0, 0);
    fireEvent.keyDown(second, { key: "Backspace" });
    expect(points()).toEqual(["Built X Led Y"]);
    expect(document.activeElement).toBe(field(1, 1));
    expect(field(1, 1).selectionStart).toBe("Built X ".length);
  });

  it("Backspace in an empty point removes it", () => {
    render(<Harness initial={["Built X", ""]} />);
    const second = field(2, 2);
    second.focus();
    second.setSelectionRange(0, 0);
    fireEvent.keyDown(second, { key: "Backspace" });
    expect(points()).toEqual(["Built X"]);
  });

  it("leaves Enter alone while an input method is composing", () => {
    render(<Harness initial={["Built X"]} />);
    fireEvent.keyDown(field(1, 1), { key: "Enter", isComposing: true });
    expect(points()).toEqual(["Built X"]);
  });
});

describe("pasting", () => {
  it("turns a pasted bulleted run into separate points", () => {
    render(<Harness initial={[""]} />);
    paste(field(1, 1), "• Managed timelines… • Engaged with clients… • Created walkthroughs…");
    expect(points()).toEqual(["Managed timelines…", "Engaged with clients…", "Created walkthroughs…"]);
    expect(document.activeElement).toBe(field(3, 3));
  });

  it("splits the point it was pasted into at the caret, losing nothing", () => {
    render(<Harness initial={["Before after"]} />);
    const input = field(1, 1);
    input.focus();
    input.setSelectionRange(7, 7);
    paste(input, "- one\n- two");
    expect(points()).toEqual(["Before one", "two after"]);
  });

  it("joins a hard-wrapped paragraph into one point instead of one per line", () => {
    render(<Harness initial={[""]} />);
    paste(field(1, 1), "Cleaned 5,000 records to prepare data for reporting\nand business analysis.");
    expect(points()).toEqual(["Cleaned 5,000 records to prepare data for reporting and business analysis."]);
  });

  it("leaves an ordinary paste to the browser", () => {
    render(<Harness initial={["Built "]} />);
    paste(field(1, 1), "dashboards");
    // Not intercepted: the browser's own paste (not run by jsdom) inserts it.
    expect(points()).toEqual(["Built "]);
  });
});

describe("on a phone", () => {
  it("grows the row actions to 44x44 on a phone only", () => {
    render(<Harness initial={["A", "B"]} />);
    for (const name of ["Move point 1 up", "Move point 1 down", "Remove point 1"]) {
      const css = cssByMedia(screen.getByRole("button", { name }));
      expect(css.phone).toMatch(/width:44px/);
      expect(css.phone).toMatch(/height:44px/);
      expect(css.unscoped).not.toMatch(/44px/);
    }
  });

  it("puts the actions on their own line under the field on a phone, not beside it", () => {
    render(<Harness initial={["A"]} />);
    const row = screen.getByTestId("experience-point");
    expect(cssByMedia(row).phone).toMatch(/flex-wrap:wrap/);
    expect(cssByMedia(row).unscoped).not.toMatch(/flex-wrap:wrap/);
    const actions = within(row).getByRole("button", { name: "Remove point 1" }).parentElement!;
    expect(cssByMedia(actions).phone).toMatch(/width:100%/);
  });

  it("gives the field a 44px target and 16px text on a phone, and leaves the desktop at 15px", () => {
    render(<Harness initial={["A"]} />);
    const root = field(1, 1).closest(".MuiTextField-root")!;
    const css = cssByMedia(root);
    expect(css.phone).toMatch(/min-height:44px/);
    expect(css.phone).toMatch(/font-size:1rem/);
    expect(css.unscoped).toMatch(/font-size:0\.9375rem/);
    expect(css.unscoped).not.toMatch(/min-height:44px/);
  });

  it("gives Add a 44px target on a phone and keeps the hint at 12px", () => {
    render(<Harness initial={["A"]} />);
    const add = screen.getByRole("button", { name: "Add a point" });
    expect(cssByMedia(add).phone).toMatch(/min-height:44px/);
    expect(cssByMedia(add).unscoped).not.toMatch(/min-height:44px/);
    const hint = screen.getByText(/becomes its own bullet/);
    expect(cssByMedia(hint).base).toMatch(/font-size:0\.75rem/);
  });
});

describe("state", () => {
  it("does not remount a field while typing, so the caret stays put", () => {
    render(<Harness initial={["Built X", "Led Y"]} />);
    const before = field(2, 2);
    act(() => {
      fireEvent.change(before, { target: { value: "Led Y and Z" } });
    });
    expect(field(2, 2)).toBe(before);
  });
});

describe("limits the server enforces (50 points, 1000 characters)", () => {
  const many = (n: number) => Array.from({ length: n }, (_, i) => `Point ${i + 1}`);

  it("stops typing at 1000 characters", () => {
    render(<Harness initial={["Built X"]} />);
    expect(field(1, 1)).toHaveAttribute("maxlength", "1000");
  });

  it("marks a point that is already too long, and says how to fix it", () => {
    render(<Harness initial={["x".repeat(1001)]} />);
    expect(field(1, 1)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/under 1000 characters \(1001 now\)/)).toBeInTheDocument();
  });

  it("does not add a point past 50, and says why", () => {
    render(<Harness initial={many(50)} />);
    expect(screen.getByRole("button", { name: "Add a point" })).toBeDisabled();
    expect(screen.getByText("An entry holds up to 50 points.")).toBeInTheDocument();
  });

  it("does not split a point with Enter at 50, and says why", () => {
    render(<Harness initial={many(50)} />);
    const input = field(3, 50);
    input.focus();
    input.setSelectionRange(3, 3);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(points()).toHaveLength(50);
    expect(screen.getByTestId("experience-points-notice")).toHaveTextContent("up to 50 points");
  });

  it("adds only the pasted points that fit, and says how many", () => {
    render(<Harness initial={[...many(47), ""]} />);
    paste(field(48, 48), "• One\n• Two\n• Three\n• Four\n• Five");
    expect(points()).toHaveLength(50);
    expect(points().slice(-3)).toEqual(["One", "Two", "Three"]);
    expect(screen.getByTestId("experience-points-notice")).toHaveTextContent(
      "Added 3 of the 5 points you pasted: an entry holds up to 50.",
    );
  });

  it("asks for points to be removed when a converted entry is already over 50", () => {
    render(<Harness initial={many(52)} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Remove 2 to save it.");
  });

  it("keeps list semantics that listStyle none takes away in Safari", () => {
    // jsdom gives every <ul> the list role, so the implicit one proves nothing here. Safari drops
    // it once list-style is none, and only an explicit role brings it back.
    render(<Harness initial={["A"]} />);
    expect(screen.getAllByTestId("experience-point")[0].parentElement).toHaveAttribute("role", "list");
  });
});
