"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { AdaptiveCredential } from "@/lib/types/adaptive-journey";

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

export function CredentialView({ credentialId }: { credentialId: string }) {
  const [cred, setCred] = useState<AdaptiveCredential | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await adaptiveJourneyService.getPublicCredential(credentialId);
        if (cancelled) return;
        if (c?.verified) {
          setCred(c);
          setStatus("ok");
        } else {
          setStatus("notfound");
        }
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [credentialId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no-op */
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, md: 4 },
        background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #fdf2f8 100%)",
      }}
    >
      {status === "loading" && <CircularProgress sx={{ color: "#6366f1" }} />}

      {status === "notfound" && (
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, maxWidth: 460, textAlign: "center", border: "1px solid #ececf1" }}>
          <Icon icon="mdi:alert-circle-outline" width={48} style={{ color: "#f59e0b" }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", mt: 1 }}>Credential not found</Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            We couldn&apos;t find a credential with the ID <b>{credentialId}</b>. It may have been mistyped.
          </Typography>
        </Paper>
      )}

      {status === "ok" && cred && (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 680,
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid #ececf1",
            boxShadow: "0 30px 60px -30px rgba(15,23,42,0.25)",
            bgcolor: "#fff",
          }}
        >
          {/* Accent header */}
          <Box sx={{ height: 8, background: "linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" }} />

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              {cred.issuer_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cred.issuer_logo_url} alt={cred.issuer_name} style={{ height: 36, objectFit: "contain" }} />
              ) : (
                <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#0f172a" }}>{cred.issuer_name}</Typography>
              )}
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: "#dcfce7", color: "#15803d" }}>
                <Icon icon="mdi:check-decagram" width={18} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Verified Credential</Typography>
              </Stack>
            </Stack>

            <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              This certifies that
            </Typography>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.2rem" }, lineHeight: 1.15, mt: 0.5, color: "#0f172a" }}>
              {cred.recipient_name}
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 1.5 }}>has successfully completed</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", md: "1.5rem" }, mt: 0.5, color: "#4f46e5" }}>
              {cred.course_title}
            </Typography>

            {cred.template_url && (
              <Box sx={{ mt: 3, borderRadius: 3, overflow: "hidden", border: "1px solid #ececf1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cred.template_url} alt="Certificate" style={{ width: "100%", height: "auto", display: "block" }} />
              </Box>
            )}

            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
              <Meta label="Issued by" value={cred.issuer_name} />
              <Meta label="Issued on" value={fmtDate(cred.issued_at)} />
              <Meta label="Completion" value={`${cred.completion_percent}%`} />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
              <Box>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
                  Credential ID
                </Typography>
                <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                  {cred.credential_id}
                </Typography>
              </Box>
              <Button
                onClick={copyLink}
                variant="outlined"
                startIcon={<Icon icon={copied ? "mdi:check" : "mdi:link-variant"} width={18} />}
                sx={{ textTransform: "none", fontWeight: 700, borderColor: "#c7d2fe", color: "#4f46e5", borderRadius: 2 }}
              >
                {copied ? "Link copied" : "Copy verify link"}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ px: { xs: 3, md: 5 }, py: 2, bgcolor: "#f8fafc", borderTop: "1px solid #ececf1" }}>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
              <Icon icon="mdi:shield-check-outline" width={15} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              This is a verified credential issued by {cred.issuer_name}. Anyone with this link can confirm its authenticity.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{value}</Typography>
    </Box>
  );
}
