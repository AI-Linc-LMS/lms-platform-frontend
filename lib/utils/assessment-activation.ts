import {
  adminAssessmentService,
  type CreateAssessmentPayload,
} from "@/lib/services/admin/admin-assessment.service";

/**
 * Save a paper's settings and switch it on or off, as two requests.
 *
 * Switching a paper on or off is not an edit. The server authorises a PATCH that carries ONLY
 * `is_active` the way it authorises publish, so an instructor who may publish a paper may
 * activate it. A PATCH that also carries content is an edit, and needs the right to change the
 * paper's content. Sending the switch inside the settings save therefore refused it for an
 * instructor who can publish but not edit, and a paper they published as inactive could never
 * be activated.
 *
 * Order: the content first, then the switch, and only when the switch actually moved. A content
 * save that fails stops here, so a refused edit never goes live on its own.
 */
export type SaveWithActivationResult =
  | { ok: true; activeChanged: boolean }
  | { ok: false; stage: "content" | "active"; error: unknown };

export async function saveAssessmentWithActivation(args: {
  clientId: string | number;
  assessmentId: number;
  payload: Partial<CreateAssessmentPayload>;
  attachment?: File | null;
  /** What the server holds now. */
  wasActive: boolean;
  /** What the form asks for. */
  isActive: boolean;
}): Promise<SaveWithActivationResult> {
  const { clientId, assessmentId, payload, attachment, wasActive, isActive } = args;
  const content = { ...payload };
  delete content.is_active;
  try {
    await adminAssessmentService.updateAssessment(clientId, assessmentId, content, attachment);
  } catch (error) {
    return { ok: false, stage: "content", error };
  }
  if (isActive === wasActive) return { ok: true, activeChanged: false };
  try {
    await adminAssessmentService.setAssessmentActive(clientId, assessmentId, isActive);
  } catch (error) {
    return { ok: false, stage: "active", error };
  }
  return { ok: true, activeChanged: true };
}

