/**
 * Turning article HTML into something a voice can read, and into BLOCKS the page can
 * follow along with.
 *
 * Read aloud used to flatten the whole article into one string and hand it to the
 * synthesiser in 3500-character chunks. That is fine for the ears and useless for the
 * eyes: nothing anywhere related a moment of audio to a place on the page, so the
 * learner had to scroll by hand to keep up with a voice that was already three
 * paragraphs ahead. The reported bug ("the read aloud feature is not synchronised with
 * the scrolling") is that missing relation, not a scrolling bug.
 *
 * The position data we have decides what is honest to build. The voice is OpenAI's
 * `onyx` via /api/tts (see app/api/tts/route.ts), which returns an mp3 and NO word or
 * sentence timings - an <audio> element gives `currentTime` and `duration` and nothing
 * else. Timing marks cannot be invented, so the only way to know where the voice is, is
 * to make the AUDIO FILE the unit: cut the article at block boundaries and synthesise
 * each piece separately. A chunk that holds exactly one block is then exact by
 * construction - its whole duration IS that block - and needs no estimate at all.
 *
 * Only short blocks (a heading, a list item) are grouped, and only up to CHUNK_CAP
 * characters, so the one place an estimate is used is inside a chunk of a few seconds
 * of short items where being a beat early moves the highlight by one list row. The
 * browser-speech fallback does better still: speechSynthesis reports boundaries, so
 * each block gets its own utterance and its start is observed rather than estimated.
 */

/** Symbols a learner needs to HEAR, applied before the generic punctuation pass below
 *  (which would otherwise consume the "." in `self.` and make that rule unreachable). */
const CODE_SPEECH: Array<[RegExp, string]> = [
  [/->/g, " arrow "],
  [/<=/g, " less than or equal to "],
  [/>=/g, " greater than or equal to "],
  [/!==?/g, " not equals "],
  [/===?/g, " equals "],
];

/** Turn one inline code node into something speakable: `range()` -> "range",
 *  `snake_case` -> "snake case", `arr.length` -> "arr dot length". */
export function speakInlineCode(raw: string): string {
  const t = raw.trim();
  if (!t) return " ";
  // A long or multi-line "inline" node is really a block in disguise - announce it.
  if (t.length > 60 || t.includes("\n")) return " a code snippet shown on screen ";
  let s = t.replace(/\(\s*\)$/, "");
  for (const [re, word] of CODE_SPEECH) s = s.replace(re, word);
  s = s.replace(/_/g, " ");
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  s = s.replace(/([A-Za-z_)\]])\.([A-Za-z_])/g, "$1 dot $2");
  s = s.replace(/\//g, " slash ");
  return ` ${s} `;
}

/** Tidy one run of spoken text: collapse whitespace and close the gap a padded code
 *  node leaves before punctuation ("O(n) , where" reads with an audible stumble). */
export function tidySpeech(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

/**
 * Rewrite a DETACHED copy of article markup into speech.
 *
 * Block code is ANNOUNCED, never read: a 30-line <pre> spoken character by character is
 * unlistenable. Inline code carries meaning mid-sentence, so it is read - the two need
 * opposite treatment and the source distinguishes them (block code is `<pre data-lang>`).
 * Mutates the node it is given, which is why callers pass a clone.
 */
export function rewriteForSpeech(scope: HTMLElement): void {
  // Must run before the inline pass below, so that pass can only match true inline nodes.
  scope.querySelectorAll("pre").forEach((pre) => {
    const codeEl = pre.querySelector("code");
    const lang = (pre.getAttribute("data-lang") || codeEl?.getAttribute("data-lang") || "").trim();
    const lines = (pre.textContent || "").trim().split("\n").filter(Boolean).length;
    const announce = ` Here is ${lang ? `a ${lang}` : "a"} code example, ${lines} line${lines === 1 ? "" : "s"}, shown on screen. `;
    // Replace the CONTENTS, not the element: the <pre> is a narration block in its own
    // right and dropping it would take its data-narrate-id with it.
    pre.textContent = announce;
  });

  scope.querySelectorAll("code").forEach((c) => {
    c.replaceWith(scope.ownerDocument.createTextNode(speakInlineCode(c.textContent || "")));
  });

  // Images carry no text; the caption beside them is prose the learner should hear.
  scope.querySelectorAll("figure > img, figure > picture, svg").forEach((el) => el.remove());

  // A <br> is a line break the eye sees and textContent does not, so "line one<br>line two"
  // came out as one run-on word.
  scope.querySelectorAll("br").forEach((el) => el.replaceWith(scope.ownerDocument.createTextNode(" ")));
}

/** Exported for tests: what the learner actually hears, given the article HTML. */
export function htmlToText(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  rewriteForSpeech(tmp);

  // textContent concatenates without regard for block boundaries, so "<h2>Loops</h2><p>A loop"
  // came out as "LoopsA loop" and was narrated as one run-on word. Separate the blocks.
  tmp.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, div, tr, blockquote, section")
    .forEach((el) => el.after(document.createTextNode(" ")));

  return tidySpeech(tmp.textContent || "");
}

/** Split into synthesis chunks. The FIRST chunk is deliberately short: the learner
 *  waits for it in silence, and a 3500-character first chunk is what made Read aloud
 *  feel like it had not responded (which is what got it clicked again). Exported for tests. */
export function chunkText(text: string, first = 400, rest = 3500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  const max = () => (chunks.length === 0 ? first : rest);
  for (const s of sentences) {
    if ((cur + s).length > max()) {
      if (cur.trim()) chunks.push(cur.trim());
      if (s.length > max()) {
        const size = max();
        for (let i = 0; i < s.length; i += size) chunks.push(s.slice(i, i + size).trim());
        cur = "";
      } else {
        cur = s;
      }
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

/** One block of the article: the element the learner should be looking at, and the
 *  words that belong to it. `id` is the element's `data-narrate-id`. */
export type NarrationSegment = { id: string; text: string };

/** Elements that can stand alone on the page. A leaf one - no block inside it - is a
 *  unit of speech; a container is descended into instead. */
const BLOCK_SELECTOR =
  "p,h1,h2,h3,h4,h5,h6,li,pre,blockquote,figure,tr,dd,dt,div,section,article,aside,ul,ol,table,tbody,thead,tfoot";

export const NARRATE_ATTR = "data-narrate-id";
export const NARRATING_ATTR = "data-narrating";

/**
 * Mark every leaf block under `root` with a stable `data-narrate-id` and return the
 * spoken text of each, in reading order.
 *
 * Text that sits in a container but in no leaf block (loose text beside a <p>, say) is
 * appended to the block before it rather than dropped: the voice must still say
 * everything `htmlToText` would have said. That is why this attributes text nodes to
 * blocks instead of picking blocks and reading them independently - the second shape
 * silently loses whatever the selector missed.
 */
export function buildNarrationSegments(root: HTMLElement): NarrationSegment[] {
  const all = Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));
  let n = 0;
  for (const el of all) {
    if (el.querySelector(BLOCK_SELECTOR)) continue; // a container, not a unit of speech
    el.setAttribute(NARRATE_ATTR, `ns-${n}`);
    n += 1;
  }
  if (n === 0) return [];

  // Speech rewriting is destructive (block code is replaced by an announcement), so it
  // runs on a copy. The copy carries the ids, which is what ties it back to the page.
  const copy = root.cloneNode(true) as HTMLElement;
  rewriteForSpeech(copy);

  const segments: NarrationSegment[] = [];
  let pending = "";
  const walker = copy.ownerDocument.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) continue;
    const owner = (node.parentElement as HTMLElement | null)?.closest<HTMLElement>(`[${NARRATE_ATTR}]`);
    const id = owner?.getAttribute(NARRATE_ATTR) ?? null;
    if (!id) {
      // Loose text: it belongs to whatever block was last spoken, or prefixes the next.
      if (segments.length) segments[segments.length - 1].text += ` ${raw}`;
      else pending += ` ${raw}`;
      continue;
    }
    const last = segments[segments.length - 1];
    if (last && last.id === id) last.text += raw;
    else segments.push({ id, text: `${pending}${pending ? " " : ""}${raw}` });
    if (pending) pending = "";
  }

  return segments
    .map((s) => ({ id: s.id, text: tidySpeech(s.text) }))
    .filter((s) => s.text.length > 0);
}

/** One request to the synthesiser, and the blocks its audio covers. */
export type SpeechChunk = {
  text: string;
  /** In reading order. `weight` is the share of the chunk's duration this block is taken
   *  to occupy - its characters plus a fixed allowance for the pause at a block end.
   *  `text` is kept so the browser-speech fallback can give each block its own
   *  utterance, where the start is OBSERVED rather than apportioned. */
  parts: Array<{ id: string; text: string; weight: number }>;
};

/** A block boundary is a beat of silence the character count cannot see. Without it a
 *  two-word heading grouped with a long list item is given ~3% of the audio and the
 *  highlight leaves it almost immediately. */
const PAUSE_PAD = 14;

/** Chunk sizing. `STANDALONE` is the important one: any block at least this long gets its
 *  OWN audio file, so the blocks a learner spends most of the time on are exact rather
 *  than estimated. `FIRST` keeps the opening wait short - it is the silence the learner
 *  sits through before anything plays. */
export const CHUNK_FIRST = 260;
export const CHUNK_CAP = 450;
export const CHUNK_STANDALONE = 170;
/** /api/tts refuses more than 4000 characters; stay clear of it. */
const CHUNK_HARD_MAX = 3500;

/** Group blocks into synthesis chunks WITHOUT ever splitting one across two audio files. */
export function chunkSegments(
  segments: NarrationSegment[],
  opts: { first?: number; cap?: number; standalone?: number } = {},
): SpeechChunk[] {
  const first = opts.first ?? CHUNK_FIRST;
  const cap = opts.cap ?? CHUNK_CAP;
  const standalone = opts.standalone ?? CHUNK_STANDALONE;

  const chunks: SpeechChunk[] = [];
  let cur: SpeechChunk | null = null;
  const flush = () => {
    if (cur && cur.text.trim()) chunks.push({ text: cur.text.trim(), parts: cur.parts });
    cur = null;
  };

  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;

    // A block longer than the route allows is the only case where one block spans more
    // than one audio file; every piece still points at the same element.
    if (text.length > CHUNK_HARD_MAX) {
      flush();
      for (const piece of chunkText(text, CHUNK_HARD_MAX, CHUNK_HARD_MAX)) {
        chunks.push({ text: piece, parts: [{ id: seg.id, text: piece, weight: piece.length + PAUSE_PAD }] });
      }
      continue;
    }

    const max = chunks.length === 0 ? first : cap;
    if (cur && (cur as SpeechChunk).text.length + 1 + text.length > max) flush();
    if (!cur) cur = { text: "", parts: [] };
    const c = cur as SpeechChunk;
    c.text = c.text ? `${c.text} ${text}` : text;
    c.parts.push({ id: seg.id, text, weight: text.length + PAUSE_PAD });
    // A block big enough to matter is never grouped with what follows it.
    if (text.length >= standalone) flush();
  }
  flush();
  return chunks;
}

/**
 * Which block a chunk is on, `progress` of the way through its audio.
 *
 * For the single-block chunk this is a constant - the answer is exact and no estimate is
 * made. For a group of short blocks it apportions the measured duration by weight, which
 * is the only thing an mp3 with no timing marks allows.
 */
export function chunkBlockAt(chunk: SpeechChunk, progress: number): string {
  const parts = chunk.parts;
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].id;
  const total = parts.reduce((a, b) => a + b.weight, 0);
  const target = Math.max(0, Math.min(1, progress)) * total;
  let acc = 0;
  for (const p of parts) {
    acc += p.weight;
    if (target <= acc) return p.id;
  }
  return parts[parts.length - 1].id;
}
