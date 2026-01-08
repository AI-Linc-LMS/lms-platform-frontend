"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { MuiTelInput } from "mui-tel-input";
import { accountsService } from "@/lib/services/accounts.service";
import { useToast } from "@/components/common/Toast";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signupSchema } from "@/lib/schemas/auth.schema";
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
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues: SignupFormValues = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  };

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);

    try {
      await accountsService.signup(values);
      showToast(
        "OTP sent to your email. Please verify your account.",
        "success"
      );
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        "Signup failed. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
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
            mb: 3,
            fontWeight: 700,
            color: "text.primary",
            fontSize: { xs: "1.75rem", sm: "2rem" },
          }}
        >
          Sign Up
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
            Or sign up with email
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
                      label="Last Name"
                      placeholder="Last Name"
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
                  label="Phone Number"
                  placeholder="Phone Number"
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
                    label="Confirm Password"
                    placeholder="Confirm Password"
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
                {loading ? "Creating Account..." : "Sign Up"}
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
                    Sign in
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
