/**
 * Switching the IDE's language.
 *
 * Reported: "java ide to python ide - template change nahi ho raha inside ide when i say ai
 * tutor to switch language in ide". The tutor did call open_ide with the new language, and the
 * label, the syntax highlighting and the run target all followed it. The CODE did not, because
 * IdePanel refuses to seed a scaffold over a non-empty buffer - a guard added so a second
 * open_ide could not wipe work in progress. Across a language change it left Java sitting in a
 * panel labelled Python.
 */

import { describe, expect, it } from "vitest";
import { languageKey, swapBufferForLanguage } from "./tutorIdeBuffers";

const swap = (over: Partial<Parameters<typeof swapBufferForLanguage>[0]> = {}) =>
  swapBufferForLanguage({
    wasOpen: true,
    previousLanguage: "java",
    nextLanguage: "python",
    currentBuffer: "public class Main { }",
    buffers: {},
    ...over,
  });

describe("switching the editor's language", () => {
  it("clears the buffer so the new language's scaffold can land", () => {
    // The reported bug, as a unit. Empty is what lets IdePanel seed.
    expect(swap().buffer).toBe("");
    expect(swap().switched).toBe(true);
  });

  it("keeps the old language's work rather than discarding it", () => {
    expect(swap().buffers.java).toBe("public class Main { }");
  });

  it("gives it back when the learner switches back", () => {
    const first = swap();
    const back = swapBufferForLanguage({
      wasOpen: true,
      previousLanguage: "python",
      nextLanguage: "java",
      currentBuffer: "print('hi')",
      buffers: first.buffers,
    });
    expect(back.buffer).toBe("public class Main { }");
    expect(back.buffers.python).toBe("print('hi')");
  });

  it("leaves a SAME-language reopen alone, which is what the guard was for", () => {
    // A second exercise in Python must not wipe what they are halfway through.
    const r = swap({ previousLanguage: "python", currentBuffer: "half = 'written'" });
    expect(r.switched).toBe(false);
    expect(r.buffer).toBe("half = 'written'");
  });

  it("treats Python, python and ' PYTHON ' as one language", () => {
    expect(languageKey(" PYTHON ")).toBe("python");
    expect(swap({ previousLanguage: "Python", nextLanguage: "python " }).switched).toBe(false);
  });

  it("does not stash an untouched buffer over real work", () => {
    // Bounce java -> python -> java without typing anything in python. The java work has to
    // survive, so the empty python buffer must not be written to the stash as if it were work.
    const toPython = swap();
    const backToJava = swapBufferForLanguage({
      wasOpen: true,
      previousLanguage: "python",
      nextLanguage: "java",
      currentBuffer: "   ",
      buffers: toPython.buffers,
    });
    expect(backToJava.buffer).toBe("public class Main { }");
    expect(backToJava.buffers.python).toBeUndefined();
  });

  it("does nothing on the first open, when there is no previous language", () => {
    const r = swap({ wasOpen: false, currentBuffer: "" });
    expect(r.switched).toBe(false);
    expect(r.buffer).toBe("");
  });
});
