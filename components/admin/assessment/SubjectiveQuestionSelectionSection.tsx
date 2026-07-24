"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Checkbox,
  CircularProgress,
  TextField,
  Chip,
  Pagination,
  Select,
  MenuItem,
  IconButton,
  Button,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { AssessmentSubjectiveQuestionListItem } from "@/lib/services/admin/admin-assessment.service";
import { DifficultyChip, StatusChip } from "@/components/admin/assessment/shared";
import {
  FacetState,
  EMPTY_FACETS,
  applyFacets,
  deriveFacetOptions,
  hasActiveFacets,
  SOURCE_LABELS,
  SourceChip,
  UsageChip,
  TagChips,
  PreviewButton,
  PreviewDialog,
} from "./questionBankFacets";

/** Redesign card recipe (create-wizard style contract). */
const CARD_SX = {
  borderRadius: "16px",
  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
  bgcolor: "var(--card-bg)",
} as const;

/** Uppercase section kicker label. */
const KICKER_SX = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--font-tertiary)",
} as const;

/** Token-accented checkbox (replaces the MUI default blue). */
const CHECKBOX_SX = {
  color: "var(--font-tertiary)",
  "&.Mui-checked": { color: "var(--ai-violet)" },
  "&.MuiCheckbox-indeterminate": { color: "var(--ai-violet)" },
} as const;

/** Search field with token focus accents instead of the default blue. */
const SEARCH_FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--ai-violet)",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--ai-violet)" },
} as const;

/** Hairline separator between rows (no heavy borders). */
const HAIRLINE = "1px solid color-mix(in srgb, var(--border-default) 45%, transparent)";

/** Compact toolbar dropdown: token border, violet focus, no floating label. */
const TOOLBAR_SELECT_SX = {
  borderRadius: "10px",
  fontSize: "0.8rem",
  bgcolor: "var(--card-bg)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "color-mix(in srgb, var(--border-default) 70%, transparent)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "color-mix(in srgb, var(--ai-violet) 45%, var(--border-default) 55%)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--ai-violet)",
  },
} as const;

/** Active-facet chip - wraps below the toolbar only when a filter is active. */
const ACTIVE_CHIP_SX = {
  height: 24,
  fontSize: "0.72rem",
  fontWeight: 600,
  bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
  color: "var(--accent-indigo)",
  "& .MuiChip-deleteIcon": {
    color: "color-mix(in srgb, var(--accent-indigo) 70%, transparent)",
    "&:hover": { color: "var(--accent-indigo)" },
  },
} as const;

/** Token pagination (replaces the MUI default blue). */
const PAGINATION_SX = {
  "& .MuiPaginationItem-root": {
    fontSize: { xs: "0.75rem", sm: "0.875rem" },
    "&.Mui-selected": {
      bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg) 88%)",
      color: "var(--ai-violet)",
      fontWeight: 700,
      "&:hover": {
        bgcolor: "color-mix(in srgb, var(--ai-violet) 18%, var(--card-bg) 82%)",
      },
    },
  },
} as const;

/** Flat result row: hairline separators; selected = soft violet tint + inset ring. */
const rowShellSx = (selected: boolean) => ({
  bgcolor: selected
    ? "color-mix(in srgb, var(--ai-violet) 6%, var(--card-bg) 94%)"
    : "transparent",
  boxShadow: selected
    ? "inset 0 0 0 1.5px color-mix(in srgb, var(--ai-violet) 40%, transparent)"
    : "none",
  transition: "background-color 0.15s ease, box-shadow 0.15s ease",
  "&:not(:last-child)": { borderBottom: HAIRLINE },
  "&:hover": {
    bgcolor: selected
      ? "color-mix(in srgb, var(--ai-violet) 9%, var(--card-bg) 91%)"
      : "color-mix(in srgb, var(--surface) 65%, var(--card-bg) 35%)",
  },
});

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"] as const;
const SOURCE_OPTIONS = ["manual", "ai_generated", "csv_import", "course_builder"] as const;

