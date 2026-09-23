import apiClient from "./api";
import { config } from "../config";

/**
 * Saved resumes the learner can REOPEN.
 *
 * Not to be confused with `resume.service.ts`, which holds the rendered PDFs. Those are what
 * leaves the product - attached to a job application, read by someone else - and every page of
 * one is a rasterised image, so nothing in it can be edited again. That is why the Resume Builder
 * could list saved resumes and never open one.
 *
 * A resume document is the other half: the content, template and section arrangement the builder
 * was driven from. Saving keeps both - a PDF to send and a document to come back to.
 *
 * It is also NOT the learner's profile. The profile is one record of who they are; a document is
 * one tailored presentation of it. "Use my profile" copies the profile into the builder, and
 * nothing here ever writes back to the profile.
 */

export interface ResumeDocumentSummary {
  id: number;
  name: string;
  template: string;
  ats_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeDocumentFull extends ResumeDocumentSummary {
  content: Record<string, unknown>;
  layout: Record<string, unknown>;
}

export interface ResumeDocumentInput {
  name: string;
  template: string;
  content: unknown;
  layout: unknown;
  ats_score?: number | null;
}

/** The learner can keep this many. Mirrors MAX_RESUME_DOCUMENTS on the server. */
export const MAX_RESUME_DOCUMENTS = 20;

const base = () => `/accounts/clients/${config.clientId}/user-profile/resume-documents/`;

/**
 * The backend deploys first, but a tenant whose API is momentarily older would answer 404 for
 * the whole collection. That is "this tenant cannot keep resumes yet", not "something broke":
 * the panel hides itself rather than showing a learner an error about a feature they never
 * asked for. A 404 on ONE document is a different thing - that resume is gone - so only the
 * collection call is treated this way.
 */
export class ResumeDocumentsUnavailable extends Error {
  constructor() {
    super("Saved resumes are not available on this tenant yet");
    this.name = "ResumeDocumentsUnavailable";
  }
}

function isNotFound(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 404;
}

/** The server's own message when it has one, so a cap or a size limit reads as itself. */
function withServerMessage(err: unknown, fallback: string): Error {
  const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
  const message = axiosErr.response?.data?.error;
  if (message && axiosErr.response?.status === 400) return new Error(message);
  return err instanceof Error ? err : new Error(fallback);
}

export const resumeDocumentsService = {
  list: async (): Promise<ResumeDocumentSummary[]> => {
    try {
      const res = await apiClient.get<ResumeDocumentSummary[]>(base());
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      if (isNotFound(err)) throw new ResumeDocumentsUnavailable();
      throw err;
    }
  },

  get: async (id: number): Promise<ResumeDocumentFull> => {
    const res = await apiClient.get<ResumeDocumentFull>(`${base()}${id}/`);
    return res.data;
  },

  create: async (input: ResumeDocumentInput): Promise<ResumeDocumentFull> => {
    try {
      const res = await apiClient.post<ResumeDocumentFull>(base(), input);
      return res.data;
    } catch (err) {
      throw withServerMessage(err, "Could not save this resume");
    }
  },

  update: async (id: number, patch: Partial<ResumeDocumentInput>): Promise<ResumeDocumentFull> => {
    try {
      const res = await apiClient.patch<ResumeDocumentFull>(`${base()}${id}/`, patch);
      return res.data;
    } catch (err) {
      throw withServerMessage(err, "Could not save this resume");
    }
  },

  duplicate: async (id: number): Promise<ResumeDocumentFull> => {
    try {
      const res = await apiClient.post<ResumeDocumentFull>(`${base()}${id}/duplicate/`, {});
      return res.data;
    } catch (err) {
      throw withServerMessage(err, "Could not duplicate this resume");
    }
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`${base()}${id}/`);
  },
};
