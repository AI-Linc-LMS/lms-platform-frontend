import apiClient from "./api";
import type {
  CertificateAssetUploadResponse,
  CertificatePresetSummary,
  CertificatePreviewQuery,
  CertificateRenderPayload,
  CertificateRule,
  CertificateRuleQuery,
  CertificateRulesBulkPayload,
  CertificateTemplate,
  CertificateTemplateWrite,
  CertificateTier,
  CertificateTierWrite,
  CertificatesOverview,
  ClaimCertificateResponse,
  IssuedCertificate,
  IssuedCertificateList,
  IssuedCertificateQuery,
  LearnerCertificatesResponse,
} from "@/lib/certificates/types";

/**
 * The certificates module's HTTP layer (docs/specs/certificates-module.md).
 *
 * Three service objects, one per audience, because the three surfaces have
 * genuinely different auth: admin calls are tenant-scoped and gated on the
 * `admin_certificates` capability, learner calls are "me"-scoped, and the
 * public credential lookup is unauthenticated. Keeping them apart makes it
 * impossible to reach for an admin call from a learner page by autocomplete.
 *
 * Everything goes through the shared apiClient: it is the only thing that
 * attaches the Bearer token and runs the single-flight refresh, so a second
 * axios instance or a bare fetch() would silently skip the refresh and log
 * people out mid-session.
 */

const BASE = "/certificates/api";
const ME = `${BASE}/me/certificates`;

/** Admin routes are explicitly tenant-scoped: the client id is a parameter, not
 *  read from config here, so an admin surface can never accidentally act on the
 *  build-time tenant while displaying another one. */
const adminBase = (clientId: string | number) => `${BASE}/admin/clients/${clientId}`;

export const adminCertificatesService = {
  /** Landing-page counts for the module. */
  async overview(clientId: string | number): Promise<CertificatesOverview> {
    const { data } = await apiClient.get<CertificatesOverview>(
      `${adminBase(clientId)}/overview/`,
    );
    return data;
  },

  /** The server's design presets. The picker previews from lib/certificates/presets.ts
   *  for instant repaint, but this is the authoritative list - render what the
   *  server actually offers, not what the local mirror happens to contain. */
  async presets(clientId: string | number): Promise<CertificatePresetSummary[]> {
    const { data } = await apiClient.get<CertificatePresetSummary[]>(
      `${adminBase(clientId)}/presets/`,
    );
    return Array.isArray(data) ? data : [];
  },

  // ---- Templates ----
  async listTemplates(clientId: string | number): Promise<CertificateTemplate[]> {
    const { data } = await apiClient.get<CertificateTemplate[]>(
      `${adminBase(clientId)}/templates/`,
    );
    return Array.isArray(data) ? data : [];
  },

  async getTemplate(
    clientId: string | number,
    templateId: number,
  ): Promise<CertificateTemplate> {
    const { data } = await apiClient.get<CertificateTemplate>(
      `${adminBase(clientId)}/templates/${templateId}/`,
    );
    return data;
  },

  async createTemplate(
    clientId: string | number,
    payload: CertificateTemplateWrite,
  ): Promise<CertificateTemplate> {
    const { data } = await apiClient.post<CertificateTemplate>(
      `${adminBase(clientId)}/templates/`,
      payload,
    );
    return data;
  },

  async updateTemplate(
    clientId: string | number,
    templateId: number,
    payload: CertificateTemplateWrite,
  ): Promise<CertificateTemplate> {
    const { data } = await apiClient.patch<CertificateTemplate>(
      `${adminBase(clientId)}/templates/${templateId}/`,
      payload,
    );
    return data;
  },

  /** Deleting a template never touches certificates already issued from it:
   *  each issued row carries its own frozen design_snapshot. */
  async deleteTemplate(clientId: string | number, templateId: number): Promise<void> {
    await apiClient.delete(`${adminBase(clientId)}/templates/${templateId}/`);
  },

  async duplicateTemplate(
    clientId: string | number,
    templateId: number,
  ): Promise<CertificateTemplate> {
    const { data } = await apiClient.post<CertificateTemplate>(
      `${adminBase(clientId)}/templates/${templateId}/duplicate/`,
      {},
    );
    return data;
  },

  /** Upload a background image for a kind="upload" template. Multipart: do NOT
   *  set Content-Type, the browser has to add the boundary itself or DRF
   *  rejects the body. */
  async uploadAsset(
    clientId: string | number,
    file: File,
  ): Promise<CertificateAssetUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<CertificateAssetUploadResponse>(
      `${adminBase(clientId)}/templates/upload-asset/`,
      form,
    );
    return data;
  },

  // ---- Tiers (the points ladder) ----
  async listTiers(clientId: string | number): Promise<CertificateTier[]> {
    const { data } = await apiClient.get<CertificateTier[]>(`${adminBase(clientId)}/tiers/`);
    return Array.isArray(data) ? data : [];
  },

  async createTier(
    clientId: string | number,
    payload: CertificateTierWrite,
  ): Promise<CertificateTier> {
    const { data } = await apiClient.post<CertificateTier>(
      `${adminBase(clientId)}/tiers/`,
      payload,
    );
    return data;
  },

  async updateTier(
    clientId: string | number,
    tierId: number,
    payload: CertificateTierWrite,
  ): Promise<CertificateTier> {
    const { data } = await apiClient.patch<CertificateTier>(
      `${adminBase(clientId)}/tiers/${tierId}/`,
      payload,
    );
    return data;
  },

  async deleteTier(clientId: string | number, tierId: number): Promise<void> {
    await apiClient.delete(`${adminBase(clientId)}/tiers/${tierId}/`);
  },

  /** Restore the seeded 7-rung ladder. Destructive to the tier rows, which is
   *  why the caller must confirm first; already-issued tier certificates keep
   *  their snapshotted threshold_at_issue regardless. */
  async resetTierDefaults(clientId: string | number): Promise<CertificateTier[]> {
    const { data } = await apiClient.post<CertificateTier[]>(
      `${adminBase(clientId)}/tiers/reset-defaults/`,
      {},
    );
    return Array.isArray(data) ? data : [];
  },

  // ---- Rules ----
  async getRules(
    clientId: string | number,
    query: CertificateRuleQuery = {},
  ): Promise<CertificateRule[]> {
    const { data } = await apiClient.get<CertificateRule[]>(`${adminBase(clientId)}/rules/`, {
      params: query,
    });
    return Array.isArray(data) ? data : [];
  },

  /** PUT is a bulk REPLACE for one scope+object, not a merge: whatever array
   *  you send becomes that course's or assessment's complete rule set, so send
   *  the rules you want to keep or they are gone. */
  async putRules(
    clientId: string | number,
    payload: CertificateRulesBulkPayload,
  ): Promise<CertificateRule[]> {
    const { data } = await apiClient.put<CertificateRule[]>(
      `${adminBase(clientId)}/rules/`,
      payload,
    );
    return Array.isArray(data) ? data : [];
  },

  // ---- Issued credentials ----
  /** Normalises a bare array into the paginated shape so the table has one
   *  branch to render whether or not the endpoint is paginated. */
  async listIssued(
    clientId: string | number,
    query: IssuedCertificateQuery = {},
  ): Promise<IssuedCertificateList> {
    const { data } = await apiClient.get<IssuedCertificateList | IssuedCertificate[]>(
      `${adminBase(clientId)}/issued/`,
      { params: query },
    );
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return {
      count: data?.count ?? data?.results?.length ?? 0,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      results: Array.isArray(data?.results) ? data.results : [],
    };
  },

  /** Revoke marks the credential revoked; it never deletes it, because the
   *  public verification URL has to keep resolving and say "revoked" rather
   *  than 404 on a link that is already on someone's profile. */
  async revoke(
    clientId: string | number,
    issuedId: number,
    reason?: string,
  ): Promise<IssuedCertificate> {
    const { data } = await apiClient.post<IssuedCertificate>(
      `${adminBase(clientId)}/issued/${issuedId}/revoke/`,
      reason ? { reason } : {},
    );
    return data;
  },

  async reinstate(
    clientId: string | number,
    issuedId: number,
  ): Promise<IssuedCertificate> {
    const { data } = await apiClient.post<IssuedCertificate>(
      `${adminBase(clientId)}/issued/${issuedId}/reinstate/`,
      {},
    );
    return data;
  },

  /** A real render payload for a template with a fake recipient, so the admin
   *  sees exactly what a learner will get without issuing anything. */
  async preview(
    clientId: string | number,
    query: CertificatePreviewQuery = {},
  ): Promise<CertificateRenderPayload> {
    const { data } = await apiClient.get<CertificateRenderPayload>(
      `${adminBase(clientId)}/preview/`,
      { params: query },
    );
    return data;
  },
};

