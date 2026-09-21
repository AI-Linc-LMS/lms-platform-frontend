"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { SHEET_BUTTON_SX } from "./mobile";

/* ==========================================================================
 * The directory filters on a phone.
 *
 * The desktop card stacks four full-width fields on a phone - course, status, resume, search -
 * which is a screen of form before the first student. Search is what an admin uses every time,
 * so it stays full width; the three selects move into a bottom sheet behind one Filters button
 * that says how many are set. Each change applies immediately, as it does on a desktop.
 * ======================================================================== */

export interface PhoneStudentsFiltersProps {
  courses: Array<{ id: number; title: string }>;
  selectedCourses: string[];
  emptySelectionMeansAllCourses?: boolean;
  status: string;
  resumeFilter: "all" | "yes" | "no";
  searchTerm: string;
  onCourseChange: (value: string[]) => void;
  onStatusChange: (value: string) => void;
  onResumeFilterChange: (value: "all" | "yes" | "no") => void;
  onSearchChange: (value: string) => void;
}

export function PhoneStudentsFilters({
  courses,
  selectedCourses,
  emptySelectionMeansAllCourses = false,
  status,
  resumeFilter,
  searchTerm,
  onCourseChange,
  onStatusChange,
  onResumeFilterChange,
  onSearchChange,
}: PhoneStudentsFiltersProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const activeCount =
    (selectedCourses.length > 0 ? 1 : 0) + (status !== "all" ? 1 : 0) + (resumeFilter !== "all" ? 1 : 0);
  const filtersLabel = t("adminManageStudents.mobile.filters", "Filters");

  const clearAll = () => {
    if (selectedCourses.length > 0) onCourseChange([]);
    if (status !== "all") onStatusChange("all");
    if (resumeFilter !== "all") onResumeFilterChange("all");
  };

  return (
    <Box data-testid="phone-student-filters" sx={{ display: "flex", alignItems: "stretch", gap: 1, mb: 2 }}>
      <TextField
        fullWidth
        sx={{ flex: 1, minWidth: 0 }}
        type="search"
        placeholder={t("adminManageStudents.searchPlaceholder")}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        inputProps={{ "aria-label": t("adminManageStudents.searchTerm") }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconWrapper icon="mdi:magnify" size={20} color="var(--font-secondary)" />
            </InputAdornment>
          ),
          sx: { backgroundColor: "var(--card-bg)", borderRadius: 3, fontSize: "1rem" },
        }}
      />
      {/* Beside the search, not under it: one row of controls before the first student. */}
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={activeCount ? `${filtersLabel} (${activeCount})` : filtersLabel}
        sx={{
          flexShrink: 0,
          minWidth: 56,
          px: 1.5,
          gap: 0.5,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 800,
          fontSize: "0.875rem",
          color: activeCount ? "var(--accent-indigo)" : "var(--font-secondary)",
          borderColor: activeCount ? "var(--accent-indigo)" : "var(--border-default)",
          backgroundColor: activeCount
            ? "color-mix(in srgb, var(--accent-indigo) 8%, var(--card-bg))"
            : "var(--card-bg)",
        }}
      >
        <IconWrapper icon="mdi:tune-variant" size={22} />
        {activeCount ? <span aria-hidden>{activeCount}</span> : null}
      </Button>

      <ResponsiveDialog
        open={open}
        onClose={() => setOpen(false)}
        title={filtersLabel}
        footer={
          <>
            <Button variant="outlined" onClick={clearAll} disabled={activeCount === 0} sx={SHEET_BUTTON_SX}>
              {t("adminManageStudents.mobile.clearFilters", "Clear all")}
            </Button>
            <Button variant="contained" onClick={() => setOpen(false)} sx={SHEET_BUTTON_SX}>
              {t("adminManageStudents.mobile.done", "Done")}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="phone-course-filter-label">{t("adminManageStudents.filterByCourse")}</InputLabel>
            <Select
              labelId="phone-course-filter-label"
              multiple
              value={selectedCourses}
              onChange={(e) => {
                const value = e.target.value;
                onCourseChange(typeof value === "string" ? value.split(",").filter(Boolean) : (value as string[]));
              }}
              input={<OutlinedInput label={t("adminManageStudents.filterByCourse")} />}
              renderValue={(selected) => {
                const ids = selected as string[];
                if (!ids.length) {
                  return emptySelectionMeansAllCourses
                    ? t("adminManageStudents.allCourses")
                    : t("adminManageStudents.filterByCourse");
                }
                const titles = new Map(courses.map((c) => [String(c.id), c.title]));
                return ids.map((id) => titles.get(id) || id).join(", ");
              }}
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: "60vh" } } } }}
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id.toString()} sx={{ minHeight: 48 }}>
                  <Checkbox checked={selectedCourses.includes(course.id.toString())} />
                  <ListItemText primary={course.title} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="phone-status-filter-label">{t("adminManageStudents.status")}</InputLabel>
            <Select
              labelId="phone-status-filter-label"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              label={t("adminManageStudents.status")}
            >
              <MenuItem value="all" sx={{ minHeight: 48 }}>{t("adminManageStudents.all")}</MenuItem>
              <MenuItem value="active" sx={{ minHeight: 48 }}>{t("adminManageStudents.active")}</MenuItem>
              <MenuItem value="inactive" sx={{ minHeight: 48 }}>{t("adminManageStudents.inactive")}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="phone-resume-filter-label">{t("adminManageStudents.filterSavedResume")}</InputLabel>
            <Select
              labelId="phone-resume-filter-label"
              value={resumeFilter}
              onChange={(e) => onResumeFilterChange(e.target.value as "all" | "yes" | "no")}
              label={t("adminManageStudents.filterSavedResume")}
            >
              <MenuItem value="all" sx={{ minHeight: 48 }}>{t("adminManageStudents.all")}</MenuItem>
              <MenuItem value="yes" sx={{ minHeight: 48 }}>{t("adminManageStudents.resumeYes")}</MenuItem>
              <MenuItem value="no" sx={{ minHeight: 48 }}>{t("adminManageStudents.resumeNo")}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </ResponsiveDialog>
    </Box>
  );
}
