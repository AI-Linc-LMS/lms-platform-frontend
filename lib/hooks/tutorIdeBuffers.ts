/**
 * Which code the editor should hold when the tutor reopens it.
 *
 * The room has ONE editor buffer. `IdePanel` will not seed a scaffold over a non-empty buffer,
 * because a second `open_ide` used to wipe whatever the learner was halfway through typing.
 * That guard is right for another exercise in the same language and wrong across a language
 * change: asked to switch the IDE from Java to Python, the tutor reopens it with `language:
 * "python"` and a Python scaffold, the buffer still holds Java, and the learner is looking at a
 * panel labelled Python full of Java that cannot compile. Reported as the template not changing.
 *
 * Java is not the learner's in-progress Python work. But it is still their work, so it is put
 * away under its own language rather than thrown out, and comes back if they switch back.
 *
 * Pure on purpose: the room owns the state, this owns the decision, and the decision is the
 * part worth testing.
 */

export type IdeBuffers = Record<string, string>;

export interface BufferSwap {
  /** What the editor should now contain. Empty means "let the scaffold seed". */
  buffer: string;
  /** The stash to keep, with the outgoing language's work folded in. */
  buffers: IdeBuffers;
  /** Whether anything moved. False means the caller can leave the buffer alone entirely. */
  switched: boolean;
}

/** Languages are free text from the model: "Python", "python ", "PYTHON" are one language. */
export function languageKey(language: string): string {
  return (language ?? "").trim().toLowerCase();
}

export function swapBufferForLanguage({
  wasOpen,
  previousLanguage,
  nextLanguage,
  currentBuffer,
  buffers,
}: {
  wasOpen: boolean;
  previousLanguage: string;
  nextLanguage: string;
  currentBuffer: string;
  buffers: IdeBuffers;
}): BufferSwap {
  const from = languageKey(previousLanguage);
  const to = languageKey(nextLanguage);

  // Opening for the first time, or reopening in the same language. Leave the buffer alone:
  // this is the case the no-clobber guard exists for.
  if (!wasOpen || from === to) {
    return { buffer: currentBuffer, buffers, switched: false };
  }

  const next: IdeBuffers = { ...buffers };
  // Only keep something worth keeping. Stashing "" would overwrite real work if the learner
  // bounced through an untouched language on the way back.
  if (currentBuffer.trim()) next[from] = currentBuffer;
  else delete next[from];

  return { buffer: next[to] ?? "", buffers: next, switched: true };
}
