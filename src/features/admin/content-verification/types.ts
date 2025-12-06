// Re-export types from API services for convenience
export type {
  ContentType,
  ContentListItem,
  ContentTypeCount,
  ContentDetail,
  ContentDetails,
  ArticleDetails,
  VideoTutorialDetails,
  QuizDetails,
  QuizMCQ,
  AssignmentDetails,
  CodingProblemDetails,
  TestCase,
  TemplateCode,
  VerifyContentResponse,
} from "../../../services/admin/contentApis";

// UI-specific types
export interface ContentFilters {
  type: string; // "All" or specific ContentType
  verificationStatus: string; // "All", "Verified", "Unverified"
  searchQuery: string;
}

export const initialFilters: ContentFilters = {
  type: "All",
  verificationStatus: "All",
  searchQuery: "",
};

// Language options for code editor
export interface LanguageOption {
  value: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

// Content type display configuration
export interface ContentTypeConfig {
  label: string;
  color: string;
  icon: string;
}

export const CONTENT_TYPE_CONFIG: Record<string, ContentTypeConfig> = {
  Quiz: { label: "Quiz", color: "#3b82f6", icon: "quiz" },
  Article: { label: "Article", color: "#10b981", icon: "article" },
  Assignment: { label: "Assignment", color: "#f59e0b", icon: "assignment" },
  CodingProblem: { label: "Coding Problem", color: "#8b5cf6", icon: "code" },
  DevCodingProblem: {
    label: "Dev Coding Problem",
    color: "#ec4899",
    icon: "code",
  },
  VideoTutorial: {
    label: "Video Tutorial",
    color: "#ef4444",
    icon: "video",
  },
};


