"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adminStudentService, type Student } from "@/lib/services/admin/admin-student.service";

const PAGE_SIZE = 20;

/** The shape the job form keeps for each curated learner. */
export interface SelectedStudent {
  id: number;
  name: string;
  email: string;
}

interface Props {
  open: boolean;
  /** Currently curated students; pre-checked and preserved across searches. */
  initialSelected: SelectedStudent[];
  onClose: () => void;
  onConfirm: (students: SelectedStudent[]) => void;
}

/**
 * Search the tenant's learners and pick one or many to curate a job for.
 *
 * Mirrors EnrollAdaptiveStudentsDialog (debounced search, paginated checkbox list) but returns the
 * selection instead of performing an action, so the job form owns the write. Selection is kept in a
 * Map, not just a Set of ids: a student picked on page 1 must survive a search that pages them out
 * of view, and we still need their name/email to render the chip afterwards.
 */
export function SelectStudentsDialog({ open, initialSelected, onClose, onConfirm }: Props) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Map<number, SelectedStudent>>(new Map());

  const load = useCallback(
    async (q: string, p: number) => {
      setLoading(true);
      try {
        const res = await adminStudentService.getManageStudents({
          search: q || undefined,
          role: "student",
          page: p,
          limit: PAGE_SIZE,
        });
        setStudents(res.students);
        setTotalPages(res.pagination.total_pages || 1);
      } catch {
        showToast("Couldn't load students.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Seed from the form each time the dialog opens, so Cancel truly discards.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPage(1);
    setSelected(new Map(initialSelected.map((s) => [s.id, s])));
    void load("", 1);
  }, [open, initialSelected, load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setPage(1);
      void load(search, 1);
    }, 350);
    return () => clearTimeout(t);
  }, [search, open, load]);

  const toggle = (s: Student) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.set(s.id, { id: s.id, name: s.name || s.email, email: s.email });
      return next;
    });
  };

  const chosen = useMemo(() => Array.from(selected.values()), [selected]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Assign to specific students</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "var(--font-tertiary, #8b8b98)" }}>
            Only the students you pick will see this opening.
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Icon icon="mdi:close" width={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" width={18} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />

        {chosen.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
            {chosen.map((s) => (
              <Chip
                key={s.id}
                size="small"
                label={s.name}
                onDelete={() =>
                  setSelected((prev) => {
                    const next = new Map(prev);
                    next.delete(s.id);
                    return next;
                  })
                }
              />
            ))}
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : students.length === 0 ? (
          <Typography sx={{ py: 4, textAlign: "center", color: "var(--font-tertiary, #8b8b98)", fontSize: "0.85rem" }}>
            No students match &ldquo;{search}&rdquo;.
          </Typography>
        ) : (
          <Box>
            {students.map((s) => {
              const checked = selected.has(s.id);
              return (
                <Box
                  key={s.id}
                  onClick={() => toggle(s)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.25,
                    px: 1, py: 0.9, borderRadius: 2, cursor: "pointer",
                    "&:hover": { bgcolor: "color-mix(in srgb, var(--border-default) 30%, transparent)" },
                  }}
                >
                  <Checkbox checked={checked} size="small" sx={{ p: 0.5 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name || s.email}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "var(--font-tertiary, #8b8b98)" }}>{s.email}</Typography>
                  </Box>
                </Box>
              );
            })}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
                <Pagination
                  size="small"
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => {
                    setPage(p);
                    void load(search, p);
                  }}
                />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography sx={{ mr: "auto", fontSize: "0.8rem", color: "var(--font-tertiary, #8b8b98)" }}>
          {chosen.length} selected
        </Typography>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onConfirm(chosen)} sx={{ textTransform: "none", fontWeight: 700 }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
