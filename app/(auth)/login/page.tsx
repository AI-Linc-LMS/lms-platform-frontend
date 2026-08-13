"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import Cookies from "js-cookie";
import { useAuth } from "@/lib/auth/auth-context";
import { resolvePostLoginPath } from "@/lib/auth/role-utils";
import { useToast } from "@/components/common/Toast";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTextField } from "@/components/auth/fields/AuthTextField";
import {
  AUTH,
  FONT,
  TYPE,
  authLinkSx,
  authPrimaryButtonSx,
  focusRing,
} from "@/components/auth/layout/authTokens";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * What to tell someone whose Google sign-in bounced them back here.
 *
 * The backend classifies the failure (`central_auth/google_errors.py`) rather than sending one
 * generic sentence, because the three causes have three different answers — and the old single
 * message named the auth code, which sent a production investigation chasing redirect URIs when
 * the real cause was a rotated client secret.
 *
 * Kept deliberately vague about the CAUSE for the misconfiguration case: a learner can do nothing
 * with "invalid_client", and the actionable detail belongs in the server log, not on a login page.
 */
const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  google_misconfigured:
    "Google sign-in isn't available right now. Our team has been notified — please sign in with your email and password.",
  google_retry:
    "That Google sign-in link had already been used. Please try signing in with Google again.",
  google_unavailable:
    "We couldn't reach Google just then. Please try again in a moment.",
};

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleAuthError = (() => {
    const code = searchParams.get("auth_error");
    if (!code) return "";
    // An unknown code still deserves a message: a silent bounce back to a blank login page reads
    // as the Google button simply not working.
    return GOOGLE_AUTH_ERRORS[code] ?? "Google sign-in didn't complete. Please try again.";
  })();
  const {
    login,
    isAuthenticated,
    user,
    requiresProfileActivation,
    loading: authLoading,
    celebrate,
    celebrating,
  } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  /**
   * Held from BEFORE the login request, not after it.
   *
   * The redirect effect fires the instant login() flips isAuthenticated — which is earlier than
   * any state the submit handler sets once the await resolves. Setting the hold afterwards is
   * always too late, so this is raised first and released only if the attempt fails.
   */
  const [holdAutoRedirect, setHoldAutoRedirect] = useState(false);
  // Wait for auth bootstrap + loadUser so requiresProfileActivation is correct (avoids racing to dashboard).
  useEffect(() => {
    if (authLoading) return;
    // Held while ANY sign-in is in flight and while its tick plays — including one started by
    // the Google button, which is a child component and could never have set this page's state.
    // Without the hold the effect navigated away the moment login() resolved and the tick never
    // painted at all.
    if (celebrating || holdAutoRedirect || isRedirecting) return;
    if (!isAuthenticated || !user?.role || requiresProfileActivation) return;
    const path = resolvePostLoginPath(user.role, searchParams.get("redirect"));
    router.replace(path);
  }, [
    authLoading,
    isAuthenticated,
    isRedirecting,
    celebrating,
    holdAutoRedirect,
    user?.role,
    requiresProfileActivation,
    router,
    searchParams,
  ]);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    // Raised BEFORE the request, so the redirect effect cannot fire the moment auth flips.
    setHoldAutoRedirect(true);

    try {
      const result = await login(values.email, values.password);
      if (!result.profileActive) {
        setLoading(false);
        setHoldAutoRedirect(false);
        router.replace("/dashboard");
        return;
      }

      // No toast. The tick takes the screen for a beat instead — a corner toast competes with
      // the dashboard already mounting underneath and is usually gone before anyone reads it.
      // The animation now belongs to the auth provider, so this page and the Google button play
      // exactly the same one.
      setIsRedirecting(true);
      await celebrate("signin");

      const role = Cookies.get("user_role") ?? "";
      const target = resolvePostLoginPath(role, searchParams.get("redirect"));
      // SPA navigation, immediately.
      //
      // This used to be `setTimeout(() => { window.location.href = target }, 500)`. That was a
      // SECOND navigation to the same URL: the redirect effect above already fires router.replace the
      // instant login() flips isAuthenticated. Nothing could cancel the timeout (this page had already
      // unmounted), so 500ms later a full document reload tore down the dashboard React had just
      // rendered — the white flash, and the second round of shimmers users reported. Using
      // router.replace keeps navigation guaranteed here while staying idempotent with the effect.
      router.replace(target);
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.loginFailed")), "error");
      setLoading(false);
      setIsRedirecting(false);
      // Released so a second attempt, or an already-authenticated visit, can redirect normally.
      setHoldAutoRedirect(false);
    }
  };

  return (
    <AuthLayout slogan={t("auth.slogan")}>
      <Box sx={{ width: "100%", textAlign: "start" }}>
        <Typography
          component="h1"
          sx={{
            ...TYPE.title,
            fontFamily: FONT,
            color: AUTH.ink,
            mb: 0.75,
            '[dir="rtl"] &': { letterSpacing: "normal" },
          }}
        >
          {t("auth.welcomeBack", { defaultValue: "Welcome back" })}
        </Typography>
        {/* Mobile only: the dark panel shrinks to a logo bar below md, so the promise would
            otherwise disappear entirely on a phone. On desktop the panel already carries it,
            and showing it twice on one screen is just noise. */}
        <Typography
          sx={{
            ...TYPE.body,
            fontFamily: FONT,
            color: AUTH.inkFaint,
            mb: 4,
            display: { xs: "block", md: "none" },
          }}
        >
          {t("auth.supporting", {
            defaultValue:
              "Start from scratch, or from where you left off. Your path adapts as you go.",
          })}
        </Typography>
        <Box sx={{ display: { xs: "none", md: "block" }, mb: 4 }} />

        {googleAuthError && (
          <Box
            role="alert"
            sx={{
              mb: 3,
              p: 1.75,
              borderRadius: 2,
              border: "1px solid rgba(239,68,68,0.35)",
              backgroundColor: "rgba(239,68,68,0.08)",
            }}
          >
            <Typography sx={{ ...TYPE.body, fontFamily: FONT, fontWeight: 600, color: "#b91c1c" }}>
              {googleAuthError}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <GoogleSignIn disabled={loading} />
        </Box>

        {/* Hairline divider. One rule, no boxes. */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: AUTH.hairline }} />
          <Typography
            sx={{
              ...TYPE.eyebrow,
              fontFamily: FONT,
              color: AUTH.inkFaint,
              '[dir="rtl"] &': { letterSpacing: "normal" },
            }}
          >
            {t("auth.orSignInWithEmail")}
          </Typography>
          <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: AUTH.hairline }} />
        </Box>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched }) => (
            <Form noValidate>
              <Field name="email">
                {({ field }: any) => (
                  <AuthTextField
                    {...field}
                    id="email"
                    label={t("auth.email")}
                    type="email"
                    // Passkeys surface inside the browser's own autofill dropdown, so a user
                    // without a credential never hits a dead modal.
                    autoComplete="username webauthn"
                    placeholder="you@example.com"
                    required
                    dir="ltr"
                    error={Boolean(touched.email && errors.email)}
                    helperText={touched.email && errors.email}
                  />
                )}
              </Field>

              <Field name="password">
                {({ field }: any) => (
                  <AuthTextField
                    {...field}
                    id="password"
                    label={t("auth.password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    error={Boolean(touched.password && errors.password)}
                    helperText={touched.password && errors.password}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          // Was nameless on all three instances across the surface, and under
                          // the 44px touch target.
                          aria-label={
                            showPassword
                              ? t("auth.hidePassword", { defaultValue: "Hide password" })
                              : t("auth.showPassword", { defaultValue: "Show password" })
                          }
                          aria-pressed={showPassword}
                          sx={{
                            width: 44,
                            height: 44,
                            color: AUTH.inkFaint,
                            "&:focus-visible": {
                              outline: "none",
                              boxShadow: focusRing(AUTH.surface),
                            },
                          }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                )}
              </Field>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                  mt: 0.5,
                }}
              >
                <FormControlLabel
                  sx={{ mr: 0 }}
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      sx={{
                        color: AUTH.hairline,
                        "&.Mui-checked": { color: AUTH.violet },
                        "&.Mui-focusVisible": { boxShadow: focusRing() },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{ ...TYPE.body, fontFamily: FONT, color: AUTH.inkMuted }}
                    >
                      {t("auth.keepMeLoggedIn")}
                    </Typography>
                  }
                />
                <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                  <Typography component="span" sx={{ ...TYPE.body, ...authLinkSx }}>
                    {t("auth.forgotPasswordLink")}
                  </Typography>
                </Link>
              </Box>

              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                loading={loading}
                // Keeps the verb instead of collapsing to a bare spinner, so nobody has to
                // remember what they clicked.
                loadingText={t("auth.signingIn")}
                sx={authPrimaryButtonSx}
              >
                {t("auth.login")}
              </LoadingButton>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Typography
                  component="span"
                  sx={{ ...TYPE.body, fontFamily: FONT, color: AUTH.inkFaint }}
                >
                  {t("auth.noAccount")}{" "}
                </Typography>
                <Link href="/signup" style={{ textDecoration: "none" }}>
                  <Typography component="span" sx={{ ...TYPE.body, ...authLinkSx }}>
                    {t("auth.signUp")}
                  </Typography>
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </AuthLayout>
  );
}
