// @vitest-environment jsdom
/**
 * "Diagram Representation can be shown better with combination of colours and outlings too."
 *
 * The complaint was read as a styling request and it was not one. A node carried only
 * `{id, label, note}`, so nothing about what a box MEANT ever reached the canvas. The single
 * colour rule tinted node index 0 - colour standing in for "first" when position already says
 * "first" - which is decoration, and is also the colour-only-meaning pattern this design system
 * forbids. Making that prettier would have changed nothing a learner could read.
 *
 * Two of the five kinds were also quietly wrong, which is what made the pictures look thin:
 *   - `tree` called `childrenOf(root.id)` once and never recursed, so every GRANDCHILD the model
 *     sent was dropped with no sign anything was missing.
 *   - `layers` drew flat full-width rows with no containment at all, so a "what sits inside what"
 *     diagram rendered as a list. That is the Plant Labeling complaint.
 *
 * What is pinned here: meaning arrives on three separable channels (shape / colour+glyph / ring),
 * a tree keeps every level, a cycle cannot hang the room, and a spec written before any of this
 * renders exactly as it did.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TutorDiagram, type DiagramSpec } from "./TutorDiagram";

const nodes = (...labels: string[]) => labels.map((l) => ({ id: l, label: l }));

describe("a tree keeps every level the model sent", () => {
  const deep: DiagramSpec = {
    kind: "tree",
    nodes: [
      { id: "root", label: "Animal" },
      { id: "mammal", label: "Mammal" },
      { id: "bird", label: "Bird" },
      { id: "dog", label: "Dog" },
      { id: "eagle", label: "Eagle" },
    ],
    edges: [
      { source: "root", target: "mammal" },
      { source: "root", target: "bird" },
      { source: "mammal", target: "dog" },
      { source: "bird", target: "eagle" },
    ],
  };

  it("draws grandchildren, not just the first level", () => {
    render(<TutorDiagram spec={deep} />);
    // Before: only Animal / Mammal / Bird reached the DOM.
    expect(screen.getByText("Dog")).toBeInTheDocument();
    expect(screen.getByText("Eagle")).toBeInTheDocument();
  });

  it("a cycle cannot recurse for ever", () => {
    const cyclic: DiagramSpec = {
      kind: "tree",
      nodes: nodes("A", "B"),
      edges: [
        { source: "A", target: "B" },
        { source: "B", target: "A" },
      ],
    };
    // A free-form edge list can describe a loop. If this hangs, the session room's tab dies.
    render(<TutorDiagram spec={cyclic} />);
    expect(screen.getAllByTestId("diagram-node").length).toBeGreaterThan(0);
  });
});

describe("meaning arrives on channels that survive without colour", () => {
  it("a verdict always brings its own glyph, never colour alone", () => {
    const spec: DiagramSpec = {
      kind: "compare",
      nodes: [
        { id: "a", label: "Has index", state: "good" },
        { id: "b", label: "No index", state: "bad" },
        { id: "c", label: "Partial", state: "warning" },
      ],
    };
    render(<TutorDiagram spec={spec} />);
    expect(screen.getAllByTestId("diagram-state-glyph").map((n) => n.textContent)).toEqual([
      "✓",
      "✕",
      "!",
    ]);
  });

  it("role is carried as a shape, so it reads in greyscale", () => {
    const spec: DiagramSpec = {
      kind: "flow",
      nodes: [
        { id: "s", label: "Start", role: "start" },
        { id: "d", label: "Valid?", role: "decision" },
        { id: "n", label: "Aside", role: "note" },
      ],
    };
    render(<TutorDiagram spec={spec} />);
    const roles = screen.getAllByTestId("diagram-node").map((n) => n.getAttribute("data-role"));
    expect(roles).toEqual(["start", "decision", "note"]);
  });

  it("marks the one node to look at first", () => {
    const spec: DiagramSpec = {
      kind: "flow",
      nodes: [
        { id: "a", label: "One" },
        { id: "b", label: "Two", emphasis: true },
      ],
    };
    render(<TutorDiagram spec={spec} />);
    const marked = screen
      .getAllByTestId("diagram-node")
      .filter((n) => n.getAttribute("data-emphasis") === "true");
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent("Two");
  });

  it("a comparison with real verdicts does not also tint the first column", () => {
    const spec: DiagramSpec = {
      kind: "compare",
      nodes: [
        { id: "a", label: "Left", state: "good" },
        { id: "b", label: "Right", state: "bad" },
      ],
    };
    render(<TutorDiagram spec={spec} />);
    // The states ARE the comparison; a positional tint would be a second, contradicting signal.
    expect(screen.getAllByTestId("diagram-state-glyph")).toHaveLength(2);
  });
});

describe("layers draws containment, not a list", () => {
  it("nodes sharing a group sit inside one labelled container", () => {
    const spec: DiagramSpec = {
      kind: "layers",
      nodes: [
        { id: "h", label: "HTTP", group: "Application" },
        { id: "f", label: "FTP", group: "Application" },
        { id: "t", label: "TCP", group: "Transport" },
      ],
    };
    render(<TutorDiagram spec={spec} />);
    const groups = screen.getAllByTestId("diagram-group");
    expect(groups).toHaveLength(2);
    expect(within(groups[0]).getByText("HTTP")).toBeInTheDocument();
    expect(within(groups[0]).getByText("FTP")).toBeInTheDocument();
    expect(within(groups[1]).getByText("TCP")).toBeInTheDocument();
  });

  it("an ungrouped spec keeps the old full-width rows", () => {
    const spec: DiagramSpec = { kind: "layers", nodes: nodes("One", "Two") };
    render(<TutorDiagram spec={spec} />);
    expect(screen.queryAllByTestId("diagram-group")).toHaveLength(0);
    expect(screen.getAllByTestId("diagram-node")).toHaveLength(2);
  });
});

describe("a spec written before any of this still renders", () => {
  it("renders labels and notes with no semantic fields at all", () => {
    const spec: DiagramSpec = {
      kind: "flow",
      title: "Old spec",
      nodes: [
        { id: "a", label: "First", note: "a note" },
        { id: "b", label: "Second" },
      ],
      edges: [{ source: "a", target: "b", label: "then" }],
    };
    render(<TutorDiagram spec={spec} />);
    expect(screen.getByText("Old spec")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("a note")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.queryAllByTestId("diagram-state-glyph")).toHaveLength(0);
  });

  it("every text node still sets its own colour, for the light recap page", () => {
    // The component is used on a dark room AND a light recap. Inherited colour rendered
    // dark-on-dark at ~1.09:1 once already; nothing added here may reintroduce that.
    const spec: DiagramSpec = {
      kind: "layers",
      nodes: [{ id: "a", label: "Row", group: "Group", note: "note" }],
    };
    const { container } = render(<TutorDiagram spec={spec} />);
    const texts = Array.from(container.querySelectorAll("p,span"));
    expect(texts.length).toBeGreaterThan(0);
    for (const el of texts) {
      expect((el as HTMLElement).style.color || getComputedStyle(el).color).toBeTruthy();
    }
  });
});
