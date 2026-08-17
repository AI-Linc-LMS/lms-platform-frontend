/**
 * The session room's dark palette, in one place.
 *
 * The room is the only dark surface in the learner app, so it cannot use the global CSS
 * variables: `--card-bg` is white, `--font-primary` is near-black, and a panel styled with
 * them lands on the room as a bright rectangle. That is exactly what happened to the coding
 * panel, which rendered a white header strip across the top of a black screen.
 *
 * Every surface inside the room imports from here instead of inventing its own rgba values.
 * The panels are built by different files and have to look like one product.
 */

/** The ground. Deep violet-black, so the ribbon can carry real luminance. */
export const ROOM_BG =
  "radial-gradient(115% 90% at 50% 8%, #241653 0%, #170d38 42%, #0b0619 100%)";

/** Flat equivalent of the darkest stop. Use for focus-ring insets and solid fills. */
export const ROOM_INK = "#0b0619";

/** A panel that sits on the ground: slightly lifted, hairline edge, no shadow. */
export const ROOM_PANEL = "#150c30";

/** One step up from the panel, for a header or footer strip inside it. */
export const ROOM_PANEL_RAISED = "rgba(255,255,255,0.04)";

export const ROOM_BORDER = "rgba(255,255,255,0.1)";
export const ROOM_BORDER_STRONG = "rgba(255,255,255,0.18)";

export const ROOM_TEXT = "rgba(255,255,255,0.94)";
export const ROOM_TEXT_DIM = "rgba(255,255,255,0.66)";
export const ROOM_TEXT_FAINT = "rgba(255,255,255,0.44)";

/** The one accent. The tutor's voice owns it; nothing else should compete. */
export const ROOM_VIOLET = "#a855f7";
export const ROOM_VIOLET_SOLID = "#7c3aed";

/** The learner's colour, used only where the two speakers have to be told apart. */
export const ROOM_PINK = "#ec4899";

export const ROOM_GREEN = "#4ade80";
export const ROOM_RED = "#fb7185";

/** DESIGN.md's focus ring, re-grounded on the dark surface. */
export const roomFocusRing = {
  outline: "none",
  boxShadow: `0 0 0 2px ${ROOM_INK}, 0 0 0 4px ${ROOM_VIOLET}`,
} as const;

/** A quiet button on the dark ground: hover moves the border, never lifts the surface. */
export const roomGhostBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.6,
  borderRadius: "8px",
  border: `1px solid ${ROOM_BORDER_STRONG}`,
  bgcolor: "rgba(255,255,255,0.05)",
  color: ROOM_TEXT,
  fontFamily: "inherit",
  fontSize: "0.85rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "border-color 160ms ease, background-color 160ms ease",
  "&:hover": { borderColor: ROOM_VIOLET, bgcolor: "rgba(168,85,247,0.16)" },
  "&:focus-visible": roomFocusRing,
} as const;
