import { describe, expect, it } from "vitest";

import {
  BATCH_REQUIRED_MESSAGE,
  audienceStepError,
  batchRequiredForRole,
  resolveBatchRequired,
} from "./assessment-audience-rules";

describe("assessment audience rules", () => {
  it("mirrors the server: every non-admin must name a batch", () => {
    expect(batchRequiredForRole("instructor")).toBe(true);
    expect(batchRequiredForRole("course_manager")).toBe(true);
    expect(batchRequiredForRole("Course Manager")).toBe(true);
    expect(batchRequiredForRole("admin")).toBe(false);
    expect(batchRequiredForRole("superadmin")).toBe(false);
  });

  it("does not demand the field before the role is known", () => {
    expect(batchRequiredForRole(undefined)).toBe(false);
    expect(batchRequiredForRole("")).toBe(false);
  });

  it("prefers the server's flag whenever it gave one", () => {
    expect(resolveBatchRequired(false, "instructor")).toBe(false);
    expect(resolveBatchRequired(true, "admin")).toBe(true);
    expect(resolveBatchRequired(null, "instructor")).toBe(true);
    expect(resolveBatchRequired(undefined, "admin")).toBe(false);
  });

  it("blocks the step only when required and empty", () => {
    expect(audienceStepError(true, [])).toBe(BATCH_REQUIRED_MESSAGE);
    expect(audienceStepError(true, [3])).toBeNull();
    expect(audienceStepError(false, [])).toBeNull();
  });
});
