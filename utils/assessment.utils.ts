/**
 * Resolve per-section time cap in seconds from common API shapes (snake_case, camelCase, seconds-only).
 */
export function getSectionTimeCapTotalSeconds(section: unknown): number | null {
  if (!section || typeof section !== "object") return null;
  const s = section as Record<string, unknown>;
  const precomputed = s.section_time_cap_seconds;
  if (
    precomputed != null &&
    Number.isFinite(Number(precomputed)) &&
    Number(precomputed) > 0
  ) {
    return Math.floor(Number(precomputed));
  }
  const min = s.time_limit_minutes ?? s.timeLimitMinutes;
  if (min != null && Number.isFinite(Number(min)) && Number(min) > 0) {
    return Math.floor(Number(min) * 60);
  }
  const sec =
    s.time_limit_seconds ??
    s.section_time_limit_seconds ??
    s.section_time_seconds;
  if (sec != null && Number.isFinite(Number(sec)) && Number(sec) > 0) {
    return Math.floor(Number(sec));
  }
  return null;
}

/** Stable key for timed sections that are marked `section_completely_attempted` in the response sheet. */
export function timedSectionCompletionKey(
  sectionType: string,
  sectionId: number,
): string {
  return `${sectionType || "quiz"}:${String(sectionId)}`;
}

const SECTION_ATTEMPTED_FLAG = "section_completely_attempted" as const;

/**
 * True if payload object from API includes `section_completely_attempted: true`.
 */
export function parseSectionCompletelyAttempted(
  sectionPayload: Record<string, unknown>,
): boolean {
  const v = sectionPayload[SECTION_ATTEMPTED_FLAG];
  return v === true || v === "true" || v === 1;
}

/**
 * Convert API MCQ format to QuizLayout format
 */
export function convertMCQToQuizQuestion(mcq: {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}): {
  id: number;
  question: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
} {
  return {
    id: mcq.id,
    question: mcq.question_text,
    options: [
      { id: "a", label: mcq.option_a, value: "a" },
      { id: "b", label: mcq.option_b, value: "b" },
      { id: "c", label: mcq.option_c, value: "c" },
      { id: "d", label: mcq.option_d, value: "d" },
    ],
  };
}

/**
 * Convert coding problem to the format expected by the UI
 */
export function convertCodingProblem(problem: any) {
  return {
    id: problem.id,
    title: problem.title ?? problem.name ?? problem.problem_title ?? "Coding Problem",
    problem_statement: problem.problem_statement,
    difficulty_level: problem.difficulty_level,
    input_format: problem.input_format,
    output_format: problem.output_format,
    sample_input: problem.sample_input,
    sample_output: problem.sample_output,
    constraints: problem.constraints,
    tags: problem.tags,
    template_code: problem.template_code,
    test_cases: problem.test_cases,
    time_limit: problem.time_limit,
    memory_limit: problem.memory_limit,
  };
}

/**
 * Convert quizSection with mcqs to sections array for the **learner take** UI.
 * Intentionally omits `section_cutoff_marks` and similar scoring thresholds so they are not exposed to students.
 */
export function convertQuizSectionsToSections(
  quizSections: Array<{
    id: number;
    title: string;
    description: string;
    order: number;
    time_limit_minutes?: number | null;
    mcqs: Array<{
      id: number;
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
    }>;
  }>
) {
  return quizSections.map((section) => {
    const capSec = getSectionTimeCapTotalSeconds(section);
    const timeLimitMinutes =
      capSec != null ? capSec / 60 : undefined;
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      section_type: "quiz" as const,
      questions: section.mcqs.map(convertMCQToQuizQuestion),
      ...(capSec != null
        ? { time_limit_minutes: timeLimitMinutes, section_time_cap_seconds: capSec }
        : {}),
    };
  });
}

/**
 * Convert codingProblemSection to sections array for the **learner take** UI.
 * Intentionally omits `section_cutoff_marks` and similar scoring thresholds so they are not exposed to students.
 */
