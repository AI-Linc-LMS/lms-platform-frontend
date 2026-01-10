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
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface Course {
  id: number;
  title: string;
}

interface StudentsFiltersProps {
  courses: Course[];
  selectedCourse: string;
  status: string;
  searchTerm: string;
  onCourseChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function StudentsFilters({
  courses,
  selectedCourse,
  status,
  searchTerm,
  onCourseChange,
  onStatusChange,
  onSearchChange,
}: StudentsFiltersProps) {
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
            Filter by Enrolled Course
          </InputLabel>
          <Select
            labelId="course-filter-label"
            value={selectedCourse}
            onChange={(e) => onCourseChange(e.target.value)}
            label="Filter by Enrolled Course"
          >
            <MenuItem value="">All Courses</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id.toString()}>
                {course.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl fullWidth>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        {/* Search Term */}
        <TextField
          fullWidth
          label="Search Term"
          placeholder="Search by name or email..."
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

