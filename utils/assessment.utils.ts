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
