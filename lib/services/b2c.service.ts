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

/** The only metered feature today. More arrive in later phases. */
export const B2C_FEATURE_ADAPTIVE_COURSE = "adaptive_course";

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
};
