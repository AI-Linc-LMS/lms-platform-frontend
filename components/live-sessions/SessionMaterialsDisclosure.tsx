"use client";

import { useCallback, useState } from "react";
import { Box, Button, Collapse } from "@mui/material";
import { Icon } from "@iconify/react";
import { StudyMaterialList } from "./StudyMaterialList";
import {
  liveSessionMaterialsService,
  type LiveSessionMaterial,
} from "@/lib/services/live-session-materials.service";

/**
 * "Study material" toggle for a learner's session card or history row.
 *
 * Loads on first open, not on render. A learner's list can hold dozens of sessions, and fetching
 * materials for every one of them to show a link most people never click would cost dozens of
 * requests for nothing.
 *
 * Once opened it stays loaded, so re-opening is instant.
 */
export function SessionMaterialsDisclosure({
  liveClassId,
  label = "Study material",
  dense = false,
}: {
  liveClassId: number;
  label?: string;
  dense?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LiveSessionMaterial[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next && items === null && !loading) {
      setLoading(true);
      try {
        setItems(await liveSessionMaterialsService.list(liveClassId));
      } catch {
        // A material list that cannot load must not break the card it hangs off — show "none"
        // rather than an error state on what is a secondary detail.
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }, [open, items, loading, liveClassId]);

  return (
    <Box sx={{ width: "100%" }}>
      <Button
        onClick={toggle}
        size="small"
        startIcon={<Icon icon="mdi:paperclip" width={15} />}
        endIcon={<Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />}
        sx={{
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.76rem",
          color: "var(--font-secondary)",
          px: 0.75,
          minWidth: 0,
        }}
      >
        {label}
        {items !== null && items.length > 0 ? ` (${items.length})` : ""}
      </Button>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 0.75 }}>
          <StudyMaterialList
            materials={items ?? []}
            dense={dense}
            emptyLabel={loading ? "Loading…" : "No material shared for this session."}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
