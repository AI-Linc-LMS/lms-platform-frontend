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

    const workshopMatch =
      !filters.workshop_name ||
      entry.workshop_name
        .toLowerCase()
        .includes(filters.workshop_name.toLowerCase());

    const sessionMatch =
      !filters.session_number ||
      (entry.session_number &&
        entry.session_number.toString().includes(filters.session_number));

    const referralMatch =
      !filters.referal_code ||
      (entry.referal_code &&
        entry.referal_code
          .toLowerCase()
          .includes(filters.referal_code.toLowerCase()));

    // New field filters
    const attendedWebinarsMatch =
      !filters.attended_webinars ||
      entry.attended_webinars
        .toLowerCase()
        .includes(filters.attended_webinars.toLowerCase());

    const assessmentAttemptedMatch =
      !filters.is_assessment_attempted ||
      entry.is_assessment_attempted
        .toLowerCase()
        .includes(filters.is_assessment_attempted.toLowerCase());

    const certificatePaidMatch =
      !filters.is_certificate_amount_paid ||
      entry.is_certificate_amount_paid
        .toLowerCase()
        .includes(filters.is_certificate_amount_paid.toLowerCase());

    const prebookingPaidMatch =
      !filters.is_prebooking_amount_paid ||
      entry.is_prebooking_amount_paid
        .toLowerCase()
        .includes(filters.is_prebooking_amount_paid.toLowerCase());

    const coursePaidMatch =
      !filters.is_course_amount_paid ||
      entry.is_course_amount_paid
        .toLowerCase()
        .includes(filters.is_course_amount_paid.toLowerCase());

    const firstCallStatusMatch =
      !filters.first_call_status ||
      entry.first_call_status
        .toLowerCase()
        .includes(filters.first_call_status.toLowerCase());

    const firstCallCommentMatch =
      !filters.fist_call_comment ||
      entry.fist_call_comment
        .toLowerCase()
        .includes(filters.fist_call_comment.toLowerCase());

    const secondCallStatusMatch =
      !filters.second_call_status ||
      entry.second_call_status
        .toLowerCase()
        .includes(filters.second_call_status.toLowerCase());

    const secondCallCommentMatch =
      !filters.second_call_comment ||
      entry.second_call_comment
        .toLowerCase()
        .includes(filters.second_call_comment.toLowerCase());

    const amountPaidMatch =
      !filters.amount_paid ||
      entry.amount_paid
        .toLowerCase()
        .includes(filters.amount_paid.toLowerCase());

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