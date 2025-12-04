// Re-export types from API services for convenience
export type {
  Assessment,
  QuizSection,
  MCQ,
  CreateAssessmentPayload,
  UpdateAssessmentPayload,
  AssessmentDetail,
} from "../../../services/admin/assessmentApis";

export type {
  MCQListItem,
  CreateMCQPayload,
  UpdateMCQPayload,
} from "../../../services/admin/mcqApis";

// UI-specific types
export type MCQMode = "create" | "select" | "bulk";

export interface MCQData {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  topic: string;
  skills: string;
}

export interface AssessmentFormData {
  title: string;
  instructions: string;
  description: string;
  duration_minutes: number;
  is_paid: boolean;
  price: string;
  currency: string;
  is_active: boolean;
  quiz_section: {
    title: string;
    description: string;
    order: number;
  };
  mode: MCQMode;
  mcqs: MCQData[];
  mcq_ids: number[];
}

export const initialAssessmentFormData: AssessmentFormData = {
  title: "",
  instructions: "",
  description: "",
  duration_minutes: 60,
  is_paid: false,
  price: "",
  currency: "INR",
  is_active: true,
  quiz_section: {
    title: "",
    description: "",
    order: 1,
  },
  mode: "create",
  mcqs: [],
  mcq_ids: [],
};

export const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

// Function to generate a unique 5-digit ID for new MCQs
const generateMCQId = () => {
  // Generate a random 5-digit number (10000 to 99999)
  return String(Math.floor(10000 + Math.random() * 90000));
};

export const initialMCQData = {
  id: generateMCQId(),
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A" as "A" | "B" | "C" | "D",
  explanation: "",
  difficulty_level: "Medium" as "Easy" | "Medium" | "Hard",
  topic: "",
  skills: "",
};

// Helper function to create a new MCQ with a unique ID
export const createNewMCQ = (): MCQData => ({
  id: generateMCQId(),
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  explanation: "",
  difficulty_level: "Medium",
  topic: "",
  skills: "",
});

// CSV Template Headers
export const CSV_HEADERS = [
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "explanation",
  "difficulty_level",
  "topic",
  "skills",
];

// Function to download CSV template (empty)
export const downloadCSVTemplate = () => {
  const headers = CSV_HEADERS.join(",");
  
  const csvContent = headers; // Empty template with only headers
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", "mcq_template.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to parse CSV line considering quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Function to parse CSV and validate
export const parseCSV = (csvText: string): { data: MCQData[]; errors: string[] } => {
  const errors: string[] = [];
  const mcqs: MCQData[] = [];
  
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    errors.push("CSV file is empty or contains only headers");
    return { data: [], errors };
  }
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  // Validate headers
  const requiredHeaders = ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    return { data: [], errors };
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    const rowData: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      rowData[header] = values[index] || "";
    });
    
    // Validate row
    const rowErrors: string[] = [];
    
    if (!rowData.question_text) {
      rowErrors.push(`Row ${i}: Question text is required`);
    }
    
    if (!rowData.option_a || !rowData.option_b || !rowData.option_c || !rowData.option_d) {
      rowErrors.push(`Row ${i}: All options (A, B, C, D) are required`);
    }
    
    if (!["A", "B", "C", "D"].includes(rowData.correct_option?.toUpperCase())) {
      rowErrors.push(`Row ${i}: Correct option must be A, B, C, or D`);
    }
    
    const difficulty = rowData.difficulty_level || "Medium";
    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      rowErrors.push(`Row ${i}: Difficulty must be Easy, Medium, or Hard`);
    }
    
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      mcqs.push({
        id: generateMCQId(),
        question_text: rowData.question_text,
        option_a: rowData.option_a,
        option_b: rowData.option_b,
        option_c: rowData.option_c,
        option_d: rowData.option_d,
        correct_option: rowData.correct_option.toUpperCase() as "A" | "B" | "C" | "D",
        explanation: rowData.explanation || "",
        difficulty_level: (difficulty as "Easy" | "Medium" | "Hard"),
        topic: rowData.topic || "",
        skills: rowData.skills || "",
      });
    }
  }
  
  return { data: mcqs, errors };
};
