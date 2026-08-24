import apiClient from "./api";
import type {
  CertificateAssetUploadResponse,
  CertificateClaimRefusal,
  CertificatePresetsResponse,
  CertificatePreviewQuery,
  CertificateRenderPayload,
  CertificateRule,
  CertificateRuleBulkResponse,
  CertificateRuleListResponse,
  CertificateRuleQuery,
  CertificateRulesBulkPayload,
  CertificateTemplate,
  CertificateTemplateArchiveResponse,
  CertificateTemplateListResponse,
  CertificateTemplateQuery,
  CertificateTemplateWrite,
  CertificateTier,
  CertificateTierListResponse,
  CertificateTierResetResponse,
  CertificateTierWrite,
  CertificatesOverview,
  ClaimCertificateResponse,
  IssuedCertificate,
  IssuedCertificateList,
  IssuedCertificateQuery,
  LearnerCertificatesResponse,
} from "@/lib/certificates/types";

/**
 * The certificates module's HTTP layer.
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
 *
 * EVERY ADMIN LIST ENDPOINT RETURNS A KEYED ENVELOPE, and unwrapping happens
 * HERE, once. What used to sit at each call site was
 * `Array.isArray(data) ? data : []`, which turned a shape error into silence:
 * an object is never an array, so six populated responses became six empty
 * lists with no throw, no toast and no retry affordance. `unwrapList` throws
 * instead, so React Query surfaces an error state and the mismatch is visible
 * the first time anyone opens the page.
 */

const BASE = "/certificates/api";
const ME = `${BASE}/me/certificates`;

/** Admin routes are explicitly tenant-scoped: the client id is a parameter, not
 *  read from config here, so an admin surface can never accidentally act on the
 *  build-time tenant while displaying another one. */
const adminBase = (clientId: string | number) => `${BASE}/admin/clients/${clientId}`;

/** Pull one array out of a keyed envelope, or fail loudly. */
function unwrapList<T, K extends string>(
  data: Record<string, unknown> | null | undefined,
  key: K,
  endpoint: string,
): T[] {
  const value = data?.[key];
  if (Array.isArray(value)) return value as T[];
  throw new Error(
    `${endpoint} did not return a "${key}" list. The certificates API answered with an unexpected shape.`,
  );
}

