
import FilterCategory from './FilterCategory';
import { FilterOption } from './FilterOptions';

interface DesktopFiltersProps {
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

const DesktopFilters = ({
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
}: DesktopFiltersProps) => {
  return (
    <div className="hidden md:block w-full md:w-1/4 lg:w-1/5">
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
  );
};

export default DesktopFilters; 