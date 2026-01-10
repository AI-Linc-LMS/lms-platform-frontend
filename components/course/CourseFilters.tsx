"use client";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Grid,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Course } from "./interfaces";

interface CourseFiltersProps {
  courses: Course[];
  filters: {
    category: string;
    subCategory: string;
    status: string;
    instructor: string;
    price: string;
    rating: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSortClick: () => void;
  showFilterButton?: boolean;
  onFilterButtonClick?: () => void;
}

// Extract unique values from courses
const getUniqueInstructors = (courses: Course[]): string[] => {
  const instructors = new Set<string>();
  courses.forEach((course) => {
    course.instructors?.forEach((instructor) => {
      if (instructor.name) {
        instructors.add(instructor.name);
      }
    });
  });
  return Array.from(instructors).sort();
};

// Extract unique tags from courses
const getUniqueTags = (courses: Course[]): string[] => {
  const tags = new Set<string>();
  courses.forEach((course) => {
    course.tags?.forEach((tag) => {
      if (tag) {
        tags.add(tag);
      }
    });
  });
  return Array.from(tags).sort();
};

// Mock categories - replace with actual data from API if available
const CATEGORIES = [
  "All",
  "Full Stack Development",
  "Front-End Development",
  "Back-End Development",
  "UI/UX Design",
  "Data Science & Analytics",
  "Marketing",
  "Business",
];

const SUB_CATEGORIES = [
  "All",
  "Graphic Design",
  "Web Design",
  "Digital Marketing",
];

const STATUS_OPTIONS = ["All", "Active", "Yet to Enroll"];

const PRICE_OPTIONS = ["All", "Free", "Paid"];


export const CourseFilters: React.FC<CourseFiltersProps> = ({
  courses,
  filters,
  onFilterChange,
  onApply,
  onClear,
  searchTerm,
  onSearchChange,
  onSortClick,
  showFilterButton = false,
  onFilterButtonClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const instructors = getUniqueInstructors(courses);
  const hasActiveFilters =
    filters.category !== "All" ||
    filters.subCategory !== "All" ||
    filters.status !== "All" ||
    filters.instructor !== "All" ||
    filters.price !== "All";

  return (
    <Box>
      {/* Top Header Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#1a1f2e",
          }}
        >
          Course List
        </Typography>

        {/* Right side controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            sx={{
              width: { xs: "100%", sm: 200 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                backgroundColor: "#ffffff",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box
                    sx={{
                      backgroundColor: "#f3f4f6",
                      borderRadius: 0.5,
                      px: 0.5,
                      py: 0.25,
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontFamily: "monospace",
                    }}
                  >
                    ⌘K
                  </Box>
                </InputAdornment>
              ),
            }}
          />

          {/* Filter Button */}
          {showFilterButton && (
            <Button
              variant={hasActiveFilters ? "outlined" : "outlined"}
              onClick={onFilterButtonClick}
              startIcon={<IconWrapper icon="mdi:filter" size={18} />}
              sx={{
                borderColor: hasActiveFilters ? "#6366f1" : "#e5e7eb",
                color: hasActiveFilters ? "#6366f1" : "#6b7280",
                textTransform: "none",
                px: 2,
                "&:hover": {
                  borderColor: "#6366f1",
                  backgroundColor: hasActiveFilters ? "#eef2ff" : "#f9fafb",
                },
              }}
            >
              Filter
            </Button>
          )}

          {/* Sort by */}
          <Button
            variant="outlined"
            onClick={onSortClick}
            startIcon={<IconWrapper icon="mdi:sort" size={18} />}
            sx={{
              borderColor: "#e5e7eb",
              color: "#6b7280",
              textTransform: "none",
              px: 2,
              "&:hover": {
                borderColor: "#d1d5db",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Sort by
          </Button>
        </Box>
      </Box>

      {/* Filter Dropdowns Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Categories */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4, lg: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel
              sx={{
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              Categories
            </InputLabel>
            <Select
              value={filters.category}
              label="Categories"
              onChange={(e) => onFilterChange("category", e.target.value)}
              sx={{
                fontSize: "0.875rem",
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e5e7eb",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sub categories */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4, lg: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel
              sx={{
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              Sub categories
            </InputLabel>
            <Select
              value={filters.subCategory}
              label="Sub categories"
              onChange={(e) => onFilterChange("subCategory", e.target.value)}
              sx={{
                fontSize: "0.875rem",
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e5e7eb",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              {SUB_CATEGORIES.map((subCat) => (
                <MenuItem key={subCat} value={subCat}>
                  {subCat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4, lg: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel
              sx={{
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              Status
            </InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => onFilterChange("status", e.target.value)}
              sx={{
                fontSize: "0.875rem",
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e5e7eb",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Instructor */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4, lg: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel
              sx={{
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              Instructor
            </InputLabel>
            <Select
              value={filters.instructor}
              label="Instructor"
              onChange={(e) => onFilterChange("instructor", e.target.value)}
              sx={{
                fontSize: "0.875rem",
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e5e7eb",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              <MenuItem value="All">All</MenuItem>
              {instructors.map((instructor) => (
                <MenuItem key={instructor} value={instructor}>
                  {instructor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Price */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4, lg: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel
              sx={{
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              Price
            </InputLabel>
            <Select
              value={filters.price}
              label="Price"
              onChange={(e) => onFilterChange("price", e.target.value)}
              sx={{
                fontSize: "0.875rem",
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e5e7eb",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d1d5db",
                },
              }}
            >
              {PRICE_OPTIONS.map((price) => (
                <MenuItem key={price} value={price}>
                  {price}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Apply and Clear buttons */}
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ ml: "auto" }}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="contained"
              onClick={onApply}
              sx={{
                backgroundColor: "#6366f1",
                color: "#ffffff",
                textTransform: "none",
                px: 3,
                flexGrow: { xs: 1, lg: 0 },
                "&:hover": {
                  backgroundColor: "#4f46e5",
                },
              }}
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              onClick={onClear}
              sx={{
                borderColor: "#e5e7eb",
                color: "#6b7280",
                textTransform: "none",
                px: 3,
                flexGrow: { xs: 1, lg: 0 },
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Clear
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
