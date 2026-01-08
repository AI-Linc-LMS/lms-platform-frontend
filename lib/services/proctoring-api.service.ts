import apiClient from "./api";
import { config } from "../config";
import { ProctoringViolation } from "./proctoring.service";

interface LogViolationParams {
  assessment_id?: number;
  exam_id?: number;
  violation: ProctoringViolation;
  snapshot?: string;
}

interface ViolationResponse {
  success: boolean;
  message: string;
  violation_id: string;
}

interface GetViolationsParams {
  assessment_id?: number;
  user_id?: number;
}

interface GetViolationsResponse {
  success: boolean;
  violations: Array<
    ProctoringViolation & {
      id: string;
      assessment_id?: number;
      user_id?: number;
      snapshot?: string;
    }
  >;
  count: number;
}

/**
 * API service for proctoring violations
 * Connects to your backend API for logging and retrieving proctoring data
 */
export const proctoringApiService = {
  /**
   * Log a proctoring violation to the backend
   */
  logViolation: async (
    params: LogViolationParams
  ): Promise<ViolationResponse> => {
    const response = await apiClient.post<ViolationResponse>(
      `/proctoring/api/clients/${config.clientId}/violations/`,
      {
        assessment_id: params.assessment_id,
        exam_id: params.exam_id,
        violation_type: params.violation.type,
        message: params.violation.message,
        severity: params.violation.severity,
        timestamp: new Date(params.violation.timestamp).toISOString(),
        confidence: params.violation.confidence,
        snapshot: params.snapshot,
      }
    );
    return response.data;
  },

  /**
   * Get violations for an assessment or user
   */
  getViolations: async (
    params: GetViolationsParams
  ): Promise<GetViolationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.assessment_id) {
      queryParams.append("assessment_id", params.assessment_id.toString());
    }
    if (params.user_id) {
      queryParams.append("user_id", params.user_id.toString());
    }

    const url = `/proctoring/api/clients/${config.clientId}/violations/?${queryParams.toString()}`;
    const response = await apiClient.get<GetViolationsResponse>(url);
    return response.data;
  },

  /**
   * Log violation with automatic snapshot capture
   */
  logViolationWithSnapshot: async (
    violation: ProctoringViolation,
    captureSnapshot: () => Promise<string | null>,
    assessmentId?: number,
    examId?: number
  ): Promise<ViolationResponse> => {
    // Capture snapshot for high-severity violations
    let snapshot: string | undefined;
    if (violation.severity === "high" || violation.severity === "medium") {
      const capturedSnapshot = await captureSnapshot();
      if (capturedSnapshot) {
        snapshot = capturedSnapshot;
      }
    }

    return await proctoringApiService.logViolation({
      assessment_id: assessmentId,
      exam_id: examId,
      violation,
      snapshot,
    });
  },
};

