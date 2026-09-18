/**
 * /certificates: "325 what?", a track that showed nothing before the first milestone, and a tour
 * that "is not showing where the features are".
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { PAGE_GUIDES } from "@/lib/guide/registry";
import { railMarkerPercent } from "./PointsLadderRail";

describe("where the marker sits on the milestone track", () => {
  it("shows progress BEFORE the first milestone - most learners are there", () => {
    // 1,100 of 1,500 towards the first of seven rungs. The old track started at the first rung,
    // so this learner saw an empty line.
    const pct = railMarkerPercent(0, 1100 / 1500, 7);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeCloseTo(((0.5 * (1100 / 1500)) / 7) * 100, 5);
  });

  it("lands on a rung's centre the moment it is reached, from either side", () => {
    const firstRungCentre = (0.5 / 7) * 100;
    expect(railMarkerPercent(0, 1, 7)).toBeCloseTo(firstRungCentre, 5);
    expect(railMarkerPercent(1, 0, 7)).toBeCloseTo(firstRungCentre, 5);
  });

  it("moves part of a slot between rungs and never leaves the track", () => {
    expect(railMarkerPercent(3, 0.5, 7)).toBeCloseTo((3 / 7) * 100, 5);
    expect(railMarkerPercent(7, 1, 7)).toBeLessThanOrEqual(100);
    expect(railMarkerPercent(0, 0, 0)).toBe(0);
  });
});

describe("page tours point at something", () => {
  // Every data-tour-id in the app, however it is written (attribute, prop, or tourId prop).
  const source = execSync(
    `grep -rhoE "(data-tour-id|tourId|targetId)=[\\"'{]*[a-z0-9-]+" app components lib --include=*.tsx`,
    { encoding: "utf8" },
  );
  const anchors = new Set(
    [...source.matchAll(/(?:data-tour-id|tourId)=["'{]*([a-z0-9-]+)/g)].map((m) => m[1]),
  );

  it("the certificates tour spotlights real parts of the page", () => {
    const steps = PAGE_GUIDES["/certificates"].tourSteps ?? [];
    const targets = steps.map((s) => s.targetId).filter(Boolean) as string[];
    expect(targets.length).toBeGreaterThanOrEqual(4);
    for (const id of targets) expect(anchors, `no data-tour-id="${id}" anywhere`).toContain(id);
  });

  it("no page's tour targets an anchor that does not exist", () => {
    const missing: string[] = [];
    for (const [route, guide] of Object.entries(PAGE_GUIDES)) {
      for (const step of guide.tourSteps ?? []) {
        if (step.targetId && !anchors.has(step.targetId)) missing.push(`${route} -> ${step.targetId}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("the tile says what the number is", () => {
    const page = readFileSync("app/certificates/page.tsx", "utf8");
    expect(page).toContain("To next milestone");
    expect(page).toContain("{{points}} pts");
  });
});
