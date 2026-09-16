"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Box, Typography } from "@mui/material";
import { decideLayout, inkHeight, legibilityFloor, smallTextPx, type Layout } from "./layout";
import { pageHeightPx, paginate } from "./paginate";
import {
  applySectionLayout,
  EMPTY_LAYOUT,
  readDocumentSections,
  type DocumentSections,
  type ResumeLayout,
} from "./sectionLayout";
import { PAGE_WIDTH_PX, PAGE_HEIGHT_PX, pageSurfaceSx } from "./pageStyles";

/**
 * Lays the resume out over as many A4 sheets as it needs, and shows them.
 *
 * Three rules come out of what went wrong before:
 *
 * The document is never measured where it is displayed. The preview shrinks the page to fit the
 * window, getBoundingClientRect reports screen pixels, and measuring through that shrink is what
 * grew pages that were already too long. So the template is rendered once into an offscreen copy
 * at a true 210mm, and that is the only thing measured.
 *
 * What is displayed is never what React owns. Pagination inserts spacers and margins, and doing
 * that inside React's own tree leaves it reconciling against nodes it never created. React renders
 * the template offscreen; the sheets show copies.
 *
 * The preview and the PDF come from the same copy, so the download cannot disagree with what the
 * learner is looking at - which it did, differently at every window width.
 */

export interface ResumeDocument {
  /** The laid-out document, detached from the page. Copy it; never adopt it. */
  flow: HTMLElement | null;
  pages: number;
  mode: Layout["mode"];
  /** Applied when the whole resume fits one page after a small shrink, or a grow. */
  scale: number;
  /** Layout width as a percentage of the page, which compensates that scale. */
  widthPct: number;
}

export interface PagedResumeHandle {
  getDocument(): ResumeDocument;
}

interface PagedResumeProps {
  children: React.ReactNode;
  /** The learner's arrangement: order, hidden sections, and which column each one sits in. */
  layout?: ResumeLayout;
  /** Which template is showing, because column placement is per template. */
  template: string;
  /** Told the page count and fit whenever they change, for the toolbar. */
  onLayout?: (doc: Pick<ResumeDocument, "pages" | "mode" | "scale">) => void;
  /** Told what sections this template actually has, and where it puts them, for the panel. */
  onDocumentSections?: (sections: DocumentSections) => void;
}

const hostSx = {
  position: "fixed",
  left: "-100000px",
  top: 0,
  // Visible in the CSS sense: a display:none or visibility:hidden subtree has no layout to measure.
  pointerEvents: "none",
  zIndex: -1,
} as const;

/** Wait for the layout to stop changing under us before measuring it. */
const DEBOUNCE_MS = 120;

