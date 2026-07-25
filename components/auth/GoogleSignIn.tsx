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

const GSI_SRC = "https://accounts.google.com/gsi/client";
const NONCE_KEY = "g_nonce";

/** Read the `nonce` claim from a JWT without verifying its signature. */
function readJwtNonce(jwt: string): string | null {
  try {
    const part = jwt.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    return typeof json.nonce === "string" ? json.nonce : null;
  } catch {
    return null;
  }
}

/** Cryptographically-random hex nonce, with a non-crypto fallback. */
function makeNonce(): string {
  try {
    const arr = new Uint8Array(16);
    (window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto).getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  // True only once Google has ACTUALLY injected its rendered button (iframe).
  // Until then the visible button stays the real, clickable redirect fallback
  // - so a blocked/slow/failed GSI script can never leave a dead button.
  const [gsiReady, setGsiReady] = useState(false);

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

  // GSI-INDEPENDENT fallback. A plain top-level redirect to Google's OAuth
  // endpoint (OpenID implicit flow) - no third-party script, no popup, no
  // FedCM - so it works even when accounts.google.com/gsi/client is blocked by
  // ad-blockers / privacy browsers / corporate or regional network filters.
  // Google POSTs the id_token to the SAME /api/auth/google/callback route the
  // GSI redirect-mode button already uses; the backend verifies it identically.
  const handleLegacyRedirect = useCallback(() => {
    if (disabled || !config.googleClientId) return;

    const nonce = makeNonce();
    try {
      sessionStorage.setItem(NONCE_KEY, nonce);
    } catch {
      /* sessionStorage unavailable (private mode) - backend still verifies sig+aud */
    }

    const params = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: "id_token",
      response_mode: "form_post",
      scope: "openid email profile",
      nonce,
      prompt: "select_account",
    });
    // Preserve any ?redirect= deep-link across the round-trip (Google echoes
    // `state` back to the callback, which re-attaches it as ?redirect=).
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) params.set("state", redirectParam);

    setIsRedirecting(true);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, [disabled, searchParams]);

  // Keep the latest callbacks reachable from the load-once effect below without
  // making that effect re-run (which previously tore down the GSI script).
  const handleGoogleSignInRef = useRef(handleGoogleSignIn);
  useEffect(() => {
    handleGoogleSignInRef.current = handleGoogleSignIn;
  }, [handleGoogleSignIn]);

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
  // This fires when the user returns to /login after either the GSI redirect
  // flow OR the implicit-redirect fallback.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cookieName = "google_pending_credential";
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${cookieName}=`));
    if (!match) return;
    const credential = match.split("=").slice(1).join("=");
    document.cookie = `${cookieName}=; Max-Age=0; path=/`;
    if (!credential) return;

    // If this token came from the implicit fallback it carries a nonce bound to
    // this browser session - verify it to defeat token injection/replay. GSI
    // redirect-mode tokens have no nonce claim, so the check is skipped for them.
    let expectedNonce: string | null = null;
    try {
      expectedNonce = sessionStorage.getItem(NONCE_KEY);
      sessionStorage.removeItem(NONCE_KEY);
    } catch {
      /* ignore */
    }
    const tokenNonce = readJwtNonce(credential);
    if (tokenNonce && expectedNonce && tokenNonce !== expectedNonce) {
      showToast(t("auth.googleSignInFailed"), "error");
      return;
    }

    handleGoogleSignIn({ credential });
  }, [handleGoogleSignIn, showToast, t]);

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
  // full-width as the layout shifts (e.g. sidebar open/close). This effect is
  // intentionally decoupled from the script-LOADING effect below: width churn
  // must never touch the <script> tag.
  const renderGsiButton = useCallback(() => {
    if (
      !window.google?.accounts?.id ||
      !googleButtonRef.current ||
      !isInitialized.current
    )
      return;
    const width =
      buttonWidth > 0
        ? buttonWidth
        : Math.floor(containerRef.current?.getBoundingClientRect().width ?? 0) ||
          300;
    try {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        logo_alignment: "left",
        width,
        // Redirect mode: Google POSTs the credential to our API route on the
        // same tab - no popup, no new tab on any device or browser.
        ux_mode: "redirect",
        login_uri: `${window.location.origin}/api/auth/google/callback`,
      });
    } catch {
      // renderButton failed (e.g. origin not in Authorized JS origins) - leave
      // gsiReady false so the visible button keeps working as a redirect.
      return;
    }
    // Only hand clicks to the overlay once GIS truly injected its button. On an
    // origin mismatch / blocked GIS it renders nothing → keep the fallback.
    // Deferred so the flag flips outside any synchronous effect body.
    if (googleButtonRef.current.childElementCount > 0) {
      queueMicrotask(() => setGsiReady(true));
    }
  }, [buttonWidth]);

  const renderGsiButtonRef = useRef(renderGsiButton);
  useEffect(() => {
    renderGsiButtonRef.current = renderGsiButton;
  }, [renderGsiButton]);

  useEffect(() => {
    renderGsiButton();
  }, [renderGsiButton]);

  // Load the GSI client script ONCE and never tear it down. Depending only on
  // `isMounted` (not on width/callbacks) means layout shifts can no longer
  // remove an in-flight <script> or skip re-init - the race that left the
  // overlay permanently empty on slow networks is gone. Idempotent, so React
  // StrictMode's double-invoke is harmless.
  useEffect(() => {
    if (!isMounted) return;

    // Central auth proxy: GSI library is not needed - the proxy handles OAuth
    // server-side. Loading it here would cause "origin not allowed" errors.
    if (config.tenantSlug && config.authProxyUrl) return;
    if (!config.googleClientId) return;
    if (isInitialized.current) return;

    const initGsi = () => {
      if (!window.google?.accounts || !googleButtonRef.current) return;
      if (isInitialized.current) {
        renderGsiButtonRef.current();
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (resp) => handleGoogleSignInRef.current(resp),
          use_fedcm_for_prompt: false,
          error_callback: (error: any) => {
            // These are all non-fatal - the rendered button handles its own
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
        renderGsiButtonRef.current();
      } catch {
        // init failed - visible button stays a working redirect fallback.
      }
    };

    // Reuse an existing tag (StrictMode / remount) instead of duplicating.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`
    );
    if (existing) {
      if (window.google?.accounts) initGsi();
      else existing.addEventListener("load", initGsi, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    script.onerror = () => {
      // Script blocked/failed (ad-blocker, network, region). Do NOT toast - the
      // visible button is already a working redirect fallback (gsiReady stays
      // false), so the user can still sign in.
    };
    document.body.appendChild(script);
    // No cleanup: load once, never remove the script.
  }, [isMounted, showToast, t]);

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
  // The custom-styled button is always a REAL, clickable element while Google's
  // own button is still loading or has failed (gsiReady === false): clicking it
  // runs the GSI-independent redirect fallback. Once GIS has actually rendered
  // its button, that transparent overlay sits on top and takes the clicks
  // (a trusted user gesture that bypasses popup-blocking / FedCM issues), and
  // the visible button reverts to a decorative pass-through.
  if (!config.googleClientId) return null;

  const fallbackActive = !gsiReady;
  const interactive = fallbackActive && !disabled;

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
      {/* Visible button - real click target until the GSI overlay is ready */}
      <Button
        fullWidth
        variant="outlined"
        disabled={disabled}
        onClick={interactive ? handleLegacyRedirect : undefined}
        tabIndex={fallbackActive ? 0 : -1}
        aria-hidden={fallbackActive ? undefined : true}
        aria-busy={interactive ? true : undefined}
        sx={{
          py: 1.25,
          borderColor: "#e2e8f0",
          borderWidth: 1.5,
          color: "#0f172a",
          textTransform: "none",
          backgroundColor: "white",
          fontWeight: 500,
          fontSize: "0.875rem",
          // Receive clicks only when we ARE the click target. When the GSI
          // overlay is live, clicks pass through to it; when disabled, nothing.
          pointerEvents: interactive ? "auto" : "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
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

      {/* GSI-rendered button - transparent overlay. The div must stay mounted so
          GIS has somewhere to render; it only captures clicks once gsiReady so
          it can never trap clicks over the working fallback. */}
      {isMounted && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            overflow: "hidden",
            pointerEvents: !disabled && gsiReady ? "auto" : "none",
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
