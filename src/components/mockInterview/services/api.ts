// API Service for Mock Interview Backend Communication
import axiosInstance from "../../../services/axiosInstance";

/**
 * Interview Object - matches API response
 * List View: id, title, status, topic, subtopic, difficulty, scheduled_date_time
 * Detail View: All list fields + questions_for_interview, grading_scheme, evaluation_score,
 *              interview_transcript, started_at, submitted_at, duration_minutes
 */
export interface InterviewAttempt {
  id: string;
  title?: string;
  userId?: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date_time?: string;
  started_at?: string;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
  completedAt?: Date | null;
  duration?: number; // in seconds
  duration_minutes?: number;
  score?: number | null;
  questionsAnswered?: number;
  totalQuestions?: number;
  videoRecordingUrl?: string;
  audioRecordingUrl?: string;
  questions_for_interview?: InterviewQuestion[];
  grading_scheme?: any;
  evaluation_score?: EvaluationScore;
  interview_transcript?: InterviewTranscript;
}

/**
 * Evaluation Score Object from API
 */
export interface EvaluationScore {
  overall_score: number;
  overall_percentage: number;
  max_possible_score: number;
  question_scores: QuestionScore[];
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
}

/**
 * Question Score from evaluation
 */
export interface QuestionScore {
  question_id: string | number;
  score: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
}

/**
 * Interview Transcript from API
 */
export interface InterviewTranscript {
  responses: TranscriptResponse[];
  total_duration_seconds: number;
  logs: any[];
  metadata?: Record<string, any>;
}

/**
 * Question Object from API
 */
export interface InterviewQuestion {
  id: string | number;
  question_text: string;
  questionText?: string; // For backwards compatibility
  type?: string;
  expected_key_points?: string[];
  expectedAnswer?: string;
  topic?: string;
  difficulty?: string;
  order?: number;
}

/**
 * Transcript Response (for submission)
 */
export interface TranscriptResponse {
  question_id: string | number;
  response: string;
  timestamp: string;
  duration_seconds: number;
}

/**
 * Interview Answer (internal format for collecting answers)
 */
export interface InterviewAnswer {
  questionId: string | number;
  answerText: string;
  audioUrl?: string;
  videoUrl?: string;
  timestamp: number;
  duration?: number;
  confidence?: number;
  questionText?: string;
}

export interface InterviewEvent {
  timestamp: number;
  type:
    | "face_detection"
    | "multiple_faces"
    | "no_face"
    | "face_valid"
    | "question_change"
    | "question_ready"
    | "user_response"
    | "fullscreen_exit"
    | "fullscreen_enter"
    | "fullscreen_lock"
    | "camera_permission"
    | "audio_permission"
    | "camera_ready"
    | "recording_start"
    | "recording_stop"
    | "audio_issue"
    | "video_issue"
    | "answer_saved"
    | "answer_save_failed"
    | "tab_switch"
    | "window_switch";
  data: any;
  severity: "info" | "warning" | "error";
}

export interface InterviewSubmission {
  attemptId: string;
  answers: InterviewAnswer[];
  events: InterviewEvent[];
  duration: number;
  faceValidationFailures: number;
  multipleFaceDetections: number;
  fullscreenExits: number;
  completedQuestions: number;
  totalQuestions: number;
  videoBlob?: Blob;
  metadata: {
    userAgent: string;
    screenResolution: string;
    timestamp: number;
    tabSwitches?: number;
    windowSwitches?: number;
    // Enhanced proctoring metrics
    noFaceIncidents?: number;
    noFaceDuration?: number; // in seconds
    lookingAwayIncidents?: number;
    lookingAwayDuration?: number; // in seconds
    multipleFaceIncidents?: number;
    [key: string]: any;
  };
}

export interface InterviewReport {
  attemptId: string;
  overallScore: number;
  questionScores: Array<{
    questionId: string;
    score: number;
    feedback: string;
  }>;
  strengths: string[];
  improvements: string[];
  behavioralNotes: string[];
  technicalAccuracy: number;
  communicationSkills: number;
  confidence: number;
  recommendation: string;
}

