"use client";

import { useState } from "react";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
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
import { Eye, EyeOff } from "lucide-react";

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

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);

    try {
      const { signup_as_instructor, ...rest } = values;
      await accountsService.signup({
        ...rest,
        signup_as: signup_as_instructor ? "instructor" : "student",
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.signup_as_instructor}
                        onChange={(e) =>
                          setFieldValue(
                            "signup_as_instructor",
                            e.target.checked
                          )
                        }
                        size="small"
                        sx={{
                          color: "primary.main",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.875rem", color: "text.primary" }}
                      >
                        {t("auth.signUpAsInstructor")}
                      </Typography>
                    }
                  />
                  <Box
                    sx={(theme) => ({
                      mt: 1,
                      pl: 1.75,
                      pr: 1.5,
                      py: 1.5,
                      borderRadius: 2,
                      borderLeft: `3px solid ${theme.palette.primary.main}`,
                      background: `linear-gradient(90deg, ${alpha(
                        theme.palette.primary.main,
                        0.08
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
                </Box>
              )}

              {/* Sign Up Button */}
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
                {loading ? t("auth.creatingAccount") : t("auth.signUp")}
              </Button>

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
