/**
 * Utility functions for handling referral codes
 */

// Key for storing referral code in localStorage
const REFERRAL_CODE_KEY = 'assessment_referral_code';

/**
 * Get referral code from URL parameters
 * @param searchParams - URLSearchParams object
 * @returns referral code or null
 */
export const getReferralCodeFromUrl = (searchParams: URLSearchParams): string | null => {
  return searchParams.get("ref") || searchParams.get("referral_code");
};

/**
 * Store referral code in localStorage for persistence across pages
 * @param referralCode - The referral code to store
 */
export const storeReferralCode = (referralCode: string): void => {
  if (referralCode) {
    localStorage.setItem(REFERRAL_CODE_KEY, referralCode);
    console.log("Referral code stored:", referralCode);
  }
};

/**
 * Get stored referral code from localStorage
 * @returns referral code or null
 */
export const getStoredReferralCode = (): string | null => {
  return localStorage.getItem(REFERRAL_CODE_KEY);
};

/**
 * Clear stored referral code (typically after assessment submission)
 */
export const clearStoredReferralCode = (): void => {
  localStorage.removeItem(REFERRAL_CODE_KEY);
  console.log("Referral code cleared from storage");
};

/**
 * Get referral code from URL or localStorage
 * @param searchParams - URLSearchParams object
 * @returns referral code or null
 */
export const getReferralCode = (searchParams: URLSearchParams): string | null => {
  // First check URL parameters
  const urlReferralCode = getReferralCodeFromUrl(searchParams);
  if (urlReferralCode) {
    // Store it for later use
    storeReferralCode(urlReferralCode);
    return urlReferralCode;
  }
  
  // If not in URL, check localStorage
  return getStoredReferralCode();
};

/**
 * Add referral code to URL if it exists
 * @param baseUrl - The base URL to append referral code to
 * @param referralCode - The referral code to append
 * @returns URL with referral code parameter
 */
export const addReferralCodeToUrl = (baseUrl: string, referralCode: string | null): string => {
  if (!referralCode) return baseUrl;
  
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('ref', referralCode);
  return url.toString();
};

/**
 * Check if a referral code is valid (basic validation)
 * @param referralCode - The referral code to validate
 * @returns boolean indicating if the code is valid
 */
export const isValidReferralCode = (referralCode: string): boolean => {
  // Basic validation: non-empty string with alphanumeric characters
  return /^[a-zA-Z0-9]+$/.test(referralCode) && referralCode.length >= 3;
}; 