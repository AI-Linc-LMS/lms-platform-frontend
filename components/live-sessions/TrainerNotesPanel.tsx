"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { MaterialViewerDialog } from "@/components/live-sessions/MaterialViewerDialog";
import { StudyMaterialList } from "@/components/live-sessions/StudyMaterialList";
import {
  PAGE_SIZE,
  liveSessionMaterialsService,
  type MySessionMaterial,
} from "@/lib/services/live-session-materials.service";

/**
 * Everything a trainer shared, in one place, grouped by the class it came from.
 *
 * Agileology asked for this by name: the Notes surface carries only the AI-generated summary,
 * while the trainer's actual files were reachable only by remembering which past session they
 * were attached to and expanding that row in History.
 *
 * Grouping is done here rather than by the API because the API's job is the security boundary,
 * not the layout. One request returns the whole list already ordered newest-first, and the
 * grouping below preserves that order: the class whose most recent file is newest comes first,
 * which is what a learner catching up is looking for.
 *
 * Deliberately NOT a fan-out over the per-session endpoint. That would be one request per class,
 * and a learner on a forty-week batch would pay forty round trips to look at one PDF.
 */
export function TrainerNotesPanel({
  onCountChange,
}: {
  /** Lets the page show a count on the tab without fetching the list twice. */
  onCountChange?: (count: number) => void;
}) {
  const [rows, setRows] = useState<MySessionMaterial[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<MySessionMaterial | null>(null);

  /**
   * One page at a time. The first screenful is what the learner waits for, and page cost is
   * roughly linear in rows: asking for everything up front made the biggest cohort's tab take
   * about twice as long as it needed to.
   *
   * `offset` is passed explicitly rather than read from state so a second click cannot race the
   * first into requesting the same page twice.
   */
  const load = useCallback(async (offset: number) => {
    setError(null);
    if (offset > 0) setLoadingMore(true);
    try {
      const { results, hasMore: more } = await liveSessionMaterialsService.mine({
        limit: PAGE_SIZE,
        offset,
      });
      setRows((prev) => {
        const next = offset === 0 ? results : [...(prev ?? []), ...results];
        onCountChange?.(next.length);
        return next;
      });
      setHasMore(more);
    } catch {
      // A failed list must say so and offer a way out. A spinner that never resolves is the
      // one outcome this panel is not allowed to produce. A failed SECOND page keeps the rows
      // already on screen rather than throwing them away.
      if (offset === 0) setRows([]);
      setError("We could not load the shared files just now.");
    } finally {
      setLoadingMore(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    void load(0);
  }, [load]);

  /** [sessionTitle, files][] in the order each class first appears, i.e. newest activity first. */
  const groups = useMemo(() => {
    const byClass = new Map<number, { title: string; items: MySessionMaterial[] }>();
    for (const row of rows ?? []) {
      const existing = byClass.get(row.live_class_id);
      if (existing) existing.items.push(row);
      else byClass.set(row.live_class_id, { title: row.session_title, items: [row] });
    }
    return Array.from(byClass.values());
  }, [rows]);

  if (rows === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  // Only take over the whole panel when there is nothing to take it over FROM. A second
  // page failing must not wipe the files the learner is already reading; that case is
  // reported by the inline message below the list instead.
  if (error && rows.length === 0) {
    return (
      <Box
        sx={{
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          borderRadius: 3,
          border: "1px dashed var(--border-default)",
        }}
      >
        <Icon icon="mdi:cloud-off-outline" width={30} style={{ opacity: 0.4 }} />
        <Typography sx={{ color: "text.secondary", mt: 1 }}>{error}</Typography>
        <Button onClick={() => void load(rows?.length ?? 0)} sx={{ mt: 1.5, textTransform: "none" }}>
          Try again
        </Button>
      </Box>
    );
  }

  if (!groups.length) {
    return (
      <Box
        sx={{
          p: { xs: 3.5, sm: 5 },
          textAlign: "center",
          borderRadius: 3,
          border: "1px dashed var(--border-default)",
        }}
      >
        <Icon icon="mdi:file-document-outline" width={30} style={{ opacity: 0.4 }} />
        <Typography sx={{ color: "text.secondary", mt: 1 }}>
          Your trainers have not shared any files yet.
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.5 }}>
          Slides, notes and datasets they upload to a class will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={2.25}>
        {groups.map((group, index) => (
          <Box
            key={`${group.title}-${index}`}
            sx={{
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--surface-raised, transparent)",
              p: { xs: 1.5, sm: 2 },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25, minWidth: 0 }}>
              <Icon icon="mdi:school-outline" width={18} style={{ flexShrink: 0, opacity: 0.7 }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {group.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {group.items.length} file{group.items.length === 1 ? "" : "s"}
              </Typography>
            </Stack>
            <StudyMaterialList materials={group.items} onOpen={(m) => setViewing(m as MySessionMaterial)} />
          </Box>
        ))}
      </Stack>

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            onClick={() => void load(rows.length)}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={16} /> : <Icon icon="mdi:chevron-down" />}
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 44 }}
          >
            {loadingMore ? "Loading" : "Load more files"}
          </Button>
        </Box>
      )}

      {error && rows.length > 0 && (
        <Typography variant="body2" sx={{ color: "error.main", textAlign: "center", mt: 1.5 }}>
          {error}
        </Typography>
      )}

      <MaterialViewerDialog material={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
