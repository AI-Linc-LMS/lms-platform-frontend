/**
 * Push-down pagination for a resume that does not fit one page.
 *
 * "If the contents are not coming in one page then let the user move to a second page."
 *
 * The rule the learner was given is: one page where it can, a second page when there is genuinely
 * too much to fit. Shrinking is tried first and has a legibility floor (see layout.ts); past it
 * the resume flows onto more pages instead of becoming unreadable.
 *
 * The mechanism is to move, never to cut. Anything that would straddle a page edge is pushed down
 * to the top of the next page, so the sheets can then be plain windows onto one continuous
 * document: page k shows the band [k x PAGE, (k+1) x PAGE) and, by construction, nothing crosses
 * the line. Slicing alone cannot do this - one horizontal cut has to be clean in every column at
 * once, and it cannot give page 2 a top margin or keep a heading with the entry it introduces.
 *
 * This only ever runs on a clone that React does not own. Inserting spacers into React's own DOM
 * would leave nodes it does not know about between siblings it does.
 */

/** A row shorter than this (an entry header: title left, dates right) moves as one block. */
const ROW_ATOMIC = 160;
/** A row taller than this is a column layout, and each column paginates independently. */
const TALL_ROW = 400;
/** Page 2 starts with a margin: the column's own padding, held between these. */
const MIN_MARGIN = 24;
const MAX_MARGIN = 40;
/** About three lines. A block this short above a break is a lead-in and follows its content. */
const HEADING_H = 64;
/** Stops, so that a document that cannot be laid out still renders something. */
const MAX_PAGES = 12;
const MAX_MOVES_PER_BOUNDARY = 40;

export interface PaginationResult {
  /** How many A4 sheets the document now occupies. */
  pages: number;
  /** Blocks taller than a page, which cannot be moved anywhere that helps. */
  unsplittable: number;
  /** Diagnostics for the tests and the lab harness. */
  moves: number;
}

/** The height of 297mm in this browser: 1122.52px, not 1123. By page 4 the difference is 2px. */
export function pageHeightPx(doc: Document = document): number {
  const probe = doc.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;height:297mm;width:1px;top:0;left:0";
  doc.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return h || 1122.52;
}

const isPaintedTag = (el: Element) => el.tagName === "IMG" || el.tagName === "svg" || el.tagName === "SVG";

function ownText(el: Element): boolean {
  return Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || "").trim().length > 0);
}

/**
 * Everything below works in px from the top of the document, measured with getBoundingClientRect
 * on a host that has no transform on it. Never call it on the displayed page, which is scaled.
 */