export function convertCodingSectionsToSections(
  codingSections: Array<{
    id: number;
    title: string;
    description: string;
    order: number;
    time_limit_minutes?: number | null;
    coding_problems: Array<any>;
  }>
) {
  return codingSections.map((section) => {
    const capSec = getSectionTimeCapTotalSeconds(section);
    const timeLimitMinutes =
      capSec != null ? capSec / 60 : undefined;
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      section_type: "coding" as const,
      questions: section.coding_problems.map(convertCodingProblem),
      ...(capSec != null
        ? { time_limit_minutes: timeLimitMinutes, section_time_cap_seconds: capSec }
        : {}),
    };
  });
}

/**
 * Normalize saved subjective answers: plain string, { answer }, or graded objects from server.
 */
export function normalizeSubjectiveAnswer(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "answer" in raw) {
    const a = (raw as { answer: unknown }).answer;
    return typeof a === "string" ? a : "";
  }
  return "";
}

/**
 * Convert subjectiveQuestionSection to sections array for the **learner take** UI.
 * Intentionally omits internal scoring fields so they are not exposed to students.
 */
export function convertSubjectiveSectionsToSections(
  subjectiveSections: Array<{
    id: number;
    title: string;
    description: string;
    order: number;
    time_limit_minutes?: number | null;
    subjective_questions: Array<{
      id: number;
      question_text: string;
      max_marks?: number;
      question_type?: string;
    }>;
  }>
) {
  return subjectiveSections.map((section) => {
    const capSec = getSectionTimeCapTotalSeconds(section);
    const timeLimitMinutes =
      capSec != null ? capSec / 60 : undefined;
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      section_type: "subjective" as const,
      questions: (section.subjective_questions || []).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        max_marks: q.max_marks,
        question_type: q.question_type,
      })),
      ...(capSec != null
        ? { time_limit_minutes: timeLimitMinutes, section_time_cap_seconds: capSec }
        : {}),
    };
  });
}

/**
 * Merge and sort quiz, coding, and subjective sections
 */
export function mergeAssessmentSections(
  quizSections: Array<any> = [],
  codingSections: Array<any> = [],
  subjectiveSections: Array<any> = []
) {
  const allSections = [
    ...convertQuizSectionsToSections(quizSections),
    ...convertCodingSectionsToSections(codingSections),
    ...convertSubjectiveSectionsToSections(subjectiveSections),
  ];

  // Sort by order
  return allSections.sort((a, b) => a.order - b.order);
}

/**
 * Format assessment responses for API submission
 * Uses actual section IDs from the assessment, not indices
 * For quiz sections: includes ALL questions (even if not attempted) for post-assessment analysis
 * For coding sections: unattempted = best_code empty; attempted = prefer sessionStorage code if found
 */
