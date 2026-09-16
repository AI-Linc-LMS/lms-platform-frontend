import type { SystemStyleObject } from "@mui/system";
import type { Theme } from "@mui/material";

/** A4 at 96dpi, in CSS px. 297mm actually measures 1122.52px; use pageHeightPx() where it matters. */
export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

/**
 * The CSS that makes a box behave like the resume page.
 *
 * It lives here because THREE things have to agree about it: the offscreen copy the layout is
 * measured on, the sheets on screen, and the copy the PDF is rendered from. When the export
 * rendered at a different width from the preview, the download quietly lost lines the preview
 * showed, which is one of the ways "the fix is not working" was true.
 */
export const pageSurfaceSx: SystemStyleObject<Theme> = {
  width: "210mm",
  backgroundColor: "var(--card-bg)",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  "& *": {
    WebkitPrintColorAdjust: "exact !important",
    printColorAdjust: "exact !important",
    colorAdjust: "exact !important",
    boxSizing: "border-box",
  },
  // A section heading is one or two short words ("WORK EXPERIENCE"), so keeping it on one line is
  // safe.
  "& [data-resume-section-title]": {
    whiteSpace: "nowrap",
  },
  /* An entry title is NOT short. "Bachelor of Technology in Computer Science and Engineering" is a
     real degree line, and forbidding it to wrap put 145px of it outside the page in Western and
     Bubble, where the page then clipped it: the learner's own degree, half printed. The rule was
     meant to stop ugly mid-word breaks in the PDF, and `break-word` keeps that promise - it breaks
     between words, and inside one only when a single word cannot fit the line at all. */
  "& [data-resume-nowrap]": {
    whiteSpace: "normal",
    overflowWrap: "break-word",
  },
  /* Contact lines. This block used to force `white-space: nowrap; overflow: visible` on every one
     of them, which made the templates' own `word-break` inert and chose spilling over clipping.
     `overflow-wrap: anywhere` breaks only when a line would otherwise overflow, so ordinary short
     contact lines still sit on one line exactly as before, and `min-width: 0` lets a flex child
     shrink to its container.

     `white-space: normal` is here for the same reason the rest is: several templates set `nowrap`
     on the contact line itself, and a line that may not break cannot break anywhere. With a real
     student address ("Plot 14, Sector 7, Kothri Kalan, Ashta Tehsil, Sehore District") that put
     249px outside the page in Right Sidebar, 175 in Bubble and 73 in Two Column. This selector is
     a class plus an attribute, so it outranks the template's own rule. */
  "& [data-resume-contact-item]": {
    minWidth: 0,
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },
};
