"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SignInLoader } from "@/components/common/SignInLoader";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  TextField,
  Typography,
  Box,
  Divider,
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
import { loginSchema } from "@/lib/schemas/auth.schema";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          textAlign: "start",
        }}
      >
        {/* Logo */}

        {/* Title */}
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 3,
            fontWeight: 700,
            color: "text.primary",
            fontSize: { xs: "1.75rem", sm: "2rem" },
          }}
        >
          {t("auth.login")}
        </Typography>

        {/* Google Sign In Button */}
        <Box sx={{ mb: 2.5 }}>
          <GoogleSignIn disabled={loading} />
        </Box>

        {/* Divider */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography
            variant="body2"
            sx={{ px: 2, color: "text.secondary", fontSize: "0.875rem" }}
          >
            {t("auth.orSignInWithEmail")}
          </Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <Field name="email">
                {({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    id="email"
                    label={t("auth.email")}
                    placeholder={t("auth.email")}
                    autoComplete="username"
                    size="small"
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                    sx={{
                      mb: 1.5,
                      "& .MuiFormHelperText-root": {
                        marginTop: 0.5,
                        fontSize: "0.75rem",
                      },
                    }}
                  />
                )}
              </Field>

              <Field name="password">
                {({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label={t("auth.password")}
                    placeholder={t("auth.password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    size="small"
                    error={touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                    sx={{
                      mb: 1.5,
                      "& .MuiFormHelperText-root": {
                        marginTop: 0.5,
                        fontSize: "0.75rem",
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: "text.secondary" }}
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              </Field>

              {/* Remember me and Forgot password */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      sx={{
                        color: "primary.main",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        color: "var(--font-primary)",
                        fontWeight: 400,
                      }}
                    >
                      {t("auth.keepMeLoggedIn")}
                    </Typography>
                  }
                />
                <Link
                  href="/forgot-password"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      color: "primary.main",
                      fontSize: "0.875rem",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {t("auth.forgotPasswordLink")}
                  </Typography>
                </Link>
              </Box>

              {/* Login Button */}
              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                loading={loading}
                loadingText={t("auth.signingIn")}
                sx={{
                  py: 1.25,
                  mb: 2,
                  background:
                    "linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)",
                  color: "var(--font-light)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)",
                    boxShadow:
                      "0 4px 12px color-mix(in srgb, var(--primary-500) 40%, transparent)",
                  },
                  "&:disabled": {
                    background:
                      "linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)",
                    opacity: 0.6,
                  },
                }}
              >
                {t("auth.login")}
              </LoadingButton>

              {/* Sign up link */}
              <Box sx={{ textAlign: "center", mt: 1 }}>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ color: "text.secondary", fontSize: "0.875rem" }}
                >
                  {t("auth.noAccount")}{" "}
                </Typography>
                <Link
                  href="/signup"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
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
