"use client";

import {
  Box,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Module } from "@/lib/services/courses.service";

interface SubmoduleItemProps {
  submodule: {
    id: number;
    title: string;
    video_count: number;
    quiz_count: number;
    article_count: number;
    coding_problem_count: number;
    assignment_count: number;
    subjective_question_count?: number;
  };
  module: Module;
  courseId: number;
  onNavigate: (submoduleId: number) => void;
}

export function SubmoduleItem({
  submodule,
  module,
  courseId,
  onNavigate,
}: SubmoduleItemProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getContentBreakdown = () => {
    const breakdown = [];
    if (submodule.video_count > 0) {
      breakdown.push({
        label: t("courses.videos"),
        count: submodule.video_count,
        icon: "mdi:video-outline",
      });
    }
    if (submodule.quiz_count > 0) {
      breakdown.push({
        label: t("courses.quizzes"),
        count: submodule.quiz_count,
        icon: "mdi:help-circle-outline",
      });
    }
    if (submodule.assignment_count > 0) {
      breakdown.push({
        label: t("courses.assignments"),
        count: submodule.assignment_count,
        icon: "mdi:file-check-outline",
      });
    }
    if (submodule.coding_problem_count > 0) {
      breakdown.push({
        label: t("courses.problems"),
        count: submodule.coding_problem_count,
        icon: "mdi:code-tags",
      });
    }
    const subjectiveCount = submodule.subjective_question_count ?? 0;
    if (subjectiveCount > 0) {
      breakdown.push({
        label: t("courses.subjectiveProgressShort"),
        count: subjectiveCount,
        icon: "mdi:text-box-outline",
      });
    }
    if (submodule.article_count > 0) {
      breakdown.push({
        label: t("courses.articles"),
        count: submodule.article_count,
        icon: "mdi:file-document-outline",
      });
    }
    return breakdown;
  };

  const getSubmoduleContentCount = () => {
    return (
      submodule.video_count +
      submodule.quiz_count +
      submodule.article_count +
      submodule.coding_problem_count +
      submodule.assignment_count +
      (submodule.subjective_question_count ?? 0)
    );
  };

  const contentCount = getSubmoduleContentCount();
  const contentBreakdown = getContentBreakdown();
  const isCompleted = module.completion_percentage === 100;
  const hasContent = contentCount > 0;

  const tooltipContent =
    contentBreakdown.length > 0 ? (
      <Box sx={{ p: { xs: 1.25, sm: 1.5 }, minWidth: { xs: 180, sm: 200 } }}>
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-light)",
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            fontWeight: 600,
            mb: 1,
          }}
        >
          {t("courses.contentBreakdown")}
        </Typography>
        {contentBreakdown.map((item, index) => (
          <Box
            key={item.label}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.75, sm: 1 },
              py: 0.5,
              borderBottom:
                index < contentBreakdown.length - 1
                  ? "1px solid color-mix(in srgb, var(--font-light) 12%, transparent)"
                  : "none",
            }}
          >
            <IconWrapper
              icon={item.icon}
              size={16}
              color="var(--font-light)"
            />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-light)",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                fontWeight: 400,
                flex: 1,
              }}
            >
              {item.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-light)",
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                fontWeight: 600,
              }}
            >
              {item.count}
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      <Typography
        variant="body2"
        sx={{
          color: "var(--font-light)",
          p: { xs: 1, sm: 1.25 },
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}
      >
        No content available
      </Typography>
    );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        py: { xs: 1.25, sm: 1.5 },
        px: { xs: 0.5, sm: 0 },
        borderBottom: "1px solid var(--border-default)",
        "&:last-child": {
          borderBottom: "none",
        },
        cursor: hasContent ? "pointer" : "not-allowed",
        opacity: hasContent ? 1 : 0.5,
        "&:hover": {
          backgroundColor: hasContent
            ? "color-mix(in srgb, var(--surface) 80%, var(--background) 20%)"
            : "transparent",
        },
      }}
      onClick={(e) => {
        if (!hasContent) return;
        
        // Prevent navigation when clicking on icon/tooltip area
        const target = e.target as HTMLElement;
        if (
          target.closest('[role="tooltip"]') ||
          target.closest(".MuiTooltip-popper")
        ) {
          return;
        }
        onNavigate(submodule.id);
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          flexShrink: 0,
        }}
      >
        <IconWrapper
          icon="mdi:book-open-variant-outline"
          size={22}
          color="var(--font-secondary)"
        />
        {isCompleted && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: -3, sm: -4 },
              right: { xs: -3, sm: -4 },
              width: { xs: 14, sm: 16 },
              height: { xs: 14, sm: 16 },
              borderRadius: "50%",
              backgroundColor: "var(--success-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--card-bg)",
              zIndex: 1,
            }}
          >
            <IconWrapper
              icon="mdi:check"
              size={10}
              color="var(--font-light)"
            />
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-primary)",
            fontWeight: 500,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mb: 0.5,
          }}
        >
          {submodule.title}
        </Typography>
        {contentBreakdown.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {contentBreakdown.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  border: "1px solid var(--border-default)",
                  borderRadius: 1,
                  backgroundColor: "var(--card-bg)",
                }}
              >
                <IconWrapper
                  icon={item.icon}
                  size={14}
                  color="var(--font-secondary)"
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-primary)",
                    fontSize: { xs: "0.6875rem", sm: "0.75rem" },
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.count} {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-tertiary)",
            fontSize: { xs: "0.6875rem", sm: "0.75rem" },
          }}
        >
          {contentCount > 0 ? `${contentCount} ${t("courses.items")}` : `0 ${t("courses.items")}`}
        </Typography>
        {contentBreakdown.length > 0 && (
          <Tooltip
            title={tooltipContent}
            arrow
            placement={isMobile ? "top" : "left"}
            enterDelay={200}
            enterTouchDelay={0}
            leaveTouchDelay={2000}
            disableInteractive={false}
            componentsProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 2,
                  boxShadow:
                    "0 4px 6px color-mix(in srgb, var(--font-primary) 12%, transparent)",
                  maxWidth: { xs: 280, sm: 300 },
                  p: 0,
                },
              },
              arrow: {
                sx: {
                  color: "var(--card-bg)",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                cursor: "pointer",
                padding: 0.25,
                borderRadius: 0.5,
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor:
                    "color-mix(in srgb, var(--font-secondary) 15%, transparent)",
                  transform: "scale(1.1)",
                },
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <IconWrapper
                icon="mdi:information-outline"
                size={16}
                color="var(--font-tertiary)"
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
