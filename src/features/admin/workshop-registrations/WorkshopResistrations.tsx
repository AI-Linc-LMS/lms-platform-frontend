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
  ActiveFiltersDisplay,
} from "./components";

const WorkshopRegistration = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [filters, setFilters] = useState<FilterState>(getInitialFilterState());
  const [openFilter, setOpenFilter] = useState<keyof FilterState | null>(null);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Permanent columns that are always visible
  const permanentColumns = [
    "name",
    "email",
    "phone_number",
    "referal_code",
    "is_course_amount_paid",
    "registered_at",
  ];

  // Column configuration for optional columns
  const columnConfigs = [
    { key: "workshop_name", label: "Workshop Name", defaultVisible: true },
    { key: "session_number", label: "Session", defaultVisible: true },
    { key: "session_date", label: "Session Date", defaultVisible: true },
    { key: "attended_webinars", label: "Attendee", defaultVisible: true },
    {
      key: "is_assessment_attempted",
      label: "Assessment",
      defaultVisible: true,
    },
    {
      key: "is_certificate_amount_paid",
      label: "Certificate Paid",
      defaultVisible: true,
    },
    {
      key: "is_prebooking_amount_paid",
      label: "Prebooking Paid",
      defaultVisible: true,
    },
    {
      key: "first_call_status",
      label: "1st Call Status",
      defaultVisible: true,
    },
    {
      key: "first_call_comment",
      label: "1st Call Comment",
      defaultVisible: true,
    },
    {
      key: "second_call_status",
      label: "2nd Call Status",
      defaultVisible: true,
    },
    {
      key: "second_call_comment",
      label: "2nd Call Comment",
      defaultVisible: true,
    },
    {
      key: "follow_up_comment",
      label: "Follow Up Comment",
      defaultVisible: true,
    },
    { key: "amount_paid", label: "Amount Paid", defaultVisible: true },
    { key: "amount_pending", label: "Amount Pending", defaultVisible: true },
    { key: "score", label: "Score", defaultVisible: true },
    {
      key: "offered_scholarship_percentage",
      label: "Scholarship %",
      defaultVisible: true,
    },
    { key: "offered_amount", label: "Offered Amount", defaultVisible: true },
    {
      key: "assessment_status",
      label: "Assessment Status",
      defaultVisible: true,
    },
    { key: "updated_at", label: "Updated At", defaultVisible: true },
    { key: "submitted_at", label: "Submitted At", defaultVisible: true },
  ];

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
    first_call_comment: useRef<HTMLDivElement>(null),
    second_call_status: useRef<HTMLDivElement>(null),
    second_call_comment: useRef<HTMLDivElement>(null),
    amount_paid: useRef<HTMLDivElement>(null),
    amount_pending: useRef<HTMLDivElement>(null),
    score: useRef<HTMLDivElement>(null),
    offered_scholarship_percentage: useRef<HTMLDivElement>(null),
    offered_amount: useRef<HTMLDivElement>(null),
    submitted_at: useRef<HTMLDivElement>(null),
    assessment_status: useRef<HTMLDivElement>(null),
    registered_at: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openFilter &&
        filterRefs[openFilter as keyof typeof filterRefs]?.current &&
        !filterRefs[openFilter as keyof typeof filterRefs]?.current?.contains(
          event.target as Node
        )
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

  const handleExport = () => {
    // Combine permanent columns with visible columns for export
    const allVisibleColumns = [...permanentColumns, ...visibleColumns];
    exportToExcel(filteredData, allVisibleColumns);
  };

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
      [column]:
        column === "registered_at" ||
        column === "submitted_at" ||
        column === "updated_at"
          ? { start: "", end: "" }
          : "",
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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex flex-col">
      <h1 className="text-xl md:text-2xl font-bold mb-6">
        Workshop Registrations
      </h1>

      <SearchAndExport
        search={search}
        onSearchChange={setSearch}
        onExport={handleExport}
        hasActiveFilters={hasActiveFilters(filters)}
        onClearAllFilters={clearAllFilters}
        clientId={clientId}
        columnConfigs={columnConfigs}
        visibleColumns={visibleColumns}
        onColumnVisibilityChange={setVisibleColumns}
      />

      <ActiveFiltersDisplay
        filters={filters}
        onClearFilter={clearFilter}
        onClearAllFilters={clearAllFilters}
      />

      <div className="mb-4 text-sm text-gray-600">
        {hasActiveFilters(filters) || search ? (
          <>
            Filtered count: <strong>{filteredData.length}</strong> of{" "}
            <strong>{workshopData.length}</strong> total students
          </>
        ) : (
          <>
            Total Students Registered: <strong>{workshopData.length}</strong>
          </>
        )}
      </div>
      <div className="flex flex-col bg-white shadow rounded flex-1 min-h-0">
        {/* Scrollable table container */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm text-left">
            <WorkshopTableHeader
              filters={filters}
              openFilter={openFilter}
              filterRefs={filterRefs}
              onToggleFilter={(col) =>
                setOpenFilter(openFilter === col ? null : col)
              }
              onUpdateFilter={updateFilter}
              onClearFilter={clearFilter}
              data={workshopData}
              visibleColumns={visibleColumns}
              permanentColumns={permanentColumns}
            />
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((entry) => (
                  <WorkshopTableRow
                    key={entry.id}
                    entry={entry}
                    visibleColumns={visibleColumns}
                    permanentColumns={permanentColumns}
                  />
                ))
              ) : (
                <NoDataState hasActiveFilters={hasActiveFilters(filters)} />
              )}
            </tbody>
          </table>
        </div>

        {/* Fixed pagination */}
        <div className="border-t bg-white">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredData.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkshopRegistration;
