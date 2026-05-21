"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
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
} from "@mui/material";
import { FileUp, FileText } from "lucide-react";
import { resumeService, type SavedResume } from "@/lib/services/resume.service";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";

interface JobQuestionForApply {
  id: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order: number;
  options?: string[];
}

interface ApplyJobDialogProps {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  questions?: JobQuestionForApply[];
  onApply: (payload: {
    resume_url?: string;
    saved_resume_id?: number;
    responses?: Array<{ question_id: number; response_text: string }>;
  }) => Promise<void>;
}

type ResumeMode = "saved" | "upload";

function ResumePreviewCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        mt: 2,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 1px 3px color-mix(in srgb, var(--font-primary) 8%, transparent)",
        border: "1px solid",
        borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid",
          borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <FileText size={14} style={{ color: "var(--font-secondary)" }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--font-secondary)", letterSpacing: "0.02em" }}>
          {label}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--background)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function ApplyJobDialog({
  open,
  onClose,
  jobTitle,
  companyName,
  questions = [],
  onApply,
}: ApplyJobDialogProps) {
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);

  const loadResumes = useCallback(async () => {
    if (!open) return;
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
  }, [open, showToast]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      prevOpenRef.current = true;
      loadResumes();
      setResumeMode("saved");
      setSelectedResumeId("");
      setUploadedResumeUrl(null);
      setUploadedResumeId(null);
      setQuestionResponses({});
      setMultichoiceResponses({});
      setPreviewUrl(null);
    }
    if (!open) prevOpenRef.current = false;
  }, [open, loadResumes]);

  useEffect(() => {
    const id = resumeMode === "saved" ? selectedResumeId : resumeMode === "upload" ? uploadedResumeId : null;
    if (id) {
      setPreviewLoading(true);
      setPreviewUrl(null);
      resumeService
        .getResumePdfBlobUrl(Number(id))
        .then(setPreviewUrl)
        .catch(() => setPreviewUrl(null))
        .finally(() => setPreviewLoading(false));
    } else {
      setPreviewUrl(null);
    }
  }, [resumeMode, selectedResumeId, uploadedResumeId]);

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
        onClose();
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
        onClose();
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to apply", "error");
      } finally {
        setApplying(false);
      }
    }
  }, [resumeMode, selectedResumeId, uploadedResumeUrl, questionResponses, multichoiceResponses, questions, onApply, onClose, showToast]);

  const canSubmit =
    ((resumeMode === "saved" && selectedResumeId !== "") ||
      (resumeMode === "upload" && Boolean(uploadedResumeUrl))) &&
    questions
      .filter((q) => q.is_required)
      .every((q) =>
        q.question_type === "multichoice"
          ? (multichoiceResponses[q.id] ?? []).length > 0
          : (questionResponses[q.id] ?? "").trim()
      );

  const selectedResume = savedResumes.find((r) => r.id === selectedResumeId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          boxShadow:
            "0 25px 50px -12px color-mix(in srgb, var(--font-primary) 30%, transparent)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          background:
            "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
          color: "var(--font-light)",
          px: 3,
          py: 2.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          Apply for this role
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          {jobTitle} · {companyName}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)", fontSize: "0.875rem" }}>
          Your resume
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 0,
            p: 0.5,
            borderRadius: 2,
            backgroundColor: "var(--surface)",
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
                backgroundColor: resumeMode === mode ? "var(--font-light)" : "transparent",
                color: resumeMode === mode ? "var(--font-primary)" : "var(--font-secondary)",
                fontWeight: resumeMode === mode ? 600 : 500,
                fontSize: "0.875rem",
                boxShadow: resumeMode === mode ? "0 1px 2px color-mix(in srgb, var(--font-primary) 7%, transparent)" : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: resumeMode === mode ? "var(--font-light)" : "color-mix(in srgb, var(--font-light) 60%, transparent)",
                },
              }}
            >
              {mode === "saved" ? <FileText size={18} /> : <FileUp size={18} />}
              {mode === "saved" ? "Saved resume" : "Upload new"}
            </Box>
          ))}
        </Box>

        {resumeMode === "saved" && (
          <>
            <FormControl size="small" fullWidth sx={{ mt: 2 }}>
              <InputLabel id="saved-resume-label">Choose resume</InputLabel>
              <Select
                labelId="saved-resume-label"
                value={selectedResumeId}
                label="Choose resume"
                onChange={(e) => setSelectedResumeId(e.target.value as number | "")}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "var(--card-bg)",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "color-mix(in srgb, var(--font-primary) 15%, transparent)" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-indigo)" },
                }}
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

            {selectedResumeId && (
              <ResumePreviewCard label={selectedResume?.display_name || `Resume ${selectedResumeId}`}>
                {previewLoading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={36} sx={{ color: "var(--accent-indigo)" }} />
                    <Typography variant="caption" color="text.secondary">
                      Loading preview...
                    </Typography>
                  </Box>
                ) : previewUrl ? (
                  <object
                    key={previewUrl}
                    data={previewUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ minHeight: 300 }}
                    title="Resume preview"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a resume to preview
                  </Typography>
                )}
              </ResumePreviewCard>
            )}
          </>
        )}

        {resumeMode === "upload" && (
          <>
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
                if (!uploading) e.currentTarget.style.borderColor = "var(--accent-indigo)";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = uploadedResumeUrl ? "var(--font-tertiary)" : "color-mix(in srgb, var(--accent-indigo) 45%, transparent)";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = uploadedResumeUrl ? "var(--font-tertiary)" : "color-mix(in srgb, var(--accent-indigo) 45%, transparent)";
                const file = e.dataTransfer.files?.[0];
                if (file && !uploading) processFile(file);
              }}
              sx={{
                mt: 2,
                py: 3,
                px: 3,
                borderRadius: 2,
                border: "2px dashed",
                borderColor: uploadedResumeUrl ? "var(--font-tertiary)" : "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
                backgroundColor: uploadedResumeUrl
                  ? "color-mix(in srgb, var(--success-500) 10%, transparent)"
                  : "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                cursor: uploading ? "wait" : "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: uploading ? undefined : "var(--accent-indigo)",
                  backgroundColor: uploading ? undefined : "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                {uploading ? (
                  <CircularProgress size={32} sx={{ color: "var(--accent-indigo)" }} />
                ) : (
                  <FileUp size={32} style={{ color: uploadedResumeUrl ? "var(--success-500)" : "var(--accent-indigo)" }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 500, color: "var(--font-secondary)" }}>
                  {uploading ? "Uploading..." : uploadedResumeUrl ? "Resume uploaded ✓" : "Click or drop PDF here (max 5MB)"}
                </Typography>
              </Box>
            </Box>

            {uploadedResumeUrl && (
              <ResumePreviewCard label="Uploaded resume">
                {previewLoading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={36} sx={{ color: "var(--accent-indigo)" }} />
                    <Typography variant="caption" color="text.secondary">
                      Loading preview...
                    </Typography>
                  </Box>
                ) : previewUrl ? (
                  <object
                    key={previewUrl}
                    data={previewUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ minHeight: 300 }}
                    title="Resume preview"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Preview unavailable
                  </Typography>
                )}
              </ResumePreviewCard>
            )}
          </>
        )}

        {questions.length > 0 && (
          <Box sx={{ mt: 3.5, pt: 3, borderTop: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 10%, transparent)" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)", fontSize: "0.875rem" }}>
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
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: "var(--font-secondary)" }}>
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
                          onChange={(e) =>
                            setQuestionResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          sx={{ gap: 0.5 }}
                        >
                          {opts.map((opt) => (
                            <FormControlLabel
                              key={opt}
                              value={opt}
                              control={
                                <Radio size="small" sx={{ color: "var(--accent-indigo)", "&.Mui-checked": { color: "var(--accent-indigo)" } }} />
                              }
                              label={<Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>{opt}</Typography>}
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
                                sx={{ color: "var(--accent-indigo)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                              />
                            }
                            label={<Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>{opt}</Typography>}
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
                        onChange={(e) =>
                          setQuestionResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Your answer"
                        required={q.is_required}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "var(--card-bg)",
                          },
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid",
          borderColor: "color-mix(in srgb, var(--font-primary) 10%, transparent)",
          backgroundColor: "var(--surface)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            color: "var(--font-secondary)",
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || applying}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            backgroundColor: "var(--accent-indigo)",
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
          }}
        >
          {applying ? "Applying..." : "Apply"}
        </Button>
      </Box>
    </Dialog>
  );
}
