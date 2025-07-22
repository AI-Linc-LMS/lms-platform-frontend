export interface WorkshopRegistrationData {
  course_name: string;
  program: string;
  id: number;
  name: string;
  email: string;
  phone_number: string;
  registered_at: string;
  workshop_name: string;
  session_number: string | null;
  session_date: string | null;
  referal_code: string | null;
  attended_webinars: string | boolean;
  is_assessment_attempted: string;
  is_certificate_amount_paid: string;
  is_prebooking_amount_paid: string;
  is_course_amount_paid: string;
  first_call_status: string;
  first_call_comment: string;
  second_call_status: string;
  second_call_comment: string;
  follow_up_comment: string;
  follow_up_date: string | null;
  amount_paid: number;
  amount_pending: string;
  updated_at?: string;
  score: string;
  offered_scholarship_percentage: string;
  platform_amount: string;
  offered_amount: string;
  assignment_submitted_at: string;
  referral_code_assessment: string | null;
  submitted_at: string;
  assessment_status: string;
  payment_history?: Array<{
    type: string;
    amount: string | number;
    date: string;
  }>;
  edithistory?: Record<string, {
    changes: Record<string, string | null>;
    edited_by: string;
    timestamp: string;
  }>;
}

export interface EditRegistrationData {
  first_call_status?: string;
  first_call_comment?: string;
  second_call_status?: string;
  second_call_comment?: string;
  follow_up_comment?: string;
  follow_up_date?: string;
  is_assessment_attempted?: string;
  is_certificate_amount_paid?: string;
  is_prebooking_amount_paid?: string;
  is_course_amount_paid?: string;
  amount_paid?: string | number;
  amount_pending?: string;
  score?: string;
  offered_scholarship_percentage?: string;
  platform_amount?: string;
  offered_amount?: string;
  assignment_submitted_at?: string;
  referral_code_assessment?: string;
  assessment_status?: string;
  registered_at?: string;
  updated_at?: string;
  submitted_at?: string;
  program?: string;
}

export interface FilterState {
  course_name: string;
  name: string;
  email: string;
  phone_number: string;
  workshop_name: string;
  session_number: string;
  session_date: string;
  referal_code: string;
  attended_webinars: string;
  is_assessment_attempted: string;
  is_certificate_amount_paid: string;
  is_prebooking_amount_paid: string;
  is_course_amount_paid: string;
  first_call_status: string;
  first_call_comment: string;
  second_call_status: string;
  second_call_comment: string;
  follow_up_comment: string;
  follow_up_date: {
    start: string;
    end: string;
  };
  amount_paid: string;
  amount_pending: string;
  score: string;
  offered_scholarship_percentage: string;
  platform_amount: string;
  offered_amount: string;
  assignment_submitted_at: {
    start: string;
    end: string;
  };
  referral_code_assessment: string;
  submitted_at: {
    start: string;
    end: string;
  };
  assessment_status: string;
  registered_at: {
    start: string;
    end: string;
  };
  updated_at: {
    start: string;
    end: string;
  };
} 

export interface AttendanceData {
  name: string;
  email: string;
  phone_number: string;
  workshop_name: string;
  session_number: string;
  attended: boolean;
  attendance_date: string;
  notes?: string;
}

export interface CSVUploadResponse {
  success: boolean;
  message: string;
  processed_count?: number;
  errors?: string[];
} 