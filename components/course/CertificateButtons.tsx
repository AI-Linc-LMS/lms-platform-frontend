"use client";

import { useState, useEffect } from "react";
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
  getLinkedInShareUrl,
  blobToBase64,
  CERTIFICATE_MIN_COMPLETION,
  checkCertificateImageInPublicImages,
} from "@/lib/services/certificate-share.service";

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
  courseId,
  courseTitle,
  certificateAvailable,
  completionPercentage = 0,
  score = "100%",
  certificateUrl,
}: CertificateButtonsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [imageAvailable, setImageAvailable] = useState<boolean | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePostText, setSharePostText] = useState("");
  const [shareCertificateBlob, setShareCertificateBlob] = useState<Blob | null>(null);
  const [shareImageObjectUrl, setShareImageObjectUrl] = useState<string | null>(null);
  const { clientInfo } = useClientInfo();

  useEffect(() => {
    if (!courseTitle?.trim()) {
      setImageAvailable(false);
      return;
    }
    const check = async () => {
      try {
        const available = await checkCertificateImageInPublicImages(courseTitle);
        setImageAvailable(available);
      } catch {
        setImageAvailable(false);
      }
    };
    check();
  }, [courseTitle]);

  const canClaimCertificate =
    certificateAvailable === true &&
    completionPercentage >= CERTIFICATE_MIN_COMPLETION &&
    imageAvailable === true;

  if (!certificateAvailable) {
    return null;
  }

  const handleDownloadCertificate = async () => {
    if (!user) {
      showToast("Please login to download certificate", "error");
      return;
    }
    if (imageAvailable !== true) {
      showToast("Certificate image is not available for this course.", "warning");
      return;
    }
    if (!canClaimCertificate) {
      showToast(`Complete ${CERTIFICATE_MIN_COMPLETION}% of the course to download the certificate.`, "warning");
      return;
    }

    try {
      setDownloading(true);
      const studentName = getUserDisplayName(user);

      // Generate certificate
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName,
          courseName: courseTitle,
          index: 0, // You can get this from backend if needed
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate certificate");
      }

      // Download the image
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${courseTitle.replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("Certificate downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Download error:", error);
      showToast(error.message || "Failed to download certificate", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareOnLinkedIn = async () => {
    if (!user) {
      showToast("Please login to share certificate", "error");
      return;
    }
    if (imageAvailable !== true) {
      showToast("Certificate image is not available for this course.", "warning");
      return;
    }
    if (!canClaimCertificate) {
      showToast(`Complete ${CERTIFICATE_MIN_COMPLETION}% of the course to share your certificate.`, "warning");
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
      const studentName = getUserDisplayName(user);
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          courseName: courseTitle ?? "",
          index: 0,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to generate certificate");
      }

      const blob = await response.blob();
      setShareCertificateBlob(blob);
      const objectUrl = URL.createObjectURL(blob);
      setShareImageObjectUrl(objectUrl);

      try {
        await navigator.clipboard.writeText(postText);
        showToast("Message copied! Paste (Ctrl+V or Cmd+V) in LinkedIn.", "success");
      } catch {
        showToast("Could not copy. Use \"Copy message\" below.", "warning");
      }

      setSharePostText(postText);
      setShareDialogOpen(true);
    } catch (error: any) {
      showToast(error?.message ?? "Failed to prepare share", "error");
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
    setShareDialogOpen(false);
  };

  const handleOpenLinkedInFromDialog = () => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareUrl = getLinkedInShareUrl(pageUrl);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    handleCloseShareDialog();
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(sharePostText);
      showToast("Message copied! Paste (Ctrl+V or Cmd+V) in LinkedIn.", "success");
    } catch {
      showToast("Could not copy. Select the text above and copy manually.", "warning");
    }
  };

  const handleCopyImage = async () => {
    if (!shareCertificateBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": shareCertificateBlob }),
      ]);
      showToast("Certificate image copied! Paste (Ctrl+V or Cmd+V) in your LinkedIn post.", "success");
    } catch {
      try {
        const base64 = await blobToBase64(shareCertificateBlob);
        const dataUrl = `data:image/png;base64,${base64}`;
        const html = `<img src="${dataUrl}" alt="Certificate" />`;
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": shareCertificateBlob,
            "text/html": new Blob([html], { type: "text/html" }),
          }),
        ]);
        showToast("Certificate image copied! Paste (Ctrl+V or Cmd+V) in your LinkedIn post.", "success");
      } catch {
        showToast("Could not copy image. Please use Download Certificate, then add the file in LinkedIn.", "warning");
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
      {imageAvailable === null && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Checking certificate availability…
        </Typography>
      )}
      {imageAvailable === false && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Certificate template is not available for this course.
        </Typography>
      )}
      {imageAvailable === true && !canClaimCertificate && (
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
          disabled={downloading || !user || !canClaimCertificate || imageAvailable !== true}
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
            sharing ? (
              <CircularProgress size={20} />
            ) : (
              <IconWrapper icon="mdi:linkedin" size={20} />
            )
          }
          onClick={handleShareOnLinkedIn}
          disabled={!user || sharing || !canClaimCertificate || imageAvailable !== true}
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
            Your message is already copied. Open LinkedIn, paste (Ctrl+V or Cmd+V) to add the message, then click &quot;Copy image&quot; here and paste again in the post to add the certificate image.
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
          <Button
            onClick={handleOpenLinkedInFromDialog}
            variant="contained"
            startIcon={<IconWrapper icon="mdi:linkedin" size={20} />}
            sx={{
              backgroundColor: "#0077b5",
              "&:hover": { backgroundColor: "#005885" },
            }}
          >
            Open LinkedIn
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
