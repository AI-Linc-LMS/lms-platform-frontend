import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent } from "@mui/material";
import { useFullscreenHandler } from "@/lib/hooks/useFullscreenHandler";
import { FullscreenWarningDialog } from "./FullscreenWarningDialog";
import { installFullscreenApi } from "@/lib/fullscreen/fullscreenTestDouble";

/**
 * The take page's own rule: a learner whose browser has no fullscreen gets no blocking modal, and
 * can still answer and SUBMIT.
 *
 * `app/assessments/[slug]/take/page.tsx` is ~2,900 lines of client component with a router, media
 * streams and tf.js in its import graph - standing it up in jsdom would test the mocks, which is
 * why `app/assessments/never-block-the-student.test.ts` asserts that page's rules against its
 * source. This file does both: the BEHAVIOUR is exercised through the same hook and the same
 * dialog the page uses, wired with the page's own gating expression, and the page's WIRING is
 * asserted against its source so a well-meaning edit cannot quietly reconnect the trap.
 */

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const TAKE = "app/assessments/[slug]/take/page.tsx";

let installed: { uninstall: () => void; leave: () => void; enter: () => void } | null =
  null;

afterEach(() => {
  installed?.uninstall();
  installed = null;
});

/**
 * The paper, reduced to what matters here: the two modal dialogs the page can put over it, driven
 * by the same hook with the same options the page passes, and a Submit the learner has to be able
 * to reach.
 *
 * The gating expressions are the page's ORIGINAL ones (`showFullscreenWarning && !submitting`),
 * deliberately NOT the new `fullscreenSupported &&` guard. Copying the new guard in here would
 * make this harness pass whatever the hook did, which is a check that cannot fail. What is under
 * test is the hook's guarantee: on a browser with no Fullscreen API, neither dialog is ever
 * raised in the first place. The page's own extra guard is asserted against its source below.
 */
function Paper({ onSubmit }: { onSubmit: () => void }) {
  const [exitConfirm, setExitConfirm] = useState(false);
  const { showFullscreenWarning, handleReEnterFullscreen } = useFullscreenHandler(
    {
      enabled: true,
      submitting: false,
      enterFullscreen: async () => false,
      // Exactly how the take page configures it.
      promptOnFullscreenExit: true,
      onLeftFullscreen: () => setExitConfirm(true),
      onEscapePressed: () => setExitConfirm(true),
    }
  );

  return (
    <>
      <button type="button" onClick={onSubmit}>
        Submit Assessment
      </button>
      {showFullscreenWarning && (
        <FullscreenWarningDialog
          open={showFullscreenWarning}
          onReEnterFullscreen={handleReEnterFullscreen}
        />
      )}
      {/* Stand-in for FullscreenExitConfirmDialog: a real MUI modal, so "Submit is unreachable"
          is a real statement about the DOM rather than about a div. */}
      <Dialog open={exitConfirm} onClose={() => {}}>
        <DialogContent>Fullscreen interrupted</DialogContent>
      </Dialog>
    </>
  );
}

function findSubmitInDom() {
  return Array.from(document.querySelectorAll("button")).find((b) =>
    /Submit Assessment/i.test(b.textContent ?? "")
  );
}

