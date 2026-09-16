/**
 * Which sections a resume shows, in which order, and in which column.
 *
 * "[Resume Builder] No option for reordering the sections."
 *
 * There was drag code in the form and a SectionManager component, but nothing rendered a handle
 * and nothing read the order they produced: dragging did nothing, and every template rendered its
 * sections in the order written into its own file.
 *
 * The decision behind this (2026-09-07) was that reordering is universal - any template can carry
 * any section in any order, and the two-column templates must accept an arbitrary order rather
 * than a fixed split. So the order is ONE list that belongs to the learner, not to the template,
 * and a section can be moved to the other column where the template has two.
 *
 * It is applied to the document rather than built into twelve templates: every template marks its
 * section blocks with `data-resume-section` and its columns with `data-resume-column`, and the
 * blocks are moved. That keeps one implementation instead of twelve, and it works on the copy the
 * layout is measured on, so the page count already accounts for the learner's arrangement.
 */

export const SECTION_IDS = [
  "summary",
  "workExperience",
  "education",
  "skills",
  "projects",
  "certifications",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type ColumnName = "main" | "side";

export interface ResumeLayout {
  v: 1;
  /** null means "however this template orders them", so nothing changes until a learner asks. */
  order: SectionId[] | null;
  hidden: SectionId[];
  /** Column overrides, per template: columns belong to the template, the order does not. */
  columns: Record<string, Partial<Record<SectionId, ColumnName>>>;
}

export const EMPTY_LAYOUT: ResumeLayout = { v: 1, order: null, hidden: [], columns: {} };

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  workExperience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

/** Never throw on stored data: an old or hand-edited layout must degrade, not break the builder. */
export function normalizeLayout(raw: unknown): ResumeLayout {
  const input = (raw ?? {}) as Partial<ResumeLayout>;
  const known = new Set<string>(SECTION_IDS);
  let order: SectionId[] | null = null;
  if (Array.isArray(input.order)) {
    const seen = new Set<SectionId>();
    order = input.order.filter((id): id is SectionId => known.has(id as string) && !seen.has(id as SectionId) && !!seen.add(id as SectionId));
    // Anything the stored order does not mention keeps its place at the end rather than vanishing.
    for (const id of SECTION_IDS) if (!seen.has(id)) order.push(id);
  }
  const hidden = Array.isArray(input.hidden)
    ? Array.from(new Set(input.hidden.filter((id): id is SectionId => known.has(id as string))))
    : [];
  const columns: ResumeLayout["columns"] = {};
  if (input.columns && typeof input.columns === "object") {
    for (const [template, map] of Object.entries(input.columns)) {
      if (!map || typeof map !== "object") continue;
      const entries = Object.entries(map).filter(
        ([id, col]) => known.has(id) && (col === "main" || col === "side"),
      ) as Array<[SectionId, ColumnName]>;
      if (entries.length) columns[template] = Object.fromEntries(entries);
    }
  }
  return { v: 1, order, hidden, columns };
}

/** The order as a full list, starting from what the template itself does. */
export function resolveOrder(layout: ResumeLayout, templateOrder: SectionId[]): SectionId[] {
  if (!layout.order) return templateOrder;
  const extra = templateOrder.filter((id) => !layout.order!.includes(id));
  return [...layout.order.filter((id) => templateOrder.includes(id)), ...extra];
}

export function moveSection(layout: ResumeLayout, order: SectionId[], id: SectionId, delta: number): ResumeLayout {
  const from = order.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return layout;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return { ...layout, order: next };
}

export function toggleHidden(layout: ResumeLayout, id: SectionId): ResumeLayout {
  const hidden = layout.hidden.includes(id)
    ? layout.hidden.filter((h) => h !== id)
    : [...layout.hidden, id];
  return { ...layout, hidden };
}

export function setColumn(layout: ResumeLayout, template: string, id: SectionId, column: ColumnName): ResumeLayout {
  return {
    ...layout,
    columns: { ...layout.columns, [template]: { ...(layout.columns[template] ?? {}), [id]: column } },
  };
}

/** Drop this template's column overrides and the shared order and hidden list. */
export function resetLayout(): ResumeLayout {
  return { ...EMPTY_LAYOUT };
}

const storageKey = (clientId: string | number | undefined) => `resume_layout_v1_${clientId ?? "default"}`;

export function loadLayout(clientId?: string | number): ResumeLayout {
  if (typeof window === "undefined") return EMPTY_LAYOUT;
  try {
    const raw = window.localStorage.getItem(storageKey(clientId));
    return raw ? normalizeLayout(JSON.parse(raw)) : EMPTY_LAYOUT;
  } catch {
    // Private browsing, cleared site data, a browser that blocks storage: an arrangement is a
    // convenience, and losing it must never stop the builder from rendering.
    return EMPTY_LAYOUT;
  }
}

export function saveLayout(layout: ResumeLayout, clientId?: string | number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(clientId), JSON.stringify(layout));
  } catch {
    /* see loadLayout */
  }
}

