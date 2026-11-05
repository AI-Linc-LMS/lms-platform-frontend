"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Typography,
  Box,
  IconButton,
  InputAdornment,
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
import {
  CV_MAX_SIZE_BYTES,
  CV_MAX_SIZE_MB,
  InstructorSignupToggle,
} from "@/components/auth/InstructorSignupToggle";
import { signupSchema } from "@/lib/schemas/auth.schema";
import {
  getAxiosErrorDetail,
  getAxiosFieldError,
} from "@/lib/utils/api-error";
import { Eye, EyeOff } from "lucide-react";

interface SignupFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export default function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { showToast } = useToast();
  const { clientInfo, loading: clientInfoLoading } = useClientInfo();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  /**
   * Deliberately component state, not a Formik field. The Google button sits OUTSIDE
   * <Formik> and has to be disabled from this value, and Formik's `values` are not
   * reachable there. It also has to survive being read before the form renders.
   */
  const [signupAsInstructor, setSignupAsInstructor] = useState(false);
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
    if (signupAsInstructor && !cvFile) {
      setCvError(
        t("auth.cvRequired", {
          defaultValue: "Please upload your CV before continuing.",
        })
      );
      return;
    }
    setLoading(true);

    try {
      const signupAs = signupAsInstructor ? "instructor" : "student";
      await accountsService.signup({
        ...values,
        signup_as: signupAs,
        cv: signupAsInstructor ? cvFile : null,
      });
      showToast(t("auth.otpSent"), "success");
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

  // A restricted tenant creates its accounts itself: the server refuses every self-signup, so a
  // form here could only end in an error. Say what to do instead. Not while client-info is still
  // loading, or every signup page would flash this for a moment.
  if (!clientInfoLoading && clientInfo?.restrict_login_to_added_members) {
    return (
      <AuthLayout slogan={t("auth.slogan")}>
        <Box sx={{ width: "100%", textAlign: "start" }} data-testid="restricted-signup">
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
            {t("auth.restrictedSignUpTitle")}
          </Typography>
          <Typography sx={{ ...TYPE.body, fontFamily: FONT, color: AUTH.inkFaint, mb: 3 }}>
            {t("auth.restrictedSignIn")}
          </Typography>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Typography component="span" sx={{ ...TYPE.body, ...authLinkSx }}>
              {t("auth.backToLogin", { defaultValue: "Back to sign in" })}
            </Typography>
          </Link>
        </Box>
      </AuthLayout>
    );
  }

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

        {/* The role choice comes BEFORE the sign-up methods, because it removes one of
            them. Previously it sat at the foot of the email form, below the password
            fields, so the obvious thing to do on this page - press Google - happened
            before the switch was ever seen. */}
        {!instructorFlagLoading && allowInstructorSelfSignup && (
          <InstructorSignupToggle
            value={signupAsInstructor}
            onChange={setSignupAsInstructor}
            cvFile={cvFile}
            cvError={cvError}
            cvInputRef={cvInputRef}
            handleCvSelect={handleCvSelect}
            clearCv={clearCv}
          />
        )}

        <Box sx={{ mb: 3 }}>
          {/* Was the shared default, "Sign in with Google", sitting directly above a
              divider that reads "Or sign up with email". */}
          <GoogleSignIn
            // Google cannot carry the instructor application. It sends an id_token and
            // nothing else, so GoogleLoginView creates the profile with the model's
            // default role and no CV and no pending_status - an instructor who signed up
            // this way landed as a plain student, approved, with no application to review
            // and no sign that anything had been skipped.
            disabled={loading || signupAsInstructor}
            label={t("auth.signUpWithGoogle", {
              defaultValue: "Sign up with Google",
            })}
          />
          {/* A greyed-out button with no reason beside it is a dead end: the one thing
              the person needs to know is that the switch above did this, and that the
              email form below still works. */}
          {signupAsInstructor && (
            <Typography
              role="status"
              sx={{
                ...TYPE.eyebrow,
                fontFamily: FONT,
                letterSpacing: 0,
                mt: 1,
                color: AUTH.inkMuted,
              }}
            >
              {t("auth.googleUnavailableForInstructors", {
                defaultValue:
                  "Google sign-up cannot carry your CV, so instructors sign up with email below.",
              })}
            </Typography>
          )}
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


              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                loading={loading}
                loadingText={t("common.submitting")}
                disabled={loading || (signupAsInstructor && !cvFile)}
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
