import React, { useState } from "react";
import { SortIcon } from "./CourseIcons";
import { Button, Menu, MenuItem } from "@mui/material";
import { Check } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  className?: string; // To accept className from parent
}

const SortDropdown = ({
  selectedSort,
  setSelectedSort,
  className,
}: SortDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (value: string) => {
    setSelectedSort(value);
    handleClose();
  };

  const sortOptions: SortOption[] = [
    { value: "most_popular", label: "Most Popular" },
    { value: "highest_rated", label: "Highest Rated" },
    { value: "newest", label: "Newest / Recently Added" },
    { value: "price_low_high", label: "Price - Low to High" },
    { value: "price_high_low", label: "Price - High to Low" },
  ];

  return (
    <div className={`relative w-full h-full md:w-fit ${className}`}>
      <Button
        id="sort-button"
        aria-controls={open ? "sort-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem",
          border: "1px solid #DEE2E6",
          borderRadius: "0.5rem",
          backgroundColor: "white",
          color: "var(--neutral-500)",
          textTransform: "none",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          "&:hover": {
            backgroundColor: "var(--neutral-50)",
          },
        }}
      >
        <SortIcon />
        <span>Sort</span>
      </Button>
      <Menu
        id="sort-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "sort-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === selectedSort}
            onClick={() => handleMenuItemClick(option.value)}
            sx={{
              color:
                option.value === selectedSort
                  ? "var(--neutral-500)"
                  : "var(--neutral-400)",
              fontWeight: option.value === selectedSort ? 500 : 400,
            }}
          >
            {option.value === selectedSort && (
              <Check size={16} className="mr-2" />
            )}
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default SortDropdown;
