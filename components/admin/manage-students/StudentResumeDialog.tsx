"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Chip, CircularProgress, IconButton, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";
import {
  adminStudentService,
  type ManagedStudentResume,
  type ManagedStudentResumeDocument,
  type ManagedStudentResumes,
} from "@/lib/services/admin/admin-student.service";

/* ==========================================================================
 * A student's saved resumes, opened from Manage Students. Read-only.
 *
 * Manage Students said "Saved resume: Yes" and nothing on the screen could open it.
 *
 * A resume comes in two halves and this shows both, because the column above counts both (see
 * `accounts/resume_presence.py`, which computes the flag and these lists together). A PDF is a
 * file: it opens. A builder document is structured content whose templates live in the learner's
 * builder, so there is nothing for the server to render and nothing here to open - it is listed
 * as a fact about the student, with no button that would fail.
 *
 * A saved resume is the PDF the learner exported from the resume builder (the builder's template
 * is baked into it) or a PDF they uploaded, so the faithful view IS that file. It opens in a new
 * tab rather than an iframe on purpose: a learner-supplied PDF is untrusted, and Chrome's PDF
 * viewer follows a link inside the document by navigating the TOP window, so an embedded PDF could
 * replace this admin tab with any page. Chrome will not render a PDF in a sandboxed frame, so no
 * frame setting makes that safe. In its own tab, a link in the PDF can only move that tab.
 *
 * Desktop: a dialog. Phone: a bottom sheet (ResponsiveDialog), full-width actions.
 * ======================================================================== */

export interface StudentResumeDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: number | null;
  studentName?: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: ManagedStudentResumes; forId: number };

/** Blob URLs live this long after an open or a download, then are released. */
const BLOB_TTL_MS = 60_000;

function pdfFileName(name: string): string {
  const base = (name || "resume").trim().replace(/\.pdf$/i, "") || "resume";
  return `${base}.pdf`;
}

function formatSavedDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function StudentResumeDialog({ open, onClose, studentId, studentName }: StudentResumeDialogProps) {
  const { t, i18n } = useTranslation("common");
  const [loaded, setState] = useState<LoadState>({ kind: "loading" });
  // Reopened for a different student: never show the previous student's list for a frame.
  const state: LoadState = loaded.kind === "ready" && loaded.forId !== studentId ? { kind: "loading" } : loaded;
  const [busy, setBusy] = useState<{ id: number; action: "open" | "download" } | null>(null);
  const [actionError, setActionError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open || !studentId) return;
    let cancelled = false;
    setState({ kind: "loading" });
    setActionError(false);
    adminStudentService
      .getStudentResumes(studentId)
      .then((data) => {
        if (!cancelled) setState({ kind: "ready", data, forId: studentId });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [open, studentId, attempt]);

  const fetchPdfUrl = useCallback(
    async (resume: ManagedStudentResume) => {
      const blob = await adminStudentService.getStudentResumePdf(studentId as number, resume.id);
      const pdf = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdf);
      window.setTimeout(() => URL.revokeObjectURL(url), BLOB_TTL_MS);
      return url;
    },
    [studentId],
  );

  const handleOpen = async (resume: ManagedStudentResume) => {
    if (!studentId || busy) return;
    // Opened inside the click so a popup blocker lets it through, then pointed at the PDF once it
    // has arrived. The opener is cut first: the new tab cannot reach back into this one.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    setBusy({ id: resume.id, action: "open" });
    setActionError(false);
    try {
      const url = await fetchPdfUrl(resume);
      if (tab && !tab.closed) {
        tab.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      tab?.close();
      setActionError(true);
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (resume: ManagedStudentResume) => {
    if (!studentId || busy) return;
    setBusy({ id: resume.id, action: "download" });
    setActionError(false);
    try {
      const url = await fetchPdfUrl(resume);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFileName(resume.display_name);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setActionError(true);
    } finally {
      setBusy(null);
    }
  };

  const name =
    (state.kind === "ready" && state.data.student_name) || studentName || "";

  let body: ReactNode;
  if (state.kind === "loading") {
    body = (
      <Box role="status" sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <CircularProgress size={36} sx={{ color: "var(--accent-indigo)" }} />
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {t("adminManageStudents.resumeViewer.loading", "Loading resume…")}
        </Typography>
      </Box>
    );
  } else if (state.kind === "error") {
    body = (
      <Box role="alert" sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, textAlign: "center" }}>
        <IconWrapper icon="mdi:file-document-alert-outline" size={40} color="var(--error-500, #dc2626)" />
        <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 600 }}>
          {t("adminManageStudents.resumeViewer.loadFailed", "Couldn't load this student's resume.")}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setAttempt((n) => n + 1)}
          sx={{ textTransform: "none", fontWeight: 600, [PHONE]: { minHeight: 44 } }}
        >
          {t("adminManageStudents.resumeViewer.retry", "Try again")}
        </Button>
      </Box>
    );
  } else if (state.data.resumes.length === 0 && (state.data.documents ?? []).length === 0) {
    body = (
      <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, textAlign: "center" }}>
        <IconWrapper icon="mdi:file-document-outline" size={40} color="var(--font-tertiary, #94a3b8)" />
        <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 600 }}>
          {t("adminManageStudents.resumeViewer.empty", { name, defaultValue: "{{name}} has not saved a resume yet." })}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", maxWidth: 360 }}>
          {t(
            "adminManageStudents.resumeViewer.emptyHint",
            "A resume shows up here once the student saves one from the resume builder on their profile, or uploads a PDF.",
          )}
        </Typography>
      </Box>
    );
  } else {
    body = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pb: 1 }}>
        {state.data.resumes.map((resume, index) => {
          const opening = busy?.id === resume.id && busy.action === "open";
          const downloading = busy?.id === resume.id && busy.action === "download";
          const date = formatSavedDate(resume.created_at, i18n?.language);
          return (
            <Box
              key={resume.id}
              data-testid="student-resume-item"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid var(--border-default, #e5e7eb)",
                backgroundColor: index === 0 ? "color-mix(in srgb, var(--accent-indigo) 5%, var(--card-bg))" : "var(--card-bg)",
                [PHONE]: { flexWrap: "wrap" },
              }}
            >
              <IconWrapper icon="mdi:file-pdf-box" size={32} color="var(--accent-indigo)" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--font-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={resume.display_name}
                  >
                    {resume.display_name}
                  </Typography>
                  {index === 0 && state.data.resumes.length > 1 && (
                    <Chip size="small" label={t("adminManageStudents.resumeViewer.latest", "Latest")} sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
                  )}
                </Box>
                {date && (
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                    {t("adminManageStudents.resumeViewer.savedOn", { date, defaultValue: "Saved {{date}}" })}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, [PHONE]: { width: "100%" } }}>
                <Button
                  variant={index === 0 ? "contained" : "outlined"}
                  size="small"
                  disabled={Boolean(busy)}
                  onClick={() => handleOpen(resume)}
                  startIcon={opening ? <CircularProgress size={14} color="inherit" /> : <IconWrapper icon="mdi:open-in-new" size={16} />}
                  sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap", [PHONE]: { flex: 1, minHeight: 44 } }}
                >
                  {t("adminManageStudents.resumeViewer.openPdf", "Open PDF")}
                </Button>
                <IconButton
                  size="small"
                  disabled={Boolean(busy)}
                  onClick={() => handleDownload(resume)}
                  aria-label={t("adminManageStudents.resumeViewer.downloadOf", {
                    name: resume.display_name,
                    defaultValue: "Download {{name}}",
                  })}
                  title={t("adminManageStudents.resumeViewer.download", "Download")}
                  sx={{ color: "var(--accent-indigo)", border: "1px solid var(--border-default, #e5e7eb)", [PHONE]: { width: 44, height: 44 } }}
                >
                  {downloading ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:download" size={18} />}
                </IconButton>
              </Box>
            </Box>
          );
        })}
        {(state.data.documents ?? []).map((doc: ManagedStudentResumeDocument) => {
          const edited = formatSavedDate(doc.updated_at, i18n?.language);
          return (
            <Box
              key={`doc-${doc.id}`}
              data-testid="student-resume-document"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: "1px dashed var(--border-default, #e5e7eb)",
                backgroundColor: "var(--card-bg)",
                [PHONE]: { flexWrap: "wrap" },
              }}
            >
              <IconWrapper icon="mdi:file-document-edit-outline" size={32} color="var(--font-tertiary, #94a3b8)" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--font-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={doc.display_name}
                >
                  {doc.display_name}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
                  {edited
                    ? t("adminManageStudents.resumeViewer.editedOn", {
                        date: edited,
                        defaultValue: "In the resume builder \u00b7 last edited {{date}}",
                      })
                    : t("adminManageStudents.resumeViewer.inBuilder", "In the resume builder")}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={t("adminManageStudents.resumeViewer.noPdfYet", "No PDF yet")}
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}
              />
            </Box>
          );
        })}
        {actionError && (
          <Typography role="alert" variant="caption" sx={{ color: "var(--error-500, #dc2626)", fontWeight: 600 }}>
            {t("adminManageStudents.resumeViewer.actionFailed", "Couldn't open this resume. Try again.")}
          </Typography>
        )}
        {state.data.resumes.length > 0 && (
          <Typography variant="caption" sx={{ color: "var(--font-tertiary, #94a3b8)" }}>
            {t("adminManageStudents.resumeViewer.opensInTab", "Opens in a new tab, exactly as the student saved it.")}
          </Typography>
        )}
        {(state.data.documents ?? []).length > 0 && (
          <Typography variant="caption" sx={{ color: "var(--font-tertiary, #94a3b8)" }}>
            {t(
              "adminManageStudents.resumeViewer.documentHint",
              "A resume still in the builder has no file to open. It becomes readable here once the student saves a PDF copy.",
            )}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={t("adminManageStudents.resumeViewer.title", "Saved resume")}
      description={name || undefined}
      maxWidth="sm"
      data-testid="student-resume-dialog"
    >
      {body}
    </ResponsiveDialog>
  );
}
