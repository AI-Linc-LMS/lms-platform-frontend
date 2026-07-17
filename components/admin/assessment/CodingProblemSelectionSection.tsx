"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Checkbox,
  CircularProgress,
  TextField,
  Pagination,
  IconButton,
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
  FacetBar,
  FacetState,
  EMPTY_FACETS,
  applyFacets,
  deriveFacetOptions,
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

/** Soft result-row card; selected = violet ring + tint (style contract). */
const rowCardSx = (selected: boolean) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 1,
  px: 1.5,
  py: 1.5,
  borderRadius: "12px",
  bgcolor: selected
    ? "color-mix(in srgb, var(--ai-violet) 7%, var(--card-bg) 93%)"
    : "var(--card-bg)",
  border: selected
    ? "1.5px solid var(--ai-violet)"
    : "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
  transition: "border-color 0.15s ease, background-color 0.15s ease",
  "&:hover": {
    borderColor: selected
      ? "var(--ai-violet)"
      : "color-mix(in srgb, var(--ai-violet) 45%, var(--border-default) 55%)",
  },
});

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: "var(--ai-violet)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              bgcolor:
                "color-mix(in srgb, var(--success-500) 12%, var(--card-bg) 88%)",
            }}
          >
            <IconWrapper
              icon="mdi:code-braces"
              size={21}
              color="var(--success-500)"
            />
          </Box>
          <Box>
            <Typography sx={KICKER_SX}>Problem bank</Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-jakarta)",
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--font-primary)",
                lineHeight: 1.3,
              }}
            >
              Select from Existing Coding Problems
            </Typography>
          </Box>
        </Box>
        {selectedIds.length > 0 && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              bgcolor:
                "color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)",
              border:
                "1px solid color-mix(in srgb, var(--ai-violet) 35%, transparent)",
            }}
          >
            <IconWrapper
              icon="mdi:check-circle-outline"
              size={15}
              color="var(--ai-violet)"
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "var(--ai-violet)" }}
            >
              Selected: {selectedIds.length} Problem(s) | Showing: {filteredProblems.length} of {codingProblems.length} total
            </Typography>
          </Box>
        )}
      </Box>

      {/* Search + facet filters grouped in one card */}
      <Box sx={{ ...CARD_SX, p: { xs: 2, sm: 2.5 } }}>
        <Typography sx={{ ...KICKER_SX, mb: 1.5 }}>Search & filters</Typography>
        <TextField
          label="Search Coding Problems"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <IconWrapper icon="mdi:magnify" size={20} style={{ marginRight: 8 }} />
            ),
          }}
          sx={SEARCH_FIELD_SX}
        />
        <Box sx={{ mt: 2 }}>
          <FacetBar
            facets={facets}
            options={facetOptions}
            onChange={(next) => {
              setFacets(next);
              setPage(1);
            }}
          />
        </Box>
      </Box>

      {filteredProblems.length === 0 ? (
        <Box sx={{ ...CARD_SX, p: 4, textAlign: "center" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              mx: "auto",
              mb: 1.5,
              bgcolor:
                "color-mix(in srgb, var(--success-500) 12%, var(--card-bg) 88%)",
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
        <Box sx={{ ...CARD_SX, overflow: "hidden" }}>
          {/* Select-all header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 2,
              py: 0.75,
              borderBottom: "1px solid var(--border-default)",
              bgcolor: "var(--surface)",
            }}
          >
            <Checkbox
              checked={isAllSelected}
              indeterminate={
                selectedIds.length > 0 && !isAllSelected
              }
              onChange={handleSelectAll}
              sx={CHECKBOX_SX}
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

          {/* Result rows as soft cards */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              p: { xs: 1.5, sm: 2 },
            }}
          >
            {paginatedProblems.map((problem) => {
              const selected = selectedIds.includes(problem.id);
              return (
                <Box key={problem.id} sx={rowCardSx(selected)}>
                  <Checkbox
                    checked={selectedIds.includes(problem.id)}
                    onChange={() => handleToggle(problem.id)}
                    sx={{ ...CHECKBOX_SX, p: 0.5 }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-tertiary)",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                        }}
                      >
                        #{problem.id}
                      </Typography>
                      {problem.difficulty_level ? (
                        <DifficultyChip level={problem.difficulty_level} />
                      ) : (
                        <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                          -
                        </Typography>
                      )}
                      <UsageChip count={problem.usage_count} />
                      <SourceChip source={problem.source} />
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton
                        size="small"
                        onClick={() => setPreviewProblem(problem)}
                        sx={{ color: "var(--accent-indigo)" }}
                        title="Preview"
                      >
                        <IconWrapper icon="mdi:eye-outline" size={18} />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        mt: 0.75,
                      }}
                    >
                      {problem.title}
                    </Typography>
                    {problem.problem_statement && (
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", display: "block", mt: 0.5 }}
                      >
                        {problem.problem_statement.length > 100
                          ? problem.problem_statement.substring(0, 100) + "..."
                          : problem.problem_statement}
                      </Typography>
                    )}
                    {problem.tags ? (
                      <Box sx={{ mt: 1 }}>
                        <TagChips tags={problem.tags} />
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Pagination */}
          {filteredProblems.length > 0 && (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderTop: "1px solid var(--border-default)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
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
                color="primary"
                size="small"
                showFirstButton={false}
                showLastButton={false}
                boundaryCount={1}
                siblingCount={0}
                disabled={totalPages <= 1}
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}

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
