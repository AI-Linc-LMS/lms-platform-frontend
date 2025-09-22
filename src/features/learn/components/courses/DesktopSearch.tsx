import { SearchIcon } from "./CourseIcons";
import SortDropdown from "./SortDropdown";

interface DesktopSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const DesktopSearch = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}: DesktopSearchProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by courses"
          className="w-full py-2 pl-10 pr-4 border border-[#DEE2E6] rounded-lg text-[var(--netural-400)] focus:outline-none focus:ring-2 focus:ring-[#17627A] focus:border-transparent"
        />
      </div>

      <SortDropdown selectedSort={sortBy} setSelectedSort={setSortBy} />
    </div>
  );
};

export default DesktopSearch;
