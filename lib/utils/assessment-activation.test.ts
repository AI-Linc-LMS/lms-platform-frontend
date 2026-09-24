import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A settings save and the Active switch are two requests. The switch rode inside the content
 * PATCH, where the server treats it as an edit: an instructor who may publish (and so activate)
 * a paper but not change its content was refused, and a paper they had published as inactive
 * could never be switched on.
 */

const h = vi.hoisted(() => ({ update: vi.fn(), setActive: vi.fn() }));

vi.mock("@/lib/services/admin/admin-assessment.service", () => ({
  adminAssessmentService: { updateAssessment: h.update, setAssessmentActive: h.setActive },
}));

import { saveAssessmentWithActivation } from "./assessment-activation";

const base = {
  clientId: 34,
  assessmentId: 7,
  payload: { title: "Unit 3", is_active: true, proctoring_enabled: true },
  attachment: null,
};

beforeEach(() => {
  h.update.mockReset().mockResolvedValue({ id: 7 });
  h.setActive.mockReset().mockResolvedValue({ id: 7 });
});

describe("saveAssessmentWithActivation", () => {
  it("never folds is_active into the content save", async () => {
    await saveAssessmentWithActivation({ ...base, wasActive: false, isActive: true });
    const [, , content] = h.update.mock.calls[0];
    expect(content).not.toHaveProperty("is_active");
    expect(content).toMatchObject({ title: "Unit 3", proctoring_enabled: true });
  });

  it("switches the paper on in its own request, after the content", async () => {
    const result = await saveAssessmentWithActivation({ ...base, wasActive: false, isActive: true });
    expect(result).toEqual({ ok: true, activeChanged: true });
    expect(h.setActive).toHaveBeenCalledWith(34, 7, true);
    expect(h.update.mock.invocationCallOrder[0]).toBeLessThan(
      h.setActive.mock.invocationCallOrder[0],
    );
  });

  it("switches it off the same way", async () => {
    await saveAssessmentWithActivation({ ...base, wasActive: true, isActive: false });
    expect(h.setActive).toHaveBeenCalledWith(34, 7, false);
  });

  it("sends no switch request when the switch did not move", async () => {
    const result = await saveAssessmentWithActivation({ ...base, wasActive: true, isActive: true });
    expect(result).toEqual({ ok: true, activeChanged: false });
    expect(h.setActive).not.toHaveBeenCalled();
  });

  it("does not switch a paper whose edit was refused", async () => {
    const refused = new Error("You do not have permission to update this assessment.");
    h.update.mockRejectedValue(refused);
    const result = await saveAssessmentWithActivation({ ...base, wasActive: false, isActive: true });
    expect(result).toEqual({ ok: false, stage: "content", error: refused });
    expect(h.setActive).not.toHaveBeenCalled();
  });

  it("reports a switch the server refused after the content saved", async () => {
    const empty = new Error("Cannot publish an assessment that has no questions.");
    h.setActive.mockRejectedValue(empty);
    const result = await saveAssessmentWithActivation({ ...base, wasActive: false, isActive: true });
    expect(result).toEqual({ ok: false, stage: "active", error: empty });
    expect(h.update).toHaveBeenCalledTimes(1);
  });
});
