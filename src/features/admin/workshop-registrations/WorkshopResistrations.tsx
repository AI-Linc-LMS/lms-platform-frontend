import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkshopRegistrations } from "../../../services/admin/workshopRegistrationApis";
import { WorkshopRegistrationData, FilterState } from "./types";
import {
  exportToExcel,
  filterWorkshopData,
  //exportToExcel,
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
import EmailConfirmationModal from "./components/modals/EmailConfirmationModal";

const WorkshopRegistration = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [filters, setFilters] = useState<FilterState>(getInitialFilterState());
  const [openFilter, setOpenFilter] = useState<keyof FilterState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [selectedEmailsForConfirmation, setSelectedEmailsForConfirmation] =
    useState<Array<{ email: string; name: string }>>([]);
  const [freezeColumns, setFreezeColumns] = useState<string[]>([
    "name",
    "email",
  ]);

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

  // Freeze columns configuration
  const freezeColumnOptions = [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone_number", label: "Phone", required: false },
  ];

  // Handle freeze column selection
  const handleFreezeColumnChange = (columnKey: string, selected: boolean) => {
    setFreezeColumns((prev) => {
      let newFreezeColumns = [...prev];

      if (selected) {
        // Add the column
        if (!newFreezeColumns.includes(columnKey)) {
          newFreezeColumns.push(columnKey);
        }

        // If phone is selected, ensure name and email are also selected
        if (columnKey === "phone_number") {
          if (!newFreezeColumns.includes("name")) {
            newFreezeColumns.push("name");
          }
          if (!newFreezeColumns.includes("email")) {
            newFreezeColumns.push("email");
          }
        }
        if (columnKey === "email") {
          if (!newFreezeColumns.includes("name")) {
            newFreezeColumns.push("name");
          }
        }
      } else {
        // Remove the column
        newFreezeColumns = newFreezeColumns.filter((col) => col !== columnKey);

        // If removing name or email, also remove phone (since phone requires both)
        if (columnKey === "name" || columnKey === "email") {
          newFreezeColumns = newFreezeColumns.filter(
            (col) => col !== "phone_number"
          );
        }
      }

      return newFreezeColumns;
    });
  };

  // Column configuration for optional columns
  const columnConfigs = [
    { key: "workshop_name", label: "Workshop Name", defaultVisible: true },
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
    { key: "follow_up_date", label: "Follow Up Date", defaultVisible: true },
    {
      key: "session_number",
      label: "Registered Session",
      defaultVisible: true,
    },
    {
      key: "session_date",
      label: "Session Date",
      defaultVisible: true,
    },
    {
      key: "course_name",
      label: "Course Name",
      defaultVisible: true,
    },
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
    // The rest of the columns
    { key: "amount_paid", label: "Amount Paid", defaultVisible: true },
    { key: "amount_pending", label: "Amount Pending", defaultVisible: true },
    { key: "score", label: "Score", defaultVisible: true },
    {
      key: "offered_scholarship_percentage",
      label: "Scholarship %",
      defaultVisible: true,
    },
    { key: "offered_amount", label: "Offered Amount", defaultVisible: true },
    { key: "platform_amount", label: "Platform Amount", defaultVisible: true },
    {
      key: "assignment_submitted_at",
      label: "Assignment Submitted At",
      defaultVisible: true,
    },
    {
      key: "referral_code_assessment",
      label: "Referral Code Assessment",
      defaultVisible: true,
    },
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
    platform_amount: useRef<HTMLDivElement>(null),
    assignment_submitted_at: useRef<HTMLDivElement>(null),
    referral_code_assessment: useRef<HTMLDivElement>(null),
    submitted_at: useRef<HTMLDivElement>(null),
    assessment_status: useRef<HTMLDivElement>(null),
    registered_at: useRef<HTMLDivElement>(null),
    updated_at: useRef<HTMLDivElement>(null),
    follow_up_comment: useRef<HTMLDivElement>(null),
    follow_up_date: useRef<HTMLDivElement>(null),
  };

  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      console.log(
        "scrolling - event type:",
        event.type,
        "target:",
        event.target
      );
      setOpenFilter(null);
    };

    const handleWheel = () => {
      console.log("wheel event detected - closing filters");
      setOpenFilter(null);
    };

    // Get the scrollable container
    const container = tableScrollRef.current;

    // Add multiple scroll event listeners for comprehensive coverage
    if (container) {
      // Table container scroll (horizontal and vertical)
      container.addEventListener("scroll", handleScroll, { passive: true });
      // Also listen for wheel events on the container
      container.addEventListener("wheel", handleWheel, { passive: true });
    }

    // Window scroll (page level)
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    // Document scroll (fallback)
    document.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
    document.addEventListener("wheel", handleWheel, {
      passive: true,
      capture: true,
    });

    // Body scroll (another fallback)
    document.body.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
        container.removeEventListener("wheel", handleWheel);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("wheel", handleWheel, true);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
    refetch,
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

  const handleRemoveEmailFromConfirmation = (emailToRemove: string) => {
    setSelectedEmailsForConfirmation((prev) =>
      prev.filter((item) => item.email !== emailToRemove)
    );
    // Also remove from the main selectedRows state
    const entryToRemove = filteredData.find(
      (entry) => entry.email === emailToRemove
    );
    if (entryToRemove) {
      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entryToRemove.id);
        return newSet;
      });
    }
  };

  const handleSendEmail = () => {
    if (selectedRows.size === 0) return;

    const selectedRecipients = workshopData
      .filter((entry) => selectedRows.has(entry.id))
      .map((entry) => ({ email: entry.email, name: entry.name }))
      .filter((recipient) => recipient.email && recipient.email.includes("@"));

    if (selectedRecipients.length === 0) return;

    setSelectedEmailsForConfirmation(selectedRecipients);
    setShowEmailConfirmation(true);
  };

  const handleRowSelection = (entryId: number, selected: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(entryId);
      } else {
        newSet.delete(entryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(filteredData.map((entry) => entry.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleSelectionMode = () => {
    setShowSelection(!showSelection);
    if (showSelection) {
      setSelectedRows(new Set());
    }
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
        column === "updated_at" ||
        column === "assignment_submitted_at" ||
        column === "follow_up_date"
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
    <div className="p-4 md:p-6 bg-gray-50 flex flex-col">
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
        onSendEmail={handleSendEmail}
        showSelection={showSelection}
        onToggleSelection={toggleSelectionMode}
        selectedCount={selectedRows.size}
        freezeColumns={freezeColumns}
        freezeColumnOptions={freezeColumnOptions}
        onFreezeColumnChange={handleFreezeColumnChange}
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
        {showSelection && selectedRows.size > 0 && (
          <span className="ml-4 text-blue-600">
            • <strong>{selectedRows.size}</strong> selected
          </span>
        )}
      </div>
      <div className="flex flex-col bg-white shadow rounded flex-1 min-h-0">
        {/* Scrollable table container */}
        <div
          ref={tableScrollRef}
          data-table-container
          className="flex-1 max-h-[100vh] overflow-auto min-h-[500px]"
        >
          <table className="w-full text-sm text-left border-collapse">
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
              showSelection={showSelection}
              isAllSelected={
                filteredData.length > 0 &&
                filteredData.every((entry) => selectedRows.has(entry.id))
              }
              onSelectAll={handleSelectAll}
              freezeColumns={freezeColumns}
            />
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((entry) => (
                  <WorkshopTableRow
                    key={entry.id}
                    entry={entry}
                    visibleColumns={visibleColumns}
                    permanentColumns={permanentColumns}
                    refetch={refetch}
                    isSelected={selectedRows.has(entry.id)}
                    onSelectionChange={handleRowSelection}
                    showSelection={showSelection}
                    freezeColumns={freezeColumns}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      permanentColumns.length +
                        visibleColumns.length +
                        (showSelection ? 1 : 0) || 1
                    }
                  >
                    <div className="flex justify-center items-center min-h-[200px] w-full">
                      <NoDataState
                        hasActiveFilters={hasActiveFilters(filters)}
                      />
                    </div>
                  </td>
                </tr>
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

      <EmailConfirmationModal
        isOpen={showEmailConfirmation}
        onClose={() => setShowEmailConfirmation(false)}
        onConfirm={() => {
          setShowEmailConfirmation(false);
          // Navigate to email self-serve with pre-filled emails
          navigate("/admin/email-send", {
            state: { preFilledRecipients: selectedEmailsForConfirmation },
          });
        }}
        selectedRecipients={selectedEmailsForConfirmation}
        totalSelected={selectedEmailsForConfirmation.length}
        onRemoveEmail={handleRemoveEmailFromConfirmation}
      />
    </div>
  );
};

export default WorkshopRegistration;
