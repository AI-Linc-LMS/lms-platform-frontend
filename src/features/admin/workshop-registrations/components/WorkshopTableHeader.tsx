import { FilterState } from "../types";
import { FilterDropdown, DateFilterDropdown } from "./FilterDropdown";

interface WorkshopTableHeaderProps {
  filters: FilterState;
  openFilter: keyof FilterState | null;
  filterRefs: {
    [key in keyof FilterState]?: React.RefObject<HTMLDivElement | null>;
  };
  onToggleFilter: (column: keyof FilterState) => void;
  onUpdateFilter: (
    column: keyof FilterState,
    value: string | { start: string; end: string }
  ) => void;
  onClearFilter: (column: keyof FilterState) => void;
}

export const WorkshopTableHeader: React.FC<WorkshopTableHeaderProps> = ({
  filters,
  openFilter,
  filterRefs,
  onToggleFilter,
  onUpdateFilter,
  onClearFilter,
}) => {
  const filterConfigs = [
    {
      column: "name" as keyof FilterState,
      label: "Name",
      placeholder: "Filter by name...",
    },
    {
      column: "email" as keyof FilterState,
      label: "Email",
      placeholder: "Filter by email...",
    },
    {
      column: "phone_number" as keyof FilterState,
      label: "Mobile Number",
      placeholder: "Filter by phone...",
    },
    {
      column: "workshop_name" as keyof FilterState,
      label: "Workshop Name",
      placeholder: "Filter by workshop...",
    },
    {
      column: "session_number" as keyof FilterState,
      label: "Session",
      placeholder: "Filter by session...",
    },
    {
      column: "referal_code" as keyof FilterState,
      label: "Referral Code",
      placeholder: "Filter by referral code...",
    },
    {
      column: "attended_webinars" as keyof FilterState,
      label: "Webinars",
      placeholder: "Filter by webinars...",
    },
    {
      column: "is_assessment_attempted" as keyof FilterState,
      label: "Assessment",
      placeholder: "Filter by assessment...",
    },
    {
      column: "is_certificate_amount_paid" as keyof FilterState,
      label: "Certificate Paid",
      placeholder: "Filter by certificate payment...",
    },
    {
      column: "is_prebooking_amount_paid" as keyof FilterState,
      label: "Prebooking Paid",
      placeholder: "Filter by prebooking payment...",
    },
    {
      column: "is_course_amount_paid" as keyof FilterState,
      label: "Course Paid",
      placeholder: "Filter by course payment...",
    },
    {
      column: "first_call_status" as keyof FilterState,
      label: "1st Call Status",
      placeholder: "Filter by first call status...",
    },
    {
      column: "fist_call_comment" as keyof FilterState,
      label: "1st Call Comment",
      placeholder: "Filter by first call comment...",
    },
    {
      column: "second_call_status" as keyof FilterState,
      label: "2nd Call Status",
      placeholder: "Filter by second call status...",
    },
    {
      column: "second_call_comment" as keyof FilterState,
      label: "2nd Call Comment",
      placeholder: "Filter by second call comment...",
    },
    {
      column: "amount_paid" as keyof FilterState,
      label: "Amount Paid",
      placeholder: "Filter by amount paid...",
    },
  ];

  return (
    <thead className="bg-gray-100">
      <tr>
        {filterConfigs.map((config) => (
          <FilterDropdown
            key={config.column}
            column={config.column}
            label={config.label}
            placeholder={config.placeholder}
            value={filters[config.column] as string}
            isOpen={openFilter === config.column}
            isActive={!!(filters[config.column] as string)}
            onToggle={onToggleFilter}
            onChange={(column, value) => onUpdateFilter(column, value)}
            onClear={onClearFilter}
            filterRef={filterRefs[config.column]!}
          />
        ))}
        <DateFilterDropdown
          column="registered_at"
          label="Registered At"
          value={filters.registered_at}
          isOpen={openFilter === "registered_at"}
          isActive={
            !!(filters.registered_at.start || filters.registered_at.end)
          }
          onToggle={onToggleFilter}
          onChange={(column, value) => onUpdateFilter(column, value)}
          onClear={onClearFilter}
          filterRef={filterRefs.registered_at!}
        />
      </tr>
    </thead>
  );
};
