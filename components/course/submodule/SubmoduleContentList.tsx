"use client";

import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
          backgroundColor: "var(--border-default)",
          borderRadius: "2px",
          "&:hover": {
            backgroundColor:
              "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
          },
        },
      }}
    >
      {/* Submodule Title */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "var(--font-primary)",
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
          sx={{ color: "var(--font-secondary)", fontSize: "0.6875rem" }}
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
                    ? "color-mix(in srgb, var(--accent-indigo) 10%, transparent)"
                    : "transparent",
                  borderInlineStart: isActive
                    ? "3px solid var(--accent-indigo)"
                    : "none",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: isActive
                      ? "color-mix(in srgb, var(--accent-indigo) 14%, transparent)"
                      : "color-mix(in srgb, var(--font-primary) 3%, transparent)",
                  },
                  "&.Mui-selected": {
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                    "&:hover": {
                      backgroundColor:
                        "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
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
                          backgroundColor: "var(--success-500)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1.5px solid var(--card-bg)",
                        }}
                      >
                        <IconWrapper
                          icon="mdi:check"
                          size={8}
                          color="var(--font-light)"
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
                          color: isActive
                            ? "var(--accent-indigo)"
                            : "var(--font-primary)",
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
                                ? "color-mix(in srgb, var(--success-500) 18%, var(--surface) 82%)"
                                : obtainedMarks >= contentItem.marks * 0.6
                                ? "color-mix(in srgb, var(--warning-500) 18%, var(--surface) 82%)"
                                : "color-mix(in srgb, var(--error-500) 18%, var(--surface) 82%)",
                            color:
                              obtainedMarks >= contentItem.marks * 0.8
                                ? "var(--success-500)"
                                : obtainedMarks >= contentItem.marks * 0.6
                                ? "var(--warning-500)"
                                : "var(--error-500)",
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
                        color: "var(--font-tertiary)",
                        fontSize: "0.6875rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{contentItem.content_type}</span>
                      {contentItem.duration_in_minutes > 0 && (
                        <>
                          <span
                            style={{
                              color: "var(--border-default)",
                              fontSize: "0.625rem",
                            }}
                          >
                            •
                          </span>
                          <span>{formatDuration(contentItem.duration_in_minutes)}</span>
                        </>
                      )}
                      {showMarksInfo && (
                        <>
                          <span
                            style={{
                              color: "var(--border-default)",
                              fontSize: "0.625rem",
                            }}
                          >
                            •
                          </span>
                          <span>{t("courses.totalMarks")}: {contentItem.marks}</span>
                        </>
                      )}
                      {obtainedMarks !== null && (
                        <>
                          <span
                            style={{
                              color: "var(--border-default)",
                              fontSize: "0.625rem",
                            }}
                          >
                            •
                          </span>
                          <span style={{ color: "var(--font-secondary)" }}>
                            Obtained: {obtainedMarks}
                          </span>
                        </>
                      )}
                      {submissions > 0 && obtainedMarks !== null && (
                        <>
                          <span
                            style={{
                              color: "var(--border-default)",
                              fontSize: "0.625rem",
                            }}
                          >
                            •
                          </span>
                          <span style={{ color: "var(--font-secondary)" }}>
                            {t("courses.submissions")}: {submissions}
                          </span>
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

