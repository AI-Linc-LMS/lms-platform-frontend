"use client";

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SubModuleContentItem } from "@/lib/services/courses.service";

interface SubmoduleContentListProps {
  submoduleName: string;
  moduleName: string;
  contentItems: SubModuleContentItem[];
  selectedContentId: number | null;
  onContentSelect: (contentId: number) => void;
  getContentIcon: (contentType: string) => string;
  getContentColor: (contentType: string) => string;
  formatDuration: (minutes: number) => string;
}

export function SubmoduleContentList({
  submoduleName,
  moduleName,
  contentItems,
  selectedContentId,
  onContentSelect,
  getContentIcon,
  getContentColor,
  formatDuration,
}: SubmoduleContentListProps) {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#cbd5e1",
          borderRadius: "2px",
          "&:hover": {
            backgroundColor: "#94a3b8",
          },
        },
      }}
    >
      {/* Submodule Title */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#1a1f2e",
            fontSize: "0.8125rem",
            mb: 0.25,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {submoduleName}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#6b7280", fontSize: "0.6875rem" }}
        >
          {moduleName}
        </Typography>
      </Box>

      {/* Content Items List */}
      <List sx={{ p: 0 }}>
        {contentItems.map((contentItem) => {
          const isActive = contentItem.id === selectedContentId;
          const isCompleted = contentItem.status === "complete";
          const icon = getContentIcon(contentItem.content_type);
          const color = getContentColor(contentItem.content_type);
          const hasMarks = contentItem.marks > 0;
          const obtainedMarks = contentItem.obtainedMarks ?? null;
          const showScore = hasMarks && obtainedMarks !== null;
          const submissions = contentItem.submissions ?? 0;
          const showMarksInfo = hasMarks;

          return (
            <ListItem key={contentItem.id} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => onContentSelect(contentItem.id)}
                sx={{
                  py: 1.25,
                  px: 2,
                  backgroundColor: isActive
                    ? "rgba(99, 102, 241, 0.08)"
                    : "transparent",
                  borderLeft: isActive ? "3px solid #6366f1" : "none",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: isActive
                      ? "rgba(99, 102, 241, 0.12)"
                      : "rgba(0, 0, 0, 0.03)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(99, 102, 241, 0.08)",
                    "&:hover": {
                      backgroundColor: "rgba(99, 102, 241, 0.12)",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ position: "relative" }}>
                    <IconWrapper icon={icon} size={20} color={color} />
                    {isCompleted && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1.5px solid #ffffff",
                        }}
                      >
                        <IconWrapper
                          icon="mdi:check"
                          size={8}
                          color="#ffffff"
                        />
                      </Box>
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? "#6366f1" : "#1a1f2e",
                          fontSize: "0.8125rem",
                          lineHeight: 1.4,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {contentItem.title}
                      </Typography>
                      {showScore && (
                        <Chip
                          label={`${obtainedMarks}/${contentItem.marks}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            backgroundColor:
                              obtainedMarks >= contentItem.marks * 0.8
                                ? "#d1fae5"
                                : obtainedMarks >= contentItem.marks * 0.6
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              obtainedMarks >= contentItem.marks * 0.8
                                ? "#065f46"
                                : obtainedMarks >= contentItem.marks * 0.6
                                ? "#92400e"
                                : "#991b1b",
                            "& .MuiChip-label": {
                              px: 0.75,
                            },
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        mt: 0.5,
                        color: "#9ca3af",
                        fontSize: "0.6875rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{contentItem.content_type}</span>
                      {contentItem.duration_in_minutes > 0 && (
                        <>
                          <span style={{ color: "#d1d5db", fontSize: "0.625rem" }}>•</span>
                          <span>{formatDuration(contentItem.duration_in_minutes)}</span>
                        </>
                      )}
                      {showMarksInfo && (
                        <>
                          <span style={{ color: "#d1d5db", fontSize: "0.625rem" }}>•</span>
                          <span>Total Marks: {contentItem.marks}</span>
                        </>
                      )}
                      {obtainedMarks !== null && (
                        <>
                          <span style={{ color: "#d1d5db", fontSize: "0.625rem" }}>•</span>
                          <span style={{ color: "#6b7280" }}>Obtained: {obtainedMarks}</span>
                        </>
                      )}
                      {submissions > 0 && obtainedMarks !== null && (
                        <>
                          <span style={{ color: "#d1d5db", fontSize: "0.625rem" }}>•</span>
                          <span style={{ color: "#6b7280" }}>Submissions: {submissions}</span>
                        </>
                      )}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