export function formatAssessmentResponses(
  responses: Record<string, Record<string, any>>,
  sections: Array<{ id: number; section_type: string; questions: Array<{ id: number | string }> }>,
  getCodeFromSession?: (questionId: number | string) => string | null,
  /** Section keys (`timedSectionCompletionKey`) that have finished a timed block — sent as `section_completely_attempted`. */
  timedSectionsComplete?: ReadonlySet<string> | null,
): {
  quizSectionId: Array<Record<string, any>>;
  codingProblemSectionId: Array<Record<string, any>>;
  subjectiveQuestionSectionId: Array<Record<string, any>>;
} {
  const quizSectionId: Array<Record<string, any>> = [];
  const codingProblemSectionId: Array<Record<string, any>> = [];
  const subjectiveQuestionSectionId: Array<Record<string, any>> = [];

  sections.forEach((section: any) => {
    const sectionType = section.section_type || "quiz";
    const sectionResponses = responses[sectionType] || {};
    const sectionQuestions = section.questions || [];
    const sectionResponseData: Record<string, any> = {};

    sectionQuestions.forEach((question: any) => {
      const questionId = question.id;
      const questionResponse = sectionResponses[questionId];

      if (sectionType === "coding") {
        // For coding: include ALL problems - attempted and unattempted
        // Unattempted: best_code = "" (empty)
        // Attempted: prefer sessionStorage code if found, else response code
        // IMPORTANT: If code exists in sessionStorage (even if never run/submitted), include it
        const templateCode = question.template_code?.python ||
                            question.template_code?.python3 ||
                            question.template_code?.java ||
                            question.template_code?.cpp ||
                            question.template_code?.javascript ||
                            "";
        const totalTestCases = question.test_cases?.length ?? 0;
        
        // Check sessionStorage first - if code exists there, use it even if never run/submitted
        const sessionCode = getCodeFromSession?.(questionId);
        const hasSessionCode = sessionCode != null && sessionCode.trim() !== "";
        
        const hasTestResults = questionResponse?.tc_passed !== undefined ||
                               questionResponse?.total_tc !== undefined ||
                               questionResponse?.passed !== undefined ||
                               questionResponse?.total_test_cases !== undefined;
        const isExplicitlySubmitted = questionResponse?.submitted === true;
        
        // Consider attempted if: explicitly submitted, has test results, OR has code in sessionStorage
        // If user wrote code (even if never run/submitted), include it in submission
        const attempted = isExplicitlySubmitted || hasTestResults || hasSessionCode;

        if (attempted) {
          // Prefer sessionStorage code (most up-to-date), then response code, then template code
          const code = hasSessionCode
            ? sessionCode
            : (questionResponse?.best_code ?? questionResponse?.code ?? templateCode ?? "");
          
          sectionResponseData[String(questionId)] = {
            tc_passed: questionResponse?.tc_passed ?? questionResponse?.passed ?? 0,
            total_tc: questionResponse?.total_tc ?? questionResponse?.total_test_cases ?? totalTestCases,
            best_code: code.trim() !== "" ? code : templateCode,
          };
        } else {
          // Unattempted - keep best_code empty
          sectionResponseData[String(questionId)] = {
            tc_passed: 0,
            total_tc: totalTestCases,
            best_code: "",
          };
        }
      } else if (sectionType === "subjective") {
        const text = normalizeSubjectiveAnswer(questionResponse);
        sectionResponseData[String(questionId)] = text;
      } else {
        // For quiz: include ALL questions, even if not attempted (for post-assessment analysis)
        // Send null or empty string if not attempted
        if (questionResponse !== undefined && questionResponse !== null) {
          sectionResponseData[String(questionId)] = questionResponse;
        } else {
          // Include unanswered questions with null value
          sectionResponseData[String(questionId)] = null;
        }
      }
    });

    const capSec = getSectionTimeCapTotalSeconds(section);
    const completionKey = timedSectionCompletionKey(sectionType, section.id);
    const attachAttemptedFlag =
      timedSectionsComplete?.has(completionKey) === true &&
      capSec != null &&
      capSec > 0;
    const sectionPayload = attachAttemptedFlag
      ? { ...sectionResponseData, [SECTION_ATTEMPTED_FLAG]: true }
      : sectionResponseData;

    // For quiz sections: always add section (even if all questions are null)
    // For coding sections: always add section - includes all problems (attempted and unattempted)
    if (sectionType === "quiz" && sectionQuestions.length > 0) {
      const sectionEntry = {
        [String(section.id)]: sectionPayload,
      };
      quizSectionId.push(sectionEntry);
    } else if (sectionType === "coding" && sectionQuestions.length > 0) {
      const sectionEntry = {
        [String(section.id)]: sectionPayload,
      };
      codingProblemSectionId.push(sectionEntry);
    } else if (sectionType === "subjective" && sectionQuestions.length > 0) {
      const sectionEntry = {
        [String(section.id)]: sectionPayload,
      };
      subjectiveQuestionSectionId.push(sectionEntry);
    }
  });

  return {
    quizSectionId,
    codingProblemSectionId,
    subjectiveQuestionSectionId,
  };
}