import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A role that is not there for this viewer is not a failure. The server answers 404 for one that
 * was removed, and for any role not addressed to everyone when the visitor is not signed in. The
 * detail and apply pages render "This role is no longer listed" for null; a throw showed an error
 * with a Retry button that could never succeed.
 */

vi.mock("@/lib/services/api", () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import apiClient from "@/lib/services/api";
import { jobsV2Service } from "@/lib/services/jobs-v2.service";

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;

const axiosError = (status: number, data: Record<string, unknown>) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  });

beforeEach(() => {
  get.mockReset();
});

describe("jobsV2Service.getJobById", () => {
  it("resolves null for a role that is not there (404)", async () => {
    get.mockImplementation(() => Promise.reject(axiosError(404, { detail: "Not found." })));
    await expect(jobsV2Service.getJobById(7)).resolves.toBeNull();
  });

  it("still throws a real failure, with the server's reason", async () => {
    get.mockImplementation(() => Promise.reject(axiosError(500, { error: "Database unavailable" })));
    await expect(jobsV2Service.getJobById(7)).rejects.toThrow("Database unavailable");
  });

  it("returns the role when it is there", async () => {
    get.mockResolvedValue({ data: { id: 7, job_title: "Analyst" } });
    await expect(jobsV2Service.getJobById(7)).resolves.toMatchObject({ id: 7 });
  });
});
