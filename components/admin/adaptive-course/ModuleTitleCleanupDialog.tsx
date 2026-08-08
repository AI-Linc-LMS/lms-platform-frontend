"use client";

import { useState } from "react";
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography,
} from "@mui/material";

/**
 * Offer to clean module titles that are only a week label.
 *
 * Nearly every module in production is titled *nothing but* "Week 1" — a title that was never a
 * name, just the position stored again as text. On a module-framed course that reads
 * "Module 1 · Week 1".
 *
 * Preview first, and every row is opt-out. This rewrites almost every module of an affected
 * course, so an admin should see the exact list rather than discover it afterwards — and a
 * rename that produced an empty title would be worse than the duplication it fixes, which is
 * why the server proposes "Module 3" rather than stripping "Week 3" down to nothing.
 */

export interface TitleCleanupProposal {
  module_id: number;
  weekno: number;
  current_title: string;
  suggested_title: string;
}

export function ModuleTitleCleanupDialog({
  open,
  proposals,
  applying,
  onApply,
  onClose,
}: {
  open: boolean;
  proposals: TitleCleanupProposal[];
  applying: boolean;
  onApply: (moduleIds: number[]) => void;
  onClose: () => void;
}) {
  // Everything is selected by default — the common case is "yes, tidy them all" — but each row
  // can be declined, so an admin who has hand-named one module does not lose that name.
  const [declined, setDeclined] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setDeclined((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selected = proposals.filter((p) => !declined.has(p.module_id));

  return (
    <Dialog open={open} onClose={applying ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
        Tidy up module titles?
        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 500, mt: 0.5 }}>
          {proposals.length} module{proposals.length === 1 ? "" : "s"} {proposals.length === 1 ? "is" : "are"} named
          after a week. Without this they read like “Module 1 · Week 1”.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={0.5}>
          {proposals.map((p) => {
            const off = declined.has(p.module_id);
            return (
              <Stack
                key={p.module_id}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ py: 0.5, opacity: off ? 0.45 : 1 }}
              >
                <Checkbox
                  size="small"
                  checked={!off}
                  onChange={() => toggle(p.module_id)}
                  disabled={applying}
                />
                <Typography sx={{ fontSize: "0.85rem", flex: 1, minWidth: 0 }}>
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {p.current_title || "(untitled)"}
                  </Box>
                  <Box component="span" sx={{ mx: 1, color: "text.disabled" }}>→</Box>
                  <Box component="span" sx={{ fontWeight: 700 }}>{p.suggested_title}</Box>
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={applying} sx={{ textTransform: "none" }}>
          Leave them as they are
        </Button>
        <Button
          variant="contained"
          disabled={applying || selected.length === 0}
          onClick={() => onApply(selected.map((p) => p.module_id))}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {applying
            ? "Renaming…"
            : `Rename ${selected.length} module${selected.length === 1 ? "" : "s"}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