export const adminCertificatesService = {
  /** Landing-page counters. Nested under `counts`, plus `seeded`, `ladder` and
   *  `recent_issued` the hub should be rendering. */
  async overview(clientId: string | number): Promise<CertificatesOverview> {
    const { data } = await apiClient.get<CertificatesOverview>(
      `${adminBase(clientId)}/overview/`,
    );
    return data;
  },

  /**
   * The server's design vocabulary: presets AND the palette token list, the
   * layouts, the kinds, the canvas size and the placement field names. Returned
   * whole rather than reduced to `presets[]`, because the editor needs the rest
   * of it and hard-coding a second copy is how a picker starts offering a
   * preset the API rejects.
   */
  async presets(clientId: string | number): Promise<CertificatePresetsResponse> {
    const { data } = await apiClient.get<CertificatePresetsResponse>(
      `${adminBase(clientId)}/presets/`,
    );
    unwrapList(data as unknown as Record<string, unknown>, "presets", "GET presets/");
    return data;
  },

  // ---- Templates ----
  async listTemplates(
    clientId: string | number,
    query: CertificateTemplateQuery = {},
  ): Promise<CertificateTemplate[]> {
    const { data } = await apiClient.get<CertificateTemplateListResponse>(
      `${adminBase(clientId)}/templates/`,
      {
        params: {
          ...(query.include_archived ? { include_archived: 1 } : {}),
          ...(query.kind ? { kind: query.kind } : {}),
          ...(query.q ? { q: query.q } : {}),
        },
      },
    );
    return unwrapList<CertificateTemplate, "templates">(
      data as unknown as Record<string, unknown>,
      "templates",
      "GET templates/",
    );
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

  /**
   * ARCHIVE, never destroy: a 200 carrying the archived row, not a 204.
   *
   * A hard delete would CASCADE away every band that awards this design (a
   * course configured for Distinction and Participation would quietly start
   * awarding nothing) and blank the ladder rungs pointing at it. Archiving
   * removes it from every picker and stops it matching, and disturbs nothing
   * already issued. The body is returned so the cache can be updated from the
   * response instead of refetching.
   */
  async deleteTemplate(
    clientId: string | number,
    templateId: number,
  ): Promise<CertificateTemplateArchiveResponse> {
    const { data } = await apiClient.delete<CertificateTemplateArchiveResponse>(
      `${adminBase(clientId)}/templates/${templateId}/`,
    );
    return data;
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

  /**
   * Upload a background image for a kind="upload" template. Multipart: do NOT
   * set Content-Type, the browser has to add the boundary itself or DRF
   * rejects the body.
   *
   * The response carries BOTH a storage `key` and a signed `url`, and names its
   * own destination field (`asset.key_field`). Store the KEY at `asset.name`;
   * the URL expires in seven days and the write serializer refuses it.
   * Throttled at 60/hour.
   */
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
  /** The whole envelope: `default_slugs` is what lets the ladder mark which
   *  rungs a reset would overwrite. */
  async listTiers(clientId: string | number): Promise<CertificateTierListResponse> {
    const { data } = await apiClient.get<CertificateTierListResponse>(
      `${adminBase(clientId)}/tiers/`,
    );
    unwrapList(data as unknown as Record<string, unknown>, "tiers", "GET tiers/");
    return data;
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
  async resetTierDefaults(
    clientId: string | number,
  ): Promise<CertificateTierResetResponse> {
    const { data } = await apiClient.post<CertificateTierResetResponse>(
      `${adminBase(clientId)}/tiers/reset-defaults/`,
      {},
    );
    unwrapList(
      data as unknown as Record<string, unknown>,
      "tiers",
      "POST tiers/reset-defaults/",
    );
    return data;
  },

  // ---- Rules ----
  async getRules(
    clientId: string | number,
    query: CertificateRuleQuery = {},
  ): Promise<CertificateRule[]> {
    const { data } = await apiClient.get<CertificateRuleListResponse>(
      `${adminBase(clientId)}/rules/`,
      { params: query },
    );
    return unwrapList<CertificateRule, "rules">(
      data as unknown as Record<string, unknown>,
      "rules",
      "GET rules/",
    );
  },

  /** PUT is a bulk REPLACE for one scope+object, not a merge: whatever array
   *  you send becomes that course's or assessment's complete rule set, so send
   *  the rules you want to keep or they are gone. The response's `removed`
   *  count is how many the replace deleted. */
  async putRules(
    clientId: string | number,
    payload: CertificateRulesBulkPayload,
  ): Promise<CertificateRuleBulkResponse> {
    const { data } = await apiClient.put<CertificateRuleBulkResponse>(
      `${adminBase(clientId)}/rules/`,
      payload,
    );
    unwrapList(data as unknown as Record<string, unknown>, "rules", "PUT rules/");
    return data;
  },

  // ---- Issued credentials ----
  /** Page-numbered, not cursor-based: the response carries `num_pages` and no
   *  next/previous links. */
  async listIssued(
    clientId: string | number,
    query: IssuedCertificateQuery = {},
  ): Promise<IssuedCertificateList> {
    const { data } = await apiClient.get<IssuedCertificateList>(
      `${adminBase(clientId)}/issued/`,
      { params: query },
    );
    unwrapList(data as unknown as Record<string, unknown>, "results", "GET issued/");
    return data;
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

  /**
   * The authoritative answer to "what will this look like": a real render
   * payload for a saved template or an unsaved draft, computed by the same
   * function that mints real documents.
   *
   * POST rather than GET because the GET variant needs `palette_overrides`
   * JSON-stringified, which is a needless second encoding for a body the
   * editor already holds as an object.
   */
  async preview(
    clientId: string | number,
    query: CertificatePreviewQuery = {},
  ): Promise<CertificateRenderPayload> {
    const { data } = await apiClient.post<CertificateRenderPayload>(
      `${adminBase(clientId)}/preview/`,
      query,
    );
    return data;
  },
};

/* ------------------------------------------------------------------ *
 * Learner
 * ------------------------------------------------------------------ */

/** A 409 refusal, carrying the machine-readable body rather than a generic
 *  message. `code` decides whether the learner is told to earn more or told
 *  the tenant has a configuration problem. */
export class CertificateClaimError extends Error {
  readonly body: CertificateClaimRefusal;

  constructor(body: CertificateClaimRefusal) {
    super(body.detail);
    this.name = "CertificateClaimError";
    this.body = body;
  }
}

function claimRefusal(error: unknown): CertificateClaimRefusal | null {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (response?.status !== 409) return null;
  const data = response.data as Partial<CertificateClaimRefusal> | undefined;
  if (!data || typeof data.detail !== "string") return null;
  return {
    ...data,
    detail: data.detail,
    code: data.code === "CERTIFICATE_UNAVAILABLE" ? "CERTIFICATE_UNAVAILABLE" : "CERTIFICATE_LOCKED",
  };
}

/** Only paths the SERVER handed out are POSTable. Guessing a claim URL from a
 *  route id is what let `app/courses/[id]` post a legacy `lms_core.Course` id
 *  at an endpoint that resolves ids against `AdaptiveCourse` - and mint a real
 *  credential for a course the learner had never touched whenever the two id
 *  spaces happened to collide. */
const CLAIM_PATH_PREFIX = `${BASE}/me/certificates/`;

export const learnerCertificatesService = {
  /** The learner's whole certificates page in one call: the points total that
   *  gates the ladder, where those points came from, what they hold (as full
   *  render payloads), every rung, and anything earned but not yet pulled. */
  async list(): Promise<LearnerCertificatesResponse> {
    const { data } = await apiClient.get<LearnerCertificatesResponse>(`${ME}/`);
    return data;
  },

  /** Full render payload for one credential the learner owns. */
  async detail(credentialId: string): Promise<CertificateRenderPayload> {
    const { data } = await apiClient.get<CertificateRenderPayload>(
      `${ME}/${encodeURIComponent(credentialId)}/`,
    );
    return data;
  },

  /**
   * Claim whatever sits behind a server-supplied `claim_path`.
   *
   * One method, not three, and no branch on `kind`: the backend publishes
   * `claim_path` on every claimable row and on every ladder rung precisely so a
   * client never assembles one. That structurally removes a whole class of
   * bug rather than patching one instance of it, and a future fourth source
   * kind claims correctly without a frontend release.
   *
   * The gate and the idempotent get_or_create are the same ones the eager
   * issuance path runs, so a double click returns the credential the learner
   * already has instead of minting a duplicate.
   */
  async claim(claimPath: string): Promise<ClaimCertificateResponse> {
    const path = (claimPath ?? "").trim();
    if (!path.startsWith(CLAIM_PATH_PREFIX)) {
      throw new Error(
        "Refusing to claim from a path the certificates API did not supply.",
      );
    }
    try {
      const { data } = await apiClient.post<ClaimCertificateResponse>(path, {});
      return data;
    } catch (error) {
      const refusal = claimRefusal(error);
      if (refusal) throw new CertificateClaimError(refusal);
      throw error;
    }
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
