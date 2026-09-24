import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Activate" is a request of its own: PATCH .../assessments/{id}/ with `{ is_active }` and
 * nothing else. The server authorises exactly that body the way it authorises publish, so an
 * instructor who may publish a paper may switch it on and off; a body that carries anything else
 * is an edit and needs the right to change content. These pin the body, and that a failure keeps
 * its HTTP status (a caller that saves before publishing acts differently on 403 and 400).
 */

vi.mock("@/lib/services/api", () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import apiClient from "@/lib/services/api";
import {
  adminAssessmentService,
  apiErrorStatus,
} from "@/lib/services/admin/admin-assessment.service";

const patch = apiClient.patch as unknown as ReturnType<typeof vi.fn>;

/** Axios rejects with an Error carrying `response`. */
function axiosError(status: number, data: Record<string, unknown>) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  });
}

beforeEach(() => {
  patch.mockReset();
});

describe("setAssessmentActive", () => {
  it("sends is_active and nothing else", async () => {
    patch.mockResolvedValue({ data: { id: 7, is_active: true } });
    await adminAssessmentService.setAssessmentActive(34, 7, true);
    expect(patch).toHaveBeenCalledTimes(1);
    const [url, body] = patch.mock.calls[0];
    expect(url).toBe("/admin-dashboard/api/clients/34/assessments/7/");
    expect(body).toStrictEqual({ is_active: true });
  });

  it("deactivates with the same one-key body", async () => {
    patch.mockResolvedValue({ data: { id: 7, is_active: false } });
    await adminAssessmentService.setAssessmentActive(34, 7, false);
    expect(patch.mock.calls[0][1]).toStrictEqual({ is_active: false });
  });

  it("passes the server's reason through, with its status", async () => {
    patch.mockRejectedValue(
      axiosError(400, { error: "Cannot publish an assessment that has no questions." }),
    );
    const error = await adminAssessmentService.setAssessmentActive(34, 7, true).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Cannot publish an assessment that has no questions.");
    expect(apiErrorStatus(error)).toBe(400);
  });
});

describe("updateAssessment keeps the HTTP status", () => {
  it("403: refused", async () => {
    patch.mockRejectedValue(
      axiosError(403, { error: "You do not have permission to update this assessment." }),
    );
    const error = await adminAssessmentService
      .updateAssessment(34, 7, { title: "x" })
      .catch((e) => e);
    expect((error as Error).message).toBe("You do not have permission to update this assessment.");
    expect(apiErrorStatus(error)).toBe(403);
  });

  it("400: invalid, with the field messages", async () => {
    patch.mockRejectedValue(axiosError(400, { title: ["This field may not be blank."] }));
    const error = await adminAssessmentService.updateAssessment(34, 7, { title: "" }).catch((e) => e);
    expect((error as Error).message).toBe("title: This field may not be blank.");
    expect(apiErrorStatus(error)).toBe(400);
  });

  it("no response at all: no status", async () => {
    patch.mockRejectedValue(new Error("Network Error"));
    const error = await adminAssessmentService.updateAssessment(34, 7, { title: "x" }).catch((e) => e);
    expect(apiErrorStatus(error)).toBeNull();
  });
});
