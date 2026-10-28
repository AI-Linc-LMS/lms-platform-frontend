import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A device problem must never stop a student sitting their assessment.
 *
 * This is the single largest source of support tickets this platform has: 126 of them, ~38% of
 * everything ever filed, from students in front of a working camera being told "No face detected"
 * with no way forward. The causes were fixed one at a time — third-party weights, a CPU fallback
 * that froze the tab, a silent retry exhaustion, an error the page never rendered — and each fix
 * made the failure rarer without making the OUTCOME impossible.
 *
 * The outcome became impossible only when the signals stopped gating the door. These tests defend
 * that property, because it is the kind of thing a well-meaning change reintroduces: adding
 * `&& cameraOk` to a start condition looks like tightening security, and is in fact how a cohort
 * loses an exam.
 *
 * Source-text assertions rather than rendering the pages: both are ~2,700-line client components
 * with routers, media streams, fullscreen and tf.js in their import graph. Standing that up in
 * jsdom would test the mocks. What is worth protecting is the RULE, and the rule is visible in the
 * source.
 */

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const DEVICE_CHECK = "app/assessments/[slug]/device-check/page.tsx";
const TAKE = "app/assessments/[slug]/take/page.tsx";

/**
 * The detector's JUDGEMENT about a working camera. None of these may gate entry — this is the
 * class that produced the 126 tickets.
 *
 * Note what is deliberately absent: `deviceStatus.camera` and `deviceStatus.microphone`. A
 * proctored assessment genuinely requires the hardware, and that precondition is enforced. The bug
 * was never "we required a camera"; it was "we required our ML to be happy about one".
 */
const DETECTOR_SIGNALS = [
  "faceValidationPassed",
  "faceCheckError",
  "faceCount",
  "faceStatus",
  "latestViolation",
  "networkAllowsProceed",
];

describe("the device check cannot lock a student out", () => {
  it("never gates entry on the detector's opinion", () => {
    const src = read(DEVICE_CHECK);
    const match = src.match(/const canProceed =([\s\S]*?);/);
    expect(match, "canProceed should still exist").toBeTruthy();

    const expression = match![1];
    for (const signal of DETECTOR_SIGNALS) {
      expect(
        expression.includes(signal),
        `canProceed must not depend on "${signal}". That is our analysis of the camera, not ` +
          `whether a camera exists, and making it load-bearing is what produced 126 tickets.`,
      ).toBe(false);
    }
  });

  it("still requires camera and mic for a proctored assessment", () => {
    // The precondition the institution is entitled to enforce, and which the owner asked to keep:
    // no camera or mic means nothing to proctor.
    const expression = read(DEVICE_CHECK).match(/const canProceed =([\s\S]*?);/)![1];
    expect(expression).toContain("browserSupported");
    expect(expression).toContain("proctoringRequired");
    expect(expression).toContain("deviceStatus.camera");
    expect(expression).toContain("deviceStatus.microphone");
  });

  it("still tells the student what is degraded", () => {
    // De-gating must not become hiding. If entry is allowed while something is broken, the student
    // is told plainly — otherwise they discover mid-exam that nothing was being recorded.
    const src = read(DEVICE_CHECK);
    expect(src).toContain("degradedSignals");
    expect(src).toMatch(/You can still start your assessment/);
  });
});

describe("the take page cannot bounce a student out", () => {
  it("never AUTOMATICALLY redirects to device check", () => {
    // The distinction that matters is who decided. `router.replace` is the app moving a student
    // against their will, with no history entry to come back by — that is the bounce that ran on
    // mount, on a failed proctoring start, and on a failed camera retry, each of them a lock-out
    // behind the first. A `router.push` inside an onClick is a button the student chose to press,
    // and offering "open device check" to someone who wants it is help, not a trap.
    const src = read(TAKE);
    const autoRedirects = [
      ...src.matchAll(/router\.replace\(`\/assessments\/\$\{slug\}\/device-check`\)/g),
    ];
    expect(
      autoRedirects.length,
      "A student on the take page is mid-assessment with a running clock; nothing may move them " +
        "off it automatically.",
    ).toBe(0);
  });

  it("degrades instead of unwinding the start when the DETECTOR fails", () => {
    const src = read(TAKE);
    expect(src).toContain("continueWithoutFaceAnalysis");
    expect(
      src.includes("failProctoredStart("),
      "failProctoredStart reset assessmentStarted and redirected; it must not come back.",
    ).toBe(false);
  });

  it("blocks in place, not by navigating away, when camera/mic are missing", () => {
    const src = read(TAKE);
    expect(src).toContain("blockOnMissingMedia");
    // Rendered outside the assessmentStarted gate, or the student gets a blank page — everything
    // else on this route lives inside that conditional.
    expect(src).toMatch(/mediaRequiredButMissing && !assessmentStarted/);
    expect(src).toContain("Camera and microphone needed to begin");
  });

  it("does not cover the paper with a blocking media overlay", () => {
    const src = read(TAKE);
    // The old overlay was position:fixed / inset:0 / zIndex:1999 over the whole exam, with the
    // clock running and no way to answer a question underneath it.
    const overlay = src.match(/mediaInterrupted &&[\s\S]{0,400}?zIndex:\s*1999/);
    expect(
      overlay,
      "The camera-dropped notice must be a dismissible banner, not a full-viewport overlay.",
    ).toBeNull();
    expect(src).toContain("mediaNoticeDismissed");
  });
});

/**
 * The camera is watched after it is granted, and a camera with no picture never strands anyone.
 *
 * Reported with two screenshots: one stuck on a disabled "Checking devices..." button with
 * nothing beneath it, one with the camera row reading "Ready" over a black preview showing
 * Chrome's own muted-track icon and "No face detected". The first is a media request with no
 * bound; the second is a camera assessed once at grant time and never looked at again.
 */
describe("a camera that stops short of a picture", () => {
  const src = readFileSync(
    path.join(__dirname, "[slug]", "device-check", "page.tsx"),
    "utf8"
  );

  it("bounds the media request, so an unanswered prompt cannot hang the check for ever", () => {
    expect(src).toContain("Promise.race(");
    expect(src).toContain("DEVICE_REQUEST_TIMEOUT_MS");
    // and a late grant is adopted rather than thrown away
    expect(src).toMatch(/adoptStream\(late\)/);
  });

  it("keeps watching the granted track instead of trusting the grant", () => {
    expect(src).toContain("watchVideoTrack(");
    expect(src).toContain("watchPictureLiveness(");
  });

  it("never lets 'no picture' become a gate", () => {
    const match = src.match(/const canProceed =([\s\S]*?);/);
    expect(match, "canProceed should still exist").toBeTruthy();
    expect(match![1]).not.toContain("noCameraPicture");
  });

  it("offers a retry when the camera is granted but shows nothing", () => {
    expect(src).toMatch(
      /\(!deviceStatus\.camera \|\| !deviceStatus\.microphone \|\| noCameraPicture\) &&/
    );
    expect(src).toContain("Try the camera again");
    expect(src).toContain("pickAlternateCamera(");
  });

  it("stops claiming 'working properly' over a black preview", () => {
    expect(src).toMatch(/noCameraPicture\s*\?\s*"Camera is allowed, but no picture/);
  });

  it("renders the begin button before the advisory alert, so it cannot sit below the fold", () => {
    const button = src.indexOf("Enter fullscreen & begin");
    const alert = src.indexOf("You can still start your assessment");
    expect(button).toBeGreaterThan(-1);
    expect(alert).toBeGreaterThan(-1);
    expect(button).toBeLessThan(alert);
  });
});
