/**
 * Validation for the five profile fields that gate Resume, Jobs and Interview.
 *
 * Mirrors `accounts/validators.py` on the server, which is the authority. The point of having it
 * here too is speed of feedback, not a second opinion — where the two could disagree, the server
 * wins and its message is what gets shown.
 */

export const MANDATORY_PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "phone_number",
  "date_of_birth",
  "country",
] as const;

export type MandatoryProfileField = (typeof MANDATORY_PROFILE_FIELDS)[number];

/** E.164: a plus, a non-zero country code, then 7–14 more digits. */
const E164 = /^\+[1-9]\d{7,14}$/;

const MIN_AGE_YEARS = 13;
const MAX_AGE_YEARS = 100;

function yearsSince(iso: string): number | null {
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

/**
 * Returns a map of field → message for whatever is wrong. Empty means valid.
 *
 * Names are checked with `.trim()` because a single space is truthy, which is exactly how the
 * old form let a blank name through: its only check was `!formData.first_name`.
 */
export function validateMandatoryProfile(values: {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  country?: string | null;
}): Partial<Record<MandatoryProfileField, string>> {
  const errors: Partial<Record<MandatoryProfileField, string>> = {};

  if (!(values.first_name || "").trim()) errors.first_name = "First name is required.";
  if (!(values.last_name || "").trim()) errors.last_name = "Last name is required.";

  const phone = (values.phone_number || "").replace(/\s+/g, "");
  if (!phone) {
    errors.phone_number = "Phone number is required.";
  } else if (!E164.test(phone)) {
    errors.phone_number = "Enter a valid number including the country code, e.g. +91 98765 43210.";
  }

  const dob = (values.date_of_birth || "").trim();
  if (!dob) {
    errors.date_of_birth = "Date of birth is required.";
  } else {
    const age = yearsSince(dob);
    if (age === null) errors.date_of_birth = "Enter a valid date.";
    else if (age < 0) errors.date_of_birth = "Date of birth cannot be in the future.";
    else if (age < MIN_AGE_YEARS) errors.date_of_birth = `You must be at least ${MIN_AGE_YEARS}.`;
    else if (age > MAX_AGE_YEARS) errors.date_of_birth = "Enter a valid date of birth.";
  }

  if (!(values.country || "").trim()) errors.country = "Country is required.";

  return errors;
}
