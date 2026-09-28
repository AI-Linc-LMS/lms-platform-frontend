"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CodingProblemBody, type CodingProblemData } from "./coding/CodingProblemBody";
import { PHONE } from "@/components/common/mobile/phone";
import { usePhoneSheet } from "@/components/mock-interview/usePhoneSheet";

export type CodingProblemPayload = CodingProblemData & {
  starter_code: string;
  language: string;
  /** Every starter the problem ships, keyed by lowercased language. */
  starters?: Record<string, string>;
};

interface CodingQuestionModalProps {
  open: boolean;
  problem: CodingProblemPayload | null;
  spokenIntro?: string;
  budgetSeconds?: number;
  allowClipboard?: boolean;
  /**
   * What the server said when it would not take the last submission, if anything.
   *
   * The modal used to close the instant Submit was pressed, whatever the server did with it.
   * A candidate submitting after the sitting had closed got a silent refusal and only found
   * out from their result page, which said no code had been submitted at all.
   */
  submitError?: string;
  /**
   * Whether the candidate's microphone is currently off, and how to change it.
   *
   * The room mutes the mic while this modal is up so that thinking aloud over the editor is
   * not transcribed as the answer to a question nobody asked - a real problem, and the reason
   * the mute exists. But the modal covers the room's own mic button, so a candidate who wanted
   * to ASK the interviewer something during a coding question had no way to be heard at all:
   * they spoke, nothing reached the model, and it appeared to ignore them.
   *
   * Passing these puts the control where the candidate is looking. Omit them and the modal
   * renders no mic affordance, which is the old behaviour.
   */
  micMuted?: boolean;
  onToggleMic?: () => void;
  onSubmit: (payload: { code: string; language: string }) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "sql", label: "SQL" },
];

