import { WorkshopRegistrationData, FilterState } from "../types";
import * as XLSX from "xlsx";

export const filterWorkshopData = (
  workshopData: WorkshopRegistrationData[],
  search: string,
  filters: FilterState
): WorkshopRegistrationData[] => {
  return workshopData.filter((entry) => {
    // Global search
    const globalSearch = `${entry.name} ${entry.email}`
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!globalSearch) return false;

    // Helper function to check if value matches any of the selected options
    const matchesSelectedOptions = (value: string, filterValue: string) => {
      if (!filterValue) return true;
      const selectedOptions = filterValue.split(',').map(opt => opt.trim().toLowerCase());
      return selectedOptions.includes(value.toLowerCase());
    };

    // Helper function to check if value matches search string (for when user is searching)
    const matchesSearchString = (value: string, filterValue: string) => {
      if (!filterValue) return true;
      return value.toLowerCase().includes(filterValue.toLowerCase());
    };

    // Column filters
    const nameMatch =
      !filters.name ||
      entry.name.toLowerCase().includes(filters.name.toLowerCase());

    const emailMatch =
      !filters.email ||
      entry.email.toLowerCase().includes(filters.email.toLowerCase());

    const phoneMatch =
      !filters.phone_number ||
      entry.phone_number.includes(filters.phone_number);

    // For multi-select fields, check if the filter value contains commas (selected options)
    // or is a single search string
    const workshopMatch = (() => {
      if (!filters.workshop_name) return true;
      const filterVal = filters.workshop_name.trim();
      if (filterVal.includes(',')) {
        // Multi-select: match any selected value exactly
        return matchesSelectedOptions(entry.workshop_name, filterVal);
      } else {
        // Single search string: substring match
        return matchesSearchString(entry.workshop_name, filterVal);
      }
    })();

    const sessionMatch = (() => {
      if (!filters.session_number) return true;
      const filterVal = filters.session_number.trim();
      const sessionValue = entry.session_number?.toString() || '';
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(sessionValue, filterVal);
      } else {
        return matchesSearchString(sessionValue, filterVal);
      }
    })();

    const referralMatch = (() => {
      if (!filters.referal_code) return true;
      const filterVal = filters.referal_code.trim();
      if (!entry.referal_code) return false;
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.referal_code, filterVal);
      } else {
        return matchesSearchString(entry.referal_code, filterVal);
      }
    })();

    // New field filters with improved logic
    const attendedWebinarsMatch = (() => {
      if (!filters.attended_webinars) return true;
      const filterVal = filters.attended_webinars.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.attended_webinars, filterVal);
      } else {
        return matchesSearchString(entry.attended_webinars, filterVal);
      }
    })();

    const assessmentAttemptedMatch = (() => {
      if (!filters.is_assessment_attempted) return true;
      const filterVal = filters.is_assessment_attempted.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_assessment_attempted, filterVal);
      } else {
        return matchesSearchString(entry.is_assessment_attempted, filterVal);
      }
    })();

    const certificatePaidMatch = (() => {
      if (!filters.is_certificate_amount_paid) return true;
      const filterVal = filters.is_certificate_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_certificate_amount_paid, filterVal);
      } else {
        return matchesSearchString(entry.is_certificate_amount_paid, filterVal);
      }
    })();

    const prebookingPaidMatch = (() => {
      if (!filters.is_prebooking_amount_paid) return true;
      const filterVal = filters.is_prebooking_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_prebooking_amount_paid, filterVal);
      } else {
        return matchesSearchString(entry.is_prebooking_amount_paid, filterVal);
      }
    })();

    const coursePaidMatch = (() => {
      if (!filters.is_course_amount_paid) return true;
      const filterVal = filters.is_course_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_course_amount_paid, filterVal);
      } else {
        return matchesSearchString(entry.is_course_amount_paid, filterVal);
      }
    })();

    const firstCallStatusMatch = (() => {
      if (!filters.first_call_status) return true;
      const filterVal = filters.first_call_status.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.first_call_status, filterVal);
      } else {
        return matchesSearchString(entry.first_call_status, filterVal);
      }
    })();

    const firstCallCommentMatch =
      !filters.fist_call_comment ||
      entry.fist_call_comment.toLowerCase().includes(filters.fist_call_comment.toLowerCase());

    const secondCallStatusMatch = (() => {
      if (!filters.second_call_status) return true;
      const filterVal = filters.second_call_status.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.second_call_status, filterVal);
      } else {
        return matchesSearchString(entry.second_call_status, filterVal);
      }
    })();

    const secondCallCommentMatch =
      !filters.second_call_comment ||
      entry.second_call_comment.toLowerCase().includes(filters.second_call_comment.toLowerCase());

    const amountPaidMatch = (() => {
      if (!filters.amount_paid) return true;
      const filterVal = filters.amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.amount_paid, filterVal);
      } else {
        return matchesSearchString(entry.amount_paid, filterVal);
      }
    })();

    // Date range filter
    const registeredDate = new Date(entry.registered_at);
    const startDate = filters.registered_at.start
      ? new Date(filters.registered_at.start + "T00:00:00")
      : null;
    const endDate = filters.registered_at.end
      ? new Date(filters.registered_at.end + "T23:59:59")
      : null;

    const dateMatch =
      (!startDate || registeredDate >= startDate) &&
      (!endDate || registeredDate <= endDate);

    return (
      nameMatch &&
      emailMatch &&
      phoneMatch &&
      workshopMatch &&
      sessionMatch &&
      referralMatch &&
      attendedWebinarsMatch &&
      assessmentAttemptedMatch &&
      certificatePaidMatch &&
      prebookingPaidMatch &&
      coursePaidMatch &&
      firstCallStatusMatch &&
      firstCallCommentMatch &&
      secondCallStatusMatch &&
      secondCallCommentMatch &&
      amountPaidMatch &&
      dateMatch
    );
  });
};

