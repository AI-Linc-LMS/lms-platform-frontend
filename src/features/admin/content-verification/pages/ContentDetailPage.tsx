import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContentById,
  verifyContent,
} from "../../../../services/admin/contentApis";
import { CONTENT_TYPE_CONFIG } from "../types";
import ArticleView from "../components/views/ArticleView";
import VideoView from "../components/views/VideoView";
import QuizView from "../components/views/QuizView";
import AssignmentView from "../components/views/AssignmentView";
import CodingProblemView from "../components/views/CodingProblemView";

const ContentDetailPage = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch content details
  const {
    data: contentDetail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contentDetail", clientId, contentId],
    queryFn: () => getContentById(clientId, Number(contentId)),
    enabled: !!contentId,
  });

  // Verify/Unverify mutation
  const verifyMutation = useMutation({
    mutationFn: (isVerified: boolean) =>
      verifyContent(clientId, Number(contentId), isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents", clientId] });
      queryClient.invalidateQueries({
        queryKey: ["contentDetail", clientId, contentId],
      });
      setShowConfirmDialog(false);
    },
  });

  const handleVerifyToggle = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmVerify = () => {
    if (contentDetail) {
      verifyMutation.mutate(!contentDetail.is_verified);
    }
  };

  const handleBack = () => {
    navigate("/admin/verify-content");
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "var(--neutral-50)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !contentDetail) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "var(--neutral-50)",
          p: 3,
        }}
      >
        <Alert severity="error">
          Failed to load content details. Please try again.
        </Alert>
      </Box>
    );
  }

  const typeConfig = CONTENT_TYPE_CONFIG[contentDetail.type] || {
    label: contentDetail.type,
    color: "#6b7280",
  };

  const renderContentView = () => {
    const { content_details, type } = contentDetail;

    switch (type) {
      case "Article":
        return <ArticleView details={content_details} />;
      case "VideoTutorial":
        return <VideoView details={content_details} />;
      case "Quiz":
        return <QuizView details={content_details} />;
      case "Assignment":
        return <AssignmentView details={content_details} />;
      case "CodingProblem":
      case "DevCodingProblem":
        return <CodingProblemView details={content_details} />;
      default:
        return (
          <Alert severity="info">
            Content type "{type}" is not supported yet.
          </Alert>
        );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "var(--neutral-50)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "var(--card-bg)",
          borderBottom: "1px solid var(--neutral-200)",
          py: 2,
          px: 3,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: "var(--font-primary)",
                "&:hover": {
                  bgcolor: "var(--neutral-100)",
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                sx={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "var(--font-primary)",
                }}
              >
                {contentDetail.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Chip
                  label={typeConfig.label}
                  size="small"
                  sx={{
                    bgcolor: `${typeConfig.color}20`,
                    color: typeConfig.color,
                    fontWeight: "bold",
                    border: `1px solid ${typeConfig.color}40`,
                  }}
                />
                <Chip
                  label={contentDetail.is_verified ? "Verified" : "Unverified"}
                  size="small"
                  icon={
                    contentDetail.is_verified ? (
                      <CheckCircleIcon />
                    ) : (
                      <CancelIcon />
                    )
                  }
                  sx={{
                    bgcolor: contentDetail.is_verified
                      ? "var(--success-100)"
                      : "var(--neutral-100)",
                    color: contentDetail.is_verified
                      ? "var(--success-700)"
                      : "var(--font-secondary)",
                    fontWeight: "bold",
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            onClick={handleVerifyToggle}
            startIcon={
              contentDetail.is_verified ? <CancelIcon /> : <CheckCircleIcon />
            }
            sx={{
              bgcolor: contentDetail.is_verified
                ? "var(--warning-500)"
                : "var(--success-500)",
              color: "white",
              "&:hover": {
                bgcolor: contentDetail.is_verified ? "#e6a800" : "#4d8a52",
              },
            }}
          >
            {contentDetail.is_verified ? "Unverify" : "Verify"}
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: "1400px", margin: "0 auto", p: 3 }}>
        {renderContentView()}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {contentDetail.is_verified ? "Unverify Content?" : "Verify Content?"}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--font-secondary)" }}>
            Are you sure you want to{" "}
            {contentDetail.is_verified ? "unverify" : "verify"} "
            {contentDetail.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmDialog(false)}
            disabled={verifyMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmVerify}
            disabled={verifyMutation.isPending}
            sx={{
              bgcolor: contentDetail.is_verified
                ? "var(--warning-500)"
                : "var(--success-500)",
              color: "white",
              "&:hover": {
                bgcolor: contentDetail.is_verified ? "#e6a800" : "#4d8a52",
              },
            }}
          >
            {verifyMutation.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : contentDetail.is_verified ? (
              "Unverify"
            ) : (
              "Verify"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentDetailPage;
