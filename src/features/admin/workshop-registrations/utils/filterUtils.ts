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
    //console.log('Active Filters:', activeFilters);
  }
  
  return workshopData.filter((entry) => {
    // Global search
    const globalSearch = `${entry.name || ''} ${entry.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!globalSearch) return false;

    // Helper function to safely convert value to string for comparison
    const safeToString = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    // Helper function to check if value matches any of the selected options
    const matchesSelectedOptions = (value: string | null | undefined, filterValue: string) => {
      if (!filterValue) return true;
      const safeValue = safeToString(value);
      if (!safeValue) return false;
      const selectedOptions = filterValue.split(',').map(opt => opt.trim().toLowerCase());
      const matches = selectedOptions.includes(safeValue.toLowerCase());
       
      return matches;
    };

    // Helper function to check if value matches search string (for when user is searching)
    const matchesSearchString = (value: string | null | undefined, filterValue: string) => {
      if (!filterValue) return true;
      const safeValue = safeToString(value);
      if (!safeValue) return false;
      return safeValue.toLowerCase().includes(filterValue.toLowerCase());
    };

    // Column filters
    const nameMatch = (() => {
      if (!filters.name) return true;
      const filterVal = filters.name.trim();
      if (filterVal.includes(',')) {
        // Multi-select: match any selected value exactly (OR query)
        const result = matchesSelectedOptions(entry.name, filterVal);
        
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
        return matchesSearchString(entry.phone_number, filterVal);
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

    const sessionDateMatch = (() => {
      if (!filters.session_date) return true;
      const filterVal = filters.session_date.trim();
      const sessionDateValue = entry.session_date?.toString() || '';
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(sessionDateValue, filterVal);
      } else {
        return matchesSearchString(sessionDateValue, filterVal);
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
      const attendedValue = typeof entry.attended_webinars === 'boolean' 
        ? entry.attended_webinars.toString() 
        : (entry.attended_webinars || '');
      
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(attendedValue, filterVal);
      } else {
        return matchesSearchString(attendedValue, filterVal);
      }
    })();

    const assessmentAttemptedMatch = (() => {
      if (!filters.is_assessment_attempted) return true;
      const filterVal = filters.is_assessment_attempted.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_assessment_attempted, filterVal);
      } else {
        // Use exact match for attempted/not_attempted
        return entry.is_assessment_attempted?.toLowerCase() === filterVal.toLowerCase();
      }
    })();

    const certificatePaidMatch = (() => {
      if (!filters.is_certificate_amount_paid) return true;
      const filterVal = filters.is_certificate_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_certificate_amount_paid, filterVal);
      } else {
        // Use exact match for paid/not_paid
        return entry.is_certificate_amount_paid?.toLowerCase() === filterVal.toLowerCase();
      }
    })();

    const prebookingPaidMatch = (() => {
      if (!filters.is_prebooking_amount_paid) return true;
      const filterVal = filters.is_prebooking_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_prebooking_amount_paid, filterVal);
      } else {
        // Use exact match for paid/not_paid
        return entry.is_prebooking_amount_paid?.toLowerCase() === filterVal.toLowerCase();
      }
    })();

    const coursePaidMatch = (() => {
      if (!filters.is_course_amount_paid) return true;
      const filterVal = filters.is_course_amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.is_course_amount_paid, filterVal);
      } else {
        // Use exact match for paid/not_paid
        return entry.is_course_amount_paid?.toLowerCase() === filterVal.toLowerCase();
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
      (entry.first_call_comment && entry.first_call_comment.toLowerCase().includes(filters.first_call_comment.toLowerCase()));

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
      (entry.second_call_comment && entry.second_call_comment.toLowerCase().includes(filters.second_call_comment.toLowerCase()));

    const followUpCommentMatch =
      !filters.follow_up_comment ||
      (entry.follow_up_comment && entry.follow_up_comment.toLowerCase().includes(filters.follow_up_comment.toLowerCase()));

    const amountPaidMatch = (() => {
      if (!filters.amount_paid) return true;
      const filterVal = filters.amount_paid.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(String(entry.amount_paid), filterVal);
      } else {
        return matchesSearchString(String(entry.amount_paid), filterVal);
      }
    })();

    // New assessment-related filters
    const amountPendingMatch = (() => {
      if (!filters.amount_pending) return true;
      const filterVal = filters.amount_pending.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.amount_pending, filterVal);
      } else {
        return matchesSearchString(entry.amount_pending, filterVal);
      }
    })();

    const scoreMatch = (() => {
      if (!filters.score) return true;
      const filterVal = filters.score.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.score, filterVal);
      } else {
        return matchesSearchString(entry.score, filterVal);
      }
    })();

    const scholarshipPercentageMatch = (() => {
      if (!filters.offered_scholarship_percentage) return true;
      const filterVal = filters.offered_scholarship_percentage.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.offered_scholarship_percentage, filterVal);
      } else {
        return matchesSearchString(entry.offered_scholarship_percentage, filterVal);
      }
    })();

    const offeredAmountMatch = (() => {
      if (!filters.offered_amount) return true;
      const filterVal = filters.offered_amount.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.offered_amount, filterVal);
      } else {
        return matchesSearchString(entry.offered_amount, filterVal);
      }
    })();

    const assessmentStatusMatch = (() => {
      if (!filters.assessment_status) return true;
      const filterVal = filters.assessment_status.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.assessment_status, filterVal);
      } else {
        return matchesSearchString(entry.assessment_status, filterVal);
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

    // Date range filter for submitted_at
    const submittedDate = entry.submitted_at && entry.submitted_at !== "" ? new Date(entry.submitted_at) : null;
    const submittedStartDate = filters.submitted_at && filters.submitted_at.start
      ? new Date(filters.submitted_at.start + "T00:00:00")
      : null;
    const submittedEndDate = filters.submitted_at && filters.submitted_at.end
      ? new Date(filters.submitted_at.end + "T23:59:59")
      : null;

    const submittedDateMatch =
      (!submittedStartDate || (submittedDate && submittedDate >= submittedStartDate)) &&
      (!submittedEndDate || (submittedDate && submittedDate <= submittedEndDate));

    const finalResult = (
      nameMatch &&
      emailMatch &&
      phoneMatch &&
      workshopMatch &&
      sessionMatch &&
      sessionDateMatch &&
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
      followUpCommentMatch &&
      amountPaidMatch &&
      amountPendingMatch &&
      scoreMatch &&
      scholarshipPercentageMatch &&
      offeredAmountMatch &&
      assessmentStatusMatch &&
      dateMatch &&
      updatedDateMatch &&
      submittedDateMatch
    );

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
    "Session Number": entry.session_number || "N/A",
    "Session Date": entry.session_date || "N/A",
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
    "Follow Up Comment": entry.follow_up_comment || "N/A",
    "Amount Paid": entry.amount_paid || "N/A",
    "Amount Pending": entry.amount_pending || "N/A",
    "Score": entry.score || "N/A",
    "Offered Scholarship Percentage": entry.offered_scholarship_percentage || "N/A",
    "Offered Amount": entry.offered_amount || "N/A",
    "Submitted At": entry.submitted_at && entry.submitted_at !== "" ? entry.submitted_at : "N/A",
    "Assessment Status": entry.assessment_status || "N/A",
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
  session_date: "",
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
  follow_up_comment: "",
  amount_paid: "",
  amount_pending: "",
  score: "",
  offered_scholarship_percentage: "",
  offered_amount: "",
  submitted_at: { start: "", end: "" },
  assessment_status: "",
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