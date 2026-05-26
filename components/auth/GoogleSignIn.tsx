"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Box, Typography } from "@mui/material";
import Cookies from "js-cookie";
import { resolvePostLoginPath } from "@/lib/auth/role-utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { SignInLoader } from "@/components/common/SignInLoader";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
            error_callback?: (error: any) => void;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

interface GoogleSignInProps {
  disabled?: boolean;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  disabled = false,
}) => {
  const { t } = useTranslation("common");
  const { googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isInitialized = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(300);

  const handleGoogleSignIn = useCallback(
    async (response: { credential: string }) => {
      try {
        const result = await googleLogin(response.credential);
        if (!result.profileActive) {
          setIsRedirecting(false);
          router.replace("/dashboard");
          return;
        }

        showToast(t("auth.loginSuccess"), "success");
        setIsRedirecting(true);
        const role = Cookies.get("user_role") ?? "";
        const redirectUrl = resolvePostLoginPath(
          role,
          searchParams.get("redirect")
        );
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
      } catch (error: unknown) {
        showToast(
          getAxiosErrorDetail(error, t("auth.googleSignInFailed")),
          "error"
        );
        setIsRedirecting(false);
      }
    },
    [googleLogin, router, showToast, searchParams, t]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show a toast if Google's redirect came back without a credential
  useEffect(() => {
    if (searchParams.get("google_error") === "1") {
      showToast(t("auth.googleSignInFailed"), "error");
      const url = new URL(window.location.href);
      url.searchParams.delete("google_error");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams, showToast, t]);

  // Consume a credential left by the /api/auth/google/callback redirect route.
  // This fires when the user returns to /login after Google's redirect-mode flow.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cookieName = "google_pending_credential";
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${cookieName}=`));
    if (!match) return;
    const credential = match.split("=").slice(1).join("=");
    document.cookie = `${cookieName}=; Max-Age=0; path=/`;
    if (credential) handleGoogleSignIn({ credential });
  }, [handleGoogleSignIn]);

  // Measure the container so the GSI button fills it exactly
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width > 0) setButtonWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Re-render the GSI button whenever the measured width changes so it stays
  // full-width as the layout shifts (e.g. sidebar open/close).
  const renderGsiButton = useCallback(() => {
    if (
      !window.google?.accounts?.id ||
      !googleButtonRef.current ||
      !isInitialized.current
    ) return;
    try {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        logo_alignment: "left",
        width: buttonWidth,
        // Redirect mode: Google POSTs the credential to our API route on the
        // same tab — no popup, no new tab on any device or browser.
        ux_mode: "redirect",
        login_uri:
          typeof window !== "undefined"
            ? `${window.location.origin}/api/auth/google/callback`
            : "/api/auth/google/callback",
      });
    } catch {
      // ignore
    }
  }, [buttonWidth]);

  useEffect(() => {
    renderGsiButton();
  }, [renderGsiButton]);

  useEffect(() => {
    if (!isMounted) return;

    // Central auth proxy: GSI library is not needed — the proxy handles OAuth
    // server-side. Loading it here would cause "origin not allowed" errors.
    if (config.tenantSlug && config.authProxyUrl) return;
    if (!config.googleClientId) return;
    if (isInitialized.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google?.accounts || !googleButtonRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: handleGoogleSignIn,
          use_fedcm_for_prompt: false,
          error_callback: (error: any) => {
            // These are all non-fatal — the rendered button handles its own
            // fallback (FedCM → popup) without any help from us.
            const silentTypes = new Set([
              "popup_closed_by_user",
              "fedcm_api_disabled",
              "unknown_reason",
              "browser_not_supported",
              "popup_blocked",
            ]);
            if (silentTypes.has(error.type)) return;
            showToast(t("auth.googleError"), "error");
          },
        });

        isInitialized.current = true;
        renderGsiButton();
      } catch {
        showToast(t("auth.googleInitFailed"), "error");
      }
    };

    script.onerror = () => {
      showToast(t("auth.googleLoadFailed"), "error");
    };

    document.body.appendChild(script);

    return () => {
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      try { existing?.remove(); } catch { /* already removed */ }
    };
  }, [isMounted, handleGoogleSignIn, showToast, renderGsiButton]);

  if (isRedirecting) {
    return <SignInLoader />;
  }

  // ── Central auth proxy flow ───────────────────────────────────────────────
  // GSI is not loaded for proxy tenants, so we keep a regular button that
  // triggers the server-side redirect.
  if (config.tenantSlug && config.authProxyUrl) {
    const handleProxyClick = () => {
      if (disabled) return;
      const returnTo =
        searchParams.get("redirect") ||
        (typeof window !== "undefined" ? window.location.pathname : "/");
      const params = new URLSearchParams({
        tenant: config.tenantSlug,
        return_to: returnTo,
      });
      window.location.href = `${config.authProxyUrl}/central-auth/oauth/google/start?${params.toString()}`;
    };

    return (
      <Button
        fullWidth
        variant="outlined"
        onClick={handleProxyClick}
        disabled={disabled}
        size="small"
        sx={{
          py: 1.25,
          borderColor: "#e2e8f0",
          borderWidth: 1.5,
          color: "#0f172a",
          textTransform: "none",
          backgroundColor: "white",
          fontWeight: 500,
          fontSize: "0.875rem",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc", borderWidth: 1.5 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fillRule="evenodd">
              <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335" />
              <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.78 2.16c1.7-1.57 2.69-3.88 2.69-6.51z" fill="#4285F4" />
              <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05" />
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.76.53-1.78.9-3.18.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853" />
            </g>
          </svg>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.9375rem", color: "#0f172a" }}>
            {t("auth.signInWithGoogle")}
          </Typography>
        </Box>
      </Button>
    );
  }

  // ── Legacy GSI flow ───────────────────────────────────────────────────────
  // The custom-styled button is shown as usual. The GSI-rendered button sits
  // on top of it as a transparent, full-size overlay so every click lands
  // directly on the GSI button — a trusted user gesture — bypassing all
  // popup-blocking and FedCM issues permanently.
  if (!config.googleClientId) return null;

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
      {/* Custom-styled button — purely visual, pointer events pass through */}
      <Button
        fullWidth
        variant="outlined"
        disabled={disabled}
        tabIndex={-1}          // GSI button handles keyboard focus
        aria-hidden="true"     // GSI button is the real interactive element
        sx={{
          py: 1.25,
          borderColor: "#e2e8f0",
          borderWidth: 1.5,
          color: "#0f172a",
          textTransform: "none",
          backgroundColor: "white",
          fontWeight: 500,
          fontSize: "0.875rem",
          pointerEvents: "none", // clicks fall through to GSI overlay
          WebkitTapHighlightColor: "transparent",
          "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc", borderWidth: 1.5 },
          "&.Mui-disabled": { opacity: 0.5, borderColor: "#e2e8f0", backgroundColor: "white" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000" fillRule="evenodd">
              <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335" />
              <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.78 2.16c1.7-1.57 2.69-3.88 2.69-6.51z" fill="#4285F4" />
              <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05" />
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.76.53-1.78.9-3.18.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853" />
            </g>
          </svg>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.9375rem", color: "#0f172a" }}>
            {t("auth.signInWithGoogle")}
          </Typography>
        </Box>
      </Button>

      {/* GSI-rendered button — transparent overlay, full size, receives all clicks */}
      {isMounted && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            overflow: "hidden",
            // Disabled: block pointer events so the underlying MUI button
            // shows the correct disabled cursor/appearance
            pointerEvents: disabled ? "none" : "auto",
            "& > div, & iframe": { width: "100% !important", height: "100% !important" },
          }}
        >
          <div
            ref={googleButtonRef}
            style={{ width: "100%", height: "100%" }}
            suppressHydrationWarning
          />
        </Box>
      )}
    </Box>
  );
};