export const PagedResume = forwardRef<PagedResumeHandle, PagedResumeProps>(function PagedResume(
  { children, layout = EMPTY_LAYOUT, template, onLayout, onDocumentSections },
  ref,
) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const workRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sheetRefs = useRef<Array<HTMLDivElement | null>>([]);
  const docRef = useRef<ResumeDocument>({ flow: null, pages: 1, mode: "fit", scale: 1, widthPct: 100 });
  const generationRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [doc, setDoc] = useState<ResumeDocument>(docRef.current);
  /** How much the sheets are shrunk to fit the space available. Never above 1. */
  const [view, setView] = useState(1);

  useEffect(() => setMounted(true), []);
  useImperativeHandle(ref, () => ({ getDocument: () => docRef.current }), []);

  const relayout = useCallback(() => {
    const host = measureRef.current;
    const work = workRef.current;
    if (!host || !work) return;
    const root = host.firstElementChild as HTMLElement | null;
    if (!root) return;
    // A hidden tab (the /profile Resume tab renders with display:none) measures as zero.
    if (!host.getBoundingClientRect().width) return;

    const generation = (generationRef.current += 1);
    const pageHeight = pageHeightPx();

    // What this template has and where it puts it, read before anything is rearranged, so the
    // panel offers the template's own arrangement as the starting point.
    onDocumentSections?.(readDocumentSections(root));

    // Everything from here happens on a COPY: the learner's arrangement moves blocks about, and
    // pagination inserts spacers, neither of which may touch the tree React is rendering.
    const flow = root.cloneNode(true) as HTMLElement;
    work.replaceChildren(flow);
    applySectionLayout(flow, layout, template);

    const measureAtWidth = (widthPct: number) => {
      flow.style.width = widthPct === 100 ? "" : `${widthPct}%`;
      return inkHeight(work);
    };
    const decided = decideLayout(pageHeight, measureAtWidth, legibilityFloor(smallTextPx(work)));
    flow.style.width = "";

    let pages = 1;
    if (decided.mode === "paged") {
      pages = paginate(flow, pageHeight).pages;
    } else if (decided.scale !== 1) {
      flow.style.width = `${decided.widthPct}%`;
      flow.style.transform = `scale(${decided.scale})`;
      flow.style.transformOrigin = "top left";
    }
    work.replaceChildren();

    if (generation !== generationRef.current) return;
    const next: ResumeDocument = {
      flow,
      pages,
      mode: decided.mode,
      scale: decided.mode === "fit" ? decided.scale : 1,
      widthPct: decided.mode === "fit" ? decided.widthPct : 100,
    };
    docRef.current = next;
    setDoc(next);
    onLayout?.({ pages: next.pages, mode: next.mode, scale: next.scale });
  }, [layout, template, onLayout, onDocumentSections]);

  // Re-lay out on every commit (new resume data, a new template), on late web fonts, and on
  // anything that changes the size of the offscreen copy.
  useLayoutEffect(() => {
    const id = window.setTimeout(relayout, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  });

  useEffect(() => {
    const host = measureRef.current;
    if (!host) return;
    const cleanups: Array<() => void> = [];
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(relayout, DEBOUNCE_MS);
    };

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(schedule);
      ro.observe(host);
      cleanups.push(() => ro.disconnect());
    }
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      fonts.addEventListener?.("loadingdone", schedule);
      fonts.ready?.then(schedule).catch(() => {});
      cleanups.push(() => fonts.removeEventListener?.("loadingdone", schedule));
    }
    // A photo that arrives after the first measurement changes where everything below it sits.
    host.addEventListener("load", schedule, true);
    cleanups.push(() => host.removeEventListener("load", schedule, true));

    return () => {
      window.clearTimeout(timer);
      cleanups.forEach((fn) => fn());
    };
  }, [relayout]);

  // The sheets are scaled to fit the space they are given, and the space is measured rather than
  // guessed from breakpoints: the old guess left the page squeezed to 640px on a 1000px screen.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const available = stage.clientWidth - 32; // the stage's own gutters
      if (available > 0) setView(Math.min(1, available / PAGE_WIDTH_PX));
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Fill each sheet with its own window onto the document.
  useLayoutEffect(() => {
    const { flow, pages } = doc;
    sheetRefs.current.slice(0, pages).forEach((sheet, index) => {
      if (!sheet) return;
      if (!flow) {
        sheet.replaceChildren();
        return;
      }
      const copy = flow.cloneNode(true) as HTMLElement;
      copy.style.marginTop = index ? `${-index * PAGE_HEIGHT_PX}px` : "";
      sheet.replaceChildren(copy);
    });
  }, [doc, view]);

  const sheets = Array.from({ length: Math.max(1, doc.pages) }, (_, i) => i);

  return (
    <>
      {mounted &&
        createPortal(
          <>
            <Box ref={measureRef} sx={{ ...pageSurfaceSx, ...hostSx }} aria-hidden data-resume-measure>
              {children}
            </Box>
            <Box ref={workRef} sx={{ ...pageSurfaceSx, ...hostSx }} aria-hidden data-resume-work />
          </>,
          document.body,
        )}

      <Box
        ref={stageRef}
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          backgroundColor: "color-mix(in srgb, var(--surface) 65%, var(--background))",
          p: 2,
          borderRadius: 2,
        }}
      >
        {sheets.map((index) => (
          <Box key={index} sx={{ flexShrink: 0 }}>
            {/* A transform does not change the space an element takes up, so the box below reserves
                the SCALED size. Reserving the full page left up to 690px of dead grey under the
                preview, and with more than one sheet it would be a page of it each. */}
            <Box
              sx={{
                width: `${Math.round(PAGE_WIDTH_PX * view)}px`,
                height: `${Math.round(PAGE_HEIGHT_PX * view)}px`,
                flexShrink: 0,
              }}
            >
              <Box
                data-resume-sheet={index}
                data-resume-content={index === 0 ? "" : undefined}
                ref={(el: HTMLDivElement | null) => {
                  sheetRefs.current[index] = el;
                }}
                sx={{
                  ...pageSurfaceSx,
                  height: "297mm",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px color-mix(in srgb, var(--font-primary) 22%, transparent)",
                  transform: view !== 1 ? `scale(${view})` : "none",
                  transformOrigin: "top left",
                  userSelect: "none",
                }}
              />
            </Box>
            {doc.pages > 1 && (
              <Typography
                sx={{ mt: 0.5, textAlign: "center", fontSize: "0.7rem", color: "var(--font-secondary)" }}
              >
                Page {index + 1} of {doc.pages}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </>
  );
});
