"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Box, Typography } from "@mui/material";
import Cookies from "js-cookie";
import { resolvePostLoginPath } from "@/lib/auth/role-utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { SignInLoader } from "@/components/common/SignInLoader";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import {
  AUTH,
  FONT,
  RADIUS,
  TYPE,
  hairlineRing,
} from "@/components/auth/layout/authTokens";

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
const PENDING_COOKIE = "google_pending_credential";

/**
 * Delete the credential cookie left by /api/auth/google/callback.
 *
 * The route sets it host-only with path "/" and no Domain, so a host-only `path=/` expiry is
 * what removes it: a cookie is identified by name+domain+path, and a delete that disagrees on
 * either attribute leaves the original sitting there, ready to be consumed against a nonce it
 * can never match.
 */
function clearPendingCredential() {
  if (typeof document === "undefined") return;
  document.cookie = `${PENDING_COOKIE}=; Max-Age=0; path=/`;
}

/**
 * What to tell someone whose Google round-trip came back broken.
 *
 * Three unrelated failures used to arrive as the same sentence, "Google sign-in failed.
 * Please try again.": no credential in the callback, a credential from a previous attempt,
 * and a rejection from our own backend. A learner's screenshot therefore told us nothing
 * about which one she hit, and one of the three repeats for as long as she does what that
 * sentence asks. Same shape as GOOGLE_AUTH_ERRORS on the login page: a code from the server,
 * a sentence for the learner, never a code on screen.
 */
