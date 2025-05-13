import axiosInstance from "../axiosInstance";

// Define types for activity types and sub types
export type ActivityType = 'Quiz' | 'Article' | 'Assignment' | 'CodingProblem' | 'VideoTutorial';
export type SubType = 'runCode' | 'submitCode' | 'customRunCode';

// Language ID mapping for Judge0
export const LANGUAGE_ID_MAPPING = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
};

export const submitContent = async (
  clientId: number,
  courseId: number,
  contentId: number,
  activityType: ActivityType,
  data: any,
  subType?: SubType
) => {
  try {
    let url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/?activity_type=${activityType}`;
    
    // Only add sub_type if activity type is CodingProblem and subType is provided
    if (activityType === 'CodingProblem' && subType) {
      url += `&sub_type=${subType}`;
    }

    const res = await axiosInstance.post(url, data);
    
    console.log("submit content",res);
    return res.status;
  } catch (error: any) {
    console.error("Failed to submit content:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to submit content"
    );
  }
}

// Run code with test cases
export interface RunCodeResult {
  results: Array<{
    test_case: number;
    input: string;
    expected_output: string;
    actual_output: string;
    status: string;
    verdict: string;
    stderr: string | null;
    compile_output: string | null;
    time: string;
    memory: number;
  }>;
}

export const runCode = async (
  clientId: number,
  courseId: number,
  contentId: number,
  source_code: string,
  language_id: number
): Promise<RunCodeResult> => {
  try {
    const url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/?activity_type=CodingProblem&sub_type=runCode`;
    const data = {
      source_code,
      language_id
    };
    
    const response = await axiosInstance.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to run code:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to run code"
    );
  }
};

// Run code with custom input
export interface CustomRunCodeResult {
  input: string;
  actual_output: string;
  status: string;
  stderr: string;
  compile_output: string;
  time: string;
  memory: number;
}

export const runCustomCode = async (
  clientId: number,
  courseId: number,
  contentId: number,
  source_code: string,
  language_id: number,
  input: string
): Promise<CustomRunCodeResult> => {
  try {
    const url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/?activity_type=CodingProblem&sub_type=customRunCode`;
    const data = {
      source_code,
      language_id,
      input
    };
    
    const response = await axiosInstance.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to run custom code:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to run custom code"
    );
  }
};

// Submit code for evaluation
export interface SubmitCodeResult {
  status: string;
  total_test_cases: number;
  passed: number;
  failed: number;
}

export const submitCode = async (
  clientId: number,
  courseId: number,
  contentId: number,
  source_code: string,
  language_id: number
): Promise<SubmitCodeResult> => {
  try {
    const url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/?activity_type=CodingProblem&sub_type=submitCode`;
    const data = {
      source_code,
      language_id
    };
    
    const response = await axiosInstance.post(url, data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to submit code:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to submit code"
    );
  }
};


