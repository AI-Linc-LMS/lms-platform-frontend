export interface WorkshopRegistrationData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  registered_at: string;
  workshop_name: string;
  session_number: number | null;
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
  updated_at?: string;
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
  registered_at: {
    start: string;
    end: string;
  };
  updated_at: {
    start: string;
    end: string;
  };
} 