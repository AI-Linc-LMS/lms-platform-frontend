import { WorkshopRegistrationData, FilterState } from "../types";
import * as XLSX from "xlsx";

export const filterWorkshopData = (
  workshopData: WorkshopRegistrationData[],
  search: string,
  filters: FilterState
): WorkshopRegistrationData[] => {
  // Debug logging for active filters
  const activeFilters = Object.entries(filters).filter(([, value]) => {
    if (typeof value === 'string') return value !== '';
    if (typeof value === 'object') return value.start !== '' || value.end !== '';
    return false;
  });
  
  if (activeFilters.length > 0) {
    console.log('Active Filters:', activeFilters);
  }
  
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
      const matches = selectedOptions.includes(value.toLowerCase());
      
      // Debug logging for OR query
      if (selectedOptions.length > 1) {
        console.log('OR Query Debug:', {
          fieldValue: value,
          selectedOptions,
          matches,
          filterValue
        });
      }
      
      return matches;
    };

    // Helper function to check if value matches search string (for when user is searching)
    const matchesSearchString = (value: string, filterValue: string) => {
      if (!filterValue) return true;
      return value.toLowerCase().includes(filterValue.toLowerCase());
    };

    // Column filters
    const nameMatch = (() => {
      if (!filters.name) return true;
      const filterVal = filters.name.trim();
      if (filterVal.includes(',')) {
        // Multi-select: match any selected value exactly (OR query)
        const result = matchesSelectedOptions(entry.name, filterVal);
        console.log('Name OR Query:', {
          entryName: entry.name,
          filterValue: filterVal,
          result
        });
        return result;
      } else {
        // Single search string: substring match
        return matchesSearchString(entry.name, filterVal);
      }
    })();

    const emailMatch = (() => {
      if (!filters.email) return true;
      const filterVal = filters.email.trim();
      if (filterVal.includes(',')) {
        // Multi-select: match any selected value exactly (OR query)
        return matchesSelectedOptions(entry.email, filterVal);
      } else {
        // Single search string: substring match
        return matchesSearchString(entry.email, filterVal);
      }
    })();

    const phoneMatch = (() => {
      if (!filters.phone_number) return true;
      const filterVal = filters.phone_number.trim();
      if (filterVal.includes(',')) {
        // Multi-select: match any selected value exactly (OR query)
        return matchesSelectedOptions(entry.phone_number, filterVal);
      } else {
        // Single search string: substring match
        return entry.phone_number.includes(filterVal);
      }
    })();

    // For multi-select fields, check if the filter value contains commas (selected options)
    // or is a single search string
    const workshopMatch = (() => {
      if (!filters.workshop_name) return true;
      const filterVal = filters.workshop_name.trim();
      if (filterVal.includes(',')) {
        // Multi-select: match any selected value exactly (OR query)
        const result = matchesSelectedOptions(entry.workshop_name, filterVal);
        console.log('Workshop OR Query:', {
          entryName: entry.name,
          workshopName: entry.workshop_name,
          filterValue: filterVal,
          result
        });
        return result;
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
        // Use exact match for attempted/not_attempted
        return entry.is_assessment_attempted.toLowerCase() === filterVal.toLowerCase();
      }
    })();

    const certificatePaidMatch = (() => {
      if (!filters.is_certificate_amount_paid) return true;
      const filterVal = filters.is_certificate_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_certificate_amount_paid, filterVal);
      } else {
        // Use exact match for paid/not_paid
        return entry.is_certificate_amount_paid.toLowerCase() === filterVal.toLowerCase();
      }
    })();

    const prebookingPaidMatch = (() => {
      if (!filters.is_prebooking_amount_paid) return true;
      const filterVal = filters.is_prebooking_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_prebooking_amount_paid, filterVal);
      } else {
        // Use exact match for paid/not_paid
        return entry.is_prebooking_amount_paid.toLowerCase() === filterVal.toLowerCase();
      }
    })();

    const coursePaidMatch = (() => {
      if (!filters.is_course_amount_paid) return true;
      const filterVal = filters.is_course_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_course_amount_paid, filterVal);
      } else {
        // Use exact match for paid/not_paid
        return entry.is_course_amount_paid.toLowerCase() === filterVal.toLowerCase();
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
      !filters.first_call_comment ||
      entry.first_call_comment.toLowerCase().includes(filters.first_call_comment.toLowerCase());

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
        return matchesSelectedOptions(String(entry.amount_paid), filterVal);
      } else {
        return matchesSearchString(String(entry.amount_paid), filterVal);
      }
    })();

    // Date range filter for registered_at
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

    // Date range filter for updated_at
    const updatedDate = entry.updated_at ? new Date(entry.updated_at) : null;
    const updatedStartDate = filters.updated_at && filters.updated_at.start
      ? new Date(filters.updated_at.start + "T00:00:00")
      : null;
    const updatedEndDate = filters.updated_at && filters.updated_at.end
      ? new Date(filters.updated_at.end + "T23:59:59")
      : null;

    const updatedDateMatch =
      (!updatedStartDate || (updatedDate && updatedDate >= updatedStartDate)) &&
      (!updatedEndDate || (updatedDate && updatedDate <= updatedEndDate));

    // Debug logging for filter results
    const allMatches = {
      nameMatch,
      emailMatch,
      phoneMatch,
      workshopMatch,
      sessionMatch,
      referralMatch,
      attendedWebinarsMatch,
      assessmentAttemptedMatch,
      certificatePaidMatch,
      prebookingPaidMatch,
      coursePaidMatch,
      firstCallStatusMatch,
      firstCallCommentMatch,
      secondCallStatusMatch,
      secondCallCommentMatch,
      amountPaidMatch,
      dateMatch,
      updatedDateMatch,
    };

    // Final match
    const finalResult = (
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
      dateMatch &&
      updatedDateMatch
    );

    // Debug logging for failed matches
    if (!finalResult && (filters.name || filters.email || filters.phone_number || filters.workshop_name)) {
      console.log('Filter Match Failed:', {
        entryName: entry.name,
        entryEmail: entry.email,
        allMatches,
        activeFilters: Object.entries(filters).filter(([, v]) => v && (typeof v === 'string' ? v !== '' : true))
      });
    }

    return finalResult;
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
    "First Call Comment": entry.first_call_comment || "N/A",
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
  first_call_comment: "",
  second_call_status: "",
  second_call_comment: "",
  amount_paid: "",
  registered_at: { start: "", end: "" },
  updated_at: { start: "", end: "" },
});

export const hasActiveFilters = (filters: FilterState): boolean => {
  return Object.values(filters).some((value) =>
    typeof value === "string"
      ? value !== ""
      : value.start !== "" || value.end !== ""
  );
}; 