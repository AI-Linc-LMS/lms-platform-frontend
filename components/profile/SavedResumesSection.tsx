"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PANEL_BORDER, PANEL_RADIUS, PANEL_SHADOW } from "./theme/profileTokens";
import { LoadingButton } from "@/components/common/LoadingButton";
import { resumeService, SavedResume } from "@/lib/services/resume.service";
import { SavedResumeDocuments } from "@/components/profile/resume/SavedResumeDocuments";

const MAX_RESUMES_PER_USER = 10;
import { ResumeUploadDialog } from "./ResumeUploadDialog";
import { ResumeViewerModal } from "./ResumeViewerModal";
import { useToast } from "@/components/common/Toast";
import { phoneSheetDialogSx } from "@/components/profile/phoneSheet";

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function ResumePreviewCard({
  resume,
  onView,
  onDownload,
  onDelete,
  deleting,
  index,
}: {
  resume: SavedResume;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  deleting: boolean;
  index: number;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const loadPreview = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    try {
      const url = await resumeService.getResumePdfBlobUrl(resume.id);
      setPreviewUrl(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [resume.id]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadPreview();
      },
      { rootMargin: "80px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadPreview]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{ height: "100%" }}
    >
      <Paper
        elevation={0}
        ref={ref}
        onClick={onView}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--border-default) 85%, transparent)",
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
          "&:hover": {
            borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default))",
            boxShadow: "0 12px 32px color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
            transform: "translateY(-4px)",
            "& .resume-card-actions": { opacity: 1, pointerEvents: "auto" },
          },
        }}
      >
        {/* PDF Preview Area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 300,
            backgroundColor: "color-mix(in srgb, var(--surface) 82%, var(--background))",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Placeholder when not loaded */}
          {!previewUrl && !loading && !error && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--surface) 72%, var(--background)) 0%, color-mix(in srgb, var(--surface) 88%, var(--background)) 100%)",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--error-500) 14%, transparent) 0%, color-mix(in srgb, var(--error-500) 8%, transparent) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:file-pdf-box" size={40} color="var(--error-500)" />
              </Box>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
                Scroll to load preview
              </Typography>
            </Box>
          )}
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                backgroundColor: "color-mix(in srgb, var(--surface) 74%, var(--background))",
              }}
            >
              <CircularProgress size={40} sx={{ color: "var(--accent-indigo)" }} />
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
                Loading preview…
              </Typography>
            </Box>
          )}
          {error && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                backgroundColor: "color-mix(in srgb, var(--error-500) 14%, var(--card-bg))",
                p: 2,
              }}
            >
              <IconWrapper icon="mdi:file-document-alert-outline" size={44} color="var(--error-500)" />
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", textAlign: "center" }}>
                Preview unavailable
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.75rem" }}>
                Click to view or download
              </Typography>
            </Box>
          )}
          {previewUrl && !loading && !error && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                p: 1.5,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px color-mix(in srgb, var(--font-primary) 18%, transparent)",
                }}
              >
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0`}
                  title={resume.display_name}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    pointerEvents: "none",
                  }}
                />
              </Box>
            </Box>
          )}
          {/* Hover overlay with actions - clicking card opens viewer */}
          <Box
            className="resume-card-actions"
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--font-primary) 50%, transparent) 100%)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 1,
              p: 2,
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 0.25s ease",
            }}
          >
            <Tooltip title="Download">
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                sx={{
                  backgroundColor: "color-mix(in srgb, var(--card-bg) 95%, transparent)",
                  color: "var(--accent-indigo)",
                  "&:hover": { backgroundColor: "var(--card-bg)", transform: "scale(1.08)" },
                }}
              >
                <IconWrapper icon="mdi:download" size={22} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={deleting}
                sx={{
                  backgroundColor: "color-mix(in srgb, var(--card-bg) 95%, transparent)",
                  color: "var(--error-500)",
                  "&:hover": { backgroundColor: "var(--card-bg)", transform: "scale(1.08)" },
                }}
              >
                {deleting ? (
                  <CircularProgress size={20} sx={{ color: "var(--error-500)" }} />
                ) : (
                  <IconWrapper icon="mdi:delete-outline" size={22} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Card footer */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid color-mix(in srgb, var(--border-default) 85%, transparent)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary)",
              fontSize: "0.9375rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mb: 0.25,
            }}
          >
            {resume.display_name || "Resume"}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem" }}>
            {formatRelativeTime(resume.created_at)}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
}

/**
 * The Saved resumes tab.
 *
 * It holds TWO different things, and they are not interchangeable:
 *
 *  - resume DOCUMENTS - content, template and section order - which is what the builder is driven
 *    from, so one can be reopened and edited. These are listed first, because they are the ones a
 *    learner can still do something with.
 *  - rendered PDFs. A PDF is what leaves the product: attached to an application, read by someone
 *    else. Every page of one is rasterised, so nothing in it can be edited again - which is why
 *    these rows offer View, Download and Delete and no Edit. They also include resumes uploaded
 *    from a file, which never had a document behind them at all.
 *
 * Until now this tab showed only the second kind, and the first was listed inside the builder,
 * under the form editing one of them.
 */
interface SavedResumesSectionProps {
  isActive?: boolean;
  /** The document the builder currently has open, so its row reads "Editing now". */
  openDocumentId?: number | null;
  /** Reopen this document in the builder. Absent, the documents list is not offered at all. */
  onEditDocument?: (id: number) => void;
  /** A document was renamed, duplicated or deleted here. */
  onDocumentsChanged?: () => void;
}

export function SavedResumesSection({
  isActive = true,
  openDocumentId = null,
  onEditDocument,
  onDocumentsChanged,
}: SavedResumesSectionProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<SavedResume | null>(null);
  const [viewingResume, setViewingResume] = useState<SavedResume | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await resumeService.getSavedResumes();
      setResumes(data);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      loadResumes();
    }
  }, [isActive, loadResumes]);

  const handleUpload = async (file: File) => {
    try {
      await resumeService.uploadResume(file);
      showToast(t("profile.resumeUploadSuccess"), "success");
      loadResumes();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("profile.resumeUploadFailed");
      showToast(message, "error");
    }
  };

  const atResumeLimit = resumes.length >= MAX_RESUMES_PER_USER;

  const handleDeleteClick = (resume: SavedResume) => {
    setResumeToDelete(resume);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;
    const id = resumeToDelete.id;
    try {
      setDeletingId(id);
      await resumeService.deleteResume(id);
      setResumeToDelete(null);
      showToast(t("profile.resumeDeleteSuccess"), "success");
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast(t("profile.resumeDeleteFailed"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* The editable ones first. */}
      {onEditDocument && (
        <Box sx={{ mb: 2.5 }}>
          <SavedResumeDocuments
            isActive={isActive}
            openId={openDocumentId}
            onEdit={onEditDocument}
            onChanged={onDocumentsChanged}
          />
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.75 },
          border: PANEL_BORDER,
          borderRadius: PANEL_RADIUS,
          boxShadow: PANEL_SHADOW,
          backgroundColor: "var(--card-bg)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 18%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 9%, transparent) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--card-bg) 50%, transparent)",
              }}
            >
              <IconWrapper icon="mdi:file-document-multiple-outline" size={30} color="var(--accent-indigo)" />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "var(--font-primary)",
                    fontSize: "1.3125rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t("savedResumes.pdfTitle", { defaultValue: "PDF copies" })}
                </Typography>
                {!loading && resumes.length > 0 && (
                  <Chip
                    label={resumes.length}
                    size="small"
                    sx={{
                      height: 26,
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                      color: "var(--accent-indigo)",
                      "& .MuiChip-label": { px: 1.5 },
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.875rem", mt: 0.25 }}>
                {!loading &&
                  (resumes.length === 0
                    ? "Upload your first resume to get started"
                    : atResumeLimit
                      ? t("profile.resumeCountAtLimit", {
                          count: resumes.length,
                          max: MAX_RESUMES_PER_USER,
                        })
                      : `${resumes.length} ${resumes.length === 1 ? "resume" : "resumes"} saved`)}
              </Typography>
            </Box>
          </Box>
          <Tooltip
            title={atResumeLimit ? t("profile.resumeLimitReached", { max: MAX_RESUMES_PER_USER }) : ""}
          >
            <span>
              <Button
                variant="contained"
                startIcon={<IconWrapper icon="mdi:upload" size={20} />}
                onClick={() => !atResumeLimit && setUploadDialogOpen(true)}
                disabled={atResumeLimit}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  px: 3,
                  backgroundColor: "var(--accent-purple)",
                  color: "var(--font-light)",
                  "&:hover": {
                    backgroundColor: "var(--accent-indigo-dark)",
                  },
                }}
              >
                {t("profile.uploadResume")}
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Said once, here, rather than left for a learner to discover by looking for an Edit
            button that cannot exist. A PDF page is an image; there is nothing in it to edit, and
            an uploaded one never had a document behind it to go back to. */}
        <Typography
          variant="body2"
          sx={{ color: "var(--font-secondary)", fontSize: "0.875rem", lineHeight: 1.65, mb: 2.5 }}
        >
          {t("savedResumes.pdfHint", {
            defaultValue:
              "These are finished PDFs - what you attach to an application. They cannot be edited: to change one, edit the resume above and save a new PDF from the Resume builder.",
          })}
        </Typography>

        {loading ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Box
                  sx={{
                    height: 380,
                    borderRadius: 3,
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, var(--surface) 84%, var(--background)) 0%, color-mix(in srgb, var(--border-default) 40%, var(--surface)) 100%)",
                    animation: "shimmer 1.5s ease-in-out infinite",
                    "@keyframes shimmer": {
                      "0%, 100%": { opacity: 0.7 },
                      "50%": { opacity: 1 },
                    },
                  }}
                />
              </motion.div>
            ))}
          </Box>
        ) : resumes.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            <AnimatePresence mode="popLayout">
              {resumes.map((resume, index) => (
                <ResumePreviewCard
                  key={resume.id}
                  resume={resume}
                  index={index}
                  onView={() => setViewingResume(resume)}
                  onDownload={() => resumeService.openDownload(resume.id)}
                  onDelete={() => handleDeleteClick(resume)}
                  deleting={deletingId === resume.id}
                />
              ))}
            </AnimatePresence>
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                textAlign: "center",
                py: 10,
                px: 4,
                border: "2px dashed color-mix(in srgb, var(--border-default) 88%, transparent)",
                borderRadius: 3,
                backgroundColor: "color-mix(in srgb, var(--surface) 60%, var(--background))",
                transition: "all 0.25s ease",
                cursor: "pointer",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, var(--background))",
                  "& .upload-hint": { opacity: 1 },
                },
              }}
              onClick={() => setUploadDialogOpen(true)}
            >
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 14%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 8%, transparent) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                  transition: "transform 0.25s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <IconWrapper icon="mdi:file-document-plus-outline" size={48} color="var(--accent-indigo)" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-primary)",
                  fontSize: "1.25rem",
                  mb: 0.5,
                }}
              >
                {t("profile.noResumesYet")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.9375rem",
                  maxWidth: 380,
                  mx: "auto",
                  lineHeight: 1.65,
                  mb: 2,
                }}
              >
                {t("profile.uploadResumeToGetStarted")}
              </Typography>
              <Typography
                className="upload-hint"
                variant="caption"
                sx={{
                  color: "var(--accent-indigo)",
                  fontWeight: 600,
                  opacity: 0.8,
                  transition: "opacity 0.25s ease",
                }}
              >
                Click here or use the button above to upload
              </Typography>
            </Box>
          </motion.div>
        )}
      </Paper>

      <ResumeUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
      />

      <ResumeViewerModal
        open={!!viewingResume}
        onClose={() => setViewingResume(null)}
        resumeId={viewingResume?.id ?? null}
        resumeName={viewingResume?.display_name || "Resume"}
      />

      <Dialog
        sx={phoneSheetDialogSx}
        open={!!resumeToDelete}
        onClose={() => !deletingId && setResumeToDelete(null)}
        PaperProps={{
          sx: { borderRadius: 2, maxWidth: 400 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
          {t("profile.deleteResumeTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.6 }}>
            {t("profile.deleteResumeMessage", {
              name: resumeToDelete?.display_name || "Resume",
            })}
          </Typography>
          {/* An application does not keep its own copy: it stores a link to this very file, and
              deleting the row deletes the file. A recruiter opening it afterwards gets nothing.
              The learner is the only person who can know whether that matters, so they are told
              rather than stopped. */}
          <Typography
            variant="body2"
            sx={{ color: "var(--font-secondary)", lineHeight: 1.6, mt: 1.25, fontWeight: 600 }}
          >
            {t("savedResumes.pdfDeleteWarning", {
              defaultValue:
                "Any job application you sent with this PDF links to this file. Deleting it leaves those applications with nothing to open.",
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setResumeToDelete(null)}
            sx={{ textTransform: "none", color: "var(--font-secondary)" }}
          >
            {t("profile.cancel")}
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            loading={deletingId !== null}
            loadingText={t("common.deleting")}
            startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {t("profile.deleteResume")}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
