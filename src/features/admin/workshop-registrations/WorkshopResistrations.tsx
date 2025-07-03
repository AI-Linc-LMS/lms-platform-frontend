import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
import { getWorkshopRegistrations } from "../../../services/admin/workshopRegistrationApis";
import { WorkshopRegistrationData, FilterState } from "./types";
import {
  filterWorkshopData,
  exportToExcel,
  getInitialFilterState,
  hasActiveFilters,
} from "./utils/filterUtils";
import {
  SearchAndExport,
  WorkshopTableHeader,
  WorkshopTableRow,
  NoDataState,
  Pagination,
} from "./components";

const WorkshopRegistration = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [filters, setFilters] = useState<FilterState>(getInitialFilterState());
  const [openFilter, setOpenFilter] = useState<keyof FilterState | null>(null);

  // Create individual refs for each filter column
  const filterRefs = {
    name: useRef<HTMLDivElement>(null),
    email: useRef<HTMLDivElement>(null),
    phone_number: useRef<HTMLDivElement>(null),
    workshop_name: useRef<HTMLDivElement>(null),
    session_number: useRef<HTMLDivElement>(null),
    referal_code: useRef<HTMLDivElement>(null),
    attended_webinars: useRef<HTMLDivElement>(null),
    is_assessment_attempted: useRef<HTMLDivElement>(null),
    is_certificate_amount_paid: useRef<HTMLDivElement>(null),
    is_prebooking_amount_paid: useRef<HTMLDivElement>(null),
    is_course_amount_paid: useRef<HTMLDivElement>(null),
    first_call_status: useRef<HTMLDivElement>(null),
    fist_call_comment: useRef<HTMLDivElement>(null),
    second_call_status: useRef<HTMLDivElement>(null),
    second_call_comment: useRef<HTMLDivElement>(null),
    amount_paid: useRef<HTMLDivElement>(null),
    registered_at: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openFilter &&
        filterRefs[openFilter]?.current &&
        !filterRefs[openFilter]?.current?.contains(event.target as Node)
      ) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilter]);

  const {
    data: workshopData = [],
    isLoading,
    error,
  } = useQuery<WorkshopRegistrationData[]>({
    queryKey: ["workshopRegistrations", clientId],
    queryFn: () => getWorkshopRegistrations(clientId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const filteredData = useMemo(
    () => filterWorkshopData(workshopData, search, filters),
    [search, workshopData, filters]
  );

  const handleExport = () => exportToExcel(filteredData);

  const updateFilter = (
    column: keyof FilterState,
    value: string | { start: string; end: string }
  ) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setPage(1);
  };

  const clearFilter = (column: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [column]: column === "registered_at" ? { start: "", end: "" } : "",
    }));
  };

  const clearAllFilters = () => setFilters(getInitialFilterState());

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error)
    return <div className="p-6">Error loading workshop registrations</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl md:text-2xl font-bold mb-6">
        Workshop Registrations
      </h1>
      <SearchAndExport
        search={search}
        onSearchChange={setSearch}
        onExport={handleExport}
        hasActiveFilters={hasActiveFilters(filters)}
        onClearAllFilters={clearAllFilters}
      />
      <div className="mb-4 text-sm text-gray-600">
        Total Students Registered: <strong>{workshopData.length}</strong>
      </div>
      <div className="overflow-x-auto bg-white shadow rounded min-h-[400px]">
        <table className="w-full text-sm text-left min-w-[1400px]">
          <WorkshopTableHeader
            filters={filters}
            openFilter={openFilter}
            filterRefs={filterRefs}
            onToggleFilter={(col) =>
              setOpenFilter(openFilter === col ? null : col)
            }
            onUpdateFilter={updateFilter}
            onClearFilter={clearFilter}
          />
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((entry) => (
                <WorkshopTableRow key={entry.id} entry={entry} />
              ))
            ) : (
              <NoDataState hasActiveFilters={hasActiveFilters(filters)} />
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default WorkshopRegistration;