class MockInterviewAPI {
  private baseUrl: string;

  constructor() {
    // Mock Interview API base URL
    this.baseUrl = "/mock-interview/api";
  }

  /**
   * Get client ID from environment or localStorage
   */
  private getClientId(): string {
    // Try environment variable first
    const envClientId = import.meta.env.VITE_CLIENT_ID;
    if (envClientId) {
      return envClientId;
    }

    // Fallback to user data in localStorage
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        return userData.client_id || userData.id || "1";
      }
    } catch (error) {
      // Silent fail
    }

    // Default fallback
    return "1";
  }

  /**
   * Fetch all interview attempts for the current user
   * GET /clients/<id>/mock-interviews/?status=<status>
   */
  async getInterviewAttempts(
    status?: "scheduled" | "in_progress" | "completed" | "cancelled"
  ): Promise<InterviewAttempt[]> {
    try {
      const clientId = this.getClientId();
      const statusParam = status ? `?status=${status}` : "";
      const url = `${this.baseUrl}/clients/${clientId}/mock-interviews/${statusParam}`;

      const response = await axiosInstance.get(url);

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get a specific interview attempt by ID
   * GET /clients/<id>/mock-interviews/<id>/
   */
  async getInterviewAttempt(attemptId: string): Promise<InterviewAttempt> {
    try {
      const clientId = this.getClientId();
      const response = await axiosInstance.get(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${attemptId}/`
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new interview (scheduled)
   * POST /clients/<id>/mock-interviews/
   */
  async createInterview(
    topic: string,
    subtopic: string,
    difficulty: string,
    scheduledDateTime?: string
  ): Promise<{ id: string }> {
    try {
      const clientId = this.getClientId();
      const response = await axiosInstance.post(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/`,
        {
          topic,
          subtopic,
          difficulty,
          scheduled_date_time: scheduledDateTime || new Date().toISOString(),
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start an interview session by ID (changes status from scheduled to in_progress)
   * POST /clients/<id>/mock-interviews/<id>/start/
   * Returns questions from the API
   */
  async startInterviewById(interviewId: string): Promise<{
    attemptId: string;
    questions: InterviewQuestion[];
    duration_minutes?: number;
  }> {
    try {
      const clientId = this.getClientId();
      const response = await axiosInstance.post(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${interviewId}/start/`
      );

      const data = response.data;
      return {
        attemptId: interviewId,
        questions: data.questions_for_interview || data.questions || [],
        duration_minutes: data.duration_minutes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Legacy method - Creates and starts interview in one call
   * Use createInterview() + startInterviewById() for proper flow
   */
  async startInterview(
    topic: string,
    difficulty: string,
    subtopic?: string
  ): Promise<{ attemptId: string; questions?: InterviewQuestion[] }> {
    try {
      // First, create the interview
      const createResponse = await this.createInterview(
        topic,
        subtopic || topic,
        difficulty
      );

      const interviewId = createResponse.id;

      // Then, start it
      return await this.startInterviewById(interviewId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit interview answers and events
   * POST /clients/<id>/mock-interviews/<id>/submit/
   */
  async submitInterview(
    submission: InterviewSubmission
  ): Promise<{ success: boolean; reportId?: string; evaluation_score?: any }> {
    try {
      const clientId = this.getClientId();

      // Transform answers to match API format
      const responses = submission.answers.map((answer, index) => ({
        question_id: answer.questionId || index + 1,
        response: answer.answerText,
        timestamp: answer.timestamp
          ? new Date(answer.timestamp).toISOString()
          : new Date().toISOString(),
        duration_seconds: answer.duration || 0,
      }));

      // Transform events to logs format
      const logs = submission.events.map((event) => ({
        type: event.type,
        timestamp: new Date(event.timestamp).toISOString(),
        severity: event.severity,
        data: event.data,
      }));

      // Create transcript object according to API documentation
      const requestBody = {
        transcript: {
          responses,
          total_duration_seconds: submission.duration,
          logs,
          metadata: {
            ...submission.metadata,
            face_validation_failures: submission.faceValidationFailures,
            multiple_face_detections: submission.multipleFaceDetections,
            fullscreen_exits: submission.fullscreenExits,
            completed_questions: submission.completedQuestions,
            total_questions: submission.totalQuestions,
          },
        },
      };

      const response = await axiosInstance.post(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${submission.attemptId}/submit/`,
        requestBody
      );

      const data = response.data;
      return {
        success: true,
        reportId: data.id || submission.attemptId,
        evaluation_score: data.evaluation_score,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get interview report/feedback
   * GET /clients/<id>/mock-interviews/<id>/
   * The detail view includes evaluation_score
   */
  async getInterviewReport(attemptId: string): Promise<InterviewReport> {
    try {
      const clientId = this.getClientId();
      const response = await axiosInstance.get(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${attemptId}/`
      );

      const data = response.data;

      // Transform API response to InterviewReport format
      return {
        attemptId: data.id,
        overallScore: data.evaluation_score?.overall_score || 0,
        questionScores:
          data.evaluation_score?.question_scores?.map((qs: any) => ({
            questionId: qs.question_id,
            score: qs.score,
            feedback: qs.feedback,
          })) || [],
        strengths: data.evaluation_score?.strengths || [],
        improvements: data.evaluation_score?.areas_for_improvement || [],
        behavioralNotes: [],
        technicalAccuracy: data.evaluation_score?.overall_percentage || 0,
        communicationSkills: 0,
        confidence: 0,
        recommendation: data.evaluation_score?.overall_feedback || "",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload video/audio chunks during interview
   * Note: The API might not support chunked uploads - video is typically sent with submission
   */
  async uploadMediaChunk(
    attemptId: string,
    chunk: Blob,
    chunkIndex: number,
    type: "video" | "audio"
  ): Promise<void> {
    try {
      const clientId = this.getClientId();
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("type", type);

      await axiosInstance.post(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${attemptId}/media/`,
        formData
      );
    } catch (error) {
      // Silently fail - video will be sent with final submission
    }
  }

  /**
   * Save individual question answer (Speech-to-Text result)
   * Note: Answers are typically collected and sent all at once during submission
   * This method stores locally for fallback
   */
  async saveQuestionAnswer(
    attemptId: string,
    answer: {
      questionIndex: number;
      questionText: string;
      answerText: string;
      timestamp: number;
      duration: number;
      confidence?: number;
    }
  ): Promise<{ success: boolean }> {
    try {
      // Store locally - answers will be sent during final submission
      const localKey = `interview_${attemptId}_answer_${answer.questionIndex}`;
      sessionStorage.setItem(localKey, JSON.stringify(answer));

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get questions for a specific topic and difficulty
   * Questions are returned when starting an interview
   */
  async getQuestions(
    topic: string,
    difficulty: string
  ): Promise<InterviewQuestion[]> {
    try {
      const clientId = this.getClientId();
      const response = await axiosInstance.get(
        `${
          this.baseUrl
        }/clients/${clientId}/questions/?topic=${encodeURIComponent(
          topic
        )}&difficulty=${encodeURIComponent(difficulty)}`
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete/Cancel an interview attempt
   * Note: API may use status update to 'cancelled' instead of delete
   */
  async deleteInterview(attemptId: string): Promise<void> {
    try {
      const clientId = this.getClientId();
      await axiosInstance.delete(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${attemptId}/`
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel an interview (change status to cancelled)
   */
  async cancelInterview(attemptId: string): Promise<void> {
    try {
      const clientId = this.getClientId();
      await axiosInstance.patch(
        `${this.baseUrl}/clients/${clientId}/mock-interviews/${attemptId}/`,
        {
          status: "cancelled",
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const mockInterviewAPI = new MockInterviewAPI();
