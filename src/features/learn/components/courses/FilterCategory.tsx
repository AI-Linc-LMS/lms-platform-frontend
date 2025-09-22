interface FilterOption {
  id: string;
  label: string;
}

interface FilterCategoryProps {
  title: string;
  options: FilterOption[];
  selectedOptions: string[];
  setSelectedOptions: (options: string[]) => void;
}

const FilterCategory = ({
  title,
  options,
  selectedOptions,
  setSelectedOptions,
}: FilterCategoryProps) => {
  return (
    <div className="mb-5">
      <h3 className="font-medium text-[#343A40] mb-3">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center">
            <input
              type="checkbox"
              id={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedOptions([...selectedOptions, option.id]);
                } else {
                  setSelectedOptions(
                    selectedOptions.filter((id) => id !== option.id)
                  );
                }
              }}
              className="w-4 h-4 text-[#17627A] bg-gray-100 border-gray-300 rounded focus:ring-[#17627A] focus:ring-2"
            />
            <label
              htmlFor={option.id}
              className="ml-2 text-sm font-medium text-[var(--netural-400)]"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterCategory;
