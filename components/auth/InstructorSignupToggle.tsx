"use client";

import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, Switch, Typography } from "@mui/material";
import { FileText, GraduationCap, Upload, X } from "lucide-react";
import {
  AUTH,
  CONTROL_HEIGHT,
  EASE,
  FONT,
  RADIUS,
  TYPE,
  focusRing,
  hairlineRing,
} from "@/components/auth/layout/authTokens";

export const CV_MAX_SIZE_MB = 5;
export const CV_MAX_SIZE_BYTES = CV_MAX_SIZE_MB * 1024 * 1024;

interface InstructorSignupToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  cvFile: File | null;
  cvError: string | null;
  cvInputRef: RefObject<HTMLInputElement | null>;
  handleCvSelect: (file: File | null | undefined) => void;
  clearCv: () => void;
}

/**
 * Lives ABOVE the sign-up methods, not at the bottom of the email form.
 *
 * Two reasons it had to come out of <Formik>. First, it decides WHICH methods are
 * available — Google cannot carry a CV and `GoogleLoginView` creates every profile with
 * the model default role, so a Google sign-up with this switch on silently produced a
 * student. Disabling that button means reading this value from outside the form.
 * Second, a choice that changes the shape of the page belongs before the fields it
 * changes, not 300px below them.
 */
export function InstructorSignupToggle({
  value,
  onChange,
  cvFile,
  cvError,
  cvInputRef,
  handleCvSelect,
  clearCv,
}: InstructorSignupToggleProps) {
  const { t } = useTranslation("common");

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        component="button"
        type="button"
        onClick={() => {
          const next = !value;
          onChange(next);
          if (!next) {
            clearCv();
          }
        }}
        aria-pressed={value}
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
          backgroundColor: value
            ? AUTH.violetSoft
            : AUTH.surface,
          boxShadow: hairlineRing(
            value ? AUTH.violet : AUTH.hairline
          ),
          transition: `box-shadow 160ms ${EASE}, background-color 160ms ${EASE}`,
          "&:hover": {
            boxShadow: hairlineRing(
              value ? AUTH.violet : "#d5d8e3"
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
            backgroundColor: value
              ? "#ffffff"
              : AUTH.canvas,
            color: value
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
          checked={value}
          onChange={(e) => {
            const next = e.target.checked;
            onChange(next);
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
              color: AUTH.link,
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: AUTH.violet,
              opacity: 0.5,
            },
          }}
        />
      </Box>

      {value && (
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
                color: AUTH.link,
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
                    color: AUTH.link,
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
  );
}
