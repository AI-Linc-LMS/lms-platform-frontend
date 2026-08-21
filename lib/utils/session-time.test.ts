import { describe, expect, it } from "vitest";
import { formatSessionTime, sessionTimeParts, zoneLabel } from "./session-time";

/** Aug 21 2026, 11:00 UTC = 4:30 PM in Kolkata — the instant from the reported header. */
const AUG = new Date("2026-08-21T11:00:00Z");
/** Northern-hemisphere winter, to pin the DST half of each label. */
const JAN = new Date("2026-01-15T11:00:00Z");

describe("zoneLabel", () => {
  it("gives IST for Asia/Kolkata, not GMT+5:30", () => {
    expect(zoneLabel(AUG, "Asia/Kolkata")).toBe("IST");
  });

  it("stays DST-correct rather than pinning one locale", () => {
    // The guard against 'just switch everything to en-IN', which renders these as GMT-4 / GMT.
    expect(zoneLabel(AUG, "America/New_York")).toBe("EDT");
    expect(zoneLabel(JAN, "America/New_York")).toBe("EST");
    expect(zoneLabel(AUG, "Europe/London")).toBe("BST");
    expect(zoneLabel(JAN, "Europe/London")).toBe("GMT");
  });

  it("uses the curated map for zones no English locale abbreviates", () => {
    expect(zoneLabel(AUG, "Asia/Riyadh")).toBe("AST");
    expect(zoneLabel(AUG, "Asia/Dubai")).toBe("GST");
    expect(zoneLabel(AUG, "Asia/Karachi")).toBe("PKT");
    expect(zoneLabel(AUG, "Asia/Dhaka")).toBe("BST");
    expect(zoneLabel(AUG, "Asia/Singapore")).toBe("SGT");
  });

  it("maps Asia/Manila to PHT, never its own PST", () => {
    // Manila's abbreviation is Philippine Standard Time — passing it through would print a
    // Philippine class as US Pacific.
    expect(zoneLabel(AUG, "Asia/Manila")).toBe("PHT");
  });

  it("keeps the label compact for zones with no abbreviation", () => {
    // These have no abbreviation anywhere, and the label is rendered as a compact column header,
    // so a long name ("Japan Time") would overflow it.
    for (const z of ["Asia/Tokyo", "Asia/Seoul", "Europe/Moscow", "America/Sao_Paulo"]) {
      const label = zoneLabel(AUG, z);
      expect(label.length).toBeLessThanOrEqual(8);
      expect(label).not.toMatch(/Time/);
    }
  });

  it("returns nothing for a blank or unknown zone", () => {
    expect(zoneLabel(AUG, "")).toBe("");
    expect(zoneLabel(AUG, null)).toBe("");
    expect(zoneLabel(AUG, "Not/AZone")).toBe("");
  });
});

describe("formatSessionTime", () => {
  it("stamps the session's own zone", () => {
    expect(formatSessionTime(AUG.toISOString(), "Asia/Kolkata")).toContain("4:30 PM IST");
  });

  it("labels a cross-zone viewer's half with its own date and zone", () => {
    // A Kolkata 8:00 AM class is the PREVIOUS day for a Los Angeles viewer, so the viewer half has
    // to carry a date - "7:30 PM your time" alone named the right clock on the wrong day.
    const tz = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      const out = formatSessionTime("2026-08-21T02:30:00Z", "Asia/Kolkata");
      expect(out).toContain("8:00 AM IST");
      expect(out).toContain("Aug 20");
      expect(out).toContain("PDT, your time");
    } finally {
      // `= undefined` would set the literal string "undefined" and leak a broken zone into the
      // rest of the file.
      if (tz === undefined) delete process.env.TZ;
      else process.env.TZ = tz;
    }
  });

  it("adds no zone label when the session has no stored zone", () => {
    // Previously stamped the VIEWER's zone as if it were the session's.
    const out = formatSessionTime(AUG.toISOString(), "");
    expect(out).not.toMatch(/GMT|UTC|IST/);
  });

  it("honours showZone: false", () => {
    expect(formatSessionTime(AUG.toISOString(), "Asia/Kolkata", { showZone: false })).not.toContain("IST");
  });
});

describe("sessionTimeParts", () => {
  it("exposes the session label and the viewer's own", () => {
    const parts = sessionTimeParts(AUG.toISOString(), "Asia/Kolkata");
    expect(parts.zoneAbbr).toBe("IST");
    expect(parts.date).toBe("Aug 21");
    expect(parts.time).toBe("4:30 PM");
    // Same zone as the test runner or not, the two labels must never contradict each other.
    if (parts.viewerTime) expect(parts.viewerZoneAbbr).not.toBe("");
    else expect(parts.viewerZoneAbbr).toBe("");
  });

  it("leaves the label empty for a session with no zone", () => {
    expect(sessionTimeParts(AUG.toISOString(), "").zoneAbbr).toBe("");
  });
});
