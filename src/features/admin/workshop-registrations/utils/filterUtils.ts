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
    const matchesSelectedOptions = (value: unknown, filterValue: string) => {
      if (!filterValue) return true;
      const selectedOptions = filterValue.split(',').map(opt => opt.trim().toLowerCase());
      if (selectedOptions.includes('n/a')) {
        if (
          value == null ||
          (typeof value === 'string' && (value.trim() === '' || value.trim().toLowerCase() === 'n/a'))
        ) {
          return true;
        }
        return false;
      }
      const safeValue = value == null ? '' : String(value);
      if (!safeValue) return false;
      return selectedOptions.includes(safeValue.toLowerCase());
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
      const assessmentValue = entry.is_assessment_attempted || "not_attempted";
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(assessmentValue, filterVal);
      } else {
        // Use exact match for attempted/not_attempted
        return assessmentValue.toLowerCase() === filterVal.toLowerCase();
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
        // For single value, check if it's "N/A"
        if (filterVal.toLowerCase() === 'n/a') {
          return !entry.first_call_status || entry.first_call_status.toLowerCase() === 'n/a';
        }
        return matchesSearchString(entry.first_call_status, filterVal);
      }
    })();

    const firstCallCommentMatch = (() => {
      const filterVal = filters.first_call_comment;
      if (!filterVal) return true;
      if (filterVal === "filled") {
        return !!(entry.first_call_comment && entry.first_call_comment.trim() !== "");
      }
      if (filterVal === "not_filled") {
        return !entry.first_call_comment || entry.first_call_comment.trim() === "";
      }
      return entry.first_call_comment && entry.first_call_comment.toLowerCase().includes(filterVal.toLowerCase());
    })();

    const secondCallStatusMatch = (() => {
      if (!filters.second_call_status) return true;
      const filterVal = filters.second_call_status.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.second_call_status, filterVal);
      } else {
        // For single value, check if it's "N/A"
        if (filterVal.toLowerCase() === 'n/a') {
          return !entry.second_call_status || entry.second_call_status.toLowerCase() === 'n/a';
        }
        return matchesSearchString(entry.second_call_status, filterVal);
      }
    })();

    const secondCallCommentMatch = (() => {
      const filterVal = filters.second_call_comment;
      if (!filterVal) return true;
      if (filterVal === "filled") {
        return !!(entry.second_call_comment && entry.second_call_comment.trim() !== "");
      }
      if (filterVal === "not_filled") {
        return !entry.second_call_comment || entry.second_call_comment.trim() === "";
      }
      return entry.second_call_comment && entry.second_call_comment.toLowerCase().includes(filterVal.toLowerCase());
    })();

    const followUpCommentMatch = (() => {
      const filterVal = filters.follow_up_comment;
      if (!filterVal) return true;
      if (filterVal === "filled") {
        return !!(entry.follow_up_comment && entry.follow_up_comment.trim() !== "");
      }
      if (filterVal === "not_filled") {
        return !entry.follow_up_comment || entry.follow_up_comment.trim() === "";
      }
      return entry.follow_up_comment && entry.follow_up_comment.toLowerCase().includes(filterVal.toLowerCase());
    })();

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

    const platformAmountMatch = (() => {
      if (!filters.platform_amount) return true;
      const filterVal = filters.platform_amount.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.platform_amount, filterVal);
      } else {
        return matchesSearchString(entry.platform_amount, filterVal);
      }
    })();

    const assignmentSubmittedAtMatch = (() => {
      if (!filters.assignment_submitted_at) return true;
      const assignmentDate = entry.assignment_submitted_at && entry.assignment_submitted_at !== "" ? new Date(entry.assignment_submitted_at) : null;
      const startDate = filters.assignment_submitted_at.start
        ? new Date(filters.assignment_submitted_at.start + "T00:00:00")
        : null;
      const endDate = filters.assignment_submitted_at.end
        ? new Date(filters.assignment_submitted_at.end + "T23:59:59")
        : null;

      return (
        (!startDate || (assignmentDate && assignmentDate >= startDate)) &&
        (!endDate || (assignmentDate && assignmentDate <= endDate))
      );
    })();

    const referralCodeAssessmentMatch = (() => {
      if (!filters.referral_code_assessment) return true;
      const filterVal = filters.referral_code_assessment.trim();
      if (filterVal.includes(',')) {
        return matchesSelectedOptions(entry.referral_code_assessment, filterVal);
      } else {
        return matchesSearchString(entry.referral_code_assessment, filterVal);
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

    // Date range filter for follow_up_date
    const followUpDate = entry.follow_up_date && entry.follow_up_date !== "" ? new Date(entry.follow_up_date) : null;
    const followUpStartDate = filters.follow_up_date && filters.follow_up_date.start
      ? new Date(filters.follow_up_date.start + "T00:00:00")
      : null;
    const followUpEndDate = filters.follow_up_date && filters.follow_up_date.end
      ? new Date(filters.follow_up_date.end + "T23:59:59")
      : null;

    const followUpDateMatch =
      (!followUpStartDate || (followUpDate && followUpDate >= followUpStartDate)) &&
      (!followUpEndDate || (followUpDate && followUpDate <= followUpEndDate));

    // Course name/program filter
    const courseNameMatch = (() => {
      if (!filters.course_name) return true;
      const filterVal = filters.course_name.trim().toLowerCase();
      // Support multi-select
      if (filterVal.includes(',')) {
        return matchesSelectedOptions((entry.program || '').toLowerCase(), filterVal);
      } else {
        return (entry.program || 'flagship').toLowerCase() === filterVal;
      }
    })();

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
      platformAmountMatch &&
      assignmentSubmittedAtMatch &&
      referralCodeAssessmentMatch &&
      assessmentStatusMatch &&
      dateMatch &&
      updatedDateMatch &&
      submittedDateMatch &&
      followUpDateMatch &&
      courseNameMatch
    );

    return finalResult;
  });
};