export const exportToExcel = (filteredData: WorkshopRegistrationData[]) => {
  const exportData = filteredData.map((entry, index) => ({
    "Serial No.": index + 1,
    Name: entry.name,
    Email: entry.email,
    "Mobile Number": entry.phone_number,
    "Workshop Name": entry.workshop_name,
    "Session Number": entry.session_number || 1,
    "Referral Code": entry.referal_code || "N/A",
    "Registered At": entry.registered_at,
    "Attended Webinars": entry.attended_webinars || "N/A",
    "Assessment Attempted": entry.is_assessment_attempted || "N/A",
    "Certificate Amount Paid": entry.is_certificate_amount_paid || "N/A",
    "Prebooking Amount Paid": entry.is_prebooking_amount_paid || "N/A",
    "Course Amount Paid": entry.is_course_amount_paid || "N/A",
    "First Call Status": entry.first_call_status || "N/A",
    "First Call Comment": entry.fist_call_comment || "N/A",
    "Second Call Status": entry.second_call_status || "N/A",
    "Second Call Comment": entry.second_call_comment || "N/A",
    "Amount Paid": entry.amount_paid || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Workshop Registrations");
  XLSX.writeFile(workbook, "workshop_registrations.xlsx");
};

export const getInitialFilterState = (): FilterState => ({
  name: "",
  email: "",
  phone_number: "",
  workshop_name: "",
  session_number: "",
  referal_code: "",
  attended_webinars: "",
  is_assessment_attempted: "",
  is_certificate_amount_paid: "",
  is_prebooking_amount_paid: "",
  is_course_amount_paid: "",
  first_call_status: "",
  fist_call_comment: "",
  second_call_status: "",
  second_call_comment: "",
  amount_paid: "",
  registered_at: { start: "", end: "" },
});

export const hasActiveFilters = (filters: FilterState): boolean => {
  return Object.values(filters).some((value) =>
    typeof value === "string"
      ? value !== ""
      : value.start !== "" || value.end !== ""
  );
}; 