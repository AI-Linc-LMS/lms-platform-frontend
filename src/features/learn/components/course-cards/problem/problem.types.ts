export interface ProblemDetails {
  id: number;
  difficulty_level: string;
  input_format: string;
  output_format: string;
  problem_statement: string;
  sample_input: string;
  sample_output: string;
  title: string;
  template_code: Array<{
    language: string;
    language_id: number;
    template_code: string;
  }>;
  test_cases: Array<{
    input: string;
    expected_output: string;
  }>;
}

export interface ProblemData {
  id: number;
  content_type: string;
  content_title: string;
  details: ProblemDetails;
}

export interface TestCase {
  test_case?: number;
  input: string;
  expected_output: string;
  sample_input: string;
  sample_output: string;
  userOutput?: string;
  status?: "passed" | "failed" | "running";
  time?: string;
  memory?: number;
}

export interface CustomTestCase {
  input: string;
  output?: string;
  status?: "passed" | "failed" | "running";
  time?: string;
  memory?: number;
}
