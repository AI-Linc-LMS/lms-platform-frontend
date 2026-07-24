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
  Autocomplete,
  TextField,
  Button,
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
  topic?: string;
  skills?: string;
  tags?: string;
}

export interface FacetState {
  difficulty: string;
  source: string;
  reusedOnly: boolean;
  /** Multi-select structured filters (OR within a facet, AND across facets). */
  topics: string[];
  skills: string[];
  tags: string[];
}

export const EMPTY_FACETS: FacetState = {
  difficulty: "",
  source: "",
  reusedOnly: false,
  topics: [],
  skills: [],
  tags: [],
};

/** Split a comma/semicolon-separated metadata string into trimmed values. */
export function splitMulti(s?: string): string[] {
  return (s || "")
    .split(/[,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** True when a state has any active filter (used to show a "Clear" affordance). */
export function hasActiveFacets(f: FacetState): boolean {
  return Boolean(
    f.difficulty ||
      f.source ||
      f.reusedOnly ||
      f.topics.length ||
      f.skills.length ||
      f.tags.length,
  );
}

/** Distinct, sorted Topic / Skill / Tag values present in the loaded pool - powers the
 * filter dropdowns so an admin can pick a topic (etc.) instead of guessing free-text. */
export function deriveFacetOptions(
  items: FacetItem[],
): { topics: string[]; skills: string[]; tags: string[] } {
  const topics = new Set<string>();
  const skills = new Set<string>();
  const tags = new Set<string>();
  for (const it of items) {
    const t = (it.topic || "").trim();
    if (t) topics.add(t);
    for (const s of splitMulti(it.skills)) skills.add(s);
    for (const g of splitMulti(it.tags)) tags.add(g);
  }
  const sorted = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));
  return { topics: sorted(topics), skills: sorted(skills), tags: sorted(tags) };
}

/** Client-side facet filter shared by all three pickers. */
export function applyFacets<T extends FacetItem>(items: T[], f: FacetState): T[] {
  const lc = (arr: string[]) => arr.map((x) => x.toLowerCase());
  const topicsL = lc(f.topics);
  const skillsL = lc(f.skills);
  const tagsL = lc(f.tags);
  return items.filter((it) => {
    if (f.difficulty && (it.difficulty_level || "") !== f.difficulty) return false;
    if (f.source && (it.source || "manual") !== f.source) return false;
    if (f.reusedOnly && !(Number(it.usage_count) > 0)) return false;
    if (topicsL.length && !topicsL.includes((it.topic || "").trim().toLowerCase()))
      return false;
    if (skillsL.length) {
      const itemSkills = splitMulti(it.skills).map((x) => x.toLowerCase());
      if (!skillsL.some((s) => itemSkills.includes(s))) return false;
    }
    if (tagsL.length) {
      const itemTags = splitMulti(it.tags).map((x) => x.toLowerCase());
      if (!tagsL.some((g) => itemTags.includes(g))) return false;
    }
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

/** "Used N×" reuse signal - dims to "Unused" when never referenced. */
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
  /** Distinct Topic/Skill/Tag values for the structured filter dropdowns (from
   * deriveFacetOptions over the loaded pool). Dropdowns with no options are hidden. */
  options?: { topics: string[]; skills: string[]; tags: string[] };
  /** Right-aligned slot (e.g. a result count). */
  extra?: ReactNode;
}

/** A compact multi-select dropdown for one structured facet (Topic/Skill/Tag). */
function FacetMultiSelect({
  label,
  icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <Autocomplete
      multiple
      size="small"
      options={options}
      value={value}
      onChange={(_, next) => onChange(next)}
      limitTags={2}
      disableCloseOnSelect
      sx={{ minWidth: 200, flex: "1 1 220px", maxWidth: 360 }}
      renderTags={(vals, getTagProps) =>
        vals.map((v, i) => (
          <Chip
            label={v}
            size="small"
            {...getTagProps({ index: i })}
            key={v}
            sx={{ height: 22, fontSize: "0.7rem" }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length ? "" : `Filter by ${label.toLowerCase()}…`}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <IconWrapper icon={icon} size={16} style={{ marginLeft: 4, marginRight: 2, opacity: 0.7 }} />
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

/** Difficulty + source + "reused only" chip toolbar, plus structured Topic/Skill/Tag
 * multi-select dropdowns. Chips single-select (click active to clear); dropdowns
 * multi-select. */
export function FacetBar({
  facets,
  onChange,
  showSource = true,
  options,
  extra,
}: FacetBarProps) {
  const set = (patch: Partial<FacetState>) => onChange({ ...facets, ...patch });
  const toggle = (key: "difficulty" | "source", value: string) =>
    set({ [key]: facets[key] === value ? "" : value } as Partial<FacetState>);

  const opts = options || { topics: [], skills: [], tags: [] };
  const showStructured = opts.topics.length || opts.skills.length || opts.tags.length;
  const active = hasActiveFacets(facets);

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
        {active && (
          <Button
            size="small"
            variant="text"
            startIcon={<IconWrapper icon="mdi:filter-remove-outline" size={16} />}
            onClick={() => onChange(EMPTY_FACETS)}
            sx={{ fontSize: "0.72rem", textTransform: "none", color: "var(--font-secondary)" }}
          >
            Clear filters
          </Button>
        )}
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

      {showStructured ? (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", minWidth: 64, pt: 1 }}>
            Filters
          </Typography>
          <FacetMultiSelect
            label="Topic"
            icon="mdi:shape-outline"
            options={opts.topics}
            value={facets.topics}
            onChange={(topics) => set({ topics })}
          />
          <FacetMultiSelect
            label="Skill"
            icon="mdi:lightbulb-on-outline"
            options={opts.skills}
            value={facets.skills}
            onChange={(skills) => set({ skills })}
          />
          <FacetMultiSelect
            label="Tag"
            icon="mdi:tag-multiple-outline"
            options={opts.tags}
            value={facets.tags}
            onChange={(tags) => set({ tags })}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