const RETURN_ERROR_KEYS: Record<string, string> = {
  no_credential: "auth.googleNoCredential",
  stale_credential: "auth.googleAttemptExpired",
  credential_lost: "auth.googleCredentialLost",
};

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
  /**
   * Overrides the button copy. Signup passes "Sign up with Google": the shared default
   * read "Sign in with Google" directly above a divider reading "Or sign up with email".
   */
  label?: string;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  disabled = false,
  label,
}) => {
  const { t } = useTranslation("common");
  const { googleLogin, celebrate } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const isInitialized = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  /**
   * Leaving this page FOR Google — a genuine loading state, worth a spinner.
   *
   * This used to also mean "signed in successfully", and one flag covering both is why the
   * success case rendered a grey spinner: the two states want opposite treatments, and the
   * spinner won.
   */
  const [leavingForGoogle, setLeavingForGoogle] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(300);
  /**
   * A failure from the round trip, shown inline above the button rather than as a toast.
   *
   * This message arrives while the page is still mounting, before she has touched anything
   * here, and it is about the button directly below it - a snackbar that appears and expires
   * on its own during a page load is the kind people never see, and the whole point of these
   * sentences is that the next person can screenshot one.
   */
  const [returnError, setReturnError] = useState<string | null>(null);
  // True only once Google has ACTUALLY injected its rendered button (iframe).
  // Until then the visible button stays the real, clickable redirect fallback
  // - so a blocked/slow/failed GSI script can never leave a dead button.
  const [gsiReady, setGsiReady] = useState(false);

  // Read the query string lazily instead of useSearchParams(): the hook forces a
  // client-side-rendering bailout during static prerender, which stripped the
  // whole login/signup form out of the prerendered document. Every use below
  // happens in a handler or effect, which only ever run in the browser.
  const getSearchParam = (key: string): string | null =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get(key);

  // An unrecognised code still deserves a sentence: a silent bounce back to a blank sign-in
  // page reads as the Google button simply not working.
  const showReturnError = useCallback(
    (code: string) => {
      const key = RETURN_ERROR_KEYS[code];
      setReturnError(key ? t(key) : t("auth.googleSignInFailed"));
    },
    [t]
  );

  const handleGoogleSignIn = useCallback(
    async (response: { credential: string }) => {
      try {
        const result = await googleLogin(response.credential);
        if (!result.profileActive) {
          setLeavingForGoogle(false);
          router.replace("/dashboard");
          return;
        }

        // The success tick, not a toast — and the SAME tick the password form plays. This path
        // showed a green "Login successful!" snackbar while the password path had long since
        // moved to the animation, because the tick used to be local state on the login page and
        // this is a child component that cannot reach it.
        // Prefetch the destination DURING the tick instead of after it, so the
        // replace() below paints from a warm router cache.
        const role = Cookies.get("user_role") ?? "";
        const redirectUrl = resolvePostLoginPath(
          role,
          getSearchParam("redirect")
        );
        router.prefetch(redirectUrl);
        await celebrate("signin");
        // SPA navigation, immediately — same fix as the password login path: this was a 500ms
        // setTimeout doing a full document reload, which tore down the freshly-rendered destination
        // (white flash + a second round of shimmers) on top of the router.replace the login page's
        // redirect effect already fires.
        router.replace(redirectUrl);
      } catch (error: unknown) {
        // The third of the three failures, and the only one that happens AFTER Google is
        // satisfied. Server detail still wins when there is any; the fallback sentence now
        // says which side refused rather than blaming Google for our own rejection.
        //
        // Split on whether the request landed at all, because getAxiosErrorDetail returns its
        // fallback for BOTH a rejection and a request that never got a response: offline, DNS,
        // CORS, an extension or a network filter blocking the API host. Telling someone we
        // refused her when we never heard from her is the same defect this diff is about, one
        // layer down - it sends the next investigation to a backend log with no entry in it,
        // and it is the likeliest reading of a generic failure on a filtered network, which is
        // exactly the population this fallback serves.
        const reachedServer = Boolean(
          (error as { response?: unknown } | null)?.response
        );
        // Inline, like the other two: this one also arrives on mount when it comes from the
        // cookie-consume path, and a snackbar that expires on its own during a page load is
        // the kind nobody sees or screenshots.
        setReturnError(
          getAxiosErrorDetail(
            error,
            reachedServer ? t("auth.googleRejected") : t("auth.googleUnreachable")
          )
        );
        setLeavingForGoogle(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [googleLogin, celebrate, router, t]
  );

  // GSI-INDEPENDENT fallback. A plain top-level redirect to Google's OAuth
  // endpoint (OpenID implicit flow) - no third-party script, no popup, no
  // FedCM - so it works even when accounts.google.com/gsi/client is blocked by
  // ad-blockers / privacy browsers / corporate or regional network filters.
  // Google POSTs the id_token to the SAME /api/auth/google/callback route the
  // GSI redirect-mode button already uses; the backend verifies it identically.
  const handleLegacyRedirect = useCallback(() => {
    if (disabled || !config.googleClientId) return;

    // Kill any credential a previous attempt left behind BEFORE minting a new nonce.
    //
    // This is the loop. A surviving cookie can only ever be measured against the nonce written
    // below, which is not the nonce it was issued for, so every retry inside the cookie window
    // reproduced the same "sign-in failed" - the failure looked persistent when it was one
    // stale token being re-read. Exactly one credential is now in flight at a time.
    clearPendingCredential();

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
    // Carry the page she started on, plus any ?redirect= deep link, across the round trip.
    // Google echoes `state` back to the callback verbatim, which validates it and returns her
    // there. It used to carry the deep link alone, so the callback had nothing to go on and
    // hard-coded /login: someone who pressed "Sign up with Google" on /signup was answered
    // with a login form. One mechanism, two fields, still one string.
    const returnTo = new URL(window.location.pathname, window.location.origin);
    const redirectParam = getSearchParam("redirect");
    if (redirectParam) returnTo.searchParams.set("redirect", redirectParam);
    params.set("state", `${returnTo.pathname}${returnTo.search}`);

    setReturnError(null);
    setLeavingForGoogle(true);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Keep the latest callbacks reachable from the load-once effect below without
  // making that effect re-run (which previously tore down the GSI script).
  const handleGoogleSignInRef = useRef(handleGoogleSignIn);
  useEffect(() => {
    handleGoogleSignInRef.current = handleGoogleSignIn;
  }, [handleGoogleSignIn]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Google's redirect came back without a credential at all: cancelled at the account
  // chooser, or interrupted before Google ever issued a token. Nothing reached our backend,
  // which is why this one has to be named on the page rather than looked for in a log.
  useEffect(() => {
    const code = getSearchParam("google_error");
    if (!code) return;
    showReturnError(code);
    const url = new URL(window.location.href);
    url.searchParams.delete("google_error");
    window.history.replaceState(null, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReturnError]);

  /**
   * Exactly one consume per mount.
   *
   * The cookie is deleted the instant it is read, so a second run of the effect below - a
   * changed dependency, StrictMode's double invoke, anything - finds nothing left. Without
   * this guard that second run would report a credential as never arriving when it had in
   * fact just been used, which is a false alarm painted over a successful sign-in.
   */
  const returnHandledRef = useRef(false);

  // Consume a credential left by the /api/auth/google/callback redirect route.
  // This fires when the user returns to /login or /signup after either the GSI
  // redirect flow OR the implicit-redirect fallback.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (returnHandledRef.current) return;
    returnHandledRef.current = true;

    // The route sets this alongside the cookie, so it means "a credential is on its way".
    // Nothing used to read it, which left the widest failure of the whole flow completely
    // silent: cookie expired, blocked by a cookie-restricting browser, or stripped by the same
    // corporate filter that blocked Google's script, and she lands back on an ordinary sign-in
    // page with no idea a round trip just happened. That is the exact dead end this diff
    // exists to remove, for the population the fallback exists to serve.
    const expectingCredential = getSearchParam("google_return") === "1";
    if (expectingCredential) {
      // Off the URL either way, so a reload or a Back cannot replay this reading of it.
      const url = new URL(window.location.href);
      url.searchParams.delete("google_return");
      window.history.replaceState(null, "", url.toString());
    }

    // The LAST match, not the first. document.cookie is ordered by path length and then by
    // creation time, so find() hands back the oldest of any same-path duplicates: the one
    // guaranteed to be stale. Duplicates should be impossible - the callback always writes the
    // same name, host-only, path "/", which overwrites - but the previous version of this
    // failure was also something that should have been impossible.
    const matches = document.cookie
      .split("; ")
      .filter((c) => c.startsWith(`${PENDING_COOKIE}=`));
    if (matches.length === 0) {
      if (expectingCredential) showReturnError("credential_lost");
      return;
    }
    const credential = matches[matches.length - 1].slice(PENDING_COOKIE.length + 1);
    clearPendingCredential();
    if (!credential) {
      if (expectingCredential) showReturnError("credential_lost");
      return;
    }

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
      // This credential belongs to an EARLIER attempt: a newer attempt rewrote the nonce, so
      // the older token can now only ever fail. The learner did nothing wrong, and the old
      // "please try again" was a dead end because every retry inside the cookie window met the
      // same surviving cookie and reproduced the same failure.
      //
      // The recovery is the two lines above plus the clear before every new attempt: the stale
      // token is gone by the time this message is painted, so the button underneath it now
      // works on the first press. Deliberately NOT an automatic bounce back to Google: it
      // costs her the same one press, and re-driving the browser to an identity provider
      // without being asked is the wrong reflex for the one case where a mismatch is not
      // staleness but a token this session never requested. One recovery, then a sentence
      // that says what expired.
      showReturnError("stale_credential");
      return;
    }

    handleGoogleSignIn({ credential });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGoogleSignIn, showReturnError]);

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

  // Only for the trip OUT to Google. On the way back in, the provider's success tick owns the
  // screen — and this spinner sits at zIndex 9999 against the tick's 2000, so leaving it wired to
  // the success case would have hidden the animation completely.
  if (leavingForGoogle) {
    return <SignInLoader />;
  }

  /**
   * The round-trip failure message, shared by EVERY branch that renders a button below.
   *
   * All four effects above run before any of those branches return, so the state is set no
   * matter which one renders. When this lived inline in the legacy-GSI branch alone, a
   * provisioned tenant - which takes the proxy branch, because provisioning always sets
   * NEXT_PUBLIC_TENANT_SLUG - computed the sentence and then threw it away. That is worse
   * than the toast it replaced, which at least rendered from anywhere.
   *
   * The live region is mounted BEFORE it has anything to say, and stays mounted after: screen
   * readers announce changes made INSIDE an existing live region and generally say nothing
   * about a region that appears already holding its text. This text is always set from an
   * effect, so it would always have arrived that way.
   */
  const returnErrorBanner = (
    <Box role="alert">
      {returnError && (
        <Box
          sx={{
            mb: 1.5,
            px: 1.5,
            py: 1.25,
            borderRadius: `${RADIUS}px`,
            backgroundColor: AUTH.errorSoft,
            boxShadow: hairlineRing(AUTH.error),
          }}
        >
          <Typography
            sx={{ ...TYPE.body, fontSize: 13, fontFamily: FONT, color: AUTH.error }}
          >
            {returnError}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // ── Central auth proxy flow ───────────────────────────────────────────────
  // GSI is not loaded for proxy tenants, so we keep a regular button that
  // triggers the server-side redirect.
  if (config.tenantSlug && config.authProxyUrl) {
    const handleProxyClick = () => {
      if (disabled) return;
      const returnTo =
        getSearchParam("redirect") ||
        (typeof window !== "undefined" ? window.location.pathname : "/");
      const params = new URLSearchParams({
        tenant: config.tenantSlug,
        return_to: returnTo,
      });
      window.location.href = `${config.authProxyUrl}/central-auth/oauth/google/start?${params.toString()}`;
    };

    return (
      <>
        {returnErrorBanner}
        <Button
          fullWidth
          variant="outlined"
          onClick={handleProxyClick}
          disabled={disabled}
          size="small"
          sx={{
            py: 1.25,
            minHeight: 44,
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 0 0 1px #e6e8ef",
            color: "#0f172a",
            textTransform: "none",
            backgroundColor: "#ffffff",
            fontWeight: 500,
            fontSize: "0.875rem",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            "&:hover": { border: "none", boxShadow: "0 0 0 1px #d5d8e3", backgroundColor: "#ffffff" },
            "&:focus-visible": { outline: "none", boxShadow: "0 0 0 2px #fbfbfd, 0 0 0 4px #7c3aed" },
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
              {label ?? t("auth.signInWithGoogle")}
            </Typography>
          </Box>
        </Button>
      </>
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
    <>
      {/* Deliberately OUTSIDE the positioned container below: that container is the GSI
          overlay's offset parent, and anything added inside it would stretch the overlay's
          `inset: 0` over this message instead of over the button. */}
      {returnErrorBanner}

      <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
        {/* Visible button - real click target until the GSI overlay is ready */}
        <Button
          fullWidth
          variant="outlined"
          disabled={disabled}
          onClick={interactive ? handleLegacyRedirect : undefined}
          tabIndex={fallbackActive ? 0 : -1}
          aria-hidden={fallbackActive ? undefined : true}
          // No aria-busy. It used to be set precisely when this button IS the live click
          // target, which is backwards: it announced "still loading" to a screen reader on the
          // one button that works, and for a blocked GSI script it said so permanently. That
          // is the same population this fallback exists for.
          sx={{
            py: 1.25,
            minHeight: 44,
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 0 0 1px #e6e8ef",
            color: "#0f172a",
            textTransform: "none",
            backgroundColor: "#ffffff",
            fontWeight: 500,
            fontSize: "0.875rem",
            // Receive clicks only when we ARE the click target. When the GSI
            // overlay is live, clicks pass through to it; when disabled, nothing.
            pointerEvents: interactive ? "auto" : "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            "&:hover": { border: "none", boxShadow: "0 0 0 1px #d5d8e3", backgroundColor: "#ffffff" },
            "&:focus-visible": { outline: "none", boxShadow: "0 0 0 2px #fbfbfd, 0 0 0 4px #7c3aed" },
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
              {label ?? t("auth.signInWithGoogle")}
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
    </>
  );
};