/** What the document itself says: which sections it has, in which column, in what order. */
export interface DocumentSections {
  order: SectionId[];
  columns: Partial<Record<SectionId, ColumnName>>;
  /** Column containers, when the template has two. */
  hasColumns: boolean;
}

export function readDocumentSections(root: HTMLElement): DocumentSections {
  const order: SectionId[] = [];
  const columns: Partial<Record<SectionId, ColumnName>> = {};
  const hasColumns = root.querySelectorAll("[data-resume-column]").length > 1;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-resume-section]"))) {
    const id = el.dataset.resumeSection as SectionId | undefined;
    if (!id || !SECTION_IDS.includes(id)) continue;
    if (!order.includes(id)) order.push(id);
    const column = el.closest<HTMLElement>("[data-resume-column]")?.dataset.resumeColumn;
    if (column === "main" || column === "side") columns[id] = column;
  }
  return { order, columns, hasColumns };
}

/**
 * Rearrange a COPY of the document to match the layout.
 *
 * Only ever called on a copy. Moving nodes inside React's own tree would leave it reconciling
 * against a DOM it did not build.
 */
export function applySectionLayout(root: HTMLElement, layout: ResumeLayout, template: string): void {
  const blocks = new Map<SectionId, HTMLElement[]>();
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-resume-section]"))) {
    const id = el.dataset.resumeSection as SectionId | undefined;
    if (!id || !SECTION_IDS.includes(id)) continue;
    // A section can be more than one block - Western and Two Column both split skills in two -
    // and the blocks of one section always travel together.
    blocks.set(id, [...(blocks.get(id) ?? []), el]);
  }
  if (!blocks.size) return;

  for (const id of layout.hidden) {
    for (const el of blocks.get(id) ?? []) el.remove();
    blocks.delete(id);
  }

  const columnEls = new Map<ColumnName, HTMLElement>();
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-resume-column]"))) {
    const name = el.dataset.resumeColumn;
    if ((name === "main" || name === "side") && !columnEls.has(name)) columnEls.set(name, el);
  }

  // Move whole sections between columns where the learner asked and the template has two.
  const wanted = layout.columns[template] ?? {};
  if (columnEls.size > 1) {
    for (const [id, column] of Object.entries(wanted) as Array<[SectionId, ColumnName]>) {
      const target = columnEls.get(column);
      const els = blocks.get(id);
      if (!target || !els?.length) continue;
      if (els[0].closest("[data-resume-column]") === target) continue;
      for (const el of els) {
        target.appendChild(el);
        recolourForColumn(el, target);
      }
    }
  }

  // Order within each column. Sections keep the SLOTS the template gave them, so a heading that
  // sits between two sections, or a contact panel pinned to the top of a column, stays where it is.
  const order = layout.order;
  if (!order) return;

  // Modern, Right Sidebar and Creative write the summary INSIDE the name header, so it has no
  // siblings to be ordered against and "move down" did nothing at all. Once a learner arranges
  // anything, such a section is lifted to the top of its column, where it can take part. Until
  // then every template renders exactly as its author wrote it.
  for (const [id, els] of blocks) {
    for (const el of els) {
      const parent = el.parentElement;
      if (!parent || parent.hasAttribute("data-resume-column")) continue;
      const column = el.closest<HTMLElement>("[data-resume-column]") ?? root;
      const alone = !Array.from(parent.children).some(
        (c) => c !== el && c instanceof HTMLElement && c.dataset.resumeSection,
      );
      const columnHasOthers = Array.from(column.querySelectorAll<HTMLElement>("[data-resume-section]")).some(
        (c) => c.dataset.resumeSection !== id,
      );
      if (!alone || !columnHasOthers) continue;
      // After the header block it was written into, so the name still comes first.
      const anchor = parent.closest<HTMLElement>("[data-resume-column] > *") ?? parent;
      anchor.parentElement?.insertBefore(el, anchor.nextSibling);
    }
  }
  const containers = new Set<HTMLElement>();
  for (const els of blocks.values()) {
    for (const el of els) {
      const parent = el.parentElement;
      if (parent) containers.add(parent);
    }
  }
  for (const parent of containers) {
    const present = Array.from(parent.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && !!c.dataset.resumeSection,
    );
    if (present.length < 2) continue;
    const slots = present.map((el) => {
      const marker = document.createComment("");
      el.parentElement?.insertBefore(marker, el);
      return marker;
    });
    const sorted = [...present].sort((a, b) => {
      const ai = order.indexOf(a.dataset.resumeSection as SectionId);
      const bi = order.indexOf(b.dataset.resumeSection as SectionId);
      return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
    });
    sorted.forEach((el, i) => {
      const marker = slots[i];
      marker.parentElement?.insertBefore(el, marker);
    });
    slots.forEach((marker) => marker.remove());
  }
}