function CodingQuestionModalComponent({
  open,
  problem,
  spokenIntro,
  budgetSeconds = 0,
  allowClipboard = false,
  submitError = "",
  micMuted,
  onToggleMic,
  onSubmit,
}: CodingQuestionModalProps) {
  const initialLang = useMemo(
    () => (problem?.language || "python").toLowerCase(),
    [problem?.language],
  );
  const { isPhone } = usePhoneSheet();
  const [language, setLanguage] = useState<string>(initialLang);

  // The starter the problem ships for each language. Switching the picker used to move
  // the label and leave Python in the editor, so a candidate who picked C++ was asked to
  // write C++ underneath a Python signature.
  const starters = useMemo(() => {
    const byLanguage: Record<string, string> = {};
    for (const [key, value] of Object.entries(problem?.starters || {})) {
      byLanguage[key.toLowerCase()] = value;
    }
    if (problem && byLanguage[initialLang] === undefined) {
      byLanguage[initialLang] = problem.starter_code || "";
    }
    return byLanguage;
  }, [problem, initialLang]);

  // One draft per language, so switching back and forth never costs the candidate what
  // they already wrote. A language they have not touched reads its own starter.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const code = drafts[language] ?? starters[language] ?? "";
  const setCode = (next: string) =>
    setDrafts((prev) => ({ ...prev, [language]: next }));

  useEffect(() => {
    setLanguage(initialLang);
    setDrafts({});
  }, [problem?.starter_code, problem?.title, initialLang]);

  const [secondsLeft, setSecondsLeft] = useState<number>(budgetSeconds);
  useEffect(() => {
    if (!open) return;
    setSecondsLeft(budgetSeconds);
  }, [open, budgetSeconds]);
  useEffect(() => {
    if (!open) return;
    if (budgetSeconds <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, budgetSeconds]);

  const formatMmSs = (totalSec: number) => {
    const safe = Math.max(0, totalSec);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const timerColor = (() => {
    if (budgetSeconds <= 0) return "var(--font-secondary)";
    const remainingFrac = secondsLeft / budgetSeconds;
    if (remainingFrac < 0.15) return "var(--ats-error)";
    if (remainingFrac < 0.35) return "var(--warning-500)";
    return "var(--accent-indigo)";
  })();

  const handleSubmit = () => {
    onSubmit({ code: code.trim() || "// (no code submitted)", language });
  };

  if (!problem) return null;

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      disableEscapeKeyDown
      // An editor needs the whole phone, not a sheet.
      fullScreen={isPhone || undefined}
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
          color: "var(--font-primary-dark)",
          maxHeight: "92vh",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "92vh",
          [PHONE]: {
            height: "100dvh",
            pt: "env(safe-area-inset-top)",
            pb: "env(safe-area-inset-bottom)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: "1px solid var(--border-default)",
            backgroundColor: "var(--surface)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconWrapper icon="mdi:code-braces" size={22} color="var(--accent-indigo)" />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}
            >
              Coding Question
            </Typography>
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: "var(--surface-indigo-light)",
                color: "var(--accent-indigo)",
                fontSize: "0.7rem",
                [PHONE]: { fontSize: "0.75rem" },
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              MAIN TIMER PAUSED
            </Box>
          </Box>
          {budgetSeconds > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.25,
                py: 0.5,
                borderRadius: 1.5,
                backgroundColor: "var(--card-bg)",
                border: "1px solid",
                borderColor: timerColor,
                color: timerColor,
                fontVariantNumeric: "tabular-nums",
                transition: "border-color 0.3s ease, color 0.3s ease",
              }}
            >
              <IconWrapper
                icon="mdi:timer-outline"
                size={16}
                color={timerColor}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', monospace",
                  fontSize: "0.85rem",
                  color: timerColor,
                }}
              >
                {formatMmSs(secondsLeft)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  [PHONE]: { fontSize: "0.75rem" },
                  color: timerColor,
                  opacity: 0.85,
                }}
              >
                left
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          <Box
            sx={{
              width: 380,
              flexShrink: 0,
              borderRight: "1px solid var(--border-default)",
              overflowY: "auto",
              px: 3,
              py: 2.5,
              backgroundColor: "var(--card-bg)",
            }}
          >
            {spokenIntro && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 2,
                  backgroundColor: "var(--surface-indigo-light)",
                  border: "1px solid var(--accent-indigo)",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "var(--accent-indigo)",
                    mb: 0.5,
                  }}
                >
                  Interviewer
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--font-primary-dark)", lineHeight: 1.55 }}
                >
                  {spokenIntro}
                </Typography>
              </Paper>
            )}
            <CodingProblemBody problem={problem} />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                borderBottom: "1px solid var(--border-default)",
                backgroundColor: "var(--surface)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                Editor
              </Typography>
              <Select
                size="small"
                value={language}
                onChange={(e) => setLanguage(String(e.target.value))}
                sx={{ minWidth: 130, fontSize: "0.85rem" }}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.85rem" }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>

              {/* Ask the interviewer. Deliberately a toggle rather than an always-live mic:
                  the default stays muted, so nothing said while thinking is transcribed, and
                  speaking becomes an explicit act. */}
              {onToggleMic ? (
                <Button
                  size="small"
                  variant={micMuted ? "outlined" : "contained"}
                  color={micMuted ? "inherit" : "primary"}
                  onClick={onToggleMic}
                  data-testid="coding-ask-mic"
                  aria-pressed={!micMuted}
                  sx={{ ml: 1, textTransform: "none", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                >
                  {micMuted ? "Ask a question" : "Listening - tap to stop"}
                </Button>
              ) : null}
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, p: 1.5 }}>
              <CodeEditor
                value={code}
                onChange={(v) => setCode(v ?? "")}
                language={language}
                height="100%"
                theme="vs-dark"
                allowClipboard={allowClipboard}
              />
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderTop: "1px solid var(--border-default)",
            backgroundColor: "var(--surface)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: submitError ? "var(--ats-error)" : "var(--font-secondary)" }}
            role={submitError ? "alert" : undefined}
          >
            {submitError ||
              "Your code is auto-scored when the interview is submitted. There's no run button - focus on getting the logic right."}
          </Typography>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!code.trim()}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--accent-indigo)",
              "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              [PHONE]: { minHeight: 44 },
            }}
          >
            Submit Code &amp; Continue
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export const CodingQuestionModal = memo(CodingQuestionModalComponent);
CodingQuestionModal.displayName = "CodingQuestionModal";
