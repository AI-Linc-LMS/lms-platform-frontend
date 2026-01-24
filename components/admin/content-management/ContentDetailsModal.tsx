"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ContentDetails, ContentType } from "@/lib/services/admin/admin-content-management.service";

interface ContentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  content: ContentDetails | null;
  loading: boolean;
}

const getTypeColor = (type: ContentType) => {
  const colors: Record<ContentType, { bg: string; text: string }> = {
    Quiz: { bg: "#eef2ff", text: "#6366f1" },
    Article: { bg: "#d1fae5", text: "#10b981" },
    Assignment: { bg: "#fef3c7", text: "#f59e0b" },
    CodingProblem: { bg: "#ede9fe", text: "#8b5cf6" },
    DevCodingProblem: { bg: "#fce7f3", text: "#ec4899" },
    VideoTutorial: { bg: "#fee2e2", text: "#ef4444" },
  };
  return colors[type] || { bg: "#f3f4f6", text: "#6b7280" };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function ContentDetailsModal({
  open,
  onClose,
  content,
  loading,
}: ContentDetailsModalProps) {
  if (!content && !loading) {
    return null;
  }

  const typeColor = content ? getTypeColor(content.type) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Content Details
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "#6b7280" }}
        >
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : content ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#111827" }}
              >
                Basic Information
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: "#f9fafb",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6b7280", fontWeight: 600 }}
                    >
                      Title
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {content.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Type
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={content.type}
                          size="small"
                          sx={{
                            bgcolor: typeColor?.bg,
                            color: typeColor?.text,
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Verification Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={content.is_verified ? "Verified" : "Unverified"}
                          size="small"
                          sx={{
                            bgcolor: content.is_verified ? "#d1fae5" : "#fee2e2",
                            color: content.is_verified ? "#065f46" : "#991b1b",
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Order
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {content.order}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {content.duration_in_minutes} minutes
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Marks
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {content.marks}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Created At
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(content.created_at)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        Last Updated
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(content.updated_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Content Details */}
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#111827" }}
              >
                Content Details
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: "#f9fafb",
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: "auto",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {Object.entries(content.content_details).map(([key, value]) => {
                    // Skip id and title as they're already shown
                    if (key === "id" || key === "title") return null;

                    // Handle arrays (like mcqs)
                    if (Array.isArray(value)) {
                      return (
                        <Box key={key}>
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280", fontWeight: 600 }}
                          >
                            {key.replace(/_/g, " ").toUpperCase()}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {value.length} item(s)
                          </Typography>
                        </Box>
                      );
                    }

                    // Handle objects (like template_code)
                    if (typeof value === "object" && value !== null) {
                      return (
                        <Box key={key}>
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280", fontWeight: 600 }}
                          >
                            {key.replace(/_/g, " ").toUpperCase()}
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              mt: 0.5,
                              p: 1,
                              backgroundColor: "#ffffff",
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              overflow: "auto",
                              maxHeight: 200,
                            }}
                          >
                            {JSON.stringify(value, null, 2)}
                          </Box>
                        </Box>
                      );
                    }

                    // Handle strings and other primitives
                    return (
                      <Box key={key}>
                        <Typography
                          variant="caption"
                          sx={{ color: "#6b7280", fontWeight: 600 }}
                        >
                          {key.replace(/_/g, " ").toUpperCase()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {String(value)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
