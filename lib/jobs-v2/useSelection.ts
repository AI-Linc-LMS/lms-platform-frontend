"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SelectionId = string | number;

export interface UseSelectionOptions<ID extends SelectionId> {
  /**
   * The ids currently on screen, in visual order. Needed for shift-click range selection and
   * for the additive "select all on this page" semantics.
   */
  ids: readonly ID[];
  /**
   * Anything that changes WHICH rows are on screen: tab, page, page size, search, filters.
   * When this changes the selection is cleared, because a bulk action must only ever hit rows
   * the operator can still see. This is the scraped queue's correct behaviour, made impossible
   * to forget on the jobs list and the applications pipeline.
   */
  deps: readonly unknown[];
}

export interface Selection<ID extends SelectionId> {
  selected: Set<ID>;
  count: number;
  isSelected: (id: ID) => boolean;
  /** Toggle one row. Also sets the shift-click anchor. */
  toggle: (id: ID) => void;
  /**
   * Shift-click. Selects (or deselects, matching the anchor's new state) every row between the
   * last anchor and `id` inclusive, in the current visual order. Falls back to a plain toggle
   * when there is no anchor or the anchor has scrolled out of the current page.
   */
  toggleRange: (id: ID) => void;
  /**
   * Additive per page: if every visible id is selected they are all removed, otherwise they are
   * all added. Selections made on other pages are preserved — the exact semantics the scraped
   * queue's `toggleSelectAll` had.
   */
  selectAll: () => void;
  /** Replace the selection wholesale. */
  set: (ids: readonly ID[]) => void;
  clear: () => void;
  /** True when every visible id is selected and there is at least one. */
  allVisibleSelected: boolean;
  /** True when some but not all visible ids are selected — the header checkbox's indeterminate. */
  someVisibleSelected: boolean;
  /** How many of the visible rows are selected. Drives "3 of 20 on this page". */
  visibleSelectedCount: number;
}

/**
 * One selection model for all three admin lists.
 *
 * The two behaviours worth reading twice:
 *   - it CLEARS on any `deps` change, so a bulk action can never hit a row the operator can no
 *     longer see;
 *   - `toggleRange` gives real shift-click, implemented once, instead of three lists where it
 *     does not exist at all.
 */
export function useSelection<ID extends SelectionId>({
  ids,
  deps,
}: UseSelectionOptions<ID>): Selection<ID> {
  const [selected, setSelected] = useState<Set<ID>>(() => new Set<ID>());
  const anchorRef = useRef<ID | null>(null);

  // Keep the visible ids in a ref so the callbacks stay stable across renders. Written in an
  // effect rather than during render: effects flush before the browser dispatches the next
  // click, so a handler never reads a stale page.
  const idsRef = useRef<readonly ID[]>(ids);
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  // Any query change changes which rows are on screen, so a selection made before it must not
  // survive. `deps` is spread deliberately: the caller owns the identity of its own values.
  useEffect(() => {
    setSelected((prev) => (prev.size === 0 ? prev : new Set<ID>()));
    anchorRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const isSelected = useCallback((id: ID) => selected.has(id), [selected]);

  const toggle = useCallback((id: ID) => {
    anchorRef.current = id;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleRange = useCallback(
    (id: ID) => {
      const visible = idsRef.current;
      const anchor = anchorRef.current;
      const from = anchor === null ? -1 : visible.indexOf(anchor);
      const to = visible.indexOf(id);
      if (from === -1 || to === -1) {
        toggle(id);
        return;
      }
      const [lo, hi] = from <= to ? [from, to] : [to, from];
      setSelected((prev) => {
        const next = new Set(prev);
        // The whole range takes the state the clicked row is moving TO, which is what every
        // file manager and mail client does.
        const turningOn = !next.has(id);
        for (let i = lo; i <= hi; i += 1) {
          const rowId = visible[i];
          if (turningOn) next.add(rowId);
          else next.delete(rowId);
        }
        return next;
      });
      anchorRef.current = id;
    },
    [toggle],
  );

  const selectAll = useCallback(() => {
    const visible = idsRef.current;
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = visible.length > 0 && visible.every((id) => next.has(id));
      if (allSelected) visible.forEach((id) => next.delete(id));
      else visible.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const set = useCallback((nextIds: readonly ID[]) => {
    setSelected(new Set(nextIds));
  }, []);

  const clear = useCallback(() => {
    anchorRef.current = null;
    setSelected((prev) => (prev.size === 0 ? prev : new Set<ID>()));
  }, []);

  const visibleSelectedCount = useMemo(
    () => ids.reduce((n, id) => n + (selected.has(id) ? 1 : 0), 0),
    [ids, selected],
  );

  return {
    selected,
    count: selected.size,
    isSelected,
    toggle,
    toggleRange,
    selectAll,
    set,
    clear,
    allVisibleSelected: ids.length > 0 && visibleSelectedCount === ids.length,
    someVisibleSelected: visibleSelectedCount > 0 && visibleSelectedCount < ids.length,
    visibleSelectedCount,
  };
}
