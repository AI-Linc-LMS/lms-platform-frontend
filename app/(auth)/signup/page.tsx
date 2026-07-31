"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Switch,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import { MuiTelInput } from "mui-tel-input";
import { accountsService } from "@/lib/services/accounts.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useToast } from "@/components/common/Toast";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthTextField } from "@/components/auth/fields/AuthTextField";
import {
  AUTH,
  CONTROL_HEIGHT,
  EASE,
  FONT,
  RADIUS,
  TYPE,
  authLinkSx,
  authPrimaryButtonSx,
  focusRing,
  hairlineRing,
} from "@/components/auth/layout/authTokens";
import { signupSchema } from "@/lib/schemas/auth.schema";
import {
  getAxiosErrorDetail,
  getAxiosFieldError,
} from "@/lib/utils/api-error";
import { Eye, EyeOff, FileText, GraduationCap, Upload, X } from "lucide-react";

const CV_MAX_SIZE_MB = 5;
const CV_MAX_SIZE_BYTES = CV_MAX_SIZE_MB * 1024 * 1024;

interface SignupFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  signup_as_instructor: boolean;
}

export default function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { showToast } = useToast();
  const { clientInfo, loading: clientInfoLoading } = useClientInfo();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  const allowInstructorSelfSignup = Boolean(
    clientInfo?.allow_instructor_self_signup
  );
  const instructorFlagLoading = clientInfoLoading;

  const initialValues: SignupFormValues = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    signup_as_instructor: false,
  };

  const handleCvSelect = (file: File | null | undefined) => {
    if (!file) {
      setCvFile(null);
      setCvError(null);
      return;
    }
    const isPdfByType = file.type === "application/pdf";
    const isPdfByName = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfByType || !isPdfByName) {
      setCvFile(null);
      setCvError(t("auth.cvMustBePdf", { defaultValue: "CV must be a PDF file." }));
      return;
    }
    if (file.size > CV_MAX_SIZE_BYTES) {
      setCvFile(null);
      setCvError(
        t("auth.cvTooLarge", {
          defaultValue: `CV file size must not exceed ${CV_MAX_SIZE_MB}MB.`,
          max: CV_MAX_SIZE_MB,
        })
      );
      return;
    }
    setCvFile(file);
    setCvError(null);
  };

  const clearCv = () => {
    setCvFile(null);
    setCvError(null);
    if (cvInputRef.current) {
      cvInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: SignupFormValues) => {
    if (values.signup_as_instructor && !cvFile) {
      setCvError(
        t("auth.cvRequired", {
          defaultValue: "Please upload your CV before continuing.",
        })
      );
      return;
    }
    setLoading(true);

    try {
      const { signup_as_instructor, ...rest } = values;
      await accountsService.signup({
        ...rest,
        signup_as: signup_as_instructor ? "instructor" : "student",
        cv: signup_as_instructor ? cvFile : null,
      });
      showToast(t("auth.otpSent"), "success");
      const signupAs = signup_as_instructor ? "instructor" : "student";
      setTimeout(() => {
        router.push(
          `/verify-email?email=${encodeURIComponent(values.email)}&signup_as=${encodeURIComponent(signupAs)}`
        );
      }, 2000);
    } catch (err: unknown) {
      const message =
        getAxiosErrorDetail(err, "") ||
        getAxiosFieldError(err, "email") ||
        t("auth.signupFailed");
      showToast(message, "error");
    } finally {
      setLoading(false);
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
          {t("auth.createAccount", { defaultValue: "Create your account" })}
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

        <Box sx={{ mb: 3 }}>
          {/* Was the shared default, "Sign in with Google", sitting directly above a
              divider that reads "Or sign up with email". */}
          <GoogleSignIn
            disabled={loading}
            label={t("auth.signUpWithGoogle", {
              defaultValue: "Sign up with Google",
            })}
          />
        </Box>

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
            {t("auth.orSignUpWithEmail")}
          </Typography>
          <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: AUTH.hairline }} />
        </Box>

        <Formik
          initialValues={initialValues}
          validationSchema={signupSchema}
          onSubmit={onSubmit}
        >
          {({ values, errors, touched, handleBlur, setFieldValue }) => (
            <Form noValidate>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Field name="first_name">
                  {({ field }: any) => (
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <AuthTextField
                        {...field}
                        id="first_name"
                        label={t("auth.firstName", { defaultValue: "First name" })}
                        autoComplete="given-name"
                        required
                        error={Boolean(touched.first_name && errors.first_name)}
                        helperText={touched.first_name && errors.first_name}
                      />
                    </Box>
                  )}
                </Field>
                <Field name="last_name">
                  {({ field }: any) => (
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <AuthTextField
                        {...field}
                        id="last_name"
                        label={t("auth.lastName")}
                        autoComplete="family-name"
                        required
                        error={Boolean(touched.last_name && errors.last_name)}
                        helperText={touched.last_name && errors.last_name}
                      />
                    </Box>
                  )}
                </Field>
              </Box>

              <Field name="email">
                {({ field }: any) => (
                  <AuthTextField
                    {...field}
                    id="email"
                    label={t("auth.email")}
                    type="email"
                    // Was autoComplete="off", which WCAG 2.2 SC 3.3.8 treats as a failure
                    // because it blocks password managers on an authentication field.
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    dir="ltr"
                    error={Boolean(touched.email && errors.email)}
                    helperText={touched.email && errors.email}
                  />
                )}
              </Field>

              <Box sx={{ mb: 2 }}>
                <Typography
                  component="label"
                  htmlFor="phone"
                  sx={{
                    ...TYPE.label,
                    fontFamily: FONT,
                    color: AUTH.inkMuted,
                    display: "block",
                    mb: 0.75,
                  }}
                >
                  {t("auth.phoneNumber")}
                </Typography>
                <MuiTelInput
                  id="phone"
                  value={values.phone}
                  onChange={(value) => setFieldValue("phone", value)}
                  onBlur={handleBlur("phone")}
                  defaultCountry="IN"
                  fullWidth
                  required
                  // Phone numbers are LTR data even inside an RTL page.
                  dir="ltr"
                  error={Boolean(touched.phone && errors.phone)}
                  helperText={touched.phone && errors.phone}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      minHeight: CONTROL_HEIGHT,
                      borderRadius: `${RADIUS}px`,
                      backgroundColor: AUTH.surface,
                      fontFamily: FONT,
                      fontSize: { xs: 16, sm: 15 },
                      color: AUTH.ink,
                      boxShadow: hairlineRing(
                        touched.phone && errors.phone ? AUTH.error : AUTH.hairline
                      ),
                      transition: `box-shadow 160ms ${EASE}`,
                      "& fieldset": { border: "none" },
                      "&.Mui-focused": { boxShadow: focusRing() },
                    },
                    "& .MuiOutlinedInput-input": { padding: "11px 14px" },
                    "& .MuiFormHelperText-root": {
                      ...TYPE.eyebrow,
                      fontFamily: FONT,
                      letterSpacing: 0,
                      marginLeft: 0,
                      marginTop: 0.75,
                    },
                  }}
                />
              </Box>

              <Field name="password">
                {({ field }: any) => (
                  <AuthTextField
                    {...field}
                    id="password"
                    label={t("auth.password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    error={Boolean(touched.password && errors.password)}
                    helperText={touched.password && errors.password}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
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

              <Field name="confirm_password">
                {({ field }: any) => (
                  <AuthTextField
                    {...field}
                    id="confirm_password"
                    label={t("auth.confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    error={Boolean(
                      touched.confirm_password && errors.confirm_password
                    )}
                    helperText={
                      touched.confirm_password && errors.confirm_password
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                          aria-label={
                            showConfirmPassword
                              ? t("auth.hidePassword", { defaultValue: "Hide password" })
                              : t("auth.showPassword", { defaultValue: "Show password" })
                          }
                          aria-pressed={showConfirmPassword}
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
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                )}
              </Field>

              {!instructorFlagLoading && allowInstructorSelfSignup && (
                <Box sx={{ mb: 3 }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      const next = !values.signup_as_instructor;
                      setFieldValue("signup_as_instructor", next);
                      if (!next) {
                        clearCv();
                      }
                    }}
                    aria-pressed={values.signup_as_instructor}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.75,
                      borderRadius: `${RADIUS}px`,
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      font: "inherit",
                      // Was a tinted gradient with a 3px glow ring. Selection now reads as a
                      // single hairline going violet, which is the whole accent budget.
                      backgroundColor: values.signup_as_instructor
                        ? AUTH.violetSoft
                        : AUTH.surface,
                      boxShadow: hairlineRing(
                        values.signup_as_instructor ? AUTH.violet : AUTH.hairline
                      ),
                      transition: `box-shadow 160ms ${EASE}, background-color 160ms ${EASE}`,
                      "&:hover": {
                        boxShadow: hairlineRing(
                          values.signup_as_instructor ? AUTH.violet : "#d5d8e3"
                        ),
                      },
                      "&:focus-visible": { outline: "none", boxShadow: focusRing() },
                    }}
                  >
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 40,
                        height: 40,
                        borderRadius: `${RADIUS}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: values.signup_as_instructor
                          ? "#ffffff"
                          : AUTH.canvas,
                        color: values.signup_as_instructor
                          ? AUTH.violet
                          : AUTH.inkFaint,
                      }}
                    >
                      <GraduationCap size={20} strokeWidth={2} aria-hidden />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        component="span"
                        sx={{
                          ...TYPE.body,
                          fontFamily: FONT,
                          fontWeight: 500,
                          color: AUTH.ink,
                          display: "block",
                        }}
                      >
                        {t("auth.signUpAsInstructor")}
                      </Typography>
                    </Box>
                    <Switch
                      checked={values.signup_as_instructor ?? false}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setFieldValue("signup_as_instructor", next);
                        if (!next) {
                          clearCv();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      inputProps={{
                        "aria-label": t("auth.signUpAsInstructor"),
                      }}
                      sx={{
                        flexShrink: 0,
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: AUTH.violet,
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: AUTH.violet,
                          opacity: 0.5,
                        },
                      }}
                    />
                  </Box>

                  {values.signup_as_instructor && (
                    <>
                      <Box
                        sx={{
                          mt: 1.5,
                          px: 1.75,
                          py: 1.5,
                          borderRadius: `${RADIUS}px`,
                          backgroundColor: AUTH.canvas,
                          boxShadow: hairlineRing(),
                        }}
                      >
                        <Typography
                          component="p"
                          sx={{
                            ...TYPE.eyebrow,
                            fontFamily: FONT,
                            color: AUTH.violet,
                            mb: 0.75,
                            // Uppercase is a no-op in Arabic and tracking breaks its joins.
                            textTransform: "uppercase",
                            '[dir="rtl"] &': {
                              textTransform: "none",
                              letterSpacing: "normal",
                            },
                          }}
                        >
                          {t("auth.instructorSignupApprovalTitle")}
                        </Typography>
                        <Typography
                          sx={{
                            ...TYPE.body,
                            fontFamily: FONT,
                            fontSize: 13,
                            color: AUTH.inkMuted,
                          }}
                        >
                          {t("auth.instructorSignupApprovalNote")}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 1.5 }}>
                        <input
                          ref={cvInputRef}
                          type="file"
                          accept="application/pdf,.pdf"
                          hidden
                          onChange={(e) =>
                            handleCvSelect(e.target.files?.[0] ?? null)
                          }
                        />
                        {cvFile ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.25,
                              p: 1.25,
                              borderRadius: `${RADIUS}px`,
                              backgroundColor: AUTH.surface,
                              boxShadow: hairlineRing(AUTH.violet),
                            }}
                          >
                            <Box
                              sx={{
                                flexShrink: 0,
                                width: 36,
                                height: 36,
                                borderRadius: `${RADIUS}px`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: AUTH.violetSoft,
                                color: AUTH.violet,
                              }}
                            >
                              <FileText size={18} strokeWidth={2} aria-hidden />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  ...TYPE.body,
                                  fontFamily: FONT,
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: AUTH.ink,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {cvFile.name}
                              </Typography>
                              <Typography
                                sx={{
                                  ...TYPE.eyebrow,
                                  fontFamily: FONT,
                                  letterSpacing: 0,
                                  color: AUTH.inkFaint,
                                }}
                              >
                                {(cvFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={clearCv}
                              aria-label={t("auth.removeCv", {
                                defaultValue: "Remove CV",
                              })}
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
                              <X size={16} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button
                            type="button"
                            fullWidth
                            onClick={() => cvInputRef.current?.click()}
                            startIcon={<Upload size={18} />}
                            sx={{
                              minHeight: CONTROL_HEIGHT,
                              borderRadius: `${RADIUS}px`,
                              textTransform: "none",
                              fontFamily: FONT,
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              color: cvError ? AUTH.error : AUTH.violet,
                              backgroundColor: AUTH.surface,
                              boxShadow: hairlineRing(
                                cvError ? AUTH.error : AUTH.hairline
                              ),
                              "&:hover": {
                                backgroundColor: AUTH.violetSoft,
                                boxShadow: hairlineRing(
                                  cvError ? AUTH.error : AUTH.violet
                                ),
                              },
                              "&:focus-visible": {
                                outline: "none",
                                boxShadow: focusRing(),
                              },
                            }}
                          >
                            {t("auth.uploadCv", {
                              defaultValue: `Upload CV (PDF, max ${CV_MAX_SIZE_MB}MB)`,
                              max: CV_MAX_SIZE_MB,
                            })}
                          </Button>
                        )}
                        {cvError && (
                          <Typography
                            role="alert"
                            sx={{
                              ...TYPE.eyebrow,
                              fontFamily: FONT,
                              letterSpacing: 0,
                              mt: 0.75,
                              color: AUTH.error,
                            }}
                          >
                            {cvError}
                          </Typography>
                        )}
                        {!cvError && !cvFile && (
                          <Typography
                            sx={{
                              ...TYPE.eyebrow,
                              fontFamily: FONT,
                              letterSpacing: 0,
                              mt: 0.75,
                              color: AUTH.inkFaint,
                            }}
                          >
                            {t("auth.cvWhy", {
                              defaultValue:
                                "Your CV is required so admins can review your application.",
                            })}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              )}

              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                loading={loading}
                loadingText={t("common.submitting")}
                disabled={loading || (values.signup_as_instructor && !cvFile)}
                sx={{
                  ...authPrimaryButtonSx,
                  "&:disabled": {
                    background: AUTH.violet,
                    color: "#ffffff",
                    opacity: 0.45,
                  },
                }}
              >
                {t("auth.signUp")}
              </LoadingButton>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Typography
                  component="span"
                  sx={{ ...TYPE.body, fontFamily: FONT, color: AUTH.inkFaint }}
                >
                  {t("auth.haveAccount", {
                    defaultValue: "Already have an account?",
                  })}{" "}
                </Typography>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <Typography component="span" sx={{ ...TYPE.body, ...authLinkSx }}>
                    {t("auth.signIn")}
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
