"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { TextField, Button, Typography, Box } from "@mui/material";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import { accountsService } from "@/lib/services/accounts.service";
import { useToast } from "@/components/common/Toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const initialValues: ForgotPasswordFormValues = {
    email: "",
  };

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);

    try {
      await accountsService.forgotPassword(values.email);
      setEmailSent(true);
      showToast("Password reset link sent to your email", "success");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || t("auth.resetLinkFailed");
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
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
        }}
      >
        {/* Title */}
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: "text.primary",
            fontSize: { xs: "1.75rem", sm: "2rem" },
          }}
        >
          {t("auth.resetPassword")}
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: "text.secondary",
            fontSize: "0.875rem",
            lineHeight: 1.5,
          }}
        >
          Enter your email address and we'll send you a link to reset your
          password.
        </Typography>

        {/* Form */}
        {!emailSent ? (
          <Formik
            initialValues={initialValues}
            validationSchema={forgotPasswordSchema}
            onSubmit={onSubmit}
          >
            {({ errors, touched }) => (
              <Form>
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      color: "#1e293b",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                  >
                    {t("auth.email")}
                  </Typography>
                  <Field name="email">
                    {({ field }: any) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        id="email"
                        label="Email"
                        placeholder="Email"
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
                </Box>

                {/* Send reset link Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.25,
                    mb: 2,
                    background:
                      "linear-gradient(135deg, #2a8cb0 0%,#1e4a6 100%)",
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
                        "linear-gradient(135deg, #2a8cb0 0%,#1e4a6 100%)",
                      opacity: 0.6,
                    },
                  }}
                >
                  {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </Button>
              </Form>
            )}
          </Formik>
        ) : (
          <Box
            sx={{
              p: 2.5,
              mb: 2,
              borderRadius: 2,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#166534",
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            >
              {t("auth.emailSentMessage")}
            </Typography>
          </Box>
        )}

        {/* Back to login link */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="body2"
            component="span"
            sx={{ color: "text.secondary" }}
          >
            Remember your password?{" "}
          </Typography>
          <Link
            href="/login"
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
              {t("auth.backToLogin")}
            </Typography>
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}
