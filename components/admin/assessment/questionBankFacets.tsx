"use client";

/**
 * P6 question-bank reuse: shared facet toolbar + reuse chips + preview dialog used by
 * the MCQ / Coding / Subjective selection pickers, so reuse UX is consistent across
 * all three banks. Filtering is client-side over the already-loaded pool (the pickers
 * receive the full array as a prop); the server-side facets are opt-in and additive.
 */
import { ReactNode } from "react";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  csv_import: "CSV Import",
  ai_generated: "AI Generated",
  course_builder: "Course Builder",
};

const SOURCE_ICON: Record<string, string> = {
  manual: "mdi:pencil-outline",
  csv_import: "mdi:file-delimited-outline",
  ai_generated: "mdi:robot-outline",
  course_builder: "mdi:book-cog-outline",
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const SOURCES = ["manual", "ai_generated", "csv_import", "course_builder"] as const;

export interface FacetItem {
  difficulty_level?: string;
  source?: string;
  usage_count?: number;
}

export interface FacetState {
  difficulty: string;
  source: string;
  reusedOnly: boolean;
}

export const EMPTY_FACETS: FacetState = { difficulty: "", source: "", reusedOnly: false };

/** Client-side facet filter shared by all three pickers. */
export function applyFacets<T extends FacetItem>(items: T[], f: FacetState): T[] {
  return items.filter((it) => {
    if (f.difficulty && (it.difficulty_level || "") !== f.difficulty) return false;
    if (f.source && (it.source || "manual") !== f.source) return false;
    if (f.reusedOnly && !(Number(it.usage_count) > 0)) return false;
    return true;
  });
}

/** Small chip showing where a question came from (Manual/AI/CSV/Course Builder). */
export function SourceChip({ source }: { source?: string }) {
  const key = source || "manual";
  const label = SOURCE_LABELS[key] || key;
  return (
    <Chip
      icon={<IconWrapper icon={SOURCE_ICON[key] || "mdi:tag-outline"} size={14} />}
      label={label}
      size="small"
      sx={{
        height: 22,
        fontSize: "0.7rem",
        bgcolor: "var(--surface)",
        color: "var(--font-secondary)",
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}

/** "Used N×" reuse signal — dims to "Unused" when never referenced. */
export function UsageChip({ count }: { count?: number }) {
  const n = Number(count) || 0;
  return (
    <Tooltip title={n > 0 ? `Reused in ${n} section${n === 1 ? "" : "s"}` : "Not used yet"}>
      <Chip
        label={n > 0 ? `Used ${n}×` : "Unused"}
        size="small"
        sx={{
          height: 22,
          fontSize: "0.7rem",
          fontWeight: n > 0 ? 600 : 400,
          bgcolor: n > 0
            ? "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)"
            : "var(--surface)",
          color: n > 0 ? "var(--accent-indigo)" : "var(--font-tertiary)",
        }}
      />
    </Tooltip>
  );
}

/** Small comma/space separated tags -> chips. */
export function TagChips({ tags }: { tags?: string }) {
  const parts = (tags || "")
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (parts.length === 0) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {parts.map((t, i) => (
        <Chip
          key={`${t}-${i}`}
          label={t}
          size="small"
          sx={{ height: 20, fontSize: "0.65rem", bgcolor: "var(--surface)", color: "var(--font-secondary)" }}
        />
      ))}
    </Box>
  );
}

/** A small "eye" button that callers place per-row to open a preview. */
export function PreviewButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip title="Preview question">
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        sx={{ color: "var(--font-secondary)" }}
      >
        <IconWrapper icon="mdi:eye-outline" size={18} />
      </IconButton>
    </Tooltip>
  );
}

/** Generic modal for previewing a bank question; caller supplies the body. */
export function PreviewDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}
      >
        <span>{title}</span>
        <IconButton onClick={onClose} size="small">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}

interface FacetBarProps {
  facets: FacetState;
  onChange: (next: FacetState) => void;
  /** Hide the source row for banks that don't expose it. */
  showSource?: boolean;
  /** Right-aligned slot (e.g. a result count). */
  extra?: ReactNode;
}

/** Difficulty + source + "reused only" chip toolbar. Toggling re-selects (chip acts
 * as a single-select; click the active chip to clear). */
export function FacetBar({ facets, onChange, showSource = true, extra }: FacetBarProps) {
  const set = (patch: Partial<FacetState>) => onChange({ ...facets, ...patch });
  const toggle = (key: "difficulty" | "source", value: string) =>
    set({ [key]: facets[key] === value ? "" : value } as Partial<FacetState>);

  return (
    <Stack spacing={1} sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: "var(--font-tertiary)", minWidth: 64 }}>
          Difficulty
        </Typography>
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            label={d}
            size="small"
            variant={facets.difficulty === d ? "filled" : "outlined"}
            onClick={() => toggle("difficulty", d)}
            sx={{
              height: 24,
              fontSize: "0.72rem",
              cursor: "pointer",
              bgcolor: facets.difficulty === d ? "var(--accent-indigo)" : "transparent",
              color: facets.difficulty === d ? "var(--font-light)" : "var(--font-secondary)",
              borderColor: "var(--border-default)",
            }}
          />
        ))}
        <Chip
          icon={<IconWrapper icon="mdi:recycle-variant" size={14} />}
          label="Reused only"
          size="small"
          variant={facets.reusedOnly ? "filled" : "outlined"}
          onClick={() => set({ reusedOnly: !facets.reusedOnly })}
          sx={{
            height: 24,
            fontSize: "0.72rem",
            cursor: "pointer",
            ml: 0.5,
            bgcolor: facets.reusedOnly ? "var(--accent-indigo)" : "transparent",
            color: facets.reusedOnly ? "var(--font-light)" : "var(--font-secondary)",
            borderColor: "var(--border-default)",
            "& .MuiChip-icon": { color: facets.reusedOnly ? "var(--font-light)" : "var(--font-secondary)" },
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        {extra}
      </Box>

      {showSource && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", minWidth: 64 }}>
            Source
          </Typography>
          {SOURCES.map((s) => (
            <Chip
              key={s}
              label={SOURCE_LABELS[s]}
              size="small"
              variant={facets.source === s ? "filled" : "outlined"}
              onClick={() => toggle("source", s)}
              sx={{
                height: 24,
                fontSize: "0.72rem",
                cursor: "pointer",
                bgcolor: facets.source === s ? "var(--accent-indigo)" : "transparent",
                color: facets.source === s ? "var(--font-light)" : "var(--font-secondary)",
                borderColor: "var(--border-default)",
              }}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}
