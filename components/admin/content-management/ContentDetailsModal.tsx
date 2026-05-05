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
import { useTranslation } from "react-i18next";
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
    Quiz: { bg: "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)", text: "var(--accent-indigo)" },
    Article: { bg: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)", text: "var(--success-500)" },
    Assignment: { bg: "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)", text: "var(--warning-500)" },
    CodingProblem: { bg: "color-mix(in srgb, var(--accent-purple) 14%, var(--surface) 86%)", text: "var(--accent-purple)" },
    DevCodingProblem: { bg: "color-mix(in srgb, var(--accent-purple) 10%, var(--surface) 90%)", text: "var(--accent-purple)" },
    VideoTutorial: { bg: "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)", text: "var(--error-500)" },
  };
  return colors[type] || { bg: "var(--surface)", text: "var(--font-secondary)" };
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
  const { t } = useTranslation("common");
  if (!content && !loading) {
    return null;
  }

  const typeColor = content ? getTypeColor(content.type) : null;
  const typeToLabelKey: Record<ContentType, string> = {
    Quiz: "adminContentManagement.typeQuiz",
    Article: "adminContentManagement.typeArticle",
    Assignment: "adminContentManagement.typeAssignment",
    CodingProblem: "adminContentManagement.typeCodingProblem",
    DevCodingProblem: "adminContentManagement.typeDevCodingProblem",
    VideoTutorial: "adminContentManagement.typeVideoTutorial",
  };

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
          {t("adminContentManagement.contentDetails")}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "var(--font-secondary)" }}
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
                sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)" }}
              >
                {t("adminContentManagement.basicInformation")}
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: "var(--surface)",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                    >
                      {t("adminContentManagement.titleColumn")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {content.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.type")}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={t(typeToLabelKey[content.type])}
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
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.verificationStatus")}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={content.is_verified ? t("adminContentManagement.verified") : t("adminContentManagement.unverified")}
                          size="small"
                          sx={{
                            bgcolor: content.is_verified
                              ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                              : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                            color: content.is_verified
                              ? "var(--success-500)"
                              : "var(--error-500)",
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.order")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {content.order}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.duration")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t("adminContentManagement.durationMinutes", { count: content.duration_in_minutes })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.marks")}
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
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.createdAt")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(content.created_at)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                      >
                        {t("adminContentManagement.lastUpdated")}
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
                sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)" }}
              >
                {t("adminContentManagement.contentDetails")}
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: "var(--surface)",
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
                            sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
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
                            sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
                          >
                            {key.replace(/_/g, " ").toUpperCase()}
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              mt: 0.5,
                              p: 1,
                              backgroundColor: "var(--card-bg)",
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
                        sx={{ color: "var(--font-secondary)", fontWeight: 600 }}
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
