"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { Certificate } from "@/lib/services/certificate.service";

interface CertificateShareButtonProps {
  certificate: Certificate;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

/**
 * Plug-and-play component for sharing certificates on LinkedIn
 * Simply pass a certificate object and it handles everything
 */
export function CertificateShareButton({
  certificate,
  variant = "contained",
  size = "medium",
  fullWidth = false,
}: CertificateShareButtonProps) {
  const { showToast } = useToast();
  const [postText, setPostText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const defaultPostText = `I'm excited to share that I've completed "${certificate.course_title}"! 🎓

This certificate represents my dedication to continuous learning and professional growth.

#Learning #ProfessionalDevelopment #${certificate.course_title.replace(/\s+/g, "")}`;

  const handleShareClick = () => {
    setPostText(defaultPostText);
    setShowDialog(true);
  };

  const handleShareToLinkedIn = () => {
    if (!postText.trim()) {
      showToast("Please enter a post message", "error");
      return;
    }

    setSharing(true);

    try {
      // LinkedIn Share API - share the certificate image URL directly
      const certificateImageUrl = encodeURIComponent(certificate.certificate_url);
      const summary = encodeURIComponent(postText);
      
      // LinkedIn Share URL
      const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${certificateImageUrl}&summary=${summary}`;

      // Open LinkedIn share in a new window
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      window.open(
        linkedInShareUrl,
        "LinkedIn Share",
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
      );

      showToast("Opening LinkedIn share dialog...", "info");
      setShowDialog(false);
      setPostText("");
    } catch (error: any) {
      showToast(error?.message || "Failed to share on LinkedIn", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleShareClick}
        startIcon={<IconWrapper icon="mdi:linkedin" size={20} />}
        sx={{
          bgcolor: variant === "contained" ? "#0077b5" : undefined,
          color: variant === "contained" ? "#ffffff" : "#0077b5",
          borderColor: variant === "outlined" ? "#0077b5" : undefined,
          "&:hover": {
            bgcolor: variant === "contained" ? "#005885" : undefined,
            backgroundColor: variant === "outlined" ? "rgba(0, 119, 181, 0.04)" : undefined,
          },
        }}
      >
        Share on LinkedIn
      </Button>

      <Dialog
        open={showDialog}
        onClose={() => !sharing && setShowDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            pb: 1,
          }}
        >
          <IconWrapper icon="mdi:linkedin" size={24} color="#0077b5" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Share on LinkedIn
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", mb: 2, fontSize: "0.875rem" }}
          >
            Customize your post message. The certificate will be shared with your post.
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Write your post message here..."
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "0.875rem",
              },
            }}
          />
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "#f9fafb",
              borderRadius: 1,
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              <strong>Note:</strong> The certificate image will be shared on LinkedIn. 
              Make sure the certificate URL is publicly accessible.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => {
              setShowDialog(false);
              setPostText("");
            }}
            disabled={sharing}
            sx={{ color: "#6b7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShareToLinkedIn}
            variant="contained"
            disabled={sharing || !postText.trim()}
            startIcon={
              sharing ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:share-variant" size={18} />
              )
            }
            sx={{
              bgcolor: "#0077b5",
              "&:hover": { bgcolor: "#005885" },
            }}
          >
            {sharing ? "Sharing..." : "Share"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

