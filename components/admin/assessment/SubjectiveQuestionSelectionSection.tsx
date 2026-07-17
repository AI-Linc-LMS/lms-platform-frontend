"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Checkbox,
  CircularProgress,
  TextField,
  Pagination,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { AssessmentSubjectiveQuestionListItem } from "@/lib/services/admin/admin-assessment.service";
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: "var(--ai-violet)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Selection summary band */}
      <Box sx={{ ...CARD_SX, p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            bgcolor:
              "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
          }}
        >
          <IconWrapper
            icon="mdi:text-box-check-outline"
            size={21}
            color="var(--warning-500)"
          />
        </Box>
        <Box>
          <Typography sx={KICKER_SX}>Question bank</Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "var(--font-primary)" }}
          >
            Selected: {selectedIds.length} | Showing: {filtered.length} of {questions.length}
          </Typography>
        </Box>
      </Box>

      {/* Search + facet filters grouped in one card */}
      <Box sx={{ ...CARD_SX, p: { xs: 2, sm: 2.5 } }}>
        <Typography sx={{ ...KICKER_SX, mb: 1.5 }}>Search & filters</Typography>
        <TextField
          label="Search"
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

      {filtered.length === 0 ? (
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
                "color-mix(in srgb, var(--warning-500) 12%, var(--card-bg) 88%)",
            }}
          >
            <IconWrapper icon="mdi:magnify" size={22} color="var(--warning-500)" />
          </Box>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {searchTerm ? "No matches" : "No written questions yet. Use Manual Entry or create some in Django admin."}
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
              checked={pageAllSelected}
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
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
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
            {paginated.map((q) => {
              const selected = selectedIds.includes(q.id);
              return (
                <Box key={q.id} sx={rowCardSx(selected)}>
                  <Checkbox
                    checked={selectedIds.includes(q.id)}
                    onChange={() => toggle(q.id)}
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
                      <UsageChip count={q.usage_count} />
                      <SourceChip source={q.source} />
                      <Box sx={{ flexGrow: 1 }} />
                      <PreviewButton onClick={() => setPreview(q)} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        mt: 0.75,
                      }}
                    >
                      {q.question_text.length > 160 ? `${q.question_text.slice(0, 160)}…` : q.question_text}
                    </Typography>
                  </Box>
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
              p: 1.5,
              borderTop: "1px solid var(--border-default)",
            }}
          >
            <PerPageSelect value={limit} onChange={(n) => { setLimit(n); setPage(1); }} />
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              size="small"
            />
          </Box>
        </Box>
      )}

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
