"use client";

import { Box, Typography, Checkbox, FormControlLabel, Link } from "@mui/material";
import { useState } from "react";

interface CourseFilterSidebarProps {
  filters: {
    categories: string[];
    levels: string[];
    price: string[];
    rating: string[];
  };
  onFilterChange: (filterType: string, value: string, checked: boolean) => void;
  onClearAll: () => void;
}

const CATEGORIES = [
  "Full Stack Development",
  "Front-End Development",
  "Back-End Development",
  "UI/UX Design",
  "Data Science & Analytics",
  "Marketing",
  "Business",
];

const LEVELS = ["Beginner", "Intermediate", "Pro"];

const PRICE_OPTIONS = ["Free", "Paid"];


export const CourseFilterSidebar: React.FC<CourseFilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearAll,
}) => {
  const handleCheckboxChange = (filterType: string, value: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFilterChange(filterType, value, event.target.checked);
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.levels.length > 0 ||
    filters.price.length > 0;

  return (
    <Box
      sx={{
        width: 280,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 3,
        height: "fit-content",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#1a1f2e",
          }}
        >
          Filter By
        </Typography>
        {hasActiveFilters && (
          <Link
            component="button"
            onClick={onClearAll}
            sx={{
              color: "#14b8a6",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Clear All
          </Link>
        )}
      </Box>

      {/* Categories */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#1a1f2e",
            mb: 2,
          }}
        >
          Categories
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {CATEGORIES.map((category) => (
            <FormControlLabel
              key={category}
              control={
                <Checkbox
                  checked={filters.categories.includes(category)}
                  onChange={handleCheckboxChange("categories", category)}
                  sx={{
                    color: "#6366f1",
                    "&.Mui-checked": {
                      color: "#6366f1",
                    },
                    padding: "4px",
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "#1a1f2e",
                  }}
                >
                  {category}
                </Typography>
              }
              sx={{ margin: 0 }}
            />
          ))}
        </Box>
      </Box>

      {/* Level/Difficulty */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#1a1f2e",
            mb: 2,
          }}
        >
          Level/Difficulty
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {LEVELS.map((level) => (
            <FormControlLabel
              key={level}
              control={
                <Checkbox
                  checked={filters.levels.includes(level)}
                  onChange={handleCheckboxChange("levels", level)}
                  sx={{
                    color: "#6366f1",
                    "&.Mui-checked": {
                      color: "#6366f1",
                    },
                    padding: "4px",
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "#1a1f2e",
                  }}
                >
                  {level}
                </Typography>
              }
              sx={{ margin: 0 }}
            />
          ))}
        </Box>
      </Box>

      {/* Price */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#1a1f2e",
            mb: 2,
          }}
        >
          Price
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {PRICE_OPTIONS.map((price) => (
            <FormControlLabel
              key={price}
              control={
                <Checkbox
                  checked={filters.price.includes(price)}
                  onChange={handleCheckboxChange("price", price)}
                  sx={{
                    color: "#6366f1",
                    "&.Mui-checked": {
                      color: "#6366f1",
                    },
                    padding: "4px",
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "#1a1f2e",
                  }}
                >
                  {price}
                </Typography>
              }
              sx={{ margin: 0 }}
            />
          ))}
        </Box>
      </Box>

    </Box>
  );
};


