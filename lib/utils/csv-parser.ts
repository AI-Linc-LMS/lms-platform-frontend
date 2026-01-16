export interface ParsedStudent {
  name: string;
  email: string;
  phone?: string;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVParseResult {
  students: ParsedStudent[];
  errors: CSVValidationError[];
  isValid: boolean;
}

/**
 * Parse CSV file and extract student data
 * Expected columns: name, email, phone (optional)
 * Column names are case-insensitive
 */
export function parseStudentCSV(csvText: string): CSVParseResult {
  const errors: CSVValidationError[] = [];
  const students: ParsedStudent[] = [];

  // Split into lines and filter empty lines
  const lines = csvText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    errors.push({
      row: 0,
      field: "file",
      message: "CSV file must have at least a header row and one data row",
    });
    return { students, errors, isValid: false };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  // Find column indices (case-insensitive)
  const nameIndex = headers.findIndex(
    (h) => h === "name" || h === "student name" || h === "full name"
  );
  const emailIndex = headers.findIndex(
    (h) => h === "email" || h === "email address" || h === "e-mail"
  );
  const phoneIndex = headers.findIndex(
    (h) =>
      h === "phone" ||
      h === "phone number" ||
      h === "mobile" ||
      h === "contact"
  );

  // Validate required columns
  if (nameIndex === -1) {
    errors.push({
      row: 1,
      field: "header",
      message: "Missing required column: 'name' (case-insensitive)",
    });
  }

  if (emailIndex === -1) {
    errors.push({
      row: 1,
      field: "header",
      message: "Missing required column: 'email' (case-insensitive)",
    });
  }

  if (errors.length > 0) {
    return { students, errors, isValid: false };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNumber = i + 1; // 1-indexed for user display

    // Handle quoted values (basic CSV parsing)
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add last value

    // Extract values
    const name = values[nameIndex]?.trim() || "";
    const email = values[emailIndex]?.trim() || "";
    const phone = phoneIndex !== -1 ? values[phoneIndex]?.trim() : undefined;

    // Validate required fields
    if (!name) {
      errors.push({
        row: rowNumber,
        field: "name",
        message: "Name is required",
      });
    }

    if (!email) {
      errors.push({
        row: rowNumber,
        field: "email",
        message: "Email is required",
      });
    } else if (!isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        message: `Invalid email format: ${email}`,
      });
    }

    // Only add student if name and email are valid
    if (name && email && isValidEmail(email)) {
      students.push({
        name,
        email,
        phone: phone || undefined,
      });
    }
  }

  // Consider valid if we have at least one valid student
  // Errors are collected for invalid rows but don't block processing
  return {
    students,
    errors,
    isValid: students.length > 0,
  };
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
