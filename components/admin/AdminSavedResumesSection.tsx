"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { IconWrapper as Icon } from "@/components/common/IconWrapper";
import {
  adminProfileService,
  AdminSavedResume,
} from "@/lib/services/admin/admin-profile.service";
import { AdminResumeViewerModal } from "./AdminResumeViewerModal";

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
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function AdminResumePreviewCard({
  resume,
  studentId,
  onView,
  index,
}: {
  resume: AdminSavedResume;
  studentId: number;
  onView: () => void;
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
      const url = await adminProfileService.getStudentResumePdfBlobUrl(
        studentId,
        resume.id
      );
      setPreviewUrl(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [studentId, resume.id]);

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
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 3,
          backgroundColor: "#ffffff",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          "&:hover": {
            borderColor: "rgba(10, 102, 194, 0.25)",
            boxShadow: "0 12px 32px rgba(10, 102, 194, 0.12)",
            transform: "translateY(-4px)",
          },
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 300,
            backgroundColor: "#f1f5f9",
            position: "relative",
            overflow: "hidden",
          }}
        >
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
                background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon icon="mdi:file-pdf-box" size={40} color="#dc2626" />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 500 }}
              >
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
                backgroundColor: "#f8fafc",
              }}
            >
              <CircularProgress size={40} sx={{ color: "#0a66c2" }} />
              <Typography
                variant="caption"
                sx={{ color: "#64748b", fontWeight: 500 }}
              >
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
                backgroundColor: "#fef2f2",
                p: 2,
              }}
            >
              <Icon
                icon="mdi:file-document-alert-outline"
                size={44}
                color="#dc2626"
              />
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", textAlign: "center" }}
              >
                Preview unavailable
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#9ca3af", fontSize: "0.75rem" }}
              >
                Click to view
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
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
        </Box>
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#111827",
              fontSize: "0.9375rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mb: 0.25,
            }}
          >
            {resume.display_name || "Resume"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.8125rem" }}
          >
            {formatRelativeTime(resume.created_at)}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
}

interface AdminSavedResumesSectionProps {
  studentId: number;
  isActive?: boolean;
}

export function AdminSavedResumesSection({
  studentId,
  isActive = true,
}: AdminSavedResumesSectionProps) {
  const { t } = useTranslation("common");
  const [resumes, setResumes] = useState<AdminSavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingResume, setViewingResume] = useState<AdminSavedResume | null>(
    null
  );

  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProfileService.getStudentResumes(studentId);
      setResumes(data);
    } catch {
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isActive && studentId) {
      loadResumes();
    }
  }, [isActive, studentId, loadResumes]);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(10, 102, 194, 0.14) 0%, rgba(10, 102, 194, 0.06) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            <Icon icon="mdi:file-document-multiple-outline" size={30} color="#0a66c2" />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#111827",
                  fontSize: "1.3125rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {t("profile.savedResumes")}
              </Typography>
              {!loading && resumes.length > 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: "#6b7280", fontSize: "0.875rem" }}
                >
                  {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 6,
            }}
          >
            <CircularProgress size={40} sx={{ color: "#0a66c2" }} />
          </Box>
        ) : resumes.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            <AnimatePresence mode="popLayout">
              {resumes.map((resume, index) => (
                <AdminResumePreviewCard
                  key={resume.id}
                  resume={resume}
                  studentId={studentId}
                  index={index}
                  onView={() => setViewingResume(resume)}
                />
              ))}
            </AnimatePresence>
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              px: 4,
              border: "2px dashed #e2e8f0",
              borderRadius: 3,
              backgroundColor: "#fafbfc",
            }}
          >
            <Icon
              icon="mdi:file-document-outline"
              size={48}
              color="#94a3b8"
              style={{ marginBottom: 16 }}
            />
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              No saved resumes
            </Typography>
          </Box>
        )}
      </Paper>

      <AdminResumeViewerModal
        open={!!viewingResume}
        onClose={() => setViewingResume(null)}
        studentId={studentId}
        resumeId={viewingResume?.id ?? null}
        resumeName={viewingResume?.display_name}
      />
    </>
  );
}
