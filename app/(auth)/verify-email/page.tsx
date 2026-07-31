"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Typography, Box } from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import { AuthTextField } from "@/components/auth/fields/AuthTextField";
import {
  AUTH,
  FONT,
  TYPE,
  authLinkSx,
  authPrimaryButtonSx,
  authSecondaryButtonSx,
} from "@/components/auth/layout/authTokens";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import type { FieldInputProps } from "formik";
import { accountsService } from "@/lib/services/accounts.service";
import { useToast } from "@/components/common/Toast";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpDigitInput } from "@/components/auth/OtpDigitInput";
import { verifyEmailSchema } from "@/lib/schemas/auth.schema";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

interface VerifyFormValues {
  email: string;
  otp: string;
}

export default function VerifyEmailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const emailFromQuery = searchParams.get("email") || "";
  const signupAsParam = searchParams.get("signup_as");
  const signupAs: "student" | "instructor" =
    signupAsParam === "instructor" ? "instructor" : "student";

  const initialValues: VerifyFormValues = {
    email: emailFromQuery,
    otp: "",
  };

  const onSubmit = async (values: VerifyFormValues) => {
    setLoading(true);

    try {
      const response = await accountsService.verifyEmail(
        values.email,
        values.otp
      );
      showToast(response.detail || t("auth.verifySuccess"), "success");
      router.push("/login");
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.verifyFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (email: string) => {
    if (!email) {
      showToast(t("auth.emailRequired"), "error");
      return;
    }

    setResending(true);
    try {
      await accountsService.resendVerificationEmail(email);
      showToast("OTP resent to your email", "success");
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.resendFailed")), "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout slogan={t("auth.slogan")}>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title */}
        <Typography
          component="h1"
          sx={{
            ...TYPE.title,
            fontFamily: FONT,
            color: AUTH.ink,
            mb: 1.5,
            '[dir="rtl"] &': { letterSpacing: "normal" },
          }}
        >
          {t("auth.verifyEmail")}
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            ...TYPE.body,
            fontFamily: FONT,
            mb: 4,
            color: AUTH.inkFaint,
          }}
        >
          {t("auth.verifyDescription")}
          {signupAs === "instructor" ? (
            <>
              {" "}
              <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                {t("auth.instructorSignupApprovalNote")}
              </Box>
            </>
          ) : null}
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
                {({ field }: { field: FieldInputProps<string> }) => (
                  <AuthTextField
                    {...field}
                    id="email"
                    label={t("auth.email")}
                    type="email"
                    autoComplete="username"
                    required
                    dir="ltr"
                    error={Boolean(touched.email && errors.email)}
                    helperText={touched.email && errors.email}
                  />
                )}
              </Field>

              <OtpDigitInput name="otp" label={t("auth.otpCode")} />

              {/* Verify Button */}
              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                loading={loading}
                loadingText={t("auth.verifying")}
                sx={{
                  ...authPrimaryButtonSx,
                  mb: 1.5,
                  "&:disabled": {
                    background: AUTH.violet,
                    color: "#ffffff",
                    opacity: 0.45,
                  },
                }}
              >
                {t("auth.verifyEmail")}
              </LoadingButton>

              {/* Resend OTP Button */}
              <LoadingButton
                type="button"
                fullWidth
                variant="outlined"
                onClick={() => handleResend(values.email)}
                loading={resending}
                loadingText={t("common.loading")}
                disabled={resending || !values.email}
                size="small"
                sx={{ ...authSecondaryButtonSx, mb: 3 }}
              >
                {t("auth.resendOtp")}
              </LoadingButton>

              {/* Back to login link */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  component="span"
                  sx={{ ...TYPE.body, fontFamily: FONT, color: AUTH.inkFaint }}
                >
                  {t("auth.alreadyVerified")}{" "}
                </Typography>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <Typography component="span" sx={{ ...TYPE.body, ...authLinkSx }}>
                    {t("auth.login")}
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
