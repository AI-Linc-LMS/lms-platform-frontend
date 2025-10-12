import FilterCategory from "./FilterCategory";
import { FilterOption } from "./FilterOptions";
import { useTranslation } from "react-i18next";

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
  ratingOptions,
}: DesktopFiltersProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="hidden md:block w-full md:w-1/4 lg:w-1/5">
      <div className="bg-white rounded-xl p-4 border border-[#DEE2E6]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--neutral-500)]">{t("filters.title")}</h2>
          <button
            onClick={clearAllFilters}
            className="text-sm text-[#17627A] hover:underline"
          >
            {t("filters.clearAll")}
          </button>
        </div>

        {/* Categories */}
        <FilterCategory
          title={t("filters.categories.title")}
          options={categoryOptions}
          selectedOptions={selectedCategories}
          setSelectedOptions={setSelectedCategories}
        />

        {/* Level/Difficulty */}
        <FilterCategory
          title={t("filters.difficulty.title")}
          options={levelOptions}
          selectedOptions={selectedLevels}
          setSelectedOptions={setSelectedLevels}
        />

        {/* Price */}
        <FilterCategory
          title={t("filters.price.title")}
          options={priceOptions}
          selectedOptions={selectedPrices}
          setSelectedOptions={setSelectedPrices}
        />

        {/* Rating */}
        <FilterCategory
          title={t("filters.rating.title")}
          options={ratingOptions}
          selectedOptions={selectedRatings}
          setSelectedOptions={setSelectedRatings}
        />
      </div>
    </div>
  );
};

export default DesktopFilters;
