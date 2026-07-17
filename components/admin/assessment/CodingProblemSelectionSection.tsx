"use client";

import { useState, useMemo } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CodingProblemListItem } from "@/lib/services/admin/admin-assessment.service";
import { ProblemDescription } from "@/components/coding/ProblemDescription";
import { DifficultyChip } from "@/components/admin/assessment/shared";
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

/** Active-facet chip — wraps below the toolbar only when a filter is active. */
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

/** Active filters as deletable chips — rendered below the toolbar only when active. */
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

interface CodingProblemSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  codingProblems: CodingProblemListItem[];
  loading: boolean;
}

export function CodingProblemSelectionSection({
  selectedIds,
  onSelectionChange,
  codingProblems,
  loading,
}: CodingProblemSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [facets, setFacets] = useState<FacetState>(EMPTY_FACETS);
  const [previewProblem, setPreviewProblem] = useState<CodingProblemListItem | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const facetOptions = useMemo(() => deriveFacetOptions(codingProblems), [codingProblems]);

  const problemDataForPreview = (problem: CodingProblemListItem) => {
    const details = { ...problem } as Record<string, unknown>;
    details.title = problem.title;
    details.name = problem.title;
    details.problem_title = problem.title;
    details.problem_statement = problem.problem_statement ?? (problem as any).description ?? "";
    if (problem.solution && typeof problem.solution === "object" && !Array.isArray(problem.solution)) {
      details.pseudo_code = Object.entries(problem.solution)
        .map(([lang, code]) => `[${lang}]\n${code}`)
        .join("\n\n");
    }
    return {
      content_title: problem.title,
      details,
    };
  };

  const filteredProblems = useMemo(() => {
    let rows = applyFacets(codingProblems, facets);
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (problem) =>
          problem.title?.toLowerCase().includes(term) ||
          problem.problem_statement?.toLowerCase().includes(term) ||
          problem.topic?.toLowerCase().includes(term) ||
          problem.skills?.toLowerCase().includes(term) ||
          problem.tags?.toLowerCase().includes(term)
      );
    }
    return rows;
  }, [codingProblems, searchTerm, facets]);

  const paginatedProblems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredProblems.slice(startIndex, endIndex);
  }, [filteredProblems, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / limit));

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const pageIds = paginatedProblems.map((problem) => problem.id);
    // Branch on isAllSelected (this page's rows), not a raw count comparison.
    if (isAllSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const isAllSelected = paginatedProblems.length > 0 && paginatedProblems.every((problem) => selectedIds.includes(problem.id));

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
            bgcolor: "color-mix(in srgb, var(--success-500) 12%, var(--card-bg) 88%)",
          }}
        >
          <IconWrapper icon="mdi:code-braces" size={19} color="var(--success-500)" />
        </Box>
        <Box>
          <Typography sx={KICKER_SX}>Problem bank</Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: "1.02rem",
              color: "var(--font-primary)",
              lineHeight: 1.3,
            }}
          >
            Select from Existing Coding Problems
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
              label="Search Coding Problems"
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

        {filteredProblems.length === 0 ? (
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
                bgcolor: "color-mix(in srgb, var(--success-500) 12%, var(--card-bg) 88%)",
              }}
            >
              <IconWrapper icon="mdi:magnify" size={22} color="var(--success-500)" />
            </Box>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {searchTerm
                ? "No coding problems found matching your search"
                : "No coding problems available. Please add coding problems first."}
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
                checked={isAllSelected}
                indeterminate={selectedIds.length > 0 && !isAllSelected}
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
                {filteredProblems.length} result{filteredProblems.length === 1 ? "" : "s"}
              </Typography>
            </Box>

            {/* Single-line-first rows; secondary metadata lives inside the expand */}
            <Box>
              {paginatedProblems.map((problem) => {
                const selected = selectedIds.includes(problem.id);
                const expanded = expandedIds.includes(problem.id);
                return (
                  <Box key={problem.id} sx={rowShellSx(selected)}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, minHeight: 48 }}>
                      <Checkbox
                        checked={selectedIds.includes(problem.id)}
                        onChange={() => handleToggle(problem.id)}
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
                        {problem.title}
                      </Typography>
                      {problem.difficulty_level && <DifficultyChip level={problem.difficulty_level} />}
                      <Box
                        sx={{
                          display: { xs: "none", md: "flex" },
                          alignItems: "center",
                          gap: 0.75,
                          flexShrink: 0,
                        }}
                      >
                        <UsageChip count={problem.usage_count} />
                        <SourceChip source={problem.source} />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setPreviewProblem(problem)}
                        sx={{ color: "var(--font-secondary)" }}
                        title="Preview"
                      >
                        <IconWrapper icon="mdi:eye-outline" size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={expanded ? "Collapse problem details" : "Expand problem details"}
                        onClick={() => toggleExpanded(problem.id)}
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography
                            sx={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              color: "var(--font-tertiary)",
                            }}
                          >
                            #{problem.id}
                          </Typography>
                          {problem.topic && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <IconWrapper
                                icon="mdi:shape-outline"
                                size={13}
                                color="var(--font-tertiary)"
                              />
                              <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                                {problem.topic}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {problem.problem_statement && (
                          <Typography
                            variant="body2"
                            sx={{ color: "var(--font-secondary)" }}
                          >
                            {problem.problem_statement.length > 240
                              ? problem.problem_statement.substring(0, 240) + "..."
                              : problem.problem_statement}
                          </Typography>
                        )}
                        {problem.tags ? <TagChips tags={problem.tags} /> : null}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Pagination */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderTop: HAIRLINE,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Showing{" "}
                  {Math.min(filteredProblems.length, (page - 1) * limit + 1)} to{" "}
                  {Math.min(filteredProblems.length, page * limit)} of{" "}
                  {filteredProblems.length} problems
                </Typography>
                <PerPageSelect
                  value={limit}
                  onChange={(v) => {
                    setLimit(v);
                    setPage(1);
                  }}
                  displayEmpty
                  SelectSx={{ "& .MuiInputBase-root": { fontSize: { xs: "0.75rem", sm: "0.875rem" } } }}
                />
              </Box>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                size="small"
                showFirstButton={false}
                showLastButton={false}
                boundaryCount={1}
                siblingCount={0}
                disabled={totalPages <= 1}
                sx={PAGINATION_SX}
              />
            </Box>
          </>
        )}
      </Box>

      <Dialog
        open={!!previewProblem}
        onClose={() => setPreviewProblem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: "90vh", borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Problem Preview</span>
          <IconButton
            size="small"
            onClick={() => setPreviewProblem(null)}
            aria-label="Close"
          >
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          {previewProblem && (
            <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
              <ProblemDescription
                problemData={problemDataForPreview(previewProblem)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
