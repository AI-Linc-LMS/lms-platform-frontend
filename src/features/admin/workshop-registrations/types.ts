export interface WorkshopRegistrationData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  registered_at: string;
  workshop_name: string;
  session_number: string | null;
  referal_code: string | null;
  attended_webinars: string;
  is_assessment_attempted: string;
  is_certificate_amount_paid: string;
  is_prebooking_amount_paid: string;
  is_course_amount_paid: string;
  first_call_status: string;
  first_call_comment: string;
  second_call_status: string;
  second_call_comment: string;
  amount_paid: number;
  amount_pending: string;
  updated_at?: string;
  score: string;
  offered_scholarship_percentage: string;
  offered_amount: string;
  submitted_at: string;
  assessment_status: string;
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
}

export interface FilterState {
  name: string;
  email: string;
  phone_number: string;
  workshop_name: string;
  session_number: string;
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
  amount_paid: string;
  amount_pending: string;
  score: string;
  offered_scholarship_percentage: string;
  offered_amount: string;
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