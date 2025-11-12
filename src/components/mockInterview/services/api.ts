// API Service for Mock Interview Backend Communication

export interface InterviewAttempt {
  id: string;
  userId: string;
  topic: string;
  difficulty: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number; // in seconds
  status: "in-progress" | "completed" | "abandoned";
  score: number | null;
  questionsAnswered: number;
  totalQuestions: number;
  videoRecordingUrl?: string;
  audioRecordingUrl?: string;
}

export interface InterviewQuestion {
  id: string;
  questionText: string;
  expectedAnswer?: string;
  topic: string;
  difficulty: string;
  order: number;
}

export interface InterviewAnswer {
  questionId: string;
  answerText: string;
  audioUrl?: string;
  videoUrl?: string;
  timestamp: number;
  confidence?: number;
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
    | "answer_save_failed";
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
    // Update this with your actual API base URL
    this.baseUrl = import.meta.env.VITE_API_URL || "/api";
  }

  /**
   * Fetch all interview attempts for the current user
   */
  async getInterviewAttempts(): Promise<InterviewAttempt[]> {
    try {
      const response = await fetch(`${this.baseUrl}/interviews`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers here
          // Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interview attempts");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific interview attempt by ID
   */
  async getInterviewAttempt(attemptId: string): Promise<InterviewAttempt> {
    try {
      const response = await fetch(`${this.baseUrl}/interviews/${attemptId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interview attempt");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start a new interview session
   */
  async startInterview(
    topic: string,
    difficulty: string
  ): Promise<{ attemptId: string; questions: InterviewQuestion[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/interviews/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      if (!response.ok) {
        throw new Error("Failed to start interview");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit interview answers and events
   */
  async submitInterview(
    submission: InterviewSubmission
  ): Promise<{ success: boolean; reportId: string }> {
    try {
      const formData = new FormData();

      // Add JSON data
      formData.append("attemptId", submission.attemptId);
      formData.append("answers", JSON.stringify(submission.answers));
      formData.append("events", JSON.stringify(submission.events));
      formData.append("duration", submission.duration.toString());
      formData.append(
        "faceValidationFailures",
        submission.faceValidationFailures.toString()
      );
      formData.append(
        "multipleFaceDetections",
        submission.multipleFaceDetections.toString()
      );
      formData.append("fullscreenExits", submission.fullscreenExits.toString());
      formData.append(
        "completedQuestions",
        submission.completedQuestions.toString()
      );
      formData.append("totalQuestions", submission.totalQuestions.toString());
      formData.append("metadata", JSON.stringify(submission.metadata));

      // Add video blob if available
      if (submission.videoBlob) {
        formData.append(
          "video",
          submission.videoBlob,
          `interview-${submission.attemptId}.webm`
        );
      }

      const response = await fetch(`${this.baseUrl}/interviews/submit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit interview");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get interview report/feedback
   */
  async getInterviewReport(attemptId: string): Promise<InterviewReport> {
    try {
      const response = await fetch(
        `${this.baseUrl}/interviews/${attemptId}/report`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch interview report");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Track interview event (for real-time monitoring)
   */
  async trackEvent(attemptId: string, event: InterviewEvent): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/interviews/${attemptId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silently fail for tracking events
    }
  }

  /**
   * Upload video/audio chunks during interview
   */
  async uploadMediaChunk(
    attemptId: string,
    chunk: Blob,
    chunkIndex: number,
    type: "video" | "audio"
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("type", type);

      await fetch(`${this.baseUrl}/interviews/${attemptId}/media`, {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save individual question answer (Speech-to-Text result)
   * This is called after each question is answered
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
      const response = await fetch(
        `${this.baseUrl}/interviews/${attemptId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionIndex: answer.questionIndex,
            questionText: answer.questionText,
            answerText: answer.answerText,
            timestamp: answer.timestamp,
            duration: answer.duration,
            confidence: answer.confidence || 0,
            metadata: {
              answerLength: answer.answerText.length,
              wordCount: answer.answerText.split(/\s+/).length,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save answer");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback: Store locally if API fails
      const localKey = `interview_${attemptId}_answer_${answer.questionIndex}`;
      localStorage.setItem(localKey, JSON.stringify(answer));

      return { success: false };
    }
  }

  /**
   * Get questions for a specific topic and difficulty
   */
  async getQuestions(
    topic: string,
    difficulty: string
  ): Promise<InterviewQuestion[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/questions?topic=${encodeURIComponent(
          topic
        )}&difficulty=${encodeURIComponent(difficulty)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an interview attempt
   */
  async deleteInterview(attemptId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/interviews/${attemptId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const mockInterviewAPI = new MockInterviewAPI();
