import type { SxProps, Theme } from "@mui/material";

/**
 * Shared sx for a grid of cards.
 *
 * A grid item's `min-width` defaults to `auto`, which means its minimum size is its
 * *content's* minimum size. One child that cannot wrap -- a `noWrap` title, whose
 * min-content width is the entire string -- therefore widens the whole track, and the
 * grid refuses to shrink below that no matter how narrow the viewport gets.
 *
 * Measured on the instructor Gradebook: the card grid's scrollWidth sat at 1254px at
 * every viewport from 1280 down to 900, pushing 482px of content sideways out of the
 * page. Setting `min-width: 0` on the items let it shrink to 535px and the sideways
 * scroll disappeared entirely.
 *
 * `noWrap` still does its job once this is set -- it can finally ellipsis, because its
 * container is allowed to be narrower than the text.
 */
export const CARD_GRID_ITEM_SX = {
  // Applies to whatever sits directly in the grid, including animation wrappers like
  // `Reveal` -- the wrapper is the grid item, so putting min-width on the card inside it
  // is too late.
  "& > *": { minWidth: 0 },
} as const;

/** A responsive card grid that is allowed to shrink. */
export function cardGridSx(
  gridTemplateColumns: SxProps<Theme>[keyof SxProps<Theme>] | unknown,
  gap: number = 2,
): SxProps<Theme> {
  return {
    display: "grid",
    gridTemplateColumns,
    gap,
    ...CARD_GRID_ITEM_SX,
  } as SxProps<Theme>;
}
