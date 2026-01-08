"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { Certificate } from "@/lib/services/certificate.service";

interface CertificateViewerProps {
  certificate: Certificate;
  onClose?: () => void;
}

export function CertificateViewer({
  certificate,
  onClose,
}: CertificateViewerProps) {
  const { showToast } = useToast();
  const [postText, setPostText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const defaultPostText = `I'm excited to share that I've completed "${certificate.course_title}"! 🎓

This certificate represents my dedication to continuous learning and professional growth.

#Learning #ProfessionalDevelopment #${certificate.course_title.replace(/\s+/g, "")}`;

  const handleShareClick = () => {
    setPostText(defaultPostText);
    setShowShareDialog(true);
  };

  const handleShareToLinkedIn = () => {
    if (!postText.trim()) {
      showToast("Please enter a post message", "error");
      return;
    }

    setSharing(true);

    try {
      // LinkedIn Share API - share the certificate image URL directly
      // LinkedIn will attempt to fetch and display the image if it's publicly accessible
      const certificateImageUrl = encodeURIComponent(certificate.certificate_url);
      const summary = encodeURIComponent(postText);
      
      // LinkedIn Share URL format
      // Note: LinkedIn will try to fetch the image from the URL
      // The image URL should be publicly accessible for LinkedIn to display it
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
      setShowShareDialog(false);
      setPostText("");
    } catch (error: any) {
      showToast(error?.message || "Failed to share on LinkedIn", "error");
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = certificate.certificate_url;
      link.download = `${certificate.course_title}_Certificate.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Certificate download started", "success");
    } catch (error: any) {
      showToast("Failed to download certificate", "error");
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.5,
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Certificate of Completion
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#6b7280", fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            {certificate.course_title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#9ca3af", mt: 0.5, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          >
            Issued on {new Date(certificate.issued_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>
        {onClose && (
          <IconButton
            onClick={onClose}
            sx={{
              color: "#6b7280",
              "&:hover": { backgroundColor: "#f3f4f6" },
            }}
          >
            <IconWrapper icon="mdi:close" size={24} />
          </IconButton>
        )}
      </Box>

      {/* Certificate Image */}
      <Paper
        elevation={3}
        sx={{
          position: "relative",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        {imageLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f9fafb",
              zIndex: 1,
            }}
          >
            <CircularProgress size={48} />
          </Box>
        )}
        {imageError ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 400,
              p: 4,
              gap: 2,
            }}
          >
            <IconWrapper
              icon="mdi:image-off"
              size={64}
              color="#9ca3af"
            />
            <Typography variant="body1" sx={{ color: "#6b7280" }}>
              Failed to load certificate image
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setImageError(false);
                setImageLoading(true);
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Box
            component="img"
            src={certificate.certificate_url}
            alt={`Certificate for ${certificate.course_title}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              width: "100%",
              height: "auto",
              display: "block",
              opacity: imageLoading ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          />
        )}
      </Paper>

      {/* Action Buttons */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: { xs: "stretch", sm: "flex-start" },
        }}
      >
        <Button
          variant="contained"
          onClick={handleShareClick}
          startIcon={<IconWrapper icon="mdi:linkedin" size={20} />}
          sx={{
            bgcolor: "#0077b5",
            "&:hover": { bgcolor: "#005885" },
            flex: { xs: 1, sm: "none" },
            minWidth: { xs: "auto", sm: 200 },
          }}
        >
          Share on LinkedIn
        </Button>
        <Button
          variant="outlined"
          onClick={handleDownload}
          startIcon={<IconWrapper icon="mdi:download" size={20} />}
          sx={{
            borderColor: "#6366f1",
            color: "#6366f1",
            "&:hover": {
              borderColor: "#4f46e5",
              backgroundColor: "#eef2ff",
            },
            flex: { xs: 1, sm: "none" },
            minWidth: { xs: "auto", sm: 200 },
          }}
        >
          Download Certificate
        </Button>
      </Box>

      {/* Share Dialog */}
      <Dialog
        open={showShareDialog}
        onClose={() => !sharing && setShowShareDialog(false)}
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
              Make sure the certificate URL is publicly accessible for LinkedIn to display it.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => {
              setShowShareDialog(false);
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
    </Box>
  );
}

