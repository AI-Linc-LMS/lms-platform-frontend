
import { FilterIcon } from './CourseIcons';
import { SearchIcon } from './CourseIcons';
import FilterCategory from './FilterCategory';
import SortDropdown from './SortDropdown';
import { FilterOption } from './FilterOptions';

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
  ratingOptions
}: MobileFiltersProps) => {
  return (
    <div className="md:hidden">
      {/* Filters Button - Mobile UI */}
      <div className="mb-4">
        <button
          className="flex items-center justify-between w-full p-3 bg-white border border-[#DEE2E6] rounded-lg text-[#343A40] shadow-sm"
          onClick={toggleFilters}
        >
          <div className="flex items-center space-x-2">
            <FilterIcon />
            <span className="font-medium">Filters</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      {/* Filter Panel - Collapsible for Mobile */}
      <div className={`${isFilterOpen ? 'max-h-[1500px] opacity-100 mb-6' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-500 ease-in-out`}>
        <div className="bg-white rounded-xl p-4 border border-[#DEE2E6]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#343A40]">Filter By</h2>
            <button
              onClick={clearAllFilters}
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
        </div>
      </div>

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
            className="w-full py-3 pl-10 pr-4 border border-[#DEE2E6] rounded-lg text-[#495057] focus:outline-none focus:ring-2 focus:ring-[#17627A] focus:border-transparent"
          />
        </div>
      </div>

      {/* Sort Dropdown - Mobile */}
      <div className="mb-6">
        <SortDropdown selectedSort={sortBy} setSelectedSort={setSortBy} />
      </div>
    </div>
  );
};

export default MobileFilters; 