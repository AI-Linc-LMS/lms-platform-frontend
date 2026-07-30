import apiClient from "./api";
import { config } from "../config";

/**
 * A tenant's own Razorpay account (GET/PUT `accounts/clients/<id>/razorpay-credentials/`).
 *
 * The secret is write-only: it is sent when connecting and never comes back. The read side reports
 * only whether one is stored, plus a masked key id — so this service has no field to hold a secret
 * in, by design.
 */
const BASE = `/accounts/clients/${config.clientId}`;

export interface RazorpayCredentials {
  id: number;
  /** e.g. `rzp_live_ab…3xY`. Enough to recognise the account, not enough to quote. */
  key_id_masked: string;
  secret_configured: boolean;
  connected: boolean;
  is_active: boolean;
  use_platform_account: boolean;
  /** Whose Razorpay account the money actually reaches. */
  settles_to: "institution" | "platform";
  /** Whether a webhook signing secret is stored. Write-only, like the key secret. */
  webhook_configured: boolean;
  /** This institution's own endpoint, to paste into the Razorpay dashboard. */
  webhook_url: string;
  created_at: string;
  updated_at: string;
}

export interface RazorpayStatus {
  credentials: RazorpayCredentials | null;
  /** False whenever this institution cannot take a payment — including "never configured". */
  connected: boolean;
  /**
   * Deliberately separate from `connected`. Valid keys with no webhook still open a checkout, but
   * settlement then depends on the learner's browser returning — so this is the difference between
   * "can charge" and "can charge safely", and the UI must be able to say so.
   */
  webhook_ready: boolean;
}

export const razorpayService = {
  get: async (): Promise<RazorpayStatus> => {
    const res = await apiClient.get<RazorpayStatus>(`${BASE}/razorpay-credentials/`);
    return res.data;
  },

  /**
   * Connect or update. `key_secret` is omitted when the admin is only toggling `is_active`, and the
   * backend treats a partial payload as a partial update — so disconnecting does not require
   * re-entering the secret.
   */
  save: async (payload: {
    key_id?: string;
    key_secret?: string;
    webhook_secret?: string;
    is_active?: boolean;
  }): Promise<RazorpayStatus> => {
    const res = await apiClient.put<RazorpayStatus>(`${BASE}/razorpay-credentials/`, payload);
    return res.data;
  },
};
