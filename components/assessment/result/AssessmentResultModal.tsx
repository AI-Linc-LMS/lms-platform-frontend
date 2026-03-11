"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  Skeleton,
  Fade,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { assessmentService, AssessmentResult } from "@/lib/services/assessment.service";
import { AssessmentResultContent } from "./AssessmentResultContent";

interface AssessmentResultModalProps {
  open: boolean;
  onClose: () => void;
  assessmentSlug: string;
  assessmentName?: string;
}

export function AssessmentResultModal({
  open,
  onClose,
  assessmentSlug,
  assessmentName,
}: AssessmentResultModalProps) {
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [psychometricData, setPsychometricData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!open || !assessmentSlug) return;

    let isCancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setAssessmentResult(null);
    setPsychometricData(null);

    const loadData = async () => {
      try {
        const result = await assessmentService.getAssessmentResult(assessmentSlug);

        if (isCancelled) return;

        if ((result as any).assessment_meta) {
          setPsychometricData(result);
        } else {
          setAssessmentResult(result as AssessmentResult);
        }
      } catch {
        if (!isCancelled) {
          setLoadFailed(true);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [open, assessmentSlug]);

  const handleClose = () => {
    onClose();
  };

  const title = assessmentName || "Assessment Result";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 220 }}
      PaperProps={{
        sx: {
          maxHeight: "92vh",
          borderRadius: 3,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          overflow: "hidden",
        },
      }}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3 },
          py: 2,
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)",
          color: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:file-document-check-outline" size={24} color="#fff" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.125rem" },
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem" }}>
              Results Summary
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          aria-label="Close"
          sx={{
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
          }}
        >
          <IconWrapper icon="mdi:close" size={22} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8fafc",
        }}
      >
        {loading && (
          <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
                  gap: 2,
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: 2 }} />
                ))}
              </Box>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
            </Box>
          </Box>
        )}

        {loadFailed && !loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
              px: 4,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <IconWrapper icon="mdi:alert-circle-outline" size={40} color="#ef4444" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
              Failed to load results
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 3, color: "#6b7280", maxWidth: 360 }}>
              Assessment results could not be loaded. You can open the full result page in a new tab.
            </Typography>
            <Button
              component={Link}
              href={`/assessments/result/${assessmentSlug}`}
              target="_blank"
              variant="contained"
              startIcon={<IconWrapper icon="mdi:open-in-new" size={18} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              }}
            >
              Open in new tab
            </Button>
          </Box>
        )}

        {psychometricData && !loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
              px: 4,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <IconWrapper icon="mdi:chart-box-outline" size={40} color="#6366f1" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
              Detailed psychometric view
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 3, color: "#6b7280", maxWidth: 360 }}>
              Psychometric assessments have a rich, interactive view. Open in a new tab to explore
              your full results.
            </Typography>
            <Button
              component={Link}
              href={`/assessments/result/${assessmentSlug}`}
              target="_blank"
              variant="contained"
              startIcon={<IconWrapper icon="mdi:open-in-new" size={18} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              }}
            >
              Open full result
            </Button>
          </Box>
        )}

        {assessmentResult?.show_result === false && !loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
              px: 4,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <IconWrapper icon="mdi:clock-outline" size={40} color="#6366f1" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
              Evaluation in progress
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "#6b7280", maxWidth: 360 }}>
              Your assessment has been submitted successfully and is being evaluated. You will
              receive your results soon.
            </Typography>
          </Box>
        )}

        {assessmentResult &&
          assessmentResult.show_result !== false &&
          !loading &&
          !loadFailed &&
          !psychometricData && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  px: { xs: 2, sm: 3, md: 4 },
                  py: 3,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 3,
                    p: { xs: 2, sm: 3 },
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <AssessmentResultContent assessmentResult={assessmentResult} />
                </Box>
              </Box>
              <Box
                sx={{
                  px: { xs: 2, sm: 3, md: 4 },
                  py: 2,
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  backgroundColor: "#fff",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <Button
                  component={Link}
                  href={`/assessments/result/${assessmentSlug}`}
                  target="_blank"
                  size="small"
                  startIcon={<IconWrapper icon="mdi:open-in-new" size={16} />}
                  sx={{
                    textTransform: "none",
                    color: "#6366f1",
                    fontWeight: 600,
                    "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
                  }}
                >
                  Open full page
                </Button>
                <Button
                  variant="contained"
                  onClick={handleClose}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    ml: 1.5,
                    borderRadius: 2,
                    px: 2.5,
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
      </DialogContent>
    </Dialog>
  );
}