/**
 * A section written for a white column is unreadable in a dark one: the templates hard-code their
 * colours, and in Modern the main column's text colour is literally the sidebar's background.
 *
 * Rather than rewrite every block for both columns, the destination column's own colours are bound
 * to the tokens the blocks already use, so a moved section takes on the colours of where it lands.
 */
function recolourForColumn(el: HTMLElement, column: HTMLElement): void {
  const cs = getComputedStyle(column);
  const fg = rgbParts(cs.color);
  const bg = opaqueBackground(column);
  if (!fg || !bg) return;
  const fade = (alpha: number) => `rgba(${fg[0]}, ${fg[1]}, ${fg[2]}, ${alpha})`;
  // Plain rgba, not color-mix: the PDF is rasterised by a library that has to parse every colour
  // it meets, and the fewer modern colour functions it is handed, the fewer ways that can fail.
  el.style.setProperty("--font-primary", fade(1));
  el.style.setProperty("--font-secondary", fade(0.78));
  el.style.setProperty("--font-tertiary", fade(0.62));
  el.style.setProperty("--font-light", fade(1));
  el.style.setProperty("--background", bg);
  el.style.setProperty("--surface", bg);
  el.style.setProperty("--card-bg", bg);
  el.style.setProperty("--border-default", fade(0.28));
  el.style.color = fade(1);
}

/** The r, g, b of a computed colour, whatever syntax the browser reports it in. */
function rgbParts(colour: string): [number, number, number] | null {
  const numbers = colour.match(/[\d.]+/g);
  if (!numbers || numbers.length < 3) return null;
  const [r, g, b] = numbers.slice(0, 3).map(Number);
  // `color(srgb 1 1 1 / .78)` reports components as fractions; rgb() reports them as 0-255.
  const scale = colour.startsWith("color(") ? 255 : 1;
  return [Math.round(r * scale), Math.round(g * scale), Math.round(b * scale)];
}

/** The nearest painted background behind an element: a transparent column inherits its parent's. */
function opaqueBackground(el: HTMLElement): string {
  let node: HTMLElement | null = el;
  while (node) {
    const cs = getComputedStyle(node);
    if (cs.backgroundImage && cs.backgroundImage !== "none") return cs.backgroundColor === "rgba(0, 0, 0, 0)" ? "transparent" : cs.backgroundColor;
    if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") {
      return cs.backgroundColor;
    }
    node = node.parentElement;
  }
  return "";
}
