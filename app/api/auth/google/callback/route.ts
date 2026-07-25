import { NextRequest, NextResponse } from "next/server";

/**
 * Google Sign-In redirect-mode callback.
 *
 * When `ux_mode: 'redirect'` is set on the GSI rendered button, Google POSTs
 * the credential (ID token) here instead of delivering it via postMessage to
 * a popup. This keeps sign-in on the same tab - no popup, no new tab.
 *
 * Flow:
 *   1. User clicks the GSI button → Google redirects here with a POST body
 *      containing `credential` and `g_csrf_token`.
 *   2. We stash the credential in a short-lived cookie and redirect back to
 *      the login page.
 *   3. The GoogleSignIn component reads the cookie on mount, calls
 *      `handleGoogleSignIn(credential)`, then clears the cookie.
 */
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

  // Determine where to send the user after sign-in completes.
  // Preserve any ?redirect= param that was on the login page originally - it is
  // round-tripped through Google's `state` by the implicit fallback. Only honour
  // safe same-origin relative paths to avoid an open-redirect.
  const loginUrl = new URL("/login", req.url);
  if (state && state.startsWith("/") && !state.startsWith("//")) {
    loginUrl.searchParams.set("redirect", state);
  }

  if (!credential) {
    loginUrl.searchParams.set("google_error", "1");
    return NextResponse.redirect(loginUrl, { status: 302 });
  }

  loginUrl.searchParams.set("google_return", "1");
  const response = NextResponse.redirect(loginUrl, { status: 302 });

  // Short-lived client-readable cookie (60 s) - the login page consumes and
  // deletes it immediately on mount. Not HttpOnly so JS can read it.
  response.cookies.set("google_pending_credential", credential, {
    httpOnly: false,
    maxAge: 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
