"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { razorpayService, type RazorpayStatus } from "@/lib/services/razorpay.service";
import { config } from "@/lib/config";
import { RazorpaySetupGuide } from "./RazorpaySetupGuide";

/**
 * Connect this institution's own Razorpay account.
 *
 * Payments FAIL CLOSED: until an account is connected here, this institution cannot charge for
 * anything. That is deliberate — previously an unconfigured institution still took payments, but
 * they settled into AI Linc's Razorpay account rather than its own, and nothing on any screen said
 * so. The "where the money goes" line exists so that can never be invisible again.
 *
 * The secret is write-only. It is sent once and never returned, so the field is always blank on
 * load — that is not a bug, and the helper text says so rather than leaving an admin wondering
 * whether their key was lost.
 *
 * "Connected" and "webhook active" are shown as two separate facts on purpose. Keys alone open a
 * checkout; only the webhook makes a payment settle. Collapsing them into one green tick is how an
 * institution ends up charging learners and granting nothing — which is exactly what happened here
 * before, so the card refuses to look healthy while the webhook is missing.
 */
export function PaymentAccountCard() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<RazorpayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await razorpayService.get());
    } catch {
      showToast("Couldn't load the payment account", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    if (!keyId.trim() || !keySecret.trim()) {
      showToast("Enter both the Key ID and the Key Secret", "warning");
      return;
    }
    setSaving(true);
    try {
      const next = await razorpayService.save({
        key_id: keyId.trim(),
        key_secret: keySecret.trim(),
        // Only sent when the admin actually typed one — an empty string would wipe a stored secret.
        ...(webhookSecret.trim() ? { webhook_secret: webhookSecret.trim() } : {}),
      });
      setStatus(next);
      setKeyId("");
      setKeySecret("");
      setWebhookSecret("");
      showToast("Payment account connected", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string; key_id?: string[] } } })?.response?.data;
      showToast(msg?.error ?? msg?.key_id?.[0] ?? "Couldn't save the payment account", "error");
    } finally {
      setSaving(false);
    }
  };

  /** The webhook can be added on its own, without re-entering the API secret. */
  const saveWebhook = async () => {
    if (!webhookSecret.trim()) {
      showToast("Enter the webhook secret you set in Razorpay", "warning");
      return;
    }
    setSaving(true);
    try {
      const next = await razorpayService.save({ webhook_secret: webhookSecret.trim() });
      setStatus(next);
      setWebhookSecret("");
      showToast(
        next.webhook_ready ? "Webhook secret saved" : "Saved, but the webhook is still not active",
        next.webhook_ready ? "success" : "warning"
      );
    } catch {
      showToast("Couldn't save the webhook secret", "error");
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = status?.credentials?.webhook_url;
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => showToast("Webhook URL copied", "success"),
      () => showToast("Couldn't copy — select the text instead", "error")
    );
  };

  const setActive = async (active: boolean) => {
    setSaving(true);
    try {
      // No secret in this payload — the backend treats a partial PUT as a partial update, so
      // pausing payments never means re-entering the key.
      const next = await razorpayService.save({ is_active: active });
      setStatus(next);
      showToast(active ? "Payments resumed" : "Payments paused", "success");
    } catch {
      showToast("Couldn't update the payment account", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem" }}>Loading…</Typography>;
  }

  const creds = status?.credentials ?? null;
  const connected = Boolean(status?.connected);
  const webhookReady = Boolean(status?.webhook_ready);
  const onPlatformAccount = creds?.settles_to === "platform";
  // The endpoint is deterministic, so it can be shown before any account exists — an admin
  // following the guide needs it in Part 3, which is the same visit as Part 1. The server value
  // wins when present because it is built from the request host, not a build-time env var.
  const webhookUrl =
    creds?.webhook_url ||
    (config.apiBaseUrl ? `${config.apiBaseUrl}/webhooks/clients/${config.clientId}/razorpay/` : "");

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip
          size="small"
          icon={<Icon icon={connected ? "mdi:check-circle" : "mdi:alert-circle-outline"} width={15} />}
          label={connected ? "Connected" : "Not connected"}
          sx={{
            fontWeight: 700,
            bgcolor: connected
              ? "color-mix(in srgb,#10b981 14%,transparent)"
              : "color-mix(in srgb,#f59e0b 16%,transparent)",
            color: connected ? "#047857" : "#b45309",
          }}
        />
        {/* Shown only once keys exist: "no webhook" is meaningless before an account is connected. */}
        {creds && (
          <Chip
            size="small"
            icon={<Icon icon={webhookReady ? "mdi:webhook" : "mdi:alert-outline"} width={15} />}
            label={webhookReady ? "Webhook active" : "Webhook missing"}
            sx={{
              fontWeight: 700,
              bgcolor: webhookReady
                ? "color-mix(in srgb,#10b981 14%,transparent)"
                : "color-mix(in srgb,#ef4444 16%,transparent)",
              color: webhookReady ? "#047857" : "#b91c1c",
            }}
          />
        )}
        {creds?.key_id_masked && (
          <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)", fontFamily: "monospace" }}>
            {creds.key_id_masked}
          </Typography>
        )}
      </Stack>

      {/* The single most important fact on this card. */}
      {creds && (
        <Alert
          severity={onPlatformAccount ? "warning" : "info"}
          icon={<Icon icon={onPlatformAccount ? "mdi:bank-transfer" : "mdi:bank-check"} width={20} />}
          sx={{ borderRadius: 2, fontSize: "0.83rem" }}
        >
          {onPlatformAccount ? (
            <>
              Payments from your learners currently settle into <strong>AI Linc&apos;s</strong>{" "}
              Razorpay account, not yours. Contact AI Linc to change this arrangement.
            </>
          ) : (
            <>
              Payments settle directly into <strong>your institution&apos;s</strong> Razorpay account.
            </>
          )}
        </Alert>
      )}

      {/* The failure this whole card exists to prevent: charging without a way to confirm payment. */}
      {creds && !webhookReady && (
        <Alert
          severity="error"
          icon={<Icon icon="mdi:alert-octagon-outline" width={20} />}
          sx={{ borderRadius: 2, fontSize: "0.83rem" }}
        >
          <strong>No webhook is configured.</strong> Your keys will open a checkout, but a learner is
          only granted access if their browser returns to this site after paying — close the tab or
          lose signal and they are charged with nothing to show for it. Follow{" "}
          <strong>Part 3</strong> of the setup guide below.
        </Alert>
      )}

      {!connected && !creds && (
        <Alert severity="warning" sx={{ borderRadius: 2, fontSize: "0.83rem" }}>
          Until you connect an account, your institution cannot charge for courses or assessments.
        </Alert>
      )}

      {!onPlatformAccount && (
        <>
          <TextField
            fullWidth
            size="small"
            label="Razorpay Key ID"
            placeholder="rzp_live_…"
            value={keyId}
            disabled={saving}
            onChange={(e) => setKeyId(e.target.value)}
            helperText="From Razorpay Dashboard → Settings → API Keys."
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            fullWidth
            size="small"
            type="password"
            label="Razorpay Key Secret"
            value={keySecret}
            disabled={saving}
            onChange={(e) => setKeySecret(e.target.value)}
            helperText={
              creds?.secret_configured
                ? "A secret is already stored. It is never shown again — enter it only to replace it."
                : "Shown by Razorpay once, when you generate the key."
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {/* The URL you paste into Razorpay. Shown before connecting too — Part 3 needs it. */}
          {webhookUrl && (
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", mb: 0.5, display: "block" }}
              >
                Webhook URL (paste this into Razorpay)
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={webhookUrl}
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-input": { fontSize: "0.8rem", fontFamily: "monospace" },
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  }}
                />
                <IconButton size="small" onClick={copyWebhookUrl} aria-label="Copy webhook URL">
                  <Icon icon="mdi:content-copy" width={18} />
                </IconButton>
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-tertiary)", mt: 0.5, display: "block" }}
              >
                Unique to your institution — it settles only your orders.
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            size="small"
            type="password"
            label="Webhook Secret"
            value={webhookSecret}
            disabled={saving}
            onChange={(e) => setWebhookSecret(e.target.value)}
            helperText={
              creds?.webhook_configured
                ? "A webhook secret is stored. It is never shown again — enter it only to replace it."
                : "Razorpay does not generate this — you invent it when creating the webhook, and it must match exactly."
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </>
      )}

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
        {!onPlatformAccount && (
          <LoadingButton
            variant="contained"
            loading={saving}
            loadingText="Saving"
            onClick={connect}
            startIcon={<Icon icon="mdi:link-variant" width={16} />}
          >
            {creds ? "Update account" : "Connect account"}
          </LoadingButton>
        )}
        {/* The common case after Part 3: the account is already connected and only the webhook is
            being added. That must not require re-entering the API secret. */}
        {creds && !onPlatformAccount && (
          <LoadingButton
            variant={webhookReady ? "outlined" : "contained"}
            loading={saving}
            loadingText="Saving"
            onClick={saveWebhook}
            startIcon={<Icon icon="mdi:webhook" width={16} />}
          >
            {webhookReady ? "Replace webhook secret" : "Save webhook secret"}
          </LoadingButton>
        )}
        {creds && (
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() => setActive(!creds.is_active)}
            startIcon={<Icon icon={creds.is_active ? "mdi:pause" : "mdi:play"} width={16} />}
          >
            {creds.is_active ? "Pause payments" : "Resume payments"}
          </Button>
        )}
      </Stack>

      {creds && !creds.is_active && (
        <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}>
          {/* Worth stating: pausing used to reroute payments rather than stop them. */}
          Paused. No new charges can be created, and your saved key is kept.
        </Typography>
      )}

      {/* Collapsed by default, like the Zoom setup guide — long enough to bury the card otherwise. */}
      <Box>
        <Button
          size="small"
          onClick={() => setShowGuide((v) => !v)}
          startIcon={<Icon icon={showGuide ? "mdi:chevron-up" : "mdi:book-open-page-variant"} width={16} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--accent-indigo)",
            "&:hover": {
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
            },
          }}
        >
          {showGuide ? "Hide setup guide" : "First time? View the step-by-step Razorpay setup guide"}
        </Button>
        <Collapse in={showGuide}>
          <RazorpaySetupGuide webhookUrl={webhookUrl} />
        </Collapse>
      </Box>
    </Stack>
  );
}
