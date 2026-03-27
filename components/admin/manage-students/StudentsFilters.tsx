"use client";

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  InputAdornment,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface Course {
  id: number;
  title: string;
}

interface StudentsFiltersProps {
  courses: Course[];
  selectedCourses: string[];
  status: string;
  searchTerm: string;
  onCourseChange: (value: string[]) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function StudentsFilters({
  courses,
  selectedCourses,
  status,
  searchTerm,
  onCourseChange,
  onStatusChange,
  onSearchChange,
}: StudentsFiltersProps) {
  const { t } = useTranslation("common");
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        mb: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {/* Filter by Enrolled Course */}
        <FormControl fullWidth>
          <InputLabel id="course-filter-label">
            {t("adminManageStudents.filterByCourse")}
          </InputLabel>
          <Select
            labelId="course-filter-label"
            multiple
            value={selectedCourses}
            onChange={(e) => {
              const value = e.target.value;
              onCourseChange(
                typeof value === "string"
                  ? value.split(",").filter(Boolean)
                  : (value as string[])
              );
            }}
            input={<OutlinedInput label={t("adminManageStudents.filterByCourse")} />}
            renderValue={(selected) => {
              const selectedIds = selected as string[];
              if (!selectedIds.length) return t("adminManageStudents.filterByCourse");
              const titleMap = new Map(courses.map((c) => [String(c.id), c.title]));
              return selectedIds
                .map((id) => titleMap.get(id) || id)
                .join(", ");
            }}
            label={t("adminManageStudents.filterByCourse")}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id.toString()}>
                <Checkbox
                  size="small"
                  checked={selectedCourses.includes(course.id.toString())}
                />
                <ListItemText primary={course.title} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl fullWidth>
          <InputLabel id="status-filter-label">{t("adminManageStudents.status")}</InputLabel>
          <Select
            labelId="status-filter-label"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            label={t("adminManageStudents.status")}
          >
            <MenuItem value="all">{t("adminManageStudents.all")}</MenuItem>
            <MenuItem value="active">{t("adminManageStudents.active")}</MenuItem>
            <MenuItem value="inactive">{t("adminManageStudents.inactive")}</MenuItem>
          </Select>
        </FormControl>

        {/* Search Term */}
        <TextField
          fullWidth
          label={t("adminManageStudents.searchTerm")}
          placeholder={t("adminManageStudents.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} color="#6b7280" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}

