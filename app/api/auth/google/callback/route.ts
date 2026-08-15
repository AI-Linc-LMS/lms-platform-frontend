import { NextRequest, NextResponse } from "next/server";

/**
 * Google Sign-In redirect-mode callback.
 *
 * When `ux_mode: 'redirect'` is set on the GSI rendered button, Google POSTs
 * the credential (ID token) here instead of delivering it via postMessage to
 * a popup. This keeps sign-in on the same tab - no popup, no new tab.
 *
 * Flow:
 *   1. User clicks the GSI button (or the GSI-independent redirect fallback) → Google
 *      redirects here with a POST body containing `credential` and `g_csrf_token`.
 *   2. We stash the credential in a short-lived cookie and redirect back to the page
 *      the user started from.
 *   3. The GoogleSignIn component reads the cookie on mount, calls
 *      `handleGoogleSignIn(credential)`, then clears the cookie.
 */

/**
 * Seconds the credential cookie survives.
 *
 * 60s was too tight for exactly the population that depends on this route: the redirect
 * fallback exists for blocked or filtered networks, which correlate with slow mobile ones,
 * and a return trip that takes longer than a minute finds nothing left to consume and dies
 * without a word. Three minutes covers a slow round trip plus a briefly backgrounded tab.
 *
 * It is not longer than that because this is a bearer credential in a cookie that JS on this
 * origin can read: the window is precisely how long any script on the page could lift it, so
 * it is measured in the time one redirect takes and not in the token's own lifetime.
 */
const CREDENTIAL_COOKIE_MAX_AGE = 180;

/** Kept in one place because the delete has to name it exactly as the write did. */
const PENDING_COOKIE = "google_pending_credential";

/**
 * The only pages that mount <GoogleSignIn/>, and therefore the only places a credential
 * cookie can actually be consumed.
 *
 * `state` is echoed back by Google verbatim and the outbound URL is craftable by anyone, so
 * the return destination is checked against this list rather than trusted. Dropping a bearer
 * credential on an arbitrary page would strand the learner there with a live token and no
 * code to read it, which is a worse failure than sending her to /login.
 */
const RETURN_PATHS = new Set(["/login", "/signup"]);

/**
 * Same-origin relative path, the same test this route has always applied to `state`.
 * "//evil.com" and "/\evil.com" are both parsed as protocol-relative, so both are rejected.
 */
function isSafeRelativePath(value: string | null): value is string {
  if (!value || !value.startsWith("/")) return false;
  return !value.startsWith("//") && !value.startsWith("/\\");
}

/**
 * Trailing slash and letter case do not make a different page: /login/ and /LOGIN are the same
 * route as /login. Comparing the raw pathname against the allowlist missed both, which dropped
 * the learner into the legacy branch below and bounced her through /login?redirect=%2Flogin%2F
 * to arrive where she already was. A visible extra hop, for a difference that is not one.
 */
function normalizeReturnPath(pathname: string): string {
  const lower = pathname.toLowerCase();
  return lower.length > 1 ? lower.replace(/\/+$/, "") || "/" : lower;
}

/**
 * Where to send the user once Google is done with her.
 *
 * `state` now carries the ORIGINATING path and its ?redirect= deep link, because hard-coding
 * /login here silently turned "Sign up with Google" on /signup into a bounce to the login
 * page: a learner asking to create an account was answered with a form asking her to log in.
 *
 * Nothing in `state` is trusted. The path must be one of ours and one that can consume the
 * credential; the deep link keeps the relative-path test it already had. Anything else falls
 * back to /login rather than being honoured.
 */
function resolveReturnUrl(state: string | null, req: NextRequest): URL {
  const fallback = new URL("/login", req.url);
  if (!isSafeRelativePath(state)) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(state, req.url);
  } catch {
    return fallback;
  }
  if (parsed.origin !== fallback.origin) return fallback;

  const pathname = normalizeReturnPath(parsed.pathname);
  if (!RETURN_PATHS.has(pathname)) {
    // The older shape: before this route round-tripped the originating page, `state` WAS the
    // ?redirect= deep link. A tab that left for Google on the previous build comes back to
    // this one, so keep honouring it instead of dropping that learner's destination.
    fallback.searchParams.set("redirect", state);
    return fallback;
  }

  const dest = new URL(pathname, req.url);
  const redirect = parsed.searchParams.get("redirect");
  if (isSafeRelativePath(redirect)) dest.searchParams.set("redirect", redirect);
  return dest;
}

export async function POST(req: NextRequest) {
  let credential: string | null = null;
  // GSI redirect-mode posts the ID token as `credential`; the OpenID implicit
  // fallback (response_type=id_token) posts it as `id_token`. Accept either.
  let state: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    credential = params.get("credential") ?? params.get("id_token");
    state = params.get("state");
  } else {
    // Fallback: try form-data
    try {
      const form = await req.formData();
      credential =
        (form.get("credential") as string | null) ??
        (form.get("id_token") as string | null);
      state = form.get("state") as string | null;
    } catch {
      credential = null;
    }
  }

  const returnUrl = resolveReturnUrl(state, req);

  if (!credential) {
    // A named code, not a bare "1". Three unrelated failures used to reach the learner as one
    // sentence, so a screenshot could never say which one she hit; the component turns each
    // code into its own sentence.
    returnUrl.searchParams.set("google_error", "no_credential");
    const failed = NextResponse.redirect(returnUrl, { status: 302 });
    // The only exit that KNOWS the round trip produced nothing, and therefore the only place
    // that can clear up after a GSI redirect-mode attempt: that button is Google's own and
    // never runs our click handler, so nothing on the client clears the cookie before it
    // leaves. Anything still sitting here belongs to an earlier attempt and can now only ever
    // fail its nonce check on the page we are about to send her to. Same name, host-only,
    // path "/" as the write below, because a delete that disagrees on either is a no-op.
    failed.cookies.set(PENDING_COOKIE, "", { maxAge: 0, path: "/" });
    return failed;
  }

  returnUrl.searchParams.set("google_return", "1");
  const response = NextResponse.redirect(returnUrl, { status: 302 });

  // Short-lived client-readable cookie - the page consumes and deletes it immediately on
  // mount. Not HttpOnly so JS can read it. Host-only with path "/" because that is the exact
  // pair the component's deletion has to match: a cookie is identified by name+domain+path,
  // and a delete that disagrees on either leaves the original in place.
  response.cookies.set(PENDING_COOKIE, credential, {
    httpOnly: false,
    maxAge: CREDENTIAL_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
