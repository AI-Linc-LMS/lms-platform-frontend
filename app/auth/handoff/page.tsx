"use client";

/**
 * Central-auth proxy handoff landing page.
 *
 * After the Google OAuth dance at the central auth proxy (Django backend
 * /central-auth/...), the proxy redirects users here with
 * `?token=<signed-handoff>&return_to=<path>`. We exchange the handoff for the
 * real SimpleJWT access/refresh pair and finish the login locally so the user
 * lands on the dashboard (or `return_to`) authenticated.
 *
 * One Google Cloud Console origin covers every tenant - there is no per-tenant
 * Google config to maintain.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import Cookies from "js-cookie";

import { config } from "@/lib/config";
import { authUtils } from "@/lib/auth/auth-utils";
import { useAuth } from "@/lib/auth/auth-context";
import { resolvePostLoginPath } from "@/lib/auth/role-utils";

interface ExchangeResponse {
  access: string;
  refresh: string;
  client_id: number;
  tenant: string;
  email: string;
  role?: string;
}

function HandoffInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const returnTo = searchParams.get("return_to") || "/dashboard";
    if (!token) {
      setError("Missing handoff token.");
      return;
    }
    if (!config.authProxyUrl) {
      setError("Central auth proxy is not configured for this site.");
      return;
    }

    (async () => {
      try {
        const resp = await fetch(
          `${config.authProxyUrl}/central-auth/oauth/exchange/`,
          {
            method: "POST",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail || `Exchange failed (${resp.status})`);
        }
        const data = (await resp.json()) as ExchangeResponse;
        authUtils.setTokens(data.access, data.refresh);
        if (data.role) {
          authUtils.setUserRole(data.role);
        }
        Cookies.set("client_id", String(data.client_id), { expires: 30 });
        await refreshUser();
        const role = authUtils.getUserRole() ?? data.role ?? "";
        const target = resolvePostLoginPath(role, returnTo);
        router.replace(target);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Could not complete sign-in.";
        setError(message);
      }
    })();
    // We deliberately run this once on mount; the search params are read inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 4,
      }}
    >
      {error ? (
        <>
          <Typography variant="h6" color="error">
            Sign-in could not be completed.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 2, cursor: "pointer", textDecoration: "underline" }}
            onClick={() => router.replace("/login")}
          >
            Back to sign in
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Finishing sign-in…
          </Typography>
        </>
      )}
    </Box>
  );
}

export default function HandoffPage() {
  return (
    <Suspense fallback={null}>
      <HandoffInner />
    </Suspense>
  );
}