export const exportToExcel = (
  filteredData: WorkshopRegistrationData[], 
  visibleColumns: string[]
) => {
  // Define column mappings using the actual column keys
  const columnMappings: Record<string, (entry: WorkshopRegistrationData, index: number) => string | number | boolean> = {
    "name": (entry) => entry.name,
    "email": (entry) => entry.email,
    "phone_number": (entry) => entry.phone_number,
    "workshop_name": (entry) => entry.workshop_name,
    "session_number": (entry) => entry.session_number || "N/A",
    "session_date": (entry) => entry.session_date || "N/A",
    "referal_code": (entry) => entry.referal_code || "N/A",
    "registered_at": (entry) => entry.registered_at,
    "updated_at": (entry) => entry.updated_at || "N/A",
    "attended_webinars": (entry) => entry.attended_webinars || "N/A",
    "is_assessment_attempted": (entry) => entry.is_assessment_attempted || "not_attempted",
    "is_certificate_amount_paid": (entry) => entry.is_certificate_amount_paid || "N/A",
    "is_prebooking_amount_paid": (entry) => entry.is_prebooking_amount_paid || "N/A",
    "is_course_amount_paid": (entry) => entry.is_course_amount_paid || "N/A",
    "first_call_status": (entry) => entry.first_call_status || "N/A",
    "first_call_comment": (entry) => entry.first_call_comment || "N/A",
    "second_call_status": (entry) => entry.second_call_status || "N/A",
    "second_call_comment": (entry) => entry.second_call_comment || "N/A",
    "follow_up_comment": (entry) => entry.follow_up_comment || "N/A",
    "follow_up_date": (entry) => entry.follow_up_date && entry.follow_up_date !== "" ? entry.follow_up_date : "N/A",
    "amount_paid": (entry) => entry.amount_paid || "N/A",
    "amount_pending": (entry) => entry.amount_pending || "N/A",
    "score": (entry) => entry.score || "N/A",
    "offered_scholarship_percentage": (entry) => entry.offered_scholarship_percentage || "N/A",
    "platform_amount": (entry) => entry.platform_amount || "N/A",
    "offered_amount": (entry) => entry.offered_amount || "N/A",
    "assignment_submitted_at": (entry) => entry.assignment_submitted_at && entry.assignment_submitted_at !== "" ? entry.assignment_submitted_at : "N/A",
    "referral_code_assessment": (entry) => entry.referral_code_assessment || "N/A",
    "submitted_at": (entry) => entry.submitted_at && entry.submitted_at !== "" ? entry.submitted_at : "N/A",
    "assessment_status": (entry) => entry.assessment_status || "N/A",
  };

  // Define display names for export headers
  const displayNames: Record<string, string> = {
    "name": "Name",
    "email": "Email",
    "phone_number": "Mobile Number",
    "workshop_name": "Workshop Name",
    "session_number": "Session Number",
    "session_date": "Session Date",
    "referal_code": "Referral Code",
    "registered_at": "Registered At",
    "updated_at": "Updated At",
    "attended_webinars": "Attended Webinars",
    "is_assessment_attempted": "Assessment Attempted",
    "is_certificate_amount_paid": "Certificate Amount Paid",
    "is_prebooking_amount_paid": "Prebooking Amount Paid",
    "is_course_amount_paid": "Course Amount Paid",
    "first_call_status": "First Call Status",
    "first_call_comment": "First Call Comment",
    "second_call_status": "Second Call Status",
    "second_call_comment": "Second Call Comment",
    "follow_up_comment": "Follow Up Comment",
    "follow_up_date": "Follow Up Date",
    "amount_paid": "Amount Paid",
    "amount_pending": "Amount Pending",
    "score": "Score",
    "offered_scholarship_percentage": "Offered Scholarship Percentage",
    "platform_amount": "Platform Amount",
    "offered_amount": "Offered Amount",
    "assignment_submitted_at": "Assignment Submitted At",
    "referral_code_assessment": "Referral Code Assessment",
    "submitted_at": "Submitted At",
    "assessment_status": "Assessment Status",
  };

  const exportData = filteredData.map((entry, index) => {
    const exportRow: Record<string, string | number | boolean> = {};
    
    // Add serial number as first column
    exportRow["Serial No."] = index + 1;
    
    // Only include columns that are visible
    visibleColumns.forEach(column => {
      if (columnMappings[column]) {
        const displayName = displayNames[column] || column;
        exportRow[displayName] = columnMappings[column](entry, index);
      }
    });
    
    return exportRow;
  });

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
  course_name: "",
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
  follow_up_date: { start: "", end: "" },
  amount_paid: "",
  amount_pending: "",
  score: "",
  offered_scholarship_percentage: "",
  platform_amount: "",
  offered_amount: "",
  assignment_submitted_at: { start: "", end: "" },
  referral_code_assessment: "",
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