/** Compact single-value facet dropdown for the toolbar row. */
function FacetSelect({
  placeholder,
  allLabel,
  value,
  options,
  onChange,
  getLabel,
}: {
  placeholder: string;
  allLabel: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
  getLabel?: (v: string) => string;
}) {
  const label = getLabel ?? ((v: string) => v);
  return (
    <Select
      size="small"
      displayEmpty
      value={value}
      onChange={(e) => onChange(e.target.value)}
      renderValue={(v) =>
        v ? (
          <span style={{ fontWeight: 600 }}>{label(v)}</span>
        ) : (
          <span style={{ color: "var(--font-tertiary)" }}>{placeholder}</span>
        )
      }
      sx={TOOLBAR_SELECT_SX}
      MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
    >
      <MenuItem value="" sx={{ fontSize: "0.85rem" }}>
        {allLabel}
      </MenuItem>
      {options.map((o) => (
        <MenuItem key={o} value={o} sx={{ fontSize: "0.85rem" }}>
          {label(o)}
        </MenuItem>
      ))}
    </Select>
  );
}

/** Compact multi-value facet dropdown (Topic/Skill/Tag); hidden when no options. */
function FacetMultiSelect({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <Select
      multiple
      size="small"
      displayEmpty
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        onChange(typeof next === "string" ? next.split(",") : next);
      }}
      renderValue={(v) =>
        v.length ? (
          <span style={{ fontWeight: 600 }}>{`${placeholder} · ${v.length}`}</span>
        ) : (
          <span style={{ color: "var(--font-tertiary)" }}>{placeholder}</span>
        )
      }
      sx={TOOLBAR_SELECT_SX}
      MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
    >
      {options.map((o) => (
        <MenuItem key={o} value={o} sx={{ fontSize: "0.85rem", gap: 1 }}>
          <Checkbox size="small" checked={value.includes(o)} sx={{ ...CHECKBOX_SX, p: 0 }} />
          {o}
        </MenuItem>
      ))}
    </Select>
  );
}

/** Active filters as deletable chips - rendered below the toolbar only when active. */
function ActiveFacetChips({
  facets,
  onChange,
}: {
  facets: FacetState;
  onChange: (next: FacetState) => void;
}) {
  if (!hasActiveFacets(facets)) return null;
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (facets.difficulty) {
    chips.push({
      key: "difficulty",
      label: facets.difficulty,
      clear: () => onChange({ ...facets, difficulty: "" }),
    });
  }
  if (facets.source) {
    chips.push({
      key: "source",
      label: SOURCE_LABELS[facets.source] || facets.source,
      clear: () => onChange({ ...facets, source: "" }),
    });
  }
  if (facets.reusedOnly) {
    chips.push({
      key: "reused",
      label: "Reused only",
      clear: () => onChange({ ...facets, reusedOnly: false }),
    });
  }
  for (const t of facets.topics) {
    chips.push({
      key: `topic:${t}`,
      label: t,
      clear: () => onChange({ ...facets, topics: facets.topics.filter((x) => x !== t) }),
    });
  }
  for (const s of facets.skills) {
    chips.push({
      key: `skill:${s}`,
      label: s,
      clear: () => onChange({ ...facets, skills: facets.skills.filter((x) => x !== s) }),
    });
  }
  for (const g of facets.tags) {
    chips.push({
      key: `tag:${g}`,
      label: g,
      clear: () => onChange({ ...facets, tags: facets.tags.filter((x) => x !== g) }),
    });
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, px: 2, pb: 1.5 }}>
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} size="small" onDelete={c.clear} sx={ACTIVE_CHIP_SX} />
      ))}
      <Button
        size="small"
        variant="text"
        startIcon={<IconWrapper icon="mdi:filter-remove-outline" size={15} />}
        onClick={() => onChange(EMPTY_FACETS)}
        sx={{
          fontSize: "0.72rem",
          fontWeight: 600,
          textTransform: "none",
          color: "var(--font-secondary)",
        }}
      >
        Clear all
      </Button>
    </Box>
  );
}

interface SubjectiveQuestionSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  questions: AssessmentSubjectiveQuestionListItem[];
  loading: boolean;
}

