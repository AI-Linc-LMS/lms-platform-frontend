"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SignInLoader } from "@/components/common/SignInLoader";
import {
  TextField,
  Button,
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
  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already signed in, send user to a path allowed for their role (ignore stale ?redirect= for wrong side)
  useEffect(() => {
    if (!isAuthenticated || !user?.role) return;
    const path = resolvePostLoginPath(user.role, searchParams.get("redirect"));
    router.replace(path);
  }, [isAuthenticated, user?.role, router, searchParams]);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      await login(values.email, values.password);
      showToast(t("auth.loginSuccess"), "success");
      setIsRedirecting(true);

      const role = Cookies.get("user_role") ?? "";
      const target = resolvePostLoginPath(role, searchParams.get("redirect"));

      setTimeout(() => {
        window.location.href = target;
      }, 500);
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.loginFailed")), "error");
      setLoading(false);
      setIsRedirecting(false);
    }
  };

  // Conditional return AFTER all hooks
  if (isRedirecting) {
    return <SignInLoader />;
  }

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
                        color: "#1e293b",
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.25,
                  mb: 2,
                  background:
                    "linear-gradient(135deg, #2a8cb0 0%,#1e4a63 100%)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)",
                    boxShadow: "0 4px 12px rgba(37, 92, 121, 0.4)",
                  },
                  "&:disabled": {
                    background:
                      "linear-gradient(135deg, #2a8cb0 0%,#1e4a63 100%)",
                    opacity: 0.6,
                  },
                }}
              >
                {loading ? t("auth.signingIn") : t("auth.login")}
              </Button>

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
