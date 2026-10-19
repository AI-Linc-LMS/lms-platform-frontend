"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { Box, Link, Stack, TextField, Typography } from "@mui/material";
import { Field, Form, Formik } from "formik";
import type { FieldInputProps } from "formik";
import { accountsService } from "@/lib/services/accounts.service";
import { resetPasswordNewOnlySchema } from "@/lib/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useToast } from "@/components/common/Toast";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  AUTH,
  CONTROL_HEIGHT,
  FONT,
  RADIUS,
  TYPE,
  authPrimaryButtonSx,
  focusRing,
  hairlineRing,
} from "@/components/auth/layout/authTokens";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

/**
 * Where a learner lands from "You have been added to <your organisation>".
 *
 * An admin who adds a student creates an account with a random password that is hashed and
 * discarded, so the learner has never had a way in. This page is it: the emailed token is the
 * credential, and it buys exactly one password write.
 *
 * The route is in proxy.ts's publicRoutes for a reason worth keeping: without that entry it
 * 307s to /login and the redirect DROPS the token, so the learner's only way into the account
 * is lost before the page ever renders.
 */

const primaryBtnSx = {
  ...authPrimaryButtonSx,
  "&:disabled": { background: AUTH.violet, color: "#ffffff", opacity: 0.45 },
} as const;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: CONTROL_HEIGHT,
    borderRadius: RADIUS,
    fontFamily: FONT,
    ...hairlineRing,
    "&.Mui-focused": focusRing,
  },
} as const;

function SetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const token = (params.get("token") || "").trim();
  const [done, setDone] = useState(false);
  const [signInEmail, setSignInEmail] = useState<string | null>(null);

  // A visit with no token is someone who opened the bare URL, or a mail client that mangled
  // the link. Say so here rather than letting them type a password into a form that cannot
  // possibly succeed.
  const missingToken = token.length === 0;

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.replace("/login"), 4000);
    return () => clearTimeout(t);
  }, [done, router]);

  if (missingToken) {
    return (
      <AuthLayout>
        <Stack spacing={2} sx={{ maxWidth: 420 }}>
          <Typography sx={{ ...TYPE.title }}>This link is incomplete</Typography>
          <Typography sx={{ ...TYPE.body, color: "var(--font-secondary)" }}>
            Open the link from your invitation email again, or use Forgot password to get in.
          </Typography>
          <Link component={NextLink} href="/forgot-password" sx={{ ...TYPE.body }}>
            Go to Forgot password
          </Link>
        </Stack>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <Stack spacing={2} sx={{ maxWidth: 420 }}>
          <Typography sx={{ ...TYPE.title }}>Your password is set</Typography>
          <Typography sx={{ ...TYPE.body, color: "var(--font-secondary)" }}>
            {signInEmail
              ? `Sign in with ${signInEmail}. Taking you to the login page…`
              : "Taking you to the login page…"}
          </Typography>
          <Link component={NextLink} href="/login" sx={{ ...TYPE.body }}>
            Go to sign in
          </Link>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Stack spacing={2.5} sx={{ maxWidth: 420, width: "100%" }}>
        <Box>
          <Typography sx={{ ...TYPE.title }}>Choose your password</Typography>
          <Typography sx={{ ...TYPE.body, color: "var(--font-secondary)", mt: 0.5 }}>
            Your account is ready. Pick a password and you are in.
          </Typography>
        </Box>

        {/* Field names are new_password / confirm_password because that is what
            resetPasswordNewOnlySchema validates. Renaming them to camelCase makes
            Yup validate two fields the form does not render: validation then fails
            on every submit, Formik never calls onSubmit, and the errors attach to
            inputs nobody can see - so the button silently does nothing. That was
            shipped once and reported from a phone. */}
        <Formik
          initialValues={{ new_password: "", confirm_password: "" }}
          validationSchema={resetPasswordNewOnlySchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await accountsService.setPasswordFromOnboarding(
                token,
                values.new_password
              );
              setSignInEmail(res.email ?? null);
              setDone(true);
            } catch (err) {
              // The server's own message is the useful one: it distinguishes a spent or
              // expired link ("ask your administrator for a new one") from a weak password,
              // and a generic "something went wrong" would send the learner nowhere.
              showToast(
                getAxiosErrorDetail(
                  err,
                  "That did not work. Try the link again, or use Forgot password."
                ),
                "error"
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form noValidate>
              <Stack spacing={2}>
                <Field name="new_password">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <TextField
                      {...field}
                      type="password"
                      label="New password"
                      autoComplete="new-password"
                      autoFocus
                      fullWidth
                      sx={fieldSx}
                      error={touched.new_password && Boolean(errors.new_password)}
                      helperText={touched.new_password ? errors.new_password : " "}
                    />
                  )}
                </Field>

                <Field name="confirm_password">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <TextField
                      {...field}
                      type="password"
                      label="Confirm password"
                      autoComplete="new-password"
                      fullWidth
                      sx={fieldSx}
                      error={touched.confirm_password && Boolean(errors.confirm_password)}
                      helperText={touched.confirm_password ? errors.confirm_password : " "}
                    />
                  )}
                </Field>

                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  fullWidth
                  sx={primaryBtnSx}
                >
                  Set password and sign in
                </LoadingButton>

                <Typography
                  sx={{ ...TYPE.body, color: "var(--font-secondary)", fontSize: "0.82rem" }}
                >
                  Link expired?{" "}
                  <Link component={NextLink} href="/forgot-password">
                    Use Forgot password
                  </Link>
                </Typography>
              </Stack>
            </Form>
          )}
        </Formik>
      </Stack>
    </AuthLayout>
  );
}

export default function SetPasswordPage() {
  // useSearchParams needs a Suspense boundary in the app router, or the whole route opts into
  // client-side rendering at build time.
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  );
}
