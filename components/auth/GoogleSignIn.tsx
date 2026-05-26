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

/**
 * How long after the user clicks the custom Google button to wait before
 * deciding the popup was blocked and surfacing the direct-GSI fallback.
 */
const POPUP_FALLBACK_DELAY_MS = 2500;

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
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  /**
   * When true the GSI-rendered button is shown visibly above the custom button
   * so the user can click it directly — bypassing any popup-blocked restriction
   * caused by our programmatic .click() triggering.
   */
  const [showGsiFallback, setShowGsiFallback] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGoogleSignIn = useCallback(
    async (response: { credential: string }) => {
      // Credential received — cancel any pending popup-fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setShowGsiFallback(false);

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
    if (!isMounted) return;

    // Central auth proxy handles Google sign-in via a server-side redirect, so
    // loading the in-page GSI library here is unnecessary AND actively harmful:
    // the GSI button iframe checks the page origin against the OAuth client's
    // "Authorized JavaScript origins" list, and per-tenant domains aren't
    // (and shouldn't be) on that list.
    if (config.tenantSlug && config.authProxyUrl) {
      return;
    }

    if (!config.googleClientId) {
      return;
    }

    if (isInitialized.current) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleGoogleSignIn,
            // Disable FedCM for the One Tap prompt (the rendered button may
            // still attempt it — we handle failures in error_callback below).
            use_fedcm_for_prompt: false,
            error_callback: (error: any) => {
              /**
               * Non-fatal errors that should be silently ignored:
               *
               * popup_closed_by_user  – user closed the popup themselves
               * fedcm_api_disabled    – FedCM blocked via site settings; GSI
               *                        should fall back to popup automatically
               * unknown_reason        – often a FedCM internal abort
               * browser_not_supported – browser lacks FedCM support (expected)
               * popup_blocked         – browser blocked the popup; our 2.5 s
               *                        timer will surface the visible GSI button
               */
              const silentTypes = new Set([
                "popup_closed_by_user",
                "fedcm_api_disabled",
                "unknown_reason",
                "browser_not_supported",
                "popup_blocked",
              ]);

              if (silentTypes.has(error.type)) {
                // FedCM was aborted/blocked — skip the normal delay and show
                // the clickable GSI fallback button immediately.
                if (
                  error.type === "fedcm_api_disabled" ||
                  error.type === "popup_blocked"
                ) {
                  if (fallbackTimerRef.current) {
                    clearTimeout(fallbackTimerRef.current);
                    fallbackTimerRef.current = null;
                  }
                  setShowGsiFallback(true);
                }
                return;
              }

              showToast(t("auth.googleError"), "error");
            },
          });

          try {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signin_with",
              width: 300,
            });
          } catch {
            // Failed to render Google button
          }

          isInitialized.current = true;
        } catch {
          showToast(t("auth.googleInitFailed"), "error");
        }
      }
    };

    script.onerror = () => {
      showToast(t("auth.googleLoadFailed"), "error");
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript && existingScript.parentNode) {
        try {
          existingScript.remove();
        } catch {
          // Element may have already been removed by React
        }
      }
    };
  }, [isMounted, handleGoogleSignIn, showToast]);

  // When the fallback container mounts, re-render the GSI button inside it
  // so the user can click it directly (a trusted user gesture).
  useEffect(() => {
    if (!showGsiFallback) return;
    if (!window.google?.accounts?.id) return;
    if (!googleButtonRef.current) return;
    if (!isInitialized.current) return;
    try {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 300,
      });
    } catch {
      // ignore
    }
  }, [showGsiFallback]);

  // Clear popup-fallback timer on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  // Conditional return AFTER all hooks
  if (isRedirecting) {
    return <SignInLoader />;
  }

  const handleClick = () => {
    // Central auth proxy path — full-page redirect, no popup needed
    if (config.tenantSlug && config.authProxyUrl) {
      const returnTo =
        searchParams.get("redirect") ||
        (typeof window !== "undefined" ? window.location.pathname : "/");
      const params = new URLSearchParams({
        tenant: config.tenantSlug,
        return_to: returnTo,
      });
      window.location.href = `${config.authProxyUrl}/central-auth/oauth/google/start?${params.toString()}`;
      return;
    }

    // Legacy in-page GSI flow
    if (!config.googleClientId) {
      showToast("Google sign-in is not configured", "error");
      return;
    }

    if (!window.google || !window.google.accounts || !isInitialized.current) {
      showToast(t("auth.googleLoading"), "info");
      return;
    }

    // Reset stale fallback state from any previous attempt
    setShowGsiFallback(false);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    /**
     * Start a timer. If no credential arrives within POPUP_FALLBACK_DELAY_MS
     * the popup was probably blocked — reveal the real GSI-rendered button
     * so the user can click it directly (no programmatic .click(), which
     * browsers treat as untrusted and block as a popup).
     */
    fallbackTimerRef.current = setTimeout(() => {
      setShowGsiFallback(true);
    }, POPUP_FALLBACK_DELAY_MS);

    // Attempt to trigger the hidden GSI button programmatically
    const googleButton = googleButtonRef.current?.querySelector(
      'div[role="button"]'
    ) as HTMLElement | null;
    if (googleButton) {
      googleButton.click();
    } else {
      window.google.accounts.id.prompt();
    }
  };

  const googleLogoSvg = (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="#000" fillRule="evenodd">
        <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335" />
        <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.78 2.16c1.7-1.57 2.69-3.88 2.69-6.51z" fill="#4285F4" />
        <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05" />
        <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.76.53-1.78.9-3.18.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853" />
      </g>
    </svg>
  );

  return (
    <>
      {/*
        GSI-rendered button container.

        Normal state  → positioned off-screen (left: -9999px), invisible.
                        Our custom-styled button is shown instead.

        Fallback state → floated into view below the custom button.
                         The user clicks it directly — a real trusted user
                         gesture — so browsers cannot block the popup.
      */}
      {isMounted && !showGsiFallback && (
        <div
          ref={googleButtonRef}
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            pointerEvents: "none",
          }}
          suppressHydrationWarning
        />
      )}

      {/* Custom-styled Google button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={handleClick}
        disabled={
          disabled ||
          (!config.googleClientId && !(config.tenantSlug && config.authProxyUrl))
        }
        size="small"
        sx={{
          mt: 0,
          mb: 0,
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
          "&:hover": {
            borderColor: "#cbd5e1",
            backgroundColor: "#f8fafc",
            borderWidth: 1.5,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {googleLogoSvg}
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: "0.9375rem", color: "#0f172a" }}
          >
            {t("auth.signInWithGoogle")}
          </Typography>
        </Box>
      </Button>

      {/*
        Fallback: shown only in the legacy GSI flow after POPUP_FALLBACK_DELAY_MS
        with no credential (popup was blocked by the browser).

        The actual GSI-rendered button is moved here and made visible.
        The user clicks it directly — a real user gesture — so the browser
        allows the popup to open. No custom OAuth redirect needed.
      */}
      {isMounted && showGsiFallback && (
        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mb: 1 }}
          >
            {t("auth.googlePopupBlocked", {
              defaultValue: "Popup blocked — click below to sign in:",
            })}
          </Typography>
          {/* GSI button is rendered here; user clicks it directly */}
          <Box
            ref={googleButtonRef}
            sx={{ display: "flex", justifyContent: "center" }}
            suppressHydrationWarning
          />
        </Box>
      )}
    </>
  );
};
