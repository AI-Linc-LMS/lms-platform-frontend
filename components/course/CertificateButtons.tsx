"use client";

import { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import {
  getLinkedInPostText,
  blobToBase64,
  CERTIFICATE_MIN_COMPLETION,
} from "@/lib/services/certificate-share.service";
import { DynamicCertificate } from "@/components/certificate/DynamicCertificate";
import { buildCourseCompletionCertificate } from "@/lib/certificate/copy";
import {
  buildCertificateBranding,
  finalizeBranding,
} from "@/lib/certificate/client-branding";
import { certificateElementToPngBlob } from "@/lib/utils/certificate-export.utils";

interface CertificateButtonsProps {
  courseId: number;
  courseTitle: string;
  certificateAvailable?: boolean;
  /** Overall course completion percentage (0–100). Buttons are actionable only when > 80%. */
  completionPercentage?: number;
  /** Score to show in LinkedIn post (e.g. "92%" or "100%") */
  score?: string;
  /** URL to share (certificate page or course page). Defaults to current window URL. */
  certificateUrl?: string;
}

export function CertificateButtons({
  courseTitle,
  certificateAvailable,
  completionPercentage = 0,
  score = "100%",
}: CertificateButtonsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePostText, setSharePostText] = useState("");
  const [shareCertificateBlob, setShareCertificateBlob] = useState<Blob | null>(null);
  const [shareImageObjectUrl, setShareImageObjectUrl] = useState<string | null>(null);
  const [copyBothStep, setCopyBothStep] = useState<"image" | "message">("image");
  const { clientInfo } = useClientInfo();
  const certRef = useRef<HTMLDivElement>(null);

  const certificateContent = useMemo(() => {
    if (!user || !courseTitle?.trim()) return null;
    const branding = finalizeBranding(buildCertificateBranding(clientInfo));
    return buildCourseCompletionCertificate({
      recipientName: getUserDisplayName(user),
      courseTitle: courseTitle.trim(),
      branding,
    });
  }, [user, courseTitle, clientInfo]);

  const canClaimCertificate =
    certificateAvailable === true &&
    completionPercentage >= CERTIFICATE_MIN_COMPLETION &&
    certificateContent != null;

  if (!certificateAvailable) {
    return null;
  }

  const safeName = (s: string) =>
    (s || "").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");

  const captureBlob = async (): Promise<Blob> => {
    const el = certRef.current;
    if (!el) throw new Error("Certificate is not ready");
    return certificateElementToPngBlob(el);
  };

  const handleDownloadCertificate = async () => {
    if (!user) {
      showToast("Please login to download certificate", "error");
      return;
    }
    if (!canClaimCertificate) {
      showToast(
        `Complete ${CERTIFICATE_MIN_COMPLETION}% of the course to download the certificate.`,
        "warning"
      );
      return;
    }

    try {
      setDownloading(true);
      const blob = await captureBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const studentName = getUserDisplayName(user);
      a.download = `certificate-${safeName(studentName)}-${safeName(courseTitle)}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Certificate downloaded successfully!", "success");
    } catch (error: unknown) {
      console.error("Download error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to download certificate",
        "error"
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleShareOnLinkedIn = async () => {
    if (!user) {
      showToast("Please login to share certificate", "error");
      return;
    }
    if (!canClaimCertificate) {
      showToast(
        `Complete ${CERTIFICATE_MIN_COMPLETION}% of the course to share your certificate.`,
        "warning"
      );
      return;
    }

    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const postText = getLinkedInPostText(
      {
        name: getUserDisplayName(user),
        course: courseTitle ?? "",
        score: score ?? "100%",
        certificateUrl: pageUrl,
      },
      clientInfo
    );

    setSharing(true);
    try {
      const blob = await captureBlob();
      setShareCertificateBlob(blob);
      const objectUrl = URL.createObjectURL(blob);
      setShareImageObjectUrl(objectUrl);

      try {
        await navigator.clipboard.writeText(postText);
        showToast("Message copied! Paste (Ctrl+V or Cmd+V) in LinkedIn.", "success");
      } catch {
        showToast('Could not copy. Use "Copy message" below.', "warning");
      }

      setSharePostText(postText);
      setShareDialogOpen(true);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to prepare share",
        "error"
      );
    } finally {
      setSharing(false);
    }
  };

  const handleCloseShareDialog = () => {
    if (shareImageObjectUrl) {
      URL.revokeObjectURL(shareImageObjectUrl);
      setShareImageObjectUrl(null);
    }
    setShareCertificateBlob(null);
    setCopyBothStep("image");
    setShareDialogOpen(false);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(sharePostText);
      showToast("Message copied! Paste (Ctrl+V or Cmd+V) in LinkedIn.", "success");
    } catch {
      showToast("Could not copy. Select the text above and copy manually.", "warning");
    }
  };

  const copyImageToClipboard = async (blob: Blob): Promise<boolean> => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch {
      try {
        const base64 = await blobToBase64(blob);
        const dataUrl = `data:image/png;base64,${base64}`;
        const html = `<img src="${dataUrl}" alt="Certificate" />`;
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
            "text/html": new Blob([html], { type: "text/html" }),
          }),
        ]);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleCopyImage = async () => {
    if (!shareCertificateBlob) return;
    const ok = await copyImageToClipboard(shareCertificateBlob);
    if (ok) {
      showToast("Certificate image copied! Paste (Ctrl+V or Cmd+V) in your LinkedIn post.", "success");
    } else {
      showToast(
        'Could not copy image. Please use Download Certificate, then add the file in LinkedIn.',
        "warning"
      );
    }
  };

  const handleCopyImageAndMessage = async () => {
    if (!shareCertificateBlob || !sharePostText) return;
    if (copyBothStep === "image") {
      const imageOk = await copyImageToClipboard(shareCertificateBlob);
      if (!imageOk) {
        showToast('Could not copy image. Use "Copy image" and "Copy message" separately.', "warning");
        return;
      }
      setCopyBothStep("message");
      showToast("Image copied! Paste in LinkedIn, then click the button again to copy your caption.", "success");
    } else {
      try {
        await navigator.clipboard.writeText(sharePostText);
        setCopyBothStep("image");
        showToast("Caption copied! Paste again in your LinkedIn post.", "success");
      } catch {
        showToast('Could not copy. Use "Copy message" instead.', "warning");
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        mt: 2,
      }}
    >
      {certificateContent ? (
        <Box
          sx={{
            position: "fixed",
            left: -14000,
            top: 0,
            width: 1200,
            height: 675,
            pointerEvents: "none",
            zIndex: -5,
            overflow: "visible",
          }}
          aria-hidden
        >
          <DynamicCertificate ref={certRef} content={certificateContent} />
        </Box>
      ) : null}

      {!certificateContent && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Sign in to generate your certificate.
        </Typography>
      )}
      {certificateContent && !canClaimCertificate && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Complete {CERTIFICATE_MIN_COMPLETION}% of the course to unlock certificate download and sharing.
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={
            downloading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:download" size={20} />
            )
          }
          onClick={handleDownloadCertificate}
          disabled={downloading || !user || !canClaimCertificate}
          sx={{
            backgroundColor: "#5A46A0",
            "&:hover": {
              backgroundColor: "#4a3a8a",
            },
          }}
        >
          {downloading ? "Downloading..." : "Download Certificate"}
        </Button>

        <Button
          variant="outlined"
          startIcon={
            sharing ? <CircularProgress size={20} /> : <IconWrapper icon="mdi:linkedin" size={20} />
          }
          onClick={handleShareOnLinkedIn}
          disabled={!user || sharing || !canClaimCertificate}
          sx={{
            borderColor: "#0077b5",
            color: "#0077b5",
            "&:hover": {
              borderColor: "#005885",
              backgroundColor: "rgba(0, 119, 181, 0.04)",
            },
          }}
        >
          Share on LinkedIn
        </Button>
      </Box>

      <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add to your LinkedIn post</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Open LinkedIn and start a new post. Click &quot;Copy image and message&quot; to copy the image,
            paste (Ctrl+V or Cmd+V) in the post, then click the same button again to copy your caption and
            paste again.
          </Typography>
          {shareImageObjectUrl && (
            <Box sx={{ mb: 2, borderRadius: 1, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareImageObjectUrl}
                alt="Certificate preview"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Message to paste:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 1,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "0.875rem",
              maxHeight: 220,
              overflow: "auto",
            }}
          >
            {sharePostText}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
          <Button onClick={handleCloseShareDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCopyMessage} variant="outlined" size="small">
            Copy message
          </Button>
          {shareCertificateBlob && (
            <Button onClick={handleCopyImage} variant="outlined" size="small">
              Copy image
            </Button>
          )}
          {shareCertificateBlob && sharePostText && (
            <Button onClick={handleCopyImageAndMessage} variant="outlined" size="small">
              {copyBothStep === "image" ? "Copy image and message" : "Copy caption (paste image first)"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