export const learnerCertificatesService = {
  /** The learner's whole certificates page in one call: the points total that
   *  gates the ladder, where those points came from, what they hold, every
   *  rung, and anything earned but not yet pulled. */
  async list(): Promise<LearnerCertificatesResponse> {
    const { data } = await apiClient.get<LearnerCertificatesResponse>(`${ME}/`);
    // The spec's Endpoints section names the earned-but-unclaimed list
    // `pending`, while the payload contract names it `claimable`, and the
    // backend is being written against both at once. Every consumer guards
    // with `?? []`, so the wrong key would not throw: the claim strip would
    // simply never render and a learner would be quietly unable to pull a
    // certificate they had already earned. Collapse both spellings here, once,
    // rather than teaching four surfaces to check two keys.
    return { ...data, claimable: data.claimable ?? data.pending ?? [] };
  },

  /** Full render payload for one credential the learner owns. */
  async detail(credentialId: string): Promise<CertificateRenderPayload> {
    const { data } = await apiClient.get<CertificateRenderPayload>(
      `${ME}/${encodeURIComponent(credentialId)}/`,
    );
    return data;
  },

  /**
   * Pull-side claims. All three run the SAME eligibility gate and the same
   * idempotent get_or_create as the eager path, so a double click or a claim
   * for something already issued returns the existing credential instead of
   * minting a duplicate.
   */
  async claimTier(tierSlug: string): Promise<ClaimCertificateResponse> {
    const { data } = await apiClient.post<ClaimCertificateResponse>(
      `${ME}/tiers/${encodeURIComponent(tierSlug)}/claim/`,
      {},
    );
    return data;
  },

  async claimCourse(courseId: number): Promise<ClaimCertificateResponse> {
    const { data } = await apiClient.post<ClaimCertificateResponse>(
      `${ME}/courses/${courseId}/claim/`,
      {},
    );
    return data;
  },

  async claimAssessment(assessmentId: number): Promise<ClaimCertificateResponse> {
    const { data } = await apiClient.post<ClaimCertificateResponse>(
      `${ME}/assessments/${assessmentId}/claim/`,
      {},
    );
    return data;
  },
};

export const publicCertificatesService = {
  /**
   * Unauthenticated verification, powering /credentials/<id>. Throttled server
   * side. apiClient is still the right client here: it simply sends no Bearer
   * when there is no token, and a revoked credential comes back with
   * status="revoked" rather than an error, because the page has to say so.
   */
  async getCredential(credentialId: string): Promise<CertificateRenderPayload> {
    const { data } = await apiClient.get<CertificateRenderPayload>(
      `${BASE}/credentials/${encodeURIComponent(credentialId)}/`,
    );
    return data;
  },
};
