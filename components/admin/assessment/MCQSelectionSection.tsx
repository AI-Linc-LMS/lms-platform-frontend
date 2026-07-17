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
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { MCQListItem } from "@/lib/services/admin/admin-assessment.service";
import { DifficultyChip, StatusChip } from "@/components/admin/assessment/shared";
import {
  FacetBar,
  FacetState,
  EMPTY_FACETS,
  applyFacets,
  deriveFacetOptions,
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

interface MCQSelectionSectionProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  mcqs: MCQListItem[];
  loading: boolean;
}

export function MCQSelectionSection({
  selectedIds,
  onSelectionChange,
  mcqs,
  loading,
}: MCQSelectionSectionProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [facets, setFacets] = useState<FacetState>(EMPTY_FACETS);
  const [preview, setPreview] = useState<MCQListItem | null>(null);
  const facetOptions = useMemo(() => deriveFacetOptions(mcqs), [mcqs]);

  const filteredMCQs = useMemo(() => {
    let rows = applyFacets(mcqs, facets);
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (mcq) =>
          mcq.question_text.toLowerCase().includes(term) ||
          mcq.topic?.toLowerCase().includes(term) ||
          mcq.skills?.toLowerCase().includes(term) ||
          mcq.tags?.toLowerCase().includes(term)
      );
    }
    return rows;
  }, [mcqs, searchTerm, facets]);

  const paginatedMCQs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredMCQs.slice(startIndex, endIndex);
  }, [filteredMCQs, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredMCQs.length / limit));

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const pageIds = paginatedMCQs.map((mcq) => mcq.id);
    // Branch on whether THIS page's rows are all selected (isAllSelected), not on a
    // raw count comparison — otherwise cross-page selections make the header checkbox
    // toggle the wrong way.
    if (isAllSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...pageIds])]);
    }
  };

  const isAllSelected = paginatedMCQs.length > 0 && paginatedMCQs.every((mcq) => selectedIds.includes(mcq.id));

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
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
            }}
          >
            <IconWrapper
              icon="mdi:format-list-checks"
              size={21}
              color="var(--accent-indigo)"
            />
          </Box>
          <Box>
            <Typography sx={KICKER_SX}>Question bank</Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-jakarta)",
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--font-primary)",
                lineHeight: 1.3,
              }}
            >
              Select from Existing Questions
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
              Selected: {selectedIds.length} MCQ(s) | Showing: {filteredMCQs.length} of {mcqs.length} total
            </Typography>
          </Box>
        )}
      </Box>

      {/* Search + facet filters grouped in one card */}
      <Box sx={{ ...CARD_SX, p: { xs: 2, sm: 2.5 } }}>
        <Typography sx={{ ...KICKER_SX, mb: 1.5 }}>Search & filters</Typography>
        <TextField
          label="Search Questions"
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

      {filteredMCQs.length === 0 ? (
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
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
            }}
          >
            <IconWrapper icon="mdi:magnify" size={22} color="var(--accent-indigo)" />
          </Box>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {searchTerm
              ? "No questions found matching your search"
              : "No questions available. Please add questions first."}
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
              {filteredMCQs.length} result{filteredMCQs.length === 1 ? "" : "s"}
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
            {paginatedMCQs.map((mcq) => {
              const selected = selectedIds.includes(mcq.id);
              return (
                <Box key={mcq.id} sx={rowCardSx(selected)}>
                  <Checkbox
                    checked={selectedIds.includes(mcq.id)}
                    onChange={() => handleToggle(mcq.id)}
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
                        #{mcq.id}
                      </Typography>
                      {mcq.difficulty_level ? (
                        <DifficultyChip level={mcq.difficulty_level} />
                      ) : (
                        <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                          -
                        </Typography>
                      )}
                      <StatusChip
                        label={`Correct: ${mcq.correct_option}`}
                        tone="success"
                        icon="mdi:check-circle-outline"
                      />
                      <UsageChip count={mcq.usage_count} />
                      <SourceChip source={mcq.source} />
                      <Box sx={{ flexGrow: 1 }} />
                      <PreviewButton onClick={() => setPreview(mcq)} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        mt: 0.75,
                      }}
                    >
                      {mcq.question_text}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <IconWrapper
                        icon="mdi:shape-outline"
                        size={13}
                        color="var(--font-tertiary)"
                      />
                      <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                        {mcq.topic || "-"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      <Chip
                        label={`A: ${mcq.option_a.length > 30 ? mcq.option_a.substring(0, 30) + "..." : mcq.option_a}`}
                        size="small"
                        sx={{
                          bgcolor:
                            mcq.correct_option === "A"
                              ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                              : "var(--surface)",
                          color:
                            mcq.correct_option === "A"
                              ? "var(--success-500)"
                              : "var(--font-primary)",
                          fontWeight: mcq.correct_option === "A" ? 600 : 400,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      <Chip
                        label={`B: ${mcq.option_b.length > 30 ? mcq.option_b.substring(0, 30) + "..." : mcq.option_b}`}
                        size="small"
                        sx={{
                          bgcolor:
                            mcq.correct_option === "B"
                              ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                              : "var(--surface)",
                          color:
                            mcq.correct_option === "B"
                              ? "var(--success-500)"
                              : "var(--font-primary)",
                          fontWeight: mcq.correct_option === "B" ? 600 : 400,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      <Chip
                        label={`C: ${mcq.option_c.length > 30 ? mcq.option_c.substring(0, 30) + "..." : mcq.option_c}`}
                        size="small"
                        sx={{
                          bgcolor:
                            mcq.correct_option === "C"
                              ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                              : "var(--surface)",
                          color:
                            mcq.correct_option === "C"
                              ? "var(--success-500)"
                              : "var(--font-primary)",
                          fontWeight: mcq.correct_option === "C" ? 600 : 400,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      <Chip
                        label={`D: ${mcq.option_d.length > 30 ? mcq.option_d.substring(0, 30) + "..." : mcq.option_d}`}
                        size="small"
                        sx={{
                          bgcolor:
                            mcq.correct_option === "D"
                              ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                              : "var(--surface)",
                          color:
                            mcq.correct_option === "D"
                              ? "var(--success-500)"
                              : "var(--font-primary)",
                          fontWeight: mcq.correct_option === "D" ? 600 : 400,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Pagination */}
          {filteredMCQs.length > 0 && (
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
                  {Math.min(filteredMCQs.length, (page - 1) * limit + 1)} to{" "}
                  {Math.min(filteredMCQs.length, page * limit)} of{" "}
                  {filteredMCQs.length} questions
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

      <PreviewDialog
        open={!!preview}
        title={preview ? `MCQ #${preview.id}` : ""}
        onClose={() => setPreview(null)}
      >
        {preview && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <SourceChip source={preview.source} />
              <UsageChip count={preview.usage_count} />
              {preview.difficulty_level && (
                <DifficultyChip level={preview.difficulty_level} />
              )}
              {preview.topic && (
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                  {preview.topic}
                </Typography>
              )}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {preview.question_text}
            </Typography>
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const val = preview[`option_${opt.toLowerCase()}` as "option_a"];
              const isCorrect =
                preview.correct_option === opt ||
                (preview.correct_options || []).includes(opt);
              return (
                <Box
                  key={opt}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    border: "1px solid var(--border-default)",
                    bgcolor: isCorrect
                      ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                      : "var(--surface)",
                    display: "flex",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20 }}>
                    {opt}
                  </Typography>
                  <Typography variant="body2">{val}</Typography>
                  {isCorrect && (
                    <IconWrapper
                      icon="mdi:check-circle"
                      size={18}
                      style={{ marginLeft: "auto", color: "var(--success-500)" }}
                    />
                  )}
                </Box>
              );
            })}
            {preview.explanation && (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontWeight: 600 }}>
                  Explanation
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {preview.explanation}
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
