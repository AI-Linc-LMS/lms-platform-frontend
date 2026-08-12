import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoadmapSpine } from "./RoadmapSpine";
import type { RoadmapGraph, RoadmapProgress } from "@/lib/services/roadmaps.service";

/**
 * Renders the REAL map at production scale.
 *
 * This exists because the trail render-loop (React #185) shipped after I verified the layout
 * with a static HTML prototype. A prototype proves geometry and proves nothing about lifecycle:
 * the component was unrunnable while its geometry was correct. Anything that renders this
 * surface has to actually mount it.
 */

function stubLayout() {
  // Stable per element. A counter-based stub returns different geometry on every call, so the
  // measure never settles and the test fails even against correct code.
  const seen = new Map<Element, number>();
  return vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      if (!seen.has(this)) seen.set(this, seen.size);
      const i = seen.get(this) as number;
      return {
        left: (i % 3) * 300, right: (i % 3) * 300 + 264,
        top: i * 40, bottom: i * 40 + 40,
        width: 264, height: 40, x: 0, y: i * 40, toJSON: () => ({}),
      } as DOMRect;
    });
}

/** A graph shaped like the shipped Frontend roadmap: 5 sections, 25 steps, 150 branches. */
function bigGraph(): RoadmapGraph {
  const nodes: RoadmapGraph["nodes"] = [];
  const edges: RoadmapGraph["edges"] = [];
  let id = 1;
  for (let s = 0; s < 5; s++) {
    const sectionId = id++;
    nodes.push({
      id: sectionId, slug: `sec-${s}`, title: `Section ${s + 1}`, kind: "milestone",
      order: nodes.length, parentId: null, isRequired: true, isTrackable: false, legendId: null,
    });
    for (let t = 0; t < 5; t++) {
      const stepId = id++;
      nodes.push({
        id: stepId, slug: `step-${s}-${t}`, title: `Step ${s}.${t}`, kind: "topic",
        order: nodes.length, parentId: sectionId, isRequired: t < 4, isTrackable: true,
        legendId: null,
      });
      for (let b = 0; b < 6; b++) {
        nodes.push({
          id: id++, slug: `br-${s}-${t}-${b}`, title: `Branch ${b}`, kind: "subtopic",
          order: nodes.length, parentId: stepId, isRequired: true, isTrackable: true,
          legendId: null,
        });
      }
    }
  }
  const steps = nodes.filter((n) => n.kind === "topic");
  edges.push({ from: steps[0].id, to: steps[7].id, kind: "depends" });
  return {
    slug: "frontend", cardTitle: "Frontend", pageTitle: "Frontend Developer", kind: "role",
    summary: "", version: 1, nodes, edges,
    legends: [{ id: 1, label: "Core path", color: "#7c3aed" }],
    related: [{ slug: "backend", cardTitle: "Backend", pageTitle: "Backend Developer", kind: "role" }],
    faqs: [],
  };
}

function progressFor(g: RoadmapGraph): RoadmapProgress {
  const nodes: RoadmapProgress["nodes"] = {};
  g.nodes.forEach((n, i) => {
    nodes[n.id] = {
      selfState: i % 7 === 0 ? "done" : i % 11 === 0 ? "skipped" : "pending",
      isLeaf: n.kind === "subtopic",
      verifiedComplete: i % 13 === 0,
      unitsComplete: 1, unitsTotal: 1, hasContentGap: false,
    };
  });
  return {
    total: 150, done: 20, skipped: 5, learning: 0, mastered: 10,
    coverage: 0.16, mastery: 0.06, contentGaps: 0, nodes,
  };
}

afterEach(() => vi.restoreAllMocks());

// A full-size map is ~180 nodes plus their wrappers. Mounting that in jsdom genuinely takes
// longer than the 5s default, and the branch layout added a wrapper per leaf. The generous
// budget is deliberate: this suite exists to catch the render LOOP that took staging down
// (React #185), and shrinking the map to fit the default would shrink away the thing under test.
describe("RoadmapSpine", { timeout: 30_000 }, () => {
  it("mounts a full-size roadmap without looping or throwing", () => {
    stubLayout();
    const g = bigGraph();
    expect(() =>
      render(<RoadmapSpine graph={g} progress={progressFor(g)} onOpenNode={() => {}} />)
    ).not.toThrow();
  });

  it("renders every step and branch", () => {
    stubLayout();
    const g = bigGraph();
    render(<RoadmapSpine graph={g} progress={progressFor(g)} onOpenNode={() => {}} />);
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(175);
  });

  it("survives with no progress overlay at all", () => {
    stubLayout();
    const g = bigGraph();
    expect(() => render(<RoadmapSpine graph={g} onOpenNode={() => {}} />)).not.toThrow();
  });

  it("survives a graph with no sections", () => {
    stubLayout();
    const g = bigGraph();
    const flat = { ...g, nodes: g.nodes.filter((n) => n.kind !== "milestone") };
    expect(() => render(<RoadmapSpine graph={flat} onOpenNode={() => {}} />)).not.toThrow();
  });
});
