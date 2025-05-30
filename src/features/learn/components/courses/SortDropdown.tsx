import { useState } from 'react';
import { SortIcon } from './CourseIcons';

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
}

const SortDropdown = ({ selectedSort, setSelectedSort }: SortDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: SortOption[] = [
    { value: 'most_popular', label: 'Most Popular' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest / Recently Added' },
    { value: 'price_low_high', label: 'Price - Low to High' },
    { value: 'price_high_low', label: 'Price - High to Low' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-[#DEE2E6] rounded-lg bg-white text-[#343A40] text-sm"
      >
        <SortIcon />
        <span>Sort</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white border border-[#DEE2E6] rounded-lg shadow-lg py-1 z-10 w-56 sm:right-0 sm:left-auto left-0 sm:origin-top-right origin-top-left">
          {sortOptions.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#F8F9FA] flex items-center ${selectedSort === option.value ? 'text-[#343A40] font-medium' : 'text-[#495057]'}`}
              onClick={() => {
                setSelectedSort(option.value);
                setIsOpen(false);
              }}
            >
              {selectedSort === option.value && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 