import { describe, expect, it } from "vitest";
import { hydrateFromJob } from "./useJobForm";

/**
 * The form sends a date (YYYY-MM-DD); the server stores the end of that day in the institution's
 * zone and renders it back in that zone, e.g. 2026-09-24T23:59:59.999999+03:00. Opening the job
 * again must show the same date, or every save moves the closing date.
 */
describe("the closing date round-trips through the admin form", () => {
  it.each([
    ["India", "2026-09-24T23:59:59.999999+05:30"],
    ["Riyadh", "2026-09-24T23:59:59.999999+03:00"],
    ["New York", "2026-09-24T23:59:59.999999-04:00"],
    ["UTC", "2026-09-24T23:59:59.999999Z"],
  ])("reads the end of 24 Sep in %s back as 24 Sep", (_zone, stored) => {
    const { data } = hydrateFromJob({ job_title: "Analyst", application_deadline: stored });
    expect(data.application_deadline).toBe("2026-09-24");
  });

  it("keeps a date-only value as it is", () => {
    const { data } = hydrateFromJob({ job_title: "Analyst", application_deadline: "2026-09-24" });
    expect(data.application_deadline).toBe("2026-09-24");
  });
});
