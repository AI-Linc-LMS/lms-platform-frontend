"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { razorpayService, type RazorpayStatus } from "@/lib/services/razorpay.service";

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
 */
export function PaymentAccountCard() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<RazorpayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");

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
      });
      setStatus(next);
      setKeyId("");
      setKeySecret("");
      showToast("Payment account connected", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string; key_id?: string[] } } })?.response?.data;
      showToast(msg?.error ?? msg?.key_id?.[0] ?? "Couldn't save the payment account", "error");
    } finally {
      setSaving(false);
    }
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
  const onPlatformAccount = creds?.settles_to === "platform";

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
    </Stack>
  );
}