export function SubjectiveQuestionSelectionSection({
  selectedIds,
  onSelectionChange,
  questions,
  loading,
}: SubjectiveQuestionSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [facets, setFacets] = useState<FacetState>(EMPTY_FACETS);
  const [preview, setPreview] = useState<AssessmentSubjectiveQuestionListItem | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const facetOptions = useMemo(() => deriveFacetOptions(questions), [questions]);

  const filtered = useMemo(() => {
    let rows = applyFacets(questions, facets);
    const t = searchTerm.trim().toLowerCase();
    if (t) {
      rows = rows.filter(
        (q) =>
          q.question_text.toLowerCase().includes(t) ||
          (q.question_type && q.question_type.toLowerCase().includes(t)) ||
          (q.topic && q.topic.toLowerCase().includes(t)) ||
          (q.skills && q.skills.toLowerCase().includes(t)) ||
          (q.tags && q.tags.toLowerCase().includes(t))
      );
    }
    return rows;
  }, [questions, searchTerm, facets]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const pageIds = paginated.map((q) => q.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const pageAllSelected =
    paginated.length > 0 && paginated.every((q) => selectedIds.includes(q.id));

  /** Facet changes always reset to page 1 (same behavior as the old FacetBar wiring). */
  const updateFacets = (next: FacetState) => {
    setFacets(next);
    setPage(1);
  };

  const toggleExpanded = (id: number) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: "var(--ai-violet)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Slim section header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
          }}
        >
          <IconWrapper icon="mdi:text-box-check-outline" size={19} color="var(--warning-500)" />
        </Box>
        <Box>
          <Typography sx={KICKER_SX}>Question bank</Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: "1.02rem",
              color: "var(--font-primary)",
              lineHeight: 1.3,
            }}
          >
            Select from Existing Written Questions
          </Typography>
        </Box>
      </Box>

      {/* Single results card: compact toolbar header + rows + pagination */}
      <Box sx={{ ...CARD_SX, overflow: "hidden" }}>
        {/* One compact toolbar row: search + facet dropdowns + selected-count chip */}
        <Box sx={{ borderBottom: HAIRLINE }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              px: 2,
              py: 1.5,
            }}
          >
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <IconWrapper icon="mdi:magnify" size={18} style={{ marginRight: 8 }} />
                ),
              }}
              sx={{ ...SEARCH_FIELD_SX, flex: "1 1 220px", minWidth: 200 }}
            />
            <FacetSelect
              placeholder="Difficulty"
              allLabel="All difficulties"
              value={facets.difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={(difficulty) => updateFacets({ ...facets, difficulty })}
            />
            <FacetSelect
              placeholder="Source"
              allLabel="All sources"
              value={facets.source}
              options={SOURCE_OPTIONS}
              getLabel={(s) => SOURCE_LABELS[s] || s}
              onChange={(source) => updateFacets({ ...facets, source })}
            />
            <FacetMultiSelect
              placeholder="Topic"
              value={facets.topics}
              options={facetOptions.topics}
              onChange={(topics) => updateFacets({ ...facets, topics })}
            />
            <FacetMultiSelect
              placeholder="Skill"
              value={facets.skills}
              options={facetOptions.skills}
              onChange={(skills) => updateFacets({ ...facets, skills })}
            />
            <FacetMultiSelect
              placeholder="Tag"
              value={facets.tags}
              options={facetOptions.tags}
              onChange={(tags) => updateFacets({ ...facets, tags })}
            />
            <Chip
              icon={<IconWrapper icon="mdi:recycle-variant" size={14} />}
              label="Reused"
              size="small"
              variant={facets.reusedOnly ? "filled" : "outlined"}
              onClick={() => updateFacets({ ...facets, reusedOnly: !facets.reusedOnly })}
              sx={{
                height: 32,
                borderRadius: "10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: facets.reusedOnly ? "var(--accent-indigo)" : "transparent",
                color: facets.reusedOnly ? "var(--font-light)" : "var(--font-secondary)",
                borderColor: "color-mix(in srgb, var(--border-default) 70%, transparent)",
                "& .MuiChip-icon": {
                  color: facets.reusedOnly ? "var(--font-light)" : "var(--font-secondary)",
                },
                "&:hover": {
                  bgcolor: facets.reusedOnly ? "var(--accent-indigo)" : "var(--surface)",
                },
              }}
            />
            <Box sx={{ flexGrow: 1 }} />
            {selectedIds.length > 0 && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  flexShrink: 0,
                  bgcolor: "color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)",
                  border: "1px solid color-mix(in srgb, var(--ai-violet) 35%, transparent)",
                }}
              >
                <IconWrapper icon="mdi:check-circle-outline" size={14} color="var(--ai-violet)" />
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--ai-violet)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Box component="span" sx={{ fontFamily: "var(--font-mono)" }}>
                    {selectedIds.length}
                  </Box>
                  {" selected"}
                </Typography>
              </Box>
            )}
          </Box>
          <ActiveFacetChips facets={facets} onChange={updateFacets} />
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                mx: "auto",
                mb: 1.5,
                bgcolor: "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
              }}
            >
              <IconWrapper icon="mdi:magnify" size={22} color="var(--warning-500)" />
            </Box>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {searchTerm ? "No matches" : "No written questions yet. Use Manual Entry or create some in Django admin."}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Select-all header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.25,
                borderBottom: HAIRLINE,
                bgcolor: "var(--surface)",
              }}
            >
              <Checkbox
                checked={pageAllSelected}
                onChange={handleSelectAll}
                sx={{ ...CHECKBOX_SX, p: 0.5 }}
              />
              <Typography sx={KICKER_SX}>Select all on page</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--font-secondary)",
                }}
              >
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </Typography>
            </Box>

            {/* Single-line-first rows; secondary metadata lives inside the expand */}
            <Box>
              {paginated.map((q) => {
                const selected = selectedIds.includes(q.id);
                const expanded = expandedIds.includes(q.id);
                return (
                  <Box key={q.id} sx={rowShellSx(selected)}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, minHeight: 48 }}>
                      <Checkbox
                        checked={selectedIds.includes(q.id)}
                        onChange={() => toggle(q.id)}
                        sx={{ ...CHECKBOX_SX, p: 0.5 }}
                      />
                      <Typography
                        noWrap
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--font-primary)",
                        }}
                      >
                        {q.question_text}
                      </Typography>
                      {q.difficulty_level && <DifficultyChip level={q.difficulty_level} />}
                      <Box
                        sx={{
                          display: { xs: "none", md: "flex" },
                          alignItems: "center",
                          gap: 0.75,
                          flexShrink: 0,
                        }}
                      >
                        <UsageChip count={q.usage_count} />
                        <SourceChip source={q.source} />
                      </Box>
                      <PreviewButton onClick={() => setPreview(q)} />
                      <IconButton
                        size="small"
                        aria-label={expanded ? "Collapse question details" : "Expand question details"}
                        onClick={() => toggleExpanded(q.id)}
                        sx={{
                          color: "var(--font-tertiary)",
                          transform: expanded ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <IconWrapper icon="mdi:chevron-down" size={18} />
                      </IconButton>
                    </Box>
                    {expanded && (
                      <Box
                        sx={{
                          pl: 6.5,
                          pr: 2,
                          pb: 1.75,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "var(--font-primary)", whiteSpace: "pre-wrap" }}
                        >
                          {q.question_text}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography
                            sx={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              color: "var(--font-tertiary)",
                            }}
                          >
                            #{q.id}
                          </Typography>
                          <StatusChip
                            label={(q.answer_mode || "text").replace(/_/g, " ")}
                            tone="info"
                            icon="mdi:pencil-box-outline"
                          />
                          <StatusChip
                            label={`${q.max_marks} marks`}
                            tone="neutral"
                            icon="mdi:star-four-points-outline"
                          />
                        </Box>
                        {q.tags && <TagChips tags={q.tags} />}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Pagination */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
                px: 2,
                py: 1.5,
                borderTop: HAIRLINE,
              }}
            >
              <PerPageSelect value={limit} onChange={(n) => { setLimit(n); setPage(1); }} />
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                size="small"
                sx={PAGINATION_SX}
              />
            </Box>
          </>
        )}
      </Box>

      <PreviewDialog
        open={!!preview}
        title={preview ? `Written question #${preview.id}` : ""}
        onClose={() => setPreview(null)}
      >
        {preview && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <SourceChip source={preview.source} />
              <UsageChip count={preview.usage_count} />
              <StatusChip
                label={(preview.answer_mode || "text").replace(/_/g, " ")}
                tone="info"
                icon="mdi:pencil-box-outline"
              />
              <StatusChip
                label={`${preview.max_marks} marks`}
                tone="neutral"
                icon="mdi:star-four-points-outline"
              />
              {preview.difficulty_level && (
                <DifficultyChip level={preview.difficulty_level} />
              )}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>
              {preview.question_text}
            </Typography>
            {preview.evaluation_prompt && (
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 600 }}>
                  Evaluation rubric
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)", whiteSpace: "pre-wrap" }}>
                  {preview.evaluation_prompt}
                </Typography>
              </Box>
            )}
            {preview.tags && <TagChips tags={preview.tags} />}
          </Box>
        )}
      </PreviewDialog>
    </Box>
  );
}
