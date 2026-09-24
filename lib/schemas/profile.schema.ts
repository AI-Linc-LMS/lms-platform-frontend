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
export function validateMandatoryProfile(
  values: {
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
    country?: string | null;
  },
  /**
   * Which fields are mandatory HERE. Defaults to the platform five.
   *
   * Emptiness is only an error for a field in this set; a bad VALUE is an error either way,
   * because the server rejects "+10000000000" whether or not it demands a phone number. Without
   * the split, a tenant that had narrowed its required set got asterisks on two fields and a
   * blocked save on five — the form marking one rule and enforcing another.
   */
  required: ReadonlySet<string> = new Set<string>(MANDATORY_PROFILE_FIELDS),
): Partial<Record<MandatoryProfileField, string>> {
  const errors: Partial<Record<MandatoryProfileField, string>> = {};

  if (required.has("first_name") && !(values.first_name || "").trim())
    errors.first_name = "First name is required.";
  if (required.has("last_name") && !(values.last_name || "").trim())
    errors.last_name = "Last name is required.";

  const phone = (values.phone_number || "").replace(/\s+/g, "");
  if (!phone) {
    if (required.has("phone_number")) errors.phone_number = "Phone number is required.";
  } else if (!E164.test(phone)) {
    errors.phone_number = "Enter a valid number including the country code, e.g. +91 98765 43210.";
  }

  const dob = (values.date_of_birth || "").trim();
  if (!dob) {
    if (required.has("date_of_birth")) errors.date_of_birth = "Date of birth is required.";
  } else {
    const age = yearsSince(dob);
    if (age === null) errors.date_of_birth = "Enter a valid date.";
    else if (age < 0) errors.date_of_birth = "Date of birth cannot be in the future.";
    else if (age < MIN_AGE_YEARS) errors.date_of_birth = `You must be at least ${MIN_AGE_YEARS}.`;
    else if (age > MAX_AGE_YEARS) errors.date_of_birth = "Enter a valid date of birth.";
  }

  if (required.has("country") && !(values.country || "").trim())
    errors.country = "Country is required.";

  return errors;
}

/** The shape of `profile_completion` these helpers read. Every key is optional: an old payload
 *  (or none yet) must not change what the form marks. */
export interface ProfileCompletionLike {
  required_fields?: { field: string }[];
  gated_modules?: string[];
}

/**
 * Do these fields buy the learner anything on THIS tenant?
 *
 * `gated_modules` is the server's list of the profile-gated modules the institution actually
 * runs. Empty means Resume, Jobs and Interview are all switched off here, so nothing asks for a
 * date of birth in exchange for them: no first-run prompt, no dashboard card, no asterisks.
 *
 * A MISSING key is not an empty list. A backend that predates this — or a payload fetched by a
 * caller that does not carry completion — must behave exactly as it does today, so `undefined`
 * means "assume it applies". Only an explicit `[]` turns the asking off.
 */
export function profileGateApplies(completion?: ProfileCompletionLike | null): boolean {
  const modules = completion?.gated_modules;
  if (!Array.isArray(modules)) return true;
  return modules.length > 0;
}

/**
 * Which of those fields THIS tenant actually requires.
 *
 * The server is the authority and it already says so: `profile_completion.required_fields` is
 * built from `accounts/profile_completion.required_fields_for(client)`, which a tenant can
 * narrow (a school whose learners have no date of birth on record drops that one). Reading the
 * constant instead would put an asterisk on a field this tenant does not require, which is the
 * same class of lie as the missing asterisk this exists to fix.
 *
 * Falls back to the platform default only when the payload has not arrived, so a slow profile
 * fetch under-marks nothing: the five defaults are what every unconfigured tenant requires.
 *
 * Returns NOTHING when the tenant runs none of the gated modules. "Required" has to mean
 * required for something: marking five fields mandatory, and refusing to save a bio edit without
 * them, in service of a lock the learner can never reach is a demand with no payoff.
 */
export function requiredProfileFields(
  completion?: ProfileCompletionLike | null,
): ReadonlySet<string> {
  if (!profileGateApplies(completion)) return new Set<string>();
  const known = new Set<string>(MANDATORY_PROFILE_FIELDS);
  const fromServer = (completion?.required_fields ?? [])
    .map((f) => f.field)
    .filter((f) => known.has(f));
  return new Set(fromServer.length > 0 ? fromServer : MANDATORY_PROFILE_FIELDS);
}
