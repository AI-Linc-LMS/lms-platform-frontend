"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  PHONE_FIELD_SX,
  PhoneSheet,
  TAP,
  useIsPhone,
} from "@/components/admin/adminPhone";
import { PHONE } from "@/components/common/mobile/phone";
import type { InstructorListStatus } from "@/lib/services/admin/admin-instructors.service";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  facetsForTab,
  type InstructorFilters,
  type JoinedWindow,
  type TriState,
} from "./instructorFilters";

export interface CourseChoice {
  key: string;
  title: string;
}

interface InstructorFilterBarProps {
  tab: InstructorListStatus;
  filters: InstructorFilters;
  onChange: (next: InstructorFilters) => void;
  /** Courses offered by the "assigned to" facet. Empty hides that facet entirely. */
  courseChoices: CourseChoice[];
  /** Rows passing the current search + filters, for the "showing N of M" line. */
  shownCount: number;
  totalCount: number;
}

const SELECT_SX = {
  minWidth: 168,
  "& .MuiInputBase-root": {
    backgroundColor: "var(--card-bg)",
    borderRadius: 2,
  },
  ...PHONE_FIELD_SX,
} as const;

export function InstructorFilterBar({
  tab,
  filters,
  onChange,
  courseChoices,
  shownCount,
  totalCount,
}: InstructorFilterBarProps) {
  const { t } = useTranslation("common");
  const isPhone = useIsPhone();
  const [sheetOpen, setSheetOpen] = useState(false);

  const facets = facetsForTab(tab);
  const activeCount = activeFilterCount(filters, tab);
  const set = <K extends keyof InstructorFilters>(
    key: K,
    value: InstructorFilters[K]
  ) => onChange({ ...filters, [key]: value });

  const triField = (
    key: "courses" | "code" | "cv",
    label: string,
    yesLabel: string,
    noLabel: string
  ) => (
    <TextField
      key={key}
      select
      size="small"
      label={label}
      value={filters[key]}
      onChange={(e) => set(key, e.target.value as TriState)}
      sx={SELECT_SX}
      inputProps={{ "data-testid": `filter-${key}` }}
    >
      <MenuItem value="any">{t("adminInstructors.filters.any", { defaultValue: "Any" })}</MenuItem>
      <MenuItem value="yes">{yesLabel}</MenuItem>
      <MenuItem value="no">{noLabel}</MenuItem>
    </TextField>
  );

  const fields = (
    <>
      {facets.includes("courses") &&
        triField(
          "courses",
          t("adminInstructors.filters.courses", { defaultValue: "Courses" }),
          t("adminInstructors.filters.coursesAssigned", { defaultValue: "Has courses" }),
          t("adminInstructors.filters.coursesNone", { defaultValue: "No courses" })
        )}

      {facets.includes("code") &&
        triField(
          "code",
          t("adminInstructors.filters.code", { defaultValue: "Instructor code" }),
          t("adminInstructors.filters.codeHas", { defaultValue: "Has a code" }),
          t("adminInstructors.filters.codeMissing", { defaultValue: "No code" })
        )}

      {facets.includes("cv") &&
        triField(
          "cv",
          t("adminInstructors.filters.cv", { defaultValue: "CV" }),
          t("adminInstructors.filters.cvHas", { defaultValue: "CV uploaded" }),
          t("adminInstructors.filters.cvMissing", { defaultValue: "No CV" })
        )}

      {facets.includes("course") && courseChoices.length > 0 && (
        <TextField
          select
          size="small"
          label={t("adminInstructors.filters.assignedTo", { defaultValue: "Assigned to" })}
          value={filters.course}
          onChange={(e) => set("course", e.target.value)}
          sx={{ ...SELECT_SX, minWidth: 220 }}
          inputProps={{ "data-testid": "filter-course" }}
        >
          <MenuItem value="">
            {t("adminInstructors.filters.anyCourse", { defaultValue: "Any course" })}
          </MenuItem>
          {courseChoices.map((c) => (
            <MenuItem key={c.key} value={c.key}>
              {c.title}
            </MenuItem>
          ))}
        </TextField>
      )}

      {facets.includes("joined") && (
        <TextField
          select
          size="small"
          label={t("adminInstructors.filters.joined", { defaultValue: "Joined" })}
          value={filters.joined}
          onChange={(e) => set("joined", e.target.value as JoinedWindow)}
          sx={SELECT_SX}
          inputProps={{ "data-testid": "filter-joined" }}
        >
          <MenuItem value="any">
            {t("adminInstructors.filters.anyTime", { defaultValue: "Any time" })}
          </MenuItem>
          <MenuItem value="7">
            {t("adminInstructors.filters.last7", { defaultValue: "Last 7 days" })}
          </MenuItem>
          <MenuItem value="30">
            {t("adminInstructors.filters.last30", { defaultValue: "Last 30 days" })}
          </MenuItem>
          <MenuItem value="90">
            {t("adminInstructors.filters.last90", { defaultValue: "Last 90 days" })}
          </MenuItem>
        </TextField>
      )}
    </>
  );

  const countLine =
    shownCount === totalCount
      ? null
      : (
        <Typography
          data-testid="filter-count"
          sx={{ fontSize: "0.8125rem", color: "var(--font-secondary)" }}
        >
          {t("adminInstructors.filters.showing", {
            defaultValue: `Showing ${shownCount} of ${totalCount}`,
            shown: shownCount,
            total: totalCount,
          })}
        </Typography>
      );

  // On a phone the selects would push the table off the bottom of the screen, so they go
  // behind one button that carries the active count — the count is what makes a collapsed
  // filter honest, since a narrowed table otherwise looks like a short list.
  if (isPhone) {
    return (
      <>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setSheetOpen(true)}
            data-testid="filters-open"
            startIcon={<IconWrapper icon="mdi:filter-variant" size={18} />}
            sx={{
              minHeight: TAP,
              borderRadius: 2,
              textTransform: "none",
              borderColor: "var(--border-default)",
              color: "var(--font-primary)",
            }}
          >
            {t("adminInstructors.filters.title", { defaultValue: "Filters" })}
            {activeCount > 0 && (
              <Chip
                size="small"
                label={activeCount}
                sx={{ ml: 0.75, height: 20, fontSize: "0.6875rem", fontWeight: 700 }}
                color="primary"
              />
            )}
          </Button>
          {countLine}
        </Stack>

        <PhoneSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          busy={false}
          title={t("adminInstructors.filters.title", { defaultValue: "Filters" })}
          cancelLabel={t("common.close", { defaultValue: "Close" }) as string}
          confirmLabel={t("adminInstructors.filters.clear", { defaultValue: "Clear all" })}
          onConfirm={() => {
            onChange(EMPTY_FILTERS);
            setSheetOpen(false);
          }}
          confirmDisabled={activeCount === 0}
        >
          <Stack spacing={2} sx={{ pt: 1 }}>
            {fields}
          </Stack>
        </PhoneSheet>
      </>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      {fields}
      {activeCount > 0 && (
        <Button
          onClick={() => onChange(EMPTY_FILTERS)}
          data-testid="filters-clear"
          sx={{
            textTransform: "none",
            color: "var(--font-secondary)",
            minHeight: 40,
            [PHONE]: { minHeight: TAP },
          }}
          startIcon={<IconWrapper icon="mdi:close" size={16} />}
        >
          {t("adminInstructors.filters.clear", { defaultValue: "Clear all" })}
        </Button>
      )}
      {countLine}
    </Box>
  );
}
