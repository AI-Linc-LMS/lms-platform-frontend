import { describe, expect, it, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { RoadmapSpine } from "@/components/roadmaps/RoadmapSpine";
import { SECTION_ACCENTS } from "@/components/roadmaps/roadmapTokens";
import type { RoadmapGraph, RoadmapProgress } from "@/lib/services/roadmaps.service";

function stubLayout() {
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

function graph(S: number, T = 5, B = 6): RoadmapGraph {
  const nodes: RoadmapGraph["nodes"] = [];
  let id = 1;
  for (let s = 0; s < S; s++) {
    const sectionId = id++;
    nodes.push({
      id: sectionId, slug: `sec-${s}`, title: `Section ${s + 1} Title`, kind: "milestone",
      order: nodes.length, parentId: null, isRequired: true, isTrackable: false, legendId: null,
    });
    for (let t = 0; t < T; t++) {
      const stepId = id++;
      nodes.push({
        id: stepId, slug: `step-${s}-${t}`, title: `Step ${s}.${t}`, kind: "topic",
        order: nodes.length, parentId: sectionId, isRequired: true, isTrackable: true, legendId: null,
      });
      for (let b = 0; b < B; b++) {
        nodes.push({
          id: id++, slug: `br-${s}-${t}-${b}`, title: `Branch ${s}.${t}.${b}`, kind: "subtopic",
          order: nodes.length, parentId: stepId, isRequired: true, isTrackable: true, legendId: null,
        });
      }
    }
  }
  return {
    slug: "x", cardTitle: "X", pageTitle: "X", kind: "role", summary: "", version: 1,
    nodes, edges: [], legends: [], related: [], faqs: [],
  } as unknown as RoadmapGraph;
}

const allPending = (g: RoadmapGraph): RoadmapProgress => {
  const nodes: RoadmapProgress["nodes"] = {};
  g.nodes.forEach((n) => {
    nodes[n.id] = {
      selfState: "pending", isLeaf: n.kind === "subtopic", verifiedComplete: false,
      unitsComplete: 0, unitsTotal: 1, hasContentGap: false,
    } as RoadmapProgress["nodes"][number];
  });
  return { nodes } as RoadmapProgress;
};

afterEach(() => vi.restoreAllMocks());

describe("per-section identification cues", () => {
  it("MEASURE: every section renders a numbered header + title, at 6 and at 8 sections", () => {
    for (const S of [6, 8]) {
      stubLayout();
      const g = graph(S, 3, 3);
      const { container, unmount } = render(
        <RoadmapSpine graph={g} progress={allPending(g)} onOpenNode={() => {}} />,
      );
      const text = container.textContent ?? "";
      const missing: string[] = [];
      for (let i = 1; i <= S; i++) {
        if (!text.includes(`Section ${i} Title`)) missing.push(`title ${i}`);
      }
      // The numeric badge: a div whose entire textContent is the section ordinal, and which is a
      // sibling of the section title.
      const badges = Array.from(container.querySelectorAll("div"))
        .filter((d) => /^\d+$/.test((d.textContent ?? "").trim()) && d.children.length === 0)
        .map((d) => (d.textContent ?? "").trim());
      // eslint-disable-next-line no-console
      console.log(
        `S=${S}: section titles missing=${JSON.stringify(missing)} numericBadges=${JSON.stringify(badges)}`,
      );
      expect(missing).toEqual([]);
      expect(badges).toEqual(Array.from({ length: S }, (_, i) => String(i + 1)));
      unmount();
      vi.restoreAllMocks();
    }
  });

  it("MEASURE: accent wrap point vs the real shipped specs", () => {
    // Milestone counts read from ai-linc-backend/roadmaps/specs/*.json on 2026-08-12.
    const shipped: Record<string, number> = {
      backend: 5, cpp: 1, dsa: 2, frontend: 5, "full-stack": 6,
      java: 2, "programming-fundamentals": 1, sql: 1,
    };
    const wraps = Object.entries(shipped).filter(([, n]) => n > SECTION_ACCENTS.length);
    // eslint-disable-next-line no-console
    console.log(
      `accents=${SECTION_ACCENTS.length} maxShippedSections=${Math.max(...Object.values(shipped))} ` +
        `roadmapsThatWrap=${JSON.stringify(wraps)}`,
    );
    expect(wraps).toEqual([]);
  });

  it("MEASURE: how much of a real map is even tinted once progress exists", () => {
    stubLayout();
    const g = graph(6, 5, 6);
    // A learner halfway through: alternate states the way the shipped fixture does.
    const nodes: RoadmapProgress["nodes"] = {};
    let pending = 0;
    let total = 0;
    g.nodes.forEach((n, i) => {
      if (n.kind === "milestone") return;
      total += 1;
      const st = i % 2 === 0 ? "done" : "pending";
      if (st === "pending") pending += 1;
      nodes[n.id] = {
        selfState: st, isLeaf: n.kind === "subtopic", verifiedComplete: false,
        unitsComplete: 0, unitsTotal: 1, hasContentGap: false,
      } as RoadmapProgress["nodes"][number];
    });
    const { unmount } = render(
      <RoadmapSpine graph={g} progress={{ nodes } as RoadmapProgress} onOpenNode={() => {}} />,
    );
    // eslint-disable-next-line no-console
    console.log(`accent-tinted nodes at 50% done: ${pending}/${total}`);
    unmount();
  });
});
