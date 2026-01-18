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
    title: problem.title,
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
 * Convert quizSection with mcqs to sections array
 */
export function convertQuizSectionsToSections(
  quizSections: Array<{
    id: number;
    title: string;
    description: string;
    order: number;
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
  return quizSections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    section_type: "quiz",
    questions: section.mcqs.map(convertMCQToQuizQuestion),
  }));
}

/**
 * Convert codingProblemSection to sections array
 */
export function convertCodingSectionsToSections(
  codingSections: Array<{
    id: number;
    title: string;
    description: string;
    order: number;
    coding_problems: Array<any>;
  }>
) {
  return codingSections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    section_type: "coding",
    questions: section.coding_problems.map(convertCodingProblem),
  }));
}

/**
 * Merge and sort quiz and coding sections
 */
export function mergeAssessmentSections(
  quizSections: Array<any> = [],
  codingSections: Array<any> = []
) {
  const allSections = [
    ...convertQuizSectionsToSections(quizSections),
    ...convertCodingSectionsToSections(codingSections),
  ];

  // Sort by order
  return allSections.sort((a, b) => a.order - b.order);
}

/**
 * Format assessment responses for API submission
 * Uses actual section IDs from the assessment, not indices
 */
export function formatAssessmentResponses(
  responses: Record<string, Record<string, any>>,
  sections: Array<{ id: number; section_type: string; questions: Array<{ id: number | string }> }>
): {
  quizSectionId: Array<Record<string, any>>;
  codingProblemSectionId: Array<Record<string, any>>;
} {
  const quizSectionId: Array<Record<string, any>> = [];
  const codingProblemSectionId: Array<Record<string, any>> = [];

  sections.forEach((section: any) => {
    const sectionType = section.section_type || "quiz";
    const sectionResponses = responses[sectionType] || {};
    const sectionQuestions = section.questions || [];
    const sectionResponseData: Record<string, any> = {};

    sectionQuestions.forEach((question: any) => {
      const questionId = question.id;
      const questionResponse = sectionResponses[questionId];

      if (questionResponse !== undefined && questionResponse !== null) {
        if (sectionType === "coding") {
          // Format coding response
          sectionResponseData[String(questionId)] = {
            tc_passed:
              questionResponse.tc_passed ?? questionResponse.passed ?? 0,
            total_tc:
              questionResponse.total_tc ??
              questionResponse.total_test_cases ??
              0,
            best_code:
              questionResponse.best_code ?? questionResponse.code ?? "",
          };
        } else {
          // Format quiz response (just the answer value)
          sectionResponseData[String(questionId)] = questionResponse;
        }
      }
    });

    // Only add section if it has responses
    if (Object.keys(sectionResponseData).length > 0) {
      const sectionEntry = {
        [String(section.id)]: sectionResponseData, // Use actual section ID, not index
      };

      if (sectionType === "coding") {
        codingProblemSectionId.push(sectionEntry);
      } else {
        quizSectionId.push(sectionEntry);
      }
    }
  });

  return {
    quizSectionId,
    codingProblemSectionId,
  };
}