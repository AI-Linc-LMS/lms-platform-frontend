import apiClient from "./api";

const BASE = "/b2c/api";

export interface B2CFeatureAllowance {
  feature_key: string;
  used: number;
  allowance: number;
  remaining: number;
}

export interface B2CAllowance {
  /** False for every ordinary institution. The UI shows no free-tier affordance at all then. */
  is_b2c: boolean;
  features: B2CFeatureAllowance[];
}

export const B2C_FEATURE_ADAPTIVE_COURSE = "adaptive_course";
export const B2C_FEATURE_ASSESSMENT = "assessment";

export interface B2CClaimResult {
  feature_key: string;
  object_id: number;
  claimed: boolean;
  used: number;
  allowance: number;
  remaining: number;
}

export const b2cService = {
  /**
   * What this learner still gets for free.
   *
   * Safe to call on any tenant: a non-B2C institution answers 200 with `is_b2c: false` rather
   * than an error, so callers never need to know which kind of tenant they are on.
   */
  async getAllowance(): Promise<B2CAllowance> {
    const { data } = await apiClient.get<B2CAllowance>(`${BASE}/allowance/`);
    return data;
  },

  /**
   * Spend one unit of the free allowance on a specific thing.
   *
   * Courses are NOT claimable here — they go through the self-enroll route, because the grant and
   * the enrolment have to share a transaction. The backend refuses `adaptive_course` with a 400
   * rather than silently minting an entitlement with no enrolment behind it.
   *
   * Throws on 402 (allowance spent) and 404 (not claimable). Callers should treat 402 as "offer
   * to buy instead" rather than as an error.
   */
  async claim(featureKey: string, objectId: number): Promise<B2CClaimResult> {
    const { data } = await apiClient.post<B2CClaimResult>(`${BASE}/claim/`, {
      feature_key: featureKey,
      object_id: objectId,
    });
    return data;
  },
};
