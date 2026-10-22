import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Recordings is a MODULE, not a tab.
 *
 * It began as a tab on Live Sessions, which was wrong twice over. It answers a different
 * question from the schedule - "what did I miss" rather than "where do I go next" - and it is
 * the only surface that reaches a class held before a learner joined their batch, which is
 * exactly what nobody goes hunting for behind a tab on a page about today.
 *
 * It is also a load decision. The live page polls; the archive never does and only grows. While
 * they shared a page, every learner checking when their next class was also downloaded the whole
 * recorded history - and then downloaded it again every 60 seconds whenever a class was near.
 *
 * These assertions are cheap and they are the ones that would quietly come undone in a refactor:
 * the sidebar entry, the route it points at, and the feature flag that governs it.
 */

import { STUDENT_NAV_ITEMS, STUDENT_SECTIONS } from "@/lib/navigation/navModel";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";

const recordings = STUDENT_NAV_ITEMS.find((i) => i.path === "/recordings");

describe("the recordings module", () => {
  it("is its own sidebar entry", () => {
    expect(recordings).toBeTruthy();
    expect(recordings?.label).toBe("Recordings");
  });

  it("sits in Engage, beside Live Sessions", () => {
    const engage = STUDENT_SECTIONS.find((s) => s.id === "engage");
    expect(engage).toBeTruthy();
    // Sections gather their items by feature name, so this is what actually places it.
    expect(engage?.itemFeatures).toContain(recordings?.featureName);
  });

  it("is governed by the same feature flag as live sessions", () => {
    const live = STUDENT_NAV_ITEMS.find((i) => i.path === "/live-sessions");
    expect(recordings?.featureName).toBe(live?.featureName);
    expect(recordings?.featureName).toBe("live_sessions");
    // A tenant with live sessions switched off must not be shown an archive of them.
  });

  it("is a top-level route, not nested under live-sessions", () => {
    // Nesting it under /live-sessions/ is what made it read as part of that page. The path is
    // the module boundary, so it is worth asserting rather than assuming.
    expect(recordings?.path).toBe("/recordings");
    expect(recordings?.path.startsWith("/live-sessions")).toBe(false);
  });

  it("is translated in every locale the sidebar renders", () => {
    // Through `unknown`: the imported JSON has a precise literal type whose other branches
    // (string[] for daysOfWeek, nested month objects) do not overlap a flat string record, so a
    // direct cast is rejected. The shape this test cares about is two string lookups.
    const locales: ReadonlyArray<readonly [string, Record<string, Record<string, string>>]> = [
      ["en", en as unknown as Record<string, Record<string, string>>],
      ["ar", ar as unknown as Record<string, Record<string, string>>],
    ];
    for (const [name, bundle] of locales) {
      expect(bundle.nav?.recordings, `nav.recordings missing in ${name}`).toBeTruthy();
      expect(bundle.navDesc?.recordings, `navDesc.recordings missing in ${name}`).toBeTruthy();
    }
  });

  it("declares the i18n keys it actually uses", () => {
    expect(recordings?.labelKey).toBe("nav.recordings");
    expect(recordings?.descKey).toBe("navDesc.recordings");
  });

  it("its page copy carries no em dashes", () => {
    // House style: a comma, a colon or a full stop, never U+2014, and never an en dash doing an
    // em dash's job between two words. The page's description is what a learner reads.
    const root = path.join(__dirname, "..", "..");
    for (const rel of ["app/recordings/page.tsx", "lib/services/live-sessions/student-live-sessions.service.ts"]) {
      const text = readFileSync(path.join(root, rel), "utf8");
      expect(text, `${rel} contains an em dash`).not.toMatch(/\u2014/);
      expect(text, `${rel} uses an en dash as an em dash`).not.toMatch(/\w \u2013 \w/);
    }
  });
});
