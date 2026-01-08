export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  authRequired: boolean;
  params?: string[];
  queryParams?: string[];
  requestBody?: Record<string, any>;
  responseExample?: any;
}

// Helper function to get API endpoints with client ID
const getClientId = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_CLIENT_ID || "1";
  }
  return process.env.NEXT_PUBLIC_CLIENT_ID || "1";
};

export const getApiEndpoints = (): Record<string, APIEndpoint[]> => {
  const clientId = getClientId();

  return {
    accounts: [
      {
        method: "POST",
        path: `/accounts/clients/${clientId}/user/login/`,
        description: "User login with email and password",
        authRequired: false,
        requestBody: {
          email: "string",
          password: "string",
        },
        responseExample: {
          access: "string",
          refresh: "string",
          user: {
            id: "integer",
            email: "string",
            first_name: "string",
            last_name: "string",
          },
        },
      },
      {
        method: "POST",
        path: `/accounts/clients/${clientId}/user/login/google/`,
        description: "Google OAuth login",
        authRequired: false,
        requestBody: {
          token: "string",
        },
        responseExample: {
          access: "string",
          refresh: "string",
          user: {
            id: "integer",
            email: "string",
            first_name: "string",
            last_name: "string",
          },
        },
      },
      {
        method: "POST",
        path: `/accounts/clients/${clientId}/user/signup/`,
        description: "User signup/registration",
        authRequired: false,
        requestBody: {
          first_name: "string",
          last_name: "string",
          email: "string",
          phone: "string",
          password: "string",
          confirm_password: "string",
        },
        responseExample: {
          detail: "OTP sent to your email",
        },
      },
      {
        method: "POST",
        path: `/accounts/clients/${clientId}/user/verify-email/`,
        description: "Verify email with OTP",
        authRequired: false,
        requestBody: {
          email: "string",
          otp: "string",
        },
        responseExample: {
          detail: "Account verified and created successfully",
        },
      },
      {
        method: "POST",
        path: `/accounts/clients/${clientId}/user/resend-verification-email/`,
        description: "Resend verification email OTP",
        authRequired: false,
        requestBody: {
          email: "string",
        },
        responseExample: {
          detail: "OTP sent to your email",
        },
      },
      {
        method: "GET",
        path: `/accounts/clients/${clientId}/user-profile/`,
        description: "Get user profile",
        authRequired: true,
        responseExample: {
          id: "integer",
          user_name: "string",
          profile_pic_url: "string",
          role: "string",
        },
      },
      {
        method: "PUT",
        path: `/accounts/clients/${clientId}/user-profile/`,
        description: "Update user profile",
        authRequired: true,
        requestBody: {
          user_name: "string",
          profile_pic_url: "string",
          role: "string",
        },
      },
      {
        method: "POST",
        path: `/accounts/clients/${clientId}/user/logout/`,
        description: "User logout",
        authRequired: true,
        requestBody: {
          refresh: "string",
        },
        responseExample: {
          detail: "Successfully logged out",
        },
      },
    ],
    courses: [
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/`,
        description: "List all courses",
        authRequired: true,
        responseExample: [
          {
            id: "integer",
            title: "string",
            description: "string",
            instructors: [],
            trusted_by: [],
            enrolled_students: {
              total: "integer",
              students_profile_pic: [],
            },
          },
        ],
      },
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/{course_id}/`,
        description: "Get course detail with modules",
        authRequired: true,
        params: ["course_id"],
        responseExample: {
          id: "integer",
          title: "string",
          description: "string",
          modules: [],
        },
      },
      {
        method: "POST",
        path: `/lms/clients/${clientId}/courses/{course_id}/enroll/`,
        description: "Enroll user in a course",
        authRequired: true,
        params: ["course_id"],
        responseExample: {
          detail: "Successfully enrolled in course",
        },
      },
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/{course_id}/user-course-dashboard/`,
        description: "Get user course dashboard with progress",
        authRequired: true,
        params: ["course_id"],
        responseExample: {
          completion_percentage: "decimal",
          total_modules: "integer",
          completed_modules: "integer",
          total_contents: "integer",
          completed_contents: "integer",
        },
      },
      {
        method: "POST",
        path: `/lms/clients/${clientId}/courses/{course_id}/toggle-like/`,
        description: "Toggle like/dislike on a course",
        authRequired: true,
        params: ["course_id"],
        responseExample: {
          liked: "boolean",
          likes_count: "integer",
        },
      },
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/{course_id}/leaderboard/`,
        description: "Get course leaderboard",
        authRequired: true,
        params: ["course_id"],
        responseExample: [
          {
            user: {
              id: "integer",
              user_name: "string",
              profile_pic_url: "string",
              role: "string",
            },
            score: "decimal",
            rank: "integer",
          },
        ],
      },
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/{course_id}/sub-module/{submodule_id}/`,
        description: "Get submodule detail with contents",
        authRequired: true,
        params: ["course_id", "submodule_id"],
        responseExample: {
          id: "integer",
          title: "string",
          description: "string",
          order: "integer",
          contents: [],
        },
      },
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/{course_id}/content/{content_id}/`,
        description: "Get content detail",
        authRequired: true,
        params: ["course_id", "content_id"],
      },
      {
        method: "GET",
        path: `/lms/clients/${clientId}/courses/{course_id}/content/{content_id}/past-submissions/`,
        description: "Get past submissions for content",
        authRequired: true,
        params: ["course_id", "content_id"],
      },
      {
        method: "POST",
        path: `/lms/clients/${clientId}/courses/{course_id}/content/{content_id}/comment/`,
        description: "Add comment to content",
        authRequired: true,
        params: ["course_id", "content_id"],
        requestBody: {
          comment: "string",
        },
      },
    ],
    assessment: [
      {
        method: "GET",
        path: `/assessment/api/client/${clientId}/active-assessments/`,
        description: "Get list of active assessments",
        authRequired: true,
        responseExample: [
          {
            id: "integer",
            title: "string",
            description: "string",
            slug: "string",
            is_paid: "boolean",
            amount: "decimal",
            has_attempted: "boolean",
          },
        ],
      },
      {
        method: "GET",
        path: `/assessment/api/client/${clientId}/assessment-details/{assessment_id}/`,
        description: "Get assessment detail",
        authRequired: true,
        params: ["assessment_id"],
        responseExample: {
          id: "integer",
          title: "string",
          description: "string",
          slug: "string",
          is_paid: "boolean",
          amount: "decimal",
          sections: [],
        },
      },
      {
        method: "GET",
        path: `/assessment/api/client/${clientId}/start-assessment/{assessment_id}/`,
        description: "Start an assessment",
        authRequired: true,
        params: ["assessment_id"],
        responseExample: {
          assessment: {
            id: "integer",
            title: "string",
            slug: "string",
            sections: [],
          },
          submission: {
            id: "integer",
            status: "string",
            started_at: "datetime",
          },
        },
      },
      {
        method: "POST",
        path: `/assessment/api/client/${clientId}/assessment-submission/{assessment_id}/`,
        description: "Save assessment submission",
        authRequired: true,
        params: ["assessment_id"],
        requestBody: {
          response_sheet: {
            section_id: {
              question_id: "answer",
            },
          },
        },
        responseExample: {
          response_sheet: "object",
          status: "in_progress",
        },
      },
      {
        method: "PUT",
        path: `/assessment/api/client/${clientId}/assessment-submission/{assessment_id}/`,
        description: "Update assessment submission",
        authRequired: true,
        params: ["assessment_id"],
        requestBody: {
          response_sheet: {
            section_id: {
              question_id: "answer",
            },
          },
        },
      },
      {
        method: "POST",
        path: `/assessment/api/client/${clientId}/assessment-submission/{assessment_id}/final/`,
        description: "Final submit assessment",
        authRequired: true,
        params: ["assessment_id"],
        responseExample: {
          id: "integer",
          score: "decimal",
          offered_scholarship_percentage: "decimal",
          status: "submitted",
          submitted_at: "datetime",
        },
      },
      {
        method: "POST",
        path: `/assessment/api/client/${clientId}/redeem-scholarship/{assessment_id}/`,
        description: "Redeem scholarship",
        authRequired: true,
        params: ["assessment_id"],
        requestBody: {
          referral_code: "string (optional)",
        },
        responseExample: {
          scholarship_percentage: "decimal",
          referral_code: "string",
          message: "Scholarship redeemed successfully",
        },
      },
      {
        method: "GET",
        path: `/assessment/api/client/${clientId}/scholarship-assessment-status/{assessment_id}/`,
        description: "Get scholarship assessment status",
        authRequired: true,
        params: ["assessment_id"],
        responseExample: {
          has_submitted: "boolean",
          score: "decimal",
          offered_scholarship_percentage: "decimal",
          is_redeemed: "boolean",
          referral_code: "string",
        },
      },
      {
        method: "GET",
        path: `/assessment/api/client/${clientId}/attempted-assessments/`,
        description: "Get attempted assessments",
        authRequired: true,
        responseExample: [
          {
            id: "integer",
            assessment: {
              id: "integer",
              title: "string",
              slug: "string",
            },
            score: "decimal",
            status: "string",
            submitted_at: "datetime",
          },
        ],
      },
    ],
    jobs: [
      {
        method: "GET",
        path: `/jobs/api/getjobs/`,
        description: "Get job listings with optional filters",
        authRequired: true,
        queryParams: ["location", "job_type", "search"],
        responseExample: [
          {
            id: "integer",
            title: "string",
            company: "string",
            location: "string",
            job_type: "string",
            description: "string",
            requirements: [],
            posted_at: "datetime",
            application_url: "string",
          },
        ],
      },
    ],
  };
};

// Helper function to get all APIs for dialog display
export const getAllAPIs = (): APIEndpoint[] => {
  return Object.values(getApiEndpoints()).flat();
};

// Helper function to get APIs by category
export const getAPIsByCategory = (
  category: keyof ReturnType<typeof getApiEndpoints>
): APIEndpoint[] => {
  const endpoints = getApiEndpoints();
  return endpoints[category] || [];
};
