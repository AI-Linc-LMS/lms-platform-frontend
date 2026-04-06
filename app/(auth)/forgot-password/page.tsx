"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import type { FieldInputProps } from "formik";
import { accountsService } from "@/lib/services/accounts.service";
import {
  forgotPasswordSchema,
  forgotPasswordVerifyOtpSchema,
  resetPasswordNewOnlySchema,
} from "@/lib/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpDigitInput } from "@/components/auth/OtpDigitInput";
import { useToast } from "@/components/common/Toast";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

const primaryBtnSx = {
  py: 1.25,
  background:
    "linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)",
  color: "white",
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
} as const;

const resendBtnSx = {
  py: 1.25,
  mb: 0.5,
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
  "&:disabled": { borderColor: "#e2e8f0", opacity: 0.5 },
} as const;

const fieldSx = (mb: number) => ({
  mb,
  "& .MuiFormHelperText-root": { marginTop: 0.5, fontSize: "0.75rem" },
});

const STEP_KEYS = [
  { title: "auth.resetPassword", badge: "auth.resetPasswordStep1Badge" },
  { title: "auth.resetPasswordStep2Title", badge: "auth.resetPasswordStep2Badge" },
  { title: "auth.resetPasswordStep3Title", badge: "auth.resetPasswordStep3Badge" },
] as const;

const textBtnSx = { textTransform: "none" as const };

