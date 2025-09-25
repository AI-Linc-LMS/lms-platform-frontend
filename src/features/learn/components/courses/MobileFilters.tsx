import React from "react";
import { SearchIcon } from "./CourseIcons";
import FilterCategory from "./FilterCategory";
import SortDropdown from "./SortDropdown";
import { FilterOption } from "./FilterOptions";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { FilterIcon, X } from "lucide-react";

interface MobileFiltersProps {
  isFilterOpen: boolean;
  toggleFilters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedLevels: string[];
  setSelectedLevels: (levels: string[]) => void;
  selectedPrices: string[];
  setSelectedPrices: (prices: string[]) => void;
  selectedRatings: string[];
  setSelectedRatings: (ratings: string[]) => void;
  clearAllFilters: () => void;
  categoryOptions: FilterOption[];
  levelOptions: FilterOption[];
  priceOptions: FilterOption[];
  ratingOptions: FilterOption[];
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MobileFilters = ({
  isFilterOpen,
  toggleFilters,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedCategories,
  setSelectedCategories,
  selectedLevels,
  setSelectedLevels,
  selectedPrices,
  setSelectedPrices,
  selectedRatings,
  setSelectedRatings,
  clearAllFilters,
  categoryOptions,
  levelOptions,
  priceOptions,
  ratingOptions,
}: MobileFiltersProps) => {
  return (
    <div className="md:hidden">
      {/* Search Input - Mobile */}
      <div className="mb-4 w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by courses"
            className="w-full py-3 pl-10 pr-4 border border-[#DEE2E6] rounded-lg text-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-[#17627A] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-stretch gap-4 mb-6">
        {/* Filters Button - Mobile UI */}
        <div className="flex-1">
          <button
            className="flex items-center justify-between w-full h-full p-3 bg-white border border-[#DEE2E6] rounded-lg text-[var(--neutral-500)]"
            onClick={toggleFilters}
          >
            <div className="flex items-center space-x-2">
              <FilterIcon size={18} />
              <span className="font-medium">Filters</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isFilterOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
        </div>

        {/* Sort Dropdown - Mobile */}
        <div className="flex-1">
          <SortDropdown selectedSort={sortBy} setSelectedSort={setSortBy} />
        </div>
      </div>

      <Dialog
        open={isFilterOpen}
        onClose={toggleFilters}
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            position: "fixed",
            bottom: 0,
            m: 0,
            width: "100%",
            maxWidth: "100%",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Filter By
          <IconButton className="!p-0" onClick={toggleFilters}>
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => {
                clearAllFilters();
                toggleFilters(); // Close dialog after clearing
              }}
              className="text-sm text-[#17627A] hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Categories */}
          <FilterCategory
            title="Categories"
            options={categoryOptions}
            selectedOptions={selectedCategories}
            setSelectedOptions={setSelectedCategories}
          />

          {/* Level/Difficulty */}
          <FilterCategory
            title="Level/Difficulty"
            options={levelOptions}
            selectedOptions={selectedLevels}
            setSelectedOptions={setSelectedLevels}
          />

          {/* Price */}
          <FilterCategory
            title="Price"
            options={priceOptions}
            selectedOptions={selectedPrices}
            setSelectedOptions={setSelectedPrices}
          />

          {/* Rating */}
          <FilterCategory
            title="Rating"
            options={ratingOptions}
            selectedOptions={selectedRatings}
            setSelectedOptions={setSelectedRatings}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileFilters;
