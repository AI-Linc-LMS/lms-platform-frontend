/**
 * What one bulk-enrol request may carry, mirrored from the backend's `_BULK_MAX_*`.
 *
 * Here rather than in admin-student.service so the toolbar can read it without pulling in the
 * service: every component test that mocks that module would otherwise have to re-declare these
 * two numbers, and a mock that forgets one turns "too many" into "no limit at all".
 *
 * The dialog uses them to say no BEFORE sending. The server enforces the same ceiling — this is
 * about the count an admin reads agreeing with the count that gets enrolled, not about trust.
 */
export const BULK_MAX_STUDENTS = 500;
export const BULK_MAX_PAIRS = 500;
