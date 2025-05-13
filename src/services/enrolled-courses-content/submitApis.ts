import axiosInstance from "../axiosInstance";
import { AxiosError } from "axios";

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
  data: Record<string, unknown>,
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

  } catch (error: unknown) {
    console.error("Failed to submit content:", error);
    if (error instanceof AxiosError) {
      throw new Error(
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to submit content"
      );
    }
    throw new Error("Failed to submit content");
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
  } catch (error: unknown) {
    console.error("Failed to run code:", error);
    if (error instanceof AxiosError) {
      throw new Error(
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to run code"
      );
    }
    throw new Error("Failed to run code");
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
  } catch (error: unknown) {
    console.error("Failed to run custom code:", error);
    if (error instanceof AxiosError) {
      throw new Error(
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to run custom code"
      );
    }
    throw new Error("Failed to run custom code");
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
      language_id,
    };
    
    console.log("Submitting code with data:", data);
    const response = await axiosInstance.post(url, data);
    
    if (response.data && response.data.status === "Accepted") {
      try {
        console.log("Submission was successful, marking problem as complete");
        // const statusUpdateUrl = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/?activity_type=CodingProblem&sub_type=updateStatus`;
        // await axiosInstance.post(statusUpdateUrl, { status: "complete" });
      } catch (statusError) {
        console.error("Failed to automatically mark problem as complete:", statusError);
      }
    }
    
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to submit code:", error);
    if (error instanceof AxiosError) {
      throw new Error(
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to submit code"
      );
    }
    throw new Error("Failed to submit code");
  }
};

// Add a new function to update content status
// export const updateContentStatus = async (
//   clientId: number,
//   courseId: number,
//   contentId: number,
//   status: string,
//   activityType: ActivityType
// ): Promise<boolean> => {
//   try {
//     // Use the more generic submitContent function that we know works with different activity types
//     const result = await submitContent(
//       clientId,
//       courseId,
//       contentId,
//       activityType,
//       { status: status },
//       "updateStatus"
//     );
    
//     console.log("Update content status response:", result);
//     return result === 200 || result === 201;
//   } catch (error: unknown) {
//     console.error("Failed to update content status:", error);
//     if (error instanceof AxiosError) {
//       console.error("API Error Details:", {
//         response: error.response?.data,
//         status: error.response?.status,
//         message: error.message
//       });
//       throw new Error(
//         error?.response?.data?.detail ||
//         error?.message ||
//         "Failed to update content status"
//       );
//     }
//     throw new Error("Failed to update content status");
//   }
// };

// // Add a function to get content status
// export interface ContentStatusResponse {
//   status: string;
//   content_id: number;
//   activity_type: ActivityType;
// }

// export const getContentStatus = async (
//   clientId: number,
//   courseId: number,
//   contentId: number,
//   activityType: ActivityType
// ): Promise<ContentStatusResponse> => {
//   try {
//     const url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/status/?activity_type=${activityType}`;
    
//     const response = await axiosInstance.get(url);
//     console.log("Get content status response:", response.data);
//     return response.data;
//   } catch (error: unknown) {
//     console.error("Failed to get content status:", error);
//     if (error instanceof AxiosError) {
//       throw new Error(
//         error?.response?.data?.detail ||
//         error?.message ||
//         "Failed to get content status"
//       );
//     }
//     throw new Error("Failed to get content status");
//   }
// };

// Define submission history interface
export interface SubmissionHistoryItem {
  id: number;
  status: string;
  submitted_at: string;
  runtime: string;
  memory: string;
  language: string;
  source_code: string;
}

// Add function to fetch submission history
export const getSubmissionHistory = async (
  clientId: number,
  courseId: number,
  contentId: number
): Promise<SubmissionHistoryItem[]> => {
  try {
    const url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/submissions/?activity_type=CodingProblem`;
    
    console.log(`Fetching submission history from: ${url}`);
    const response = await axiosInstance.get(url);
    console.log("Submission history response:", response.data);
    
    return response.data.submissions || [];
  } catch (error: unknown) {
    console.error("Failed to fetch submission history:", error);
    if (error instanceof AxiosError) {
      throw new Error(
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to fetch submission history"
      );
    }
    throw new Error("Failed to fetch submission history");
  }
};


