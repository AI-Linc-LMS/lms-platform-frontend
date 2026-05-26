"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Switch,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { MuiTelInput } from "mui-tel-input";
import { accountsService } from "@/lib/services/accounts.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useToast } from "@/components/common/Toast";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
      setCvError("CV must be a PDF file.");
      return;
    }
    if (file.size > CV_MAX_SIZE_BYTES) {
      setCvFile(null);
      setCvError(`CV file size must not exceed ${CV_MAX_SIZE_MB}MB.`);
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
      setCvError("Please upload your CV before continuing.");
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
            mb: 3,
            fontWeight: 700,
            color: "text.primary",
            fontSize: { xs: "1.75rem", sm: "2rem" },
          }}
        >
          {t("auth.signUp")}
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
            {t("auth.orSignUpWithEmail")}
          </Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={signupSchema}
          onSubmit={onSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
          }) => (
            <Form>
              <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                <Field name="first_name">
                  {({ field }: any) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      id="first_name"
                      label="First Name"
                      placeholder="First Name"
                      size="small"
                      error={touched.first_name && !!errors.first_name}
                      helperText={touched.first_name && errors.first_name}
                      sx={{
                        "& .MuiFormHelperText-root": {
                          marginTop: 0.5,
                          fontSize: "0.75rem",
                        },
                      }}
                    />
                  )}
                </Field>
                <Field name="last_name">
                  {({ field }: any) => (
                    <TextField
                      {...field}
                      fullWidth
                      required
                      id="last_name"
                      label={t("auth.lastName")}
                      placeholder={t("auth.lastName")}
                      size="small"
                      error={touched.last_name && !!errors.last_name}
                      helperText={touched.last_name && errors.last_name}
                      sx={{
                        "& .MuiFormHelperText-root": {
                          marginTop: 0.5,
                          fontSize: "0.75rem",
                        },
                      }}
                    />
                  )}
                </Field>
              </Box>

              <Field name="email">
                {({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    id="email"
                    label="Email"
                    placeholder="Email"
                    autoComplete="off"
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

              <Box sx={{ mb: 1.5 }}>
                <MuiTelInput
                  value={values.phone}
                  onChange={(value) => setFieldValue("phone", value)}
                  onBlur={handleBlur("phone")}
                  defaultCountry="IN"
                  fullWidth
                  required
                  size="small"
                  label={t("auth.phoneNumber")}
                  placeholder={t("auth.phoneNumber")}
                  error={touched.phone && !!errors.phone}
                  helperText={touched.phone && errors.phone}
                  sx={{
                    "& .MuiFormHelperText-root": {
                      marginTop: 0.5,
                      fontSize: "0.75rem",
                    },
                  }}
                />
              </Box>

              <Field name="password">
                {({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label="Password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    id="password"
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

              <Field name="confirm_password">
                {({ field }: any) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label={t("auth.confirmPassword")}
                    placeholder={t("auth.confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    size="small"
                    error={
                      touched.confirm_password && !!errors.confirm_password
                    }
                    helperText={
                      touched.confirm_password && errors.confirm_password
                    }
                    sx={{
                      mb: 2,
                      "& .MuiFormHelperText-root": {
                        marginTop: 0.5,
                        fontSize: "0.75rem",
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                            size="small"
                            sx={{ color: "text.secondary" }}
                          >
                            {showConfirmPassword ? (
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

              {!instructorFlagLoading && allowInstructorSelfSignup && (
                <Box sx={{ mb: 2 }}>
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
                    sx={(theme) => {
                      const on = values.signup_as_instructor;
                      return {
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.75,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: on
                          ? theme.palette.primary.main
                          : alpha(theme.palette.primary.main, 0.35),
                        textAlign: "left",
                        cursor: "pointer",
                        font: "inherit",
                        background: on
                          ? `linear-gradient(135deg, ${alpha(
                              theme.palette.primary.main,
                              0.16
                            )} 0%, ${alpha(theme.palette.primary.main, 0.07)} 50%, ${alpha(
                              theme.palette.primary.main,
                              0.04
                            )} 100%)`
                          : `linear-gradient(135deg, ${alpha(
                              theme.palette.primary.main,
                              0.1
                            )} 0%, ${alpha(theme.palette.primary.main, 0.035)} 100%)`,
                        boxShadow: on
                          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}, 0 8px 24px ${alpha(
                              theme.palette.primary.main,
                              0.18
                            )}`
                          : `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                        transition:
                          "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 3px ${alpha(
                            theme.palette.primary.main,
                            0.12
                          )}, 0 10px 28px ${alpha(
                            theme.palette.primary.main,
                            0.14
                          )}`,
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2,
                        },
                      };
                    }}
                  >
                    <Box
                      sx={(theme) => ({
                        flexShrink: 0,
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: values.signup_as_instructor
                          ? alpha(theme.palette.primary.main, 0.22)
                          : alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                        transition: "background-color 0.2s ease",
                      })}
                    >
                      <GraduationCap
                        size={24}
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: "text.primary",
                          lineHeight: 1.35,
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
                      sx={(theme) => ({
                        flexShrink: 0,
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: theme.palette.primary.main,
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.55
                            ),
                          },
                      })}
                    />
                  </Box>
                  {values.signup_as_instructor && (
                    <>
                      <Box
                        sx={(theme) => ({
                          mt: 1.25,
                          pl: 1.75,
                          pr: 1.5,
                          py: 1.5,
                          borderRadius: 2,
                          borderLeft: `3px solid ${theme.palette.primary.main}`,
                          background: `linear-gradient(90deg, ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                        })}
                      >
                        <Typography
                          variant="caption"
                          component="p"
                          sx={{
                            display: "block",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            color: "primary.main",
                            letterSpacing: "0.02em",
                            textTransform: "uppercase",
                            mb: 0.75,
                          }}
                        >
                          {t("auth.instructorSignupApprovalTitle")}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "block",
                            color: "text.secondary",
                            fontSize: "0.8125rem",
                            lineHeight: 1.55,
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
                            sx={(theme) => ({
                              display: "flex",
                              alignItems: "center",
                              gap: 1.25,
                              p: 1.25,
                              borderRadius: 2,
                              border: `1.5px solid ${theme.palette.primary.main}`,
                              background: alpha(
                                theme.palette.primary.main,
                                0.06
                              ),
                            })}
                          >
                            <Box
                              sx={(theme) => ({
                                flexShrink: 0,
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.16
                                ),
                                color: "primary.main",
                              })}
                            >
                              <FileText size={18} strokeWidth={2.25} aria-hidden />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  color: "text.primary",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {cvFile.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  color: "text.secondary",
                                }}
                              >
                                {(cvFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={clearCv}
                              aria-label="Remove CV"
                              sx={{ color: "text.secondary" }}
                            >
                              <X size={16} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            onClick={() => cvInputRef.current?.click()}
                            startIcon={<Upload size={18} />}
                            sx={(theme) => ({
                              py: 1.25,
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              borderStyle: "dashed",
                              borderWidth: 2,
                              borderColor: cvError
                                ? theme.palette.error.main
                                : alpha(theme.palette.primary.main, 0.55),
                              color: cvError
                                ? "error.main"
                                : "primary.main",
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.04
                              ),
                              "&:hover": {
                                borderColor: cvError
                                  ? theme.palette.error.main
                                  : theme.palette.primary.main,
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.08
                                ),
                              },
                            })}
                          >
                            Upload CV (PDF, max {CV_MAX_SIZE_MB}MB)
                          </Button>
                        )}
                        {cvError && (
                          <Typography
                            sx={{
                              mt: 0.75,
                              color: "error.main",
                              fontSize: "0.75rem",
                              lineHeight: 1.4,
                            }}
                          >
                            {cvError}
                          </Typography>
                        )}
                        {!cvError && !cvFile && (
                          <Typography
                            sx={{
                              mt: 0.75,
                              color: "text.secondary",
                              fontSize: "0.75rem",
                              lineHeight: 1.4,
                            }}
                          >
                            Your CV is required so admins can review your
                            application.
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              )}

              {/* Sign Up Button */}
              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                loading={loading}
                loadingText={t("common.submitting")}
                disabled={
                  loading ||
                  (values.signup_as_instructor && !cvFile)
                }
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
                    color: "var(--font-light)",
                  },
                }}
              >
                {t("auth.signUp")}
              </LoadingButton>

              {/* Sign in link */}
              <Box sx={{ textAlign: "center", mt: 1 }}>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ color: "text.secondary", fontSize: "0.875rem" }}
                >
                  Already have an account?{" "}
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
