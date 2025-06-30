// Central interface for all referral operations
export interface ReferralData {
  id?: number;
  name: string;
  email: string;
  phone_number: string;
  referral_code: string;
}

// For API responses (includes id)
export interface Referral extends ReferralData {
  id: number;
}

// For create operations (id is optional)
export interface CreateReferralData extends ReferralData {
  id?: number;
}

// For update operations (all fields optional except id)
export interface UpdateReferralData {
  id?: number;
  name?: string;
  email?: string;
  phone_number?: string;
  referral_code?: string;
}

// For form data (same as ReferralData but with validation)
export interface ReferralFormData extends ReferralData {
  id?: number;
} 