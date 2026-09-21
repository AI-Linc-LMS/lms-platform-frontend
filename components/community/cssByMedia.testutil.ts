/**
 * The CSS Emotion emitted for one element, split by where it applies.
 *
 * Emotion writes its rules as text into <style> tags outside production. A phone-only rule sits
 * inside `@media (max-width:599.95px)` (theme.breakpoints.down("sm")). A `{ xs, sm }` value puts
 * its xs half inside `@media (min-width:0px)` - which matches every screen - and its sm half
 * inside `@media (min-width:600px)`.
 *
 *  - `base`: rules that apply at every width: the top level plus `(min-width:0px)` blocks.
 *  - `phone`: rules inside the max-width:599.95px block - they reach a phone and nothing else.
 *  - `desktop`: rules inside `(min-width:600px)` and wider blocks - sm and up only.
 *  - `unscoped`: every rule outside the phone block, i.e. everything a desktop browser can see.
 *    A phone-only size must never appear here.
 */
const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";

function rulesFor(classes: string[], text: string): string {
  return classes
    .flatMap((c) => text.split(/(?=\.css-)/).filter((chunk) => chunk.startsWith(`.${c}`)))
    .join("\n");
}

export function cssByMedia(el: Element): { base: string; phone: string; desktop: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-"));

  let base = sheets.replace(MEDIA_BLOCK, "");
  let phone = "";
  let desktop = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) {
    const query = m[1].trim();
    const minWidth = /^\(min-width:(\d+)px\)$/.exec(query);
    if (query === PHONE_QUERY) phone += `\n${m[2]}`;
    else if (minWidth && Number(minWidth[1]) === 0) base += `\n${m[2]}`;
    else if (minWidth) desktop += `\n${m[2]}`;
  }
  const withoutPhone = sheets.replace(MEDIA_BLOCK, (block, query: string) =>
    query.trim() === PHONE_QUERY ? "" : block,
  );

  return {
    base: rulesFor(classes, base),
    phone: rulesFor(classes, phone),
    desktop: rulesFor(classes, desktop),
    unscoped: rulesFor(classes, withoutPhone),
  };
}
