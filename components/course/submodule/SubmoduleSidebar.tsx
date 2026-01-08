"use client";

import { Box, Paper, IconButton, Typography, Tabs, Tab } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SubmoduleContentList } from "./SubmoduleContentList";
import { SubmoduleProgress } from "./SubmoduleProgress";
import {
  SubModuleContentItem,
  CourseDetail,
} from "@/lib/services/courses.service";

interface SubmoduleSidebarProps {
  courseDetail: CourseDetail;
  submoduleName: string;
  moduleName: string;
  contentItems: SubModuleContentItem[];
  selectedContentId: number | null;
  activeTab: number;
  courseId: number;
  onTabChange: (value: number) => void;
  onContentSelect: (contentId: number) => void;
  getContentIcon: (contentType: string) => string;
  getContentColor: (contentType: string) => string;
  formatDuration: (minutes: number) => string;
}

export function SubmoduleSidebar({
  courseDetail,
  submoduleName,
  moduleName,
  contentItems,
  selectedContentId,
  activeTab,
  courseId,
  onTabChange,
  onContentSelect,
  getContentIcon,
  getContentColor,
  formatDuration,
}: SubmoduleSidebarProps) {
  const router = useRouter();

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        display: "flex",
        borderRight: { xs: "none", md: "1px solid #e5e7eb" },
        flexDirection: "column",
        height: "100%",
        borderRadius: 0,
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => router.push(`/courses/${courseId}`)}
            size="small"
            sx={{
              flexShrink: 0,
              mt: 0.25,
              "&:hover": {
                backgroundColor: "#f3f4f6",
              },
            }}
          >
            <IconWrapper icon="mdi:chevron-left" size={24} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1a1f2e",
                fontSize: "1rem",
                lineHeight: 1.4,
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {submoduleName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                display: "block",
                mt: 0.25,
              }}
            >
              {contentItems.length}{" "}
              {contentItems.length === 1 ? "item" : "items"}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "0.75rem",
            pl: 5, // Align with text after icon
          }}
        >
          {moduleName}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid #e5e7eb" }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => onTabChange(newValue)}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
            },
            "& .Mui-selected": {
              color: "#6366f1",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#6366f1",
            },
          }}
        >
          <Tab
            label="Materials"
            icon={<IconWrapper icon="mdi:home-outline" size={20} />}
            iconPosition="start"
          />
          <Tab
            label="Progress"
            icon={<IconWrapper icon="mdi:chart-line" size={20} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content List - Materials Tab */}
      {activeTab === 0 && (
        <SubmoduleContentList
          submoduleName={submoduleName}
          moduleName={moduleName}
          contentItems={contentItems}
          selectedContentId={selectedContentId}
          onContentSelect={onContentSelect}
          getContentIcon={getContentIcon}
          getContentColor={getContentColor}
          formatDuration={formatDuration}
        />
      )}

      {/* Progress Tab */}
      {activeTab === 1 && <SubmoduleProgress contentItems={contentItems} />}
    </Paper>
  );
}
