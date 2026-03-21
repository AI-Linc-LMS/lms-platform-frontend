"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Radio,
  RadioGroup,
  Checkbox,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FileUp, FileText, Eye } from "lucide-react";
import { resumeService, type SavedResume } from "@/lib/services/resume.service";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobDetailIllustration } from "@/components/jobs-v2/illustrations";
import { ResumeViewerModal } from "@/components/profile/ResumeViewerModal";

interface JobQuestionForApply {
  id: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order: number;
  options?: string[];
}

type ResumeMode = "saved" | "upload";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.4)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6366f1",
      borderWidth: 2,
    },
    "&.Mui-focused .MuiInputLabel-root": { color: "#6366f1" },
  },
};

export interface ApplyJobPageProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
  questions?: JobQuestionForApply[];
  onApply: (payload: {
    resume_url?: string;
    saved_resume_id?: number;
    responses?: Array<{ question_id: number; response_text: string }>;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ApplyJobPage({
  jobId,
  jobTitle,
  companyName,
  questions = [],
  onApply,
  onCancel,
}: ApplyJobPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showToast } = useToast();
  const [resumeMode, setResumeMode] = useState<ResumeMode>("saved");
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | "">("");
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<number | null>(null);
  const [questionResponses, setQuestionResponses] = useState<Record<number, string>>({});
  const [multichoiceResponses, setMultichoiceResponses] = useState<Record<number, string[]>>({});
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STEPS =
    questions.length > 0
      ? ["Your Resume", "Application Questions", "Review & Submit"]
      : ["Your Resume", "Review & Submit"];

  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === STEPS.length - 1;

  const loadResumes = useCallback(async () => {
    try {
      resumeService.invalidateResumesCache();
      const list = await resumeService.getSavedResumes();
      setSavedResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      }
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load resumes", "error");
      setSavedResumes([]);
    }
  }, [showToast]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        showToast("Please upload a PDF file", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be under 5MB", "error");
        return;
      }
      try {
        setUploading(true);
        const saved = await resumeService.uploadResume(file, file.name);
        setUploadedResumeUrl(saved.file_url);
        setUploadedResumeId(saved.id);
        setResumeMode("upload");
        showToast("Resume uploaded successfully", "success");
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to upload resume", "error");
      } finally {
        setUploading(false);
      }
    },
    [showToast]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const canProceedStep0 =
    (resumeMode === "saved" && selectedResumeId !== "") ||
    (resumeMode === "upload" && Boolean(uploadedResumeUrl));

  const canProceedStep1 =
    questions.length === 0 ||
    questions
      .filter((q) => q.is_required)
      .every((q) =>
        q.question_type === "multichoice"
          ? (multichoiceResponses[q.id] ?? []).length > 0
          : (questionResponses[q.id] ?? "").trim()
      );

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [STEPS.length]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    const requiredIds = questions.filter((q) => q.is_required).map((q) => q.id);
    const missing = requiredIds.filter((id) => {
      if (questions.find((q) => q.id === id)?.question_type === "multichoice") {
        return (multichoiceResponses[id] ?? []).length === 0;
      }
      return !(questionResponses[id] ?? "").trim();
    });
    if (missing.length > 0) {
      showToast("Please answer all required questions", "error");
      return;
    }
    const responses = questions
      .filter((q) => {
        if (q.question_type === "multichoice") {
          return (multichoiceResponses[q.id] ?? []).length > 0;
        }
        return (questionResponses[q.id] ?? "").trim();
      })
      .map((q) => {
        let text: string;
        if (q.question_type === "multichoice") {
          text = (multichoiceResponses[q.id] ?? []).join(", ");
        } else {
          text = questionResponses[q.id]?.trim() ?? "";
        }
        return { question_id: q.id, response_text: text };
      });

    if (resumeMode === "saved") {
      if (!selectedResumeId) {
        showToast("Please select a resume", "error");
        return;
      }
      try {
        setApplying(true);
        await onApply({ saved_resume_id: Number(selectedResumeId), responses: responses.length ? responses : undefined });
        onCancel();
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to apply", "error");
      } finally {
        setApplying(false);
      }
    } else {
      if (!uploadedResumeUrl) {
        showToast("Please upload a resume", "error");
        return;
      }
      const fullUrl = uploadedResumeUrl.startsWith("http")
        ? uploadedResumeUrl
        : `${config.apiBaseUrl.replace(/\/$/, "")}${uploadedResumeUrl.startsWith("/") ? "" : "/"}${uploadedResumeUrl}`;
      try {
        setApplying(true);
        await onApply({ resume_url: fullUrl, responses: responses.length ? responses : undefined });
        onCancel();
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to apply", "error");
      } finally {
        setApplying(false);
      }
    }
  }, [resumeMode, selectedResumeId, uploadedResumeUrl, questionResponses, multichoiceResponses, questions, onApply, onCancel, showToast]);

  const selectedResume = savedResumes.find((r) => r.id === selectedResumeId);
  const previewResumeId =
    resumeMode === "saved" ? (selectedResumeId ? Number(selectedResumeId) : null) : uploadedResumeId;
  const previewResumeName =
    resumeMode === "saved"
      ? selectedResume?.display_name || `Resume ${selectedResumeId}`
      : "Uploaded resume";

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            backgroundColor: "#fff",
            mb: 2.5,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)",
            },
            "&:hover": {
              borderColor: "rgba(99, 102, 241, 0.2)",
              boxShadow: "0 8px 30px rgba(99, 102, 241, 0.08)",
            },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#0f172a", fontSize: "1.05rem" }}>
            Your resume
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 0,
              p: 0.5,
              borderRadius: 2,
              backgroundColor: "#f1f5f9",
              width: "fit-content",
            }}
          >
            {(["saved", "upload"] as const).map((mode) => (
              <Box
                key={mode}
                component="button"
                type="button"
                onClick={() => setResumeMode(mode)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.5,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: resumeMode === mode ? "#fff" : "transparent",
                  color: resumeMode === mode ? "#0f172a" : "#64748b",
                  fontWeight: resumeMode === mode ? 600 : 500,
                  fontSize: "0.875rem",
                  boxShadow: resumeMode === mode ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s ease",
                  "&:hover": { backgroundColor: resumeMode === mode ? "#fff" : "rgba(255,255,255,0.6)" },
                }}
              >
                {mode === "saved" ? <FileText size={18} /> : <FileUp size={18} />}
                {mode === "saved" ? "Saved resume" : "Upload new"}
              </Box>
            ))}
          </Box>

          {resumeMode === "saved" && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { xs: "stretch", sm: "flex-end" } }}>
                <FormControl size="small" sx={{ flex: 1, minWidth: 0, ...inputSx }}>
                  <InputLabel id="saved-resume-label">Choose resume</InputLabel>
                  <Select
                    labelId="saved-resume-label"
                    value={selectedResumeId}
                    label="Choose resume"
                    onChange={(e) => setSelectedResumeId(e.target.value as number | "")}
                  >
                    {savedResumes.length === 0 ? (
                      <MenuItem value="" disabled>
                        No saved resumes. Upload one from Profile.
                      </MenuItem>
                    ) : (
                      savedResumes.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.display_name || `Resume ${r.id}`}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<Eye size={18} />}
                  onClick={() => setPreviewModalOpen(true)}
                  disabled={!selectedResumeId}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    "&:hover": { borderColor: "#4f46e5", backgroundColor: "rgba(99, 102, 241, 0.08)" },
                  }}
                >
                  Preview
                </Button>
              </Box>
            </Box>
          )}

          {resumeMode === "upload" && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <Box
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!uploading) e.currentTarget.style.borderColor = "#6366f1";
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = uploadedResumeUrl ? "#22c55e" : "rgba(99, 102, 241, 0.4)";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = uploadedResumeUrl ? "#22c55e" : "rgba(99, 102, 241, 0.4)";
                  const file = e.dataTransfer.files?.[0];
                  if (file && !uploading) processFile(file);
                }}
                sx={{
                  py: 4,
                  px: 3,
                  borderRadius: 2,
                  border: "2px dashed",
                  borderColor: uploadedResumeUrl ? "#22c55e" : "rgba(99, 102, 241, 0.4)",
                  backgroundColor: uploadedResumeUrl ? "rgba(34, 197, 94, 0.06)" : "rgba(99, 102, 241, 0.04)",
                  cursor: uploading ? "wait" : "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: uploading ? undefined : "#6366f1",
                    backgroundColor: uploading ? undefined : "rgba(99, 102, 241, 0.08)",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                  {uploading ? (
                    <CircularProgress size={40} sx={{ color: "#6366f1" }} />
                  ) : (
                    <FileUp size={44} style={{ color: uploadedResumeUrl ? "#22c55e" : "#6366f1" }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                    {uploading ? "Uploading..." : uploadedResumeUrl ? "Resume uploaded ✓" : "Click or drop PDF here (max 5MB)"}
                  </Typography>
                </Box>
              </Box>
              {uploadedResumeUrl && uploadedResumeId && (
                <Button
                  variant="outlined"
                  startIcon={<Eye size={18} />}
                  onClick={() => setPreviewModalOpen(true)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    alignSelf: "flex-start",
                    "&:hover": { borderColor: "#4f46e5", backgroundColor: "rgba(99, 102, 241, 0.08)" },
                  }}
                >
                  Preview uploaded resume
                </Button>
              )}
            </Box>
          )}
        </Paper>
      );
    }

    if (activeStep === 1 && questions.length > 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            backgroundColor: "#fff",
            mb: 2.5,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)",
            },
            "&:hover": {
              borderColor: "rgba(99, 102, 241, 0.2)",
              boxShadow: "0 8px 30px rgba(99, 102, 241, 0.08)",
            },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, color: "#0f172a", fontSize: "1.05rem" }}>
            Application questions
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {questions.map((q) => {
              const opts = q.options && q.options.length > 0 ? q.options : ["Yes", "No"];
              const isChoice = q.question_type === "choice" || q.question_type === "yes_no";
              const isMultichoice = q.question_type === "multichoice";
              const isText = q.question_type === "text" || q.question_type === "textarea";

              return (
                <Box key={q.id}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: "#334155" }}>
                    {q.question_text}
                    {q.is_required && (
                      <Typography component="span" color="error" sx={{ ml: 0.25 }}>
                        *
                      </Typography>
                    )}
                  </Typography>
                  {isChoice && (
                    <FormControl component="fieldset" sx={{ display: "block" }}>
                      <RadioGroup
                        value={questionResponses[q.id] ?? ""}
                        onChange={(e) => setQuestionResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        sx={{ gap: 0.5 }}
                      >
                        {opts.map((opt) => (
                          <FormControlLabel
                            key={opt}
                            value={opt}
                            control={
                              <Radio size="small" sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }} />
                            }
                            label={<Typography variant="body2" sx={{ color: "#475569" }}>{opt}</Typography>}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                  {isMultichoice && (
                    <FormGroup sx={{ gap: 0.5 }}>
                      {opts.map((opt) => (
                        <FormControlLabel
                          key={opt}
                          control={
                            <Checkbox
                              size="small"
                              checked={(multichoiceResponses[q.id] ?? []).includes(opt)}
                              onChange={(e) => {
                                setMultichoiceResponses((prev) => {
                                  const current = prev[q.id] ?? [];
                                  if (e.target.checked) {
                                    return { ...prev, [q.id]: [...current, opt] };
                                  }
                                  return { ...prev, [q.id]: current.filter((o) => o !== opt) };
                                });
                              }}
                              sx={{ color: "#6366f1", "&.Mui-checked": { color: "#6366f1" } }}
                            />
                          }
                          label={<Typography variant="body2" sx={{ color: "#475569" }}>{opt}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  )}
                  {isText && (
                    <TextField
                      fullWidth
                      size="small"
                      multiline={q.question_type === "textarea"}
                      rows={q.question_type === "textarea" ? 3 : 1}
                      value={questionResponses[q.id] ?? ""}
                      onChange={(e) => setQuestionResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Your answer"
                      required={q.is_required}
                      sx={inputSx}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      );
    }

    const reviewHeader = (
      <Box
        sx={{
          p: 3,
          borderRadius: 2.5,
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          mb: 3,
          "&::after": {
            content: '""',
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:clipboard-check-outline" size={30} color="#fff" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.7rem", letterSpacing: 1.5, fontWeight: 600 }}>
              Ready to submit
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", fontSize: "1.25rem", letterSpacing: "-0.02em", mt: 0.25 }}>
              Review your application
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mt: 0.5, fontWeight: 500 }}>
              {jobTitle} at {companyName}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", display: "block", mt: 0.75 }}>
              Please verify all details below before clicking Apply
            </Typography>
          </Box>
        </Box>
      </Box>
    );

    const resumeCard = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          p: 2.5,
          borderRadius: 2,
          backgroundColor: "#fff",
          border: "1px solid",
          borderColor: "rgba(99, 102, 241, 0.15)",
          boxShadow: "0 1px 3px rgba(99, 102, 241, 0.06)",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "rgba(99, 102, 241, 0.25)",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.05) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={26} style={{ color: "#6366f1" }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Resume
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
              {resumeMode === "saved" ? selectedResume?.display_name || `Resume ${selectedResumeId}` : "Uploaded resume"}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Eye size={18} />}
          onClick={() => setPreviewModalOpen(true)}
          disabled={!previewResumeId}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            borderColor: "#6366f1",
            color: "#6366f1",
            fontSize: "0.875rem",
            py: 1,
            px: 2,
            "&:hover": { borderColor: "#4f46e5", backgroundColor: "rgba(99, 102, 241, 0.08)" },
          }}
        >
          Preview
        </Button>
      </Box>
    );

    if (activeStep === 1 && questions.length === 0) {
      return (
        <Box sx={{ mb: 2.5 }}>
          {reviewHeader}
          {resumeCard}
        </Box>
      );
    }

    if (activeStep === 2) {
      return (
        <Box sx={{ mb: 2.5 }}>
          {reviewHeader}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeCard}
            {questions.length > 0 && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.12)",
                  boxShadow: "0 1px 3px rgba(99, 102, 241, 0.04)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      backgroundColor: "rgba(99, 102, 241, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconWrapper icon="mdi:format-list-checks" size={20} color="#6366f1" />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                    Your answers
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {questions.map((q, idx) => {
                    const text =
                      q.question_type === "multichoice"
                        ? (multichoiceResponses[q.id] ?? []).join(", ")
                        : questionResponses[q.id] ?? "";
                    if (!text) return null;
                    return (
                      <Box
                        key={q.id}
                        sx={{
                          p: 2,
                          borderRadius: 1.5,
                          backgroundColor: "#fafbff",
                          border: "1px solid",
                          borderColor: "rgba(99, 102, 241, 0.1)",
                          borderLeft: "3px solid #6366f1",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "#f8fafc",
                            borderColor: "rgba(99, 102, 241, 0.18)",
                          },
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 0.5, fontWeight: 600 }}>
                          Q{idx + 1}: {q.question_text}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", lineHeight: 1.6 }}>
                          {text}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: 3,
          p: 3.5,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 35%, #eef2ff 100%)",
          borderRadius: 2.5,
          mb: 3,
          border: "1px solid",
          borderColor: "rgba(99, 102, 241, 0.12)",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.06)",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: { xs: "100%", md: 110 },
            height: { xs: 88, md: 110 },
            position: "relative",
            zIndex: 1,
          }}
        >
          <JobDetailIllustration width={100} height={88} primaryColor="#6366f1" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>
            Apply for this role
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b", fontWeight: 500 }}>
            {jobTitle} · {companyName}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              mt: 0.5,
            }}
          >
            Step {activeStep + 1} of {STEPS.length}
            <Box component="span" sx={{ color: "rgba(0,0,0,0.3)" }}>·</Box>
            <Box component="span" sx={{ color: "#6366f1", fontWeight: 700 }}>{STEPS[activeStep]}</Box>
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <Stepper
          activeStep={activeStep}
          sx={{
            "& .MuiStepConnector-line": {
              borderColor: "rgba(99, 102, 241, 0.25)",
              borderTopWidth: 2,
              transition: "border-color 0.2s ease",
            },
            "& .MuiStepLabel-label": {
              fontWeight: 500,
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
              color: "#64748b",
            },
            "& .MuiStepIcon-root.Mui-completed": { color: "#16a34a" },
            "& .MuiStepIcon-root.Mui-completed .MuiStepIcon-text": { fill: "#fff" },
            "& .MuiStepIcon-root.Mui-active": { color: "#6366f1" },
            "& .MuiStepLabel-root.Mui-active .MuiStepLabel-label": {
              color: "#6366f1",
              fontWeight: 700,
            },
          }}
          alternativeLabel={!isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form content */}
      <Box sx={{ overflowY: "auto", pb: 2 }}>{renderStepContent()}</Box>

      {/* Sticky footer actions */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          p: 3,
          borderRadius: 2.5,
          borderTop: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          backgroundColor: "#fff",
          zIndex: 10,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              onClick={onCancel}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#64748b",
                px: 2,
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              }}
            >
              Cancel
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#64748b",
                  px: 2.5,
                  "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)", color: "#6366f1" },
                }}
              >
                Back
              </Button>
            )}
            {!isLastStep ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !canProceedStep0) || (activeStep === 1 && questions.length > 0 && !canProceedStep1)
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: "#6366f1",
                  boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
                  "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)" },
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={applying}
                startIcon={applying ? <CircularProgress size={18} color="inherit" /> : <IconWrapper icon="mdi:send" size={18} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: "#6366f1",
                  boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
                  "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)" },
                }}
              >
                {applying ? "Applying..." : "Apply"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <ResumeViewerModal
        open={previewModalOpen && previewResumeId != null}
        onClose={() => setPreviewModalOpen(false)}
        resumeId={previewResumeId}
        resumeName={previewResumeName}
        fullWidth
        context={isLastStep ? "review" : "resume"}
      />
    </Box>
  );
}