describe("taking an assessment on a browser with no Fullscreen API", () => {
  it("raises neither dialog on a fullscreen change, and Submit stays clickable", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Paper onSubmit={onSubmit} />);

    // A fullscreenchange with nothing in fullscreen is exactly what the old code acted on: it
    // treated it as "the learner left fullscreen" and opened the exit prompt, whose "Continue
    // test" then led to the blocking modal. On a device that cannot enter fullscreen, leaving it
    // is not an event that can happen.
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
      document.dispatchEvent(new Event("webkitfullscreenchange"));
    });

    expect(screen.queryByText(/Fullscreen Mode Required/i)).toBeNull();
    expect(screen.queryByText(/Fullscreen interrupted/i)).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Enter Fullscreen Mode/i })
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: /Submit Assessment/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("taking it on a desktop document (the control)", () => {
  it("still prompts on a real fullscreen exit, and that prompt really does block Submit", async () => {
    installed = installFullscreenApi();
    const onSubmit = vi.fn();
    render(<Paper onSubmit={onSubmit} />);

    act(() => installed!.enter());
    act(() => installed!.leave());

    await waitFor(() =>
      expect(screen.getByText(/Fullscreen interrupted/i)).toBeInTheDocument()
    );

    // MUI hides the rest of the tree from assistive technology, so Submit drops out of the
    // accessible roles entirely - it is still in the DOM, inside an aria-hidden subtree.
    expect(screen.queryByRole("button", { name: /Submit Assessment/i })).toBeNull();
    const submit = findSubmitInDom();
    expect(submit).toBeTruthy();
    expect(submit!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("the warning dialog's copy", () => {
  it("does not tell a phone learner to press F11", () => {
    // Straight from the screenshot in the report: "Press F11 or click the button below", on an
    // iPhone. No fullscreen here, so no hotkey either.
    render(<FullscreenWarningDialog open onReEnterFullscreen={vi.fn()} />);
    expect(screen.queryByText("F11")).toBeNull();
    expect(screen.getByText(/Use the button below to continue/i)).toBeInTheDocument();
  });

  it("still mentions F11 where that key exists (the control)", () => {
    render(
      <FullscreenWarningDialog open mentionHotkey onReEnterFullscreen={vi.fn()} />
    );
    expect(screen.getByText("F11")).toBeInTheDocument();
  });
});

describe("the take page's wiring", () => {
  it("asks the shared capability helper, not a device sniff, before demanding fullscreen", () => {
    const src = read(TAKE);
    expect(src).toContain('from "@/lib/fullscreen/fullscreenSupport"');
    expect(
      /if \(canEnterFullscreen\(\)\) \{\s*void enterFullscreen\(\)/.test(src),
      "Starting the assessment must not request fullscreen where there is none to request; " +
        "the old code did, read the resolved no-op as success, and raised the blocking modal.",
    ).toBe(true);
  });

  it("renders neither fullscreen dialog where fullscreen is impossible", () => {
    const src = read(TAKE);
    // Both are modal and unescapable; the warning's only button cannot work, and the exit
    // confirm's "Continue test" used to fall through to the warning.
    expect(src).toMatch(
      /fullscreenSupported && showFullscreenWarning && !submitting/,
    );
    expect(src).toMatch(
      /fullscreenSupported && showFullscreenExitConfirm && !submitting/,
    );
  });

  it("does not run fullscreen recovery after a file picker on such a device", () => {
    const src = read(TAKE);
    const benign = src.slice(
      src.indexOf("const onBenignFullscreenLoss"),
      src.indexOf("const onBenignFullscreenLoss") + 900,
    );
    expect(
      /if \(!canEnterFullscreen\(\)\) return;/.test(benign),
      "A subjective question's image picker would otherwise end in setShowFullscreenWarning(true).",
    ).toBe(true);
  });

  it('lets "Continue test" return the learner to the paper rather than to the modal', () => {
    const src = read(TAKE);
    const cancel = src.slice(
      src.indexOf("const handleFullscreenExitCancel"),
      src.indexOf("const handleFullscreenExitCancel") + 900,
    );
    expect(cancel).toMatch(/!canEnterFullscreen\(\) \|\| isDocumentFullscreen\(\)/);
  });

  it("tells the learner plainly what applies instead, once, and dismissibly", () => {
    const src = read(TAKE);
    expect(src).toContain("Fullscreen is not available on this device");
    expect(src).toContain("fullscreenNoticeDismissed");
    // What REMAINS must be named, not implied: this is the "nothing may silently report an
    // unproctored attempt as a proctored one" rule applied to the learner's own screen.
    expect(src).toMatch(/leaving the app or switching tabs is still recorded/);
    expect(src).toMatch(/camera monitoring is running/);
  });

  it("sends the attempt's record the three fields the backend needs", () => {
    const submission = read("lib/hooks/useAssessmentSubmission.ts");
    for (const field of [
      "fullscreen_supported",
      "fullscreen_enforcement",
      "device_class",
    ]) {
      expect(
        submission.includes(field),
        `The transcript must carry "${field}". Without it an iPhone attempt (no fullscreen to ` +
          `leave) and a clean desktop attempt both arrive as fullscreen_exits: [].`,
      ).toBe(true);
    }
  });
});