export default function ForgotPasswordPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpGen, setOtpGen] = useState(0);
  const [pwdGen, setPwdGen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const goStep1 = () => {
    setStep(1);
    setResetEmail("");
    setResetToken("");
  };

  const backToOtp = () => {
    setResetToken("");
    setStep(2);
    setOtpGen((g) => g + 1);
  };

  const onEmail = async (values: { email: string }) => {
    setLoading(true);
    try {
      await accountsService.forgotPassword(values.email);
      setResetEmail(values.email);
      setResetToken("");
      setStep(2);
      showToast(t("auth.resetCodeSent"), "success");
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.resetRequestFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const onOtp = async (values: { otp: string }) => {
    setLoading(true);
    try {
      const { reset_token } = await accountsService.verifyPasswordResetOtp({
        email: resetEmail,
        otp: values.otp,
      });
      setResetToken(reset_token);
      setPwdGen((g) => g + 1);
      setStep(3);
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.resetPasswordFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const onPassword = async (values: {
    new_password: string;
    confirm_password: string;
  }) => {
    setLoading(true);
    try {
      await accountsService.resetPasswordWithToken({
        email: resetEmail,
        reset_token: resetToken,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      showToast(t("auth.resetPasswordSuccessToast"), "success");
      router.push("/login");
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.resetPasswordFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!resetEmail) {
      showToast(t("auth.emailRequired"), "error");
      return;
    }
    setResending(true);
    try {
      await accountsService.resendPasswordResetOtp(resetEmail);
      setOtpGen((g) => g + 1);
      setResetToken("");
      showToast(t("auth.passwordResetOtpResent"), "success");
    } catch (err: unknown) {
      showToast(getAxiosErrorDetail(err, t("auth.resendFailed")), "error");
    } finally {
      setResending(false);
    }
  };

  const { title: titleKey, badge: badgeKey } = STEP_KEYS[step - 1];

  return (
    <AuthLayout slogan={t("auth.slogan")}>
      <Box sx={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 0.5,
            fontWeight: 700,
            color: "text.primary",
            fontSize: { xs: "1.75rem", sm: "2rem" },
            letterSpacing: "-0.02em",
          }}
        >
          {t(titleKey)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 2.5,
            color: "text.secondary",
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: "0.6875rem",
          }}
        >
          {t(badgeKey)}
        </Typography>

        {step === 1 && (
          <>
            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary", lineHeight: 1.6 }}>
              {t("auth.resetDescription")}
            </Typography>
            <Formik
              initialValues={{ email: "" }}
              validationSchema={forgotPasswordSchema}
              onSubmit={onEmail}
            >
              {({ errors, touched }) => (
                <Form>
                  <Field name="email">
                    {({ field }: { field: FieldInputProps<string> }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        id="email"
                        label={t("auth.email")}
                        type="email"
                        autoComplete="username"
                        size="small"
                        error={touched.email && !!errors.email}
                        helperText={touched.email && errors.email}
                        sx={fieldSx(2.5)}
                      />
                    )}
                  </Field>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ ...primaryBtnSx, mb: 2 }}
                  >
                    {loading ? t("auth.sending") : t("auth.sendResetCode")}
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary", lineHeight: 1.6 }}>
              {t("auth.forgotPasswordOtpStepDescription")}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: "divider" }} />
            <Formik
              key={`${resetEmail}-${otpGen}`}
              initialValues={{ otp: "" }}
              validationSchema={forgotPasswordVerifyOtpSchema}
              onSubmit={onOtp}
            >
              {() => (
                <Form>
                  <OtpDigitInput name="otp" label={t("auth.otpCode")} />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ ...primaryBtnSx, mb: 1.5 }}
                  >
                    {loading ? t("auth.verifying") : t("auth.forgotPasswordVerifyContinue")}
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    variant="outlined"
                    onClick={onResend}
                    disabled={resending || !resetEmail}
                    size="small"
                    sx={resendBtnSx}
                  >
                    {resending ? t("auth.resending") : t("auth.resendOtp")}
                  </Button>
                  <Typography
                    variant="caption"
                    component="p"
                    sx={{ mb: 2, color: "text.secondary", lineHeight: 1.45, px: 0.25 }}
                  >
                    {t("auth.passwordResetResendHint")}
                  </Typography>
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Button type="button" variant="text" size="small" onClick={goStep1} sx={textBtnSx}>
                      {t("auth.useDifferentEmail")}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </>
        )}

        {step === 3 && (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary", lineHeight: 1.6 }}>
              {t("auth.forgotPasswordNewPasswordStepDescription")}
            </Typography>
            <Typography
              variant="caption"
              component="p"
              sx={{ mb: 2.5, color: "text.secondary", lineHeight: 1.5, display: "block" }}
            >
              {t("auth.passwordResetPasswordHint")}
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: "divider" }} />
            <Formik
              key={`${resetEmail}-pwd-${pwdGen}`}
              initialValues={{ new_password: "", confirm_password: "" }}
              validationSchema={resetPasswordNewOnlySchema}
              onSubmit={onPassword}
            >
              {({ errors, touched }) => (
                <Form>
                  <Field name="new_password">
                    {({ field }: { field: FieldInputProps<string> }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        type="password"
                        id="new_password"
                        label={t("auth.newPassword")}
                        autoComplete="new-password"
                        size="small"
                        error={touched.new_password && !!errors.new_password}
                        helperText={touched.new_password && errors.new_password}
                        sx={fieldSx(1.5)}
                      />
                    )}
                  </Field>
                  <Field name="confirm_password">
                    {({ field }: { field: FieldInputProps<string> }) => (
                      <TextField
                        {...field}
                        fullWidth
                        required
                        type="password"
                        id="confirm_password"
                        label={t("auth.confirmPassword")}
                        autoComplete="new-password"
                        size="small"
                        error={touched.confirm_password && !!errors.confirm_password}
                        helperText={touched.confirm_password && errors.confirm_password}
                        sx={fieldSx(1.5)}
                      />
                    )}
                  </Field>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ ...primaryBtnSx, mb: 1.5 }}
                  >
                    {loading ? t("auth.resettingPassword") : t("auth.resetPasswordSubmit")}
                  </Button>
                  <Stack spacing={0.5} alignItems="center" sx={{ mb: 2 }}>
                    <Button type="button" variant="text" size="small" onClick={backToOtp} sx={textBtnSx}>
                      {t("auth.forgotPasswordBackToCode")}
                    </Button>
                    <Button type="button" variant="text" size="small" onClick={goStep1} sx={textBtnSx}>
                      {t("auth.useDifferentEmail")}
                    </Button>
                  </Stack>
                </Form>
              )}
            </Formik>
          </>
        )}

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" component="span" sx={{ color: "text.secondary" }}>
            {t("auth.rememberPassword")}{" "}
          </Typography>
          <Link
            component={NextLink}
            href="/login"
            underline="hover"
            variant="body2"
            sx={{ color: "primary.main", fontWeight: 500, fontSize: "0.875rem" }}
          >
            {t("auth.backToLogin")}
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}
