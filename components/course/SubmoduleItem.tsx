"use client";

import {
  Box,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getContentBreakdown = () => {
    const breakdown = [];
    if (submodule.video_count > 0) {
      breakdown.push({
        label: "Videos",
        count: submodule.video_count,
        icon: "mdi:video-outline",
      });
    }
    if (submodule.quiz_count > 0) {
      breakdown.push({
        label: "Quizzes",
        count: submodule.quiz_count,
        icon: "mdi:help-circle-outline",
      });
    }
    if (submodule.assignment_count > 0) {
      breakdown.push({
        label: "Assignments",
        count: submodule.assignment_count,
        icon: "mdi:file-check-outline",
      });
    }
    if (submodule.coding_problem_count > 0) {
      breakdown.push({
        label: "Problems",
        count: submodule.coding_problem_count,
        icon: "mdi:code-tags",
      });
    }
    if (submodule.article_count > 0) {
      breakdown.push({
        label: "Articles",
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
      submodule.assignment_count
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
            color: "#ffffff",
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            fontWeight: 600,
            mb: 1,
          }}
        >
          Content Breakdown
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
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "none",
            }}
          >
            <IconWrapper
              icon={item.icon}
              size={16}
              color="#ffffff"
            />
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
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
                color: "#ffffff",
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
          color: "#ffffff",
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
        borderBottom: "1px solid #f3f4f6",
        "&:last-child": {
          borderBottom: "none",
        },
        cursor: hasContent ? "pointer" : "not-allowed",
        opacity: hasContent ? 1 : 0.5,
        "&:hover": {
          backgroundColor: hasContent ? "#f9fafb" : "transparent",
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
          color="#6b7280"
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
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ffffff",
              zIndex: 1,
            }}
          >
            <IconWrapper
              icon="mdi:check"
              size={10}
              color="#ffffff"
            />
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#1a1f2e",
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
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  backgroundColor: "#ffffff",
                }}
              >
                <IconWrapper
                  icon={item.icon}
                  size={14}
                  color="#6b7280"
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#1a1f2e",
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
            color: "#9ca3af",
            fontSize: { xs: "0.6875rem", sm: "0.75rem" },
          }}
        >
          {contentCount > 0 ? `${contentCount} items` : "0 items"}
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
                  backgroundColor: "#1a1f2e",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  maxWidth: { xs: 280, sm: 300 },
                  p: 0,
                },
              },
              arrow: {
                sx: {
                  color: "#1a1f2e",
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
                  backgroundColor: "rgba(107, 114, 128, 0.15)",
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
                color="#9ca3af"
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
