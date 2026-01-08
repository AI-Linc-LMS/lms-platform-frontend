"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField, Button, Typography, Box } from "@mui/material";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import { accountsService } from "@/lib/services/accounts.service";
import { useToast } from "@/components/common/Toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { verifyEmailSchema } from "@/lib/schemas/auth.schema";

interface VerifyFormValues {
  email: string;
  otp: string;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const emailFromQuery = searchParams.get("email") || "";

  const initialValues: VerifyFormValues = {
    email: emailFromQuery,
    otp: "",
  };

  const onSubmit = async (values: VerifyFormValues) => {
    setLoading(true);

    try {
      await accountsService.verifyEmail(values.email, values.otp);
      showToast("Email verified successfully!", "success");
      router.push("/login");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Verification failed. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (email: string) => {
    if (!email) {
      showToast("Email is required", "error");
      return;
    }

    setResending(true);
    try {
      await accountsService.resendVerificationEmail(email);
      showToast("OTP resent to your email", "success");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to resend OTP";
      showToast(errorMessage, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout slogan="Changing the  way  the  world  learns">
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
          Verify Email
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
          Enter the 6-digit OTP code sent to your email address to verify your
          account.
        </Typography>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={verifyEmailSchema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {({ values, errors, touched }) => (
            <Form>
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

              <Field name="otp">
                {({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    id="otp"
                    label="OTP Code"
                    placeholder="Enter 6-digit OTP"
                    size="small"
                    error={touched.otp && !!errors.otp}
                    helperText={touched.otp && errors.otp}
                    sx={{
                      mb: 2,
                      "& .MuiFormHelperText-root": {
                        marginTop: 0.5,
                        fontSize: "0.75rem",
                      },
                    }}
                    inputProps={{
                      maxLength: 6,
                    }}
                  />
                )}
              </Field>

              {/* Verify Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.25,
                  mb: 1.5,
                  background:
                    "linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)",
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
                      "linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)",
                    opacity: 0.6,
                  },
                }}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>

              {/* Resend OTP Button */}
              <Button
                type="button"
                fullWidth
                variant="outlined"
                onClick={() => handleResend(values.email)}
                disabled={resending || !values.email}
                size="small"
                sx={{
                  py: 1.25,
                  mb: 2,
                  borderColor: "#e2e8f0",
                  borderWidth: 1.5,
                  color: "text.primary",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                    backgroundColor: "#f8fafc",
                    borderWidth: 1.5,
                  },
                  "&:disabled": {
                    borderColor: "#e2e8f0",
                    opacity: 0.5,
                  },
                }}
              >
                {resending ? "Resending..." : "Resend OTP"}
              </Button>

              {/* Back to login link */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ color: "text.secondary" }}
                >
                  Already verified?{" "}
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
                      fontSize: "0.875rem",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Login
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