export function paginate(root: HTMLElement, pageHeight: number): PaginationResult {
  const topOf = () => root.getBoundingClientRect().top;
  const box = (el: Element) => {
    const r = el.getBoundingClientRect();
    const t = topOf();
    return { top: r.top - t, bottom: r.bottom - t, h: r.height };
  };
  const display = (el: Element) => getComputedStyle(el).display;
  const blockish = (el: Element) => {
    const d = display(el);
    return d !== "none" && d !== "contents" && !d.startsWith("inline") && d !== "table-cell";
  };
  const kids = (el: Element): HTMLElement[] =>
    Array.from(el.children).filter(
      (c): c is HTMLElement =>
        c instanceof HTMLElement &&
        // A spacer this pass inserted is not content. The first prototype counted its own spacers
        // as blocks to move and ran to 58 pages.
        !c.hasAttribute("data-page-spacer") &&
        blockish(c) &&
        c.getBoundingClientRect().height > 0.5,
    );
  const painted = (el: Element) => {
    if (ownText(el) || isPaintedTag(el)) return true;
    const cs = getComputedStyle(el);
    return (
      (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") ||
      cs.backgroundImage !== "none" ||
      parseFloat(cs.borderTopWidth) > 0 ||
      parseFloat(cs.borderBottomWidth) > 0 ||
      parseFloat(cs.borderLeftWidth) > 0
    );
  };
  const isRow = (el: Element) => {
    const cs = getComputedStyle(el);
    if (cs.display.includes("flex")) return !cs.flexDirection.startsWith("column");
    if (cs.display.includes("grid")) return cs.gridTemplateColumns.trim().split(/\s+/).length > 1;
    return false;
  };
  const isLeaf = (el: Element) => ownText(el) || isPaintedTag(el) || kids(el).length === 0;
  const isHeading = (el: Element) =>
    el.hasAttribute("data-resume-section-title") ||
    (!!el.querySelector("[data-resume-section-title]") && box(el).h <= 60);

  /** The column a block lives in: a template's sidebar, or the document itself. */
  function columnOf(el: HTMLElement): HTMLElement {
    let node: HTMLElement | null = el;
    while (node && node !== root) {
      const parent: HTMLElement | null = node.parentElement;
      if (parent && isRow(parent) && box(parent).h > TALL_ROW) return node;
      node = parent;
    }
    return root;
  }
  const clampMargin = (v: number) => Math.min(MAX_MARGIN, Math.max(MIN_MARGIN, v));
  function margins(el: HTMLElement) {
    const cs = getComputedStyle(columnOf(el));
    return {
      top: clampMargin(parseFloat(cs.paddingTop) || 0),
      bottom: clampMargin(parseFloat(cs.paddingBottom) || 0),
    };
  }

  /** Blocks sitting in the forbidden band around a page edge: [b - marginBottom, b + marginTop). */
  function collect(el: HTMLElement, boundary: number, out: HTMLElement[]): void {
    const r = box(el);
    const m = margins(el);
    if (r.bottom <= boundary - m.bottom + 0.5 || r.top >= boundary + m.top - 0.5) return;
    if (el !== root && isLeaf(el)) {
      if (painted(el)) out.push(el);
      return;
    }
    if (el !== root && isRow(el) && r.h <= ROW_ATOMIC) {
      out.push(el);
      return;
    }
    for (const kid of kids(el)) collect(kid, boundary, out);
  }

  /**
   * What actually moves. Usually not the offending line itself: a heading whose section starts on
   * the next page belongs with it, and a single last line of an entry should not be marooned at
   * the top of a page on its own.
   */
  function moveTarget(unit: HTMLElement, pageTop: number): HTMLElement {
    let target: HTMLElement = unit;
    const contentLimit = pageHeight - 2 * MAX_MARGIN;

    const parent: HTMLElement | null = unit.parentElement;
    if (parent && parent !== root && !(isRow(parent) && box(parent).h > ROW_ATOMIC)) {
      const siblings = kids(parent);
      const index = siblings.indexOf(unit);
      const cs = getComputedStyle(unit);
      const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      // A widow: the last line of an entry, alone at the top of the next page. Take the line
      // before it along.
      if (index >= 2 && index === siblings.length - 1 && box(unit).h <= 2 * lineHeight + 1) {
        target = siblings[index - 1];
      }
    }

    for (let guard = 0; guard < 12; guard += 1) {
      const p = target.parentElement;
      if (!p || p === root) break;
      if (isRow(p) && box(p).h > ROW_ATOMIC) break; // never climb out of a column
      const siblings = kids(p);
      const index = siblings.indexOf(target);
      const pb = box(p);
      if (pb.h > contentLimit || pb.top < pageTop + margins(p).top + 0.5) break;
      if (index === 0) {
        target = p; // first child: move the parent, so its padding and border go with it
        continue;
      }
      const prev = siblings[index - 1];
      if (index === 1 && (isHeading(prev) || box(prev).h <= HEADING_H)) {
        target = p; // keep-with-next: a section title or entry header leads its content
        continue;
      }
      break;
    }
    return target;
  }

  /** Move `el` down so its top lands on `target`, and check that it landed. */
  function push(el: HTMLElement, target: number): number {
    const distance = target - box(el).top;
    if (distance <= 0.5) return 0;
    const parent = el.parentElement;
    if (!parent) return 0;
    const parentDisplay = display(parent);

    if (parentDisplay.includes("flex") || parentDisplay.includes("grid")) {
      // Flex and grid margins do not collapse, and a spacer element in a row would become a
      // horizontal item sitting next to its siblings.
      const current = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.setProperty("margin-top", `${current + distance}px`, "important");
      const miss = target - box(el).top;
      if (Math.abs(miss) > 0.5) {
        el.style.setProperty("margin-top", `${current + distance + miss}px`, "important");
      }
      return distance;
    }

    // Block flow: a spacer, then a correction, because inserting it stops the neighbouring
    // margins from collapsing into each other and the first attempt overshoots by that much.
    const spacer = document.createElement("div");
    spacer.setAttribute("data-page-spacer", "");
    spacer.style.cssText = `height:${distance}px;margin:0;padding:0;border:0`;
    parent.insertBefore(spacer, el);
    for (let i = 0; i < 3; i += 1) {
      const miss = target - box(el).top;
      if (Math.abs(miss) <= 0.5) break;
      spacer.style.height = `${Math.max(0, parseFloat(spacer.style.height) + miss)}px`;
    }
    return distance;
  }

  function inkBottom(): number {
    let bottom = 0;
    const top = topOf();
    for (const node of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      const cs = getComputedStyle(node);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
      if (!ownText(node) && !isPaintedTag(node)) continue;
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      bottom = Math.max(bottom, r.bottom - top);
    }
    return bottom;
  }

  let moves = 0;
  const unsplittable = new Set<HTMLElement>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const boundary = page * pageHeight;
    if (inkBottom() <= boundary) break;

    for (let attempt = 0; attempt < MAX_MOVES_PER_BOUNDARY; attempt += 1) {
      const units: HTMLElement[] = [];
      collect(root, boundary, units);
      const todo = units.filter((u) => box(u).top < boundary + margins(u).top - 0.5);
      if (!todo.length) break;

      let movedSomething = false;
      for (const unit of todo) {
        const pageTop = (page - 1) * pageHeight;
        // Already at the top of its own page and still crossing the next edge: taller than a page.
        // Moving it again would only loop.
        if ((box(unit).top <= pageTop + margins(unit).top + 0.5 && page > 1) || box(unit).top <= 0.5) {
          unsplittable.add(unit);
          continue;
        }
        const target = moveTarget(unit, pageTop);
        if (push(target, boundary + margins(target).top) > 0) {
          moves += 1;
          movedSomething = true;
          break; // re-measure: one move changes everything below it
        }
      }
      if (!movedSomething) break;
    }
  }

  const ink = inkBottom();
  const pages = Math.max(1, Math.min(MAX_PAGES, Math.ceil((ink - 0.5) / pageHeight)));
  // Every full-height sidebar and column rule stretches to the bottom of the last sheet.
  root.style.setProperty("min-height", `${pages * pageHeight}px`, "important");
  return { pages, unsplittable: unsplittable.size, moves };
}

/**
 * Anything still crossing a page edge. Always empty after paginate() on the twelve templates;
 * exported so a test can assert that rather than trust it.
 */
export function pageBreakViolations(root: HTMLElement, pageHeight: number, pages: number): string[] {
  const top = root.getBoundingClientRect().top;
  const out: string[] = [];
  for (const node of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (node.hasAttribute("data-page-spacer")) continue;
    const cs = getComputedStyle(node);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    if (!ownText(node) && !isPaintedTag(node)) continue;
    const r = node.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    for (let k = 1; k < pages; k += 1) {
      const b = k * pageHeight;
      if (r.top - top < b - 0.5 && r.bottom - top > b + 0.5) {
        out.push(`page ${k}: ${(node.textContent || "").trim().slice(0, 40)}`);
      }
    }
  }
  return out;
}
