"use client";

import { useState } from "react";
import { Box, Typography, IconButton, Drawer, Tabs, Tab } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AttendanceActivity } from "@/lib/services/admin/admin-attendance.service";
import { ActivityDetailsCard } from "./ActivityDetailsCard";
import { SessionSummaryCard } from "./SessionSummaryCard";
import { StudentsTableCard } from "./StudentsTableCard";

interface ViewActivityPanelProps {
  open: boolean;
  activity: AttendanceActivity;
  onClose: () => void;
  onSave: (data: {
    title?: string;
    topic_covered?: string;
    assignments_given?: string;
    hands_on_coding?: string;
    additional_comments?: string;
  }) => void;
  studentsPage: number;
  studentsLimit: number;
  onStudentsPageChange: (page: number) => void;
  onStudentsLimitChange: (limit: number) => void;
}

const APP_BAR_HEIGHT = 56;

export function ViewActivityPanel({
  open,
  activity,
  onClose,
  onSave,
  studentsPage,
  studentsLimit,
  onStudentsPageChange,
  onStudentsLimitChange,
}: ViewActivityPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: {
            xs: "100%",
            sm: 600,
            md: 900,
          },

          // Floating spacing (desktop only)
          m: { xs: 0, sm: 2 },

          // AppBar offset
          mt: {
            xs: `${APP_BAR_HEIGHT}px`,
            sm: `calc(${APP_BAR_HEIGHT}px + 16px)`,
          },

          height: {
            xs: `calc(100% - ${APP_BAR_HEIGHT}px)`,
            sm: `calc(100% - ${APP_BAR_HEIGHT}px - 32px)`,
          },

          borderRadius: { xs: 0, sm: 2.5 },
          boxShadow: {
            xs: "none",
            sm: "0 20px 40px rgba(0,0,0,0.12)",
          },

          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "contain",
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ================= HEADER ================= */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            p: { xs: 2.5, sm: 3 },
            minHeight: { xs: 56, sm: 64 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            borderBottom: "2px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.125rem", sm: "1.5rem" },
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              pr: 2,
              flex: 1,
            }}
          >
            {activity.name}
          </Typography>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#6b7280",
              "&:hover": {
                backgroundColor: "#f3f4f6",
                color: "#111827",
              },
            }}
          >
            <IconWrapper icon="mdi:close" size={24} />
          </IconButton>
        </Box>

        {/* ============ ACTIVITY DETAILS ============ */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          <ActivityDetailsCard activity={activity} />
        </Box>

        {/* ================= TABS ================= */}
        <Box
          sx={{
            position: "sticky",
            top: { xs: 56, sm: 64 },
            zIndex: 2,
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: { xs: 2, sm: 3 },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                minHeight: { xs: 44, sm: 48 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                px: { xs: 1.5, sm: 3 },
              },
            }}
          >
            <Tab label="Session Summary" />
            <Tab label="Students" />
          </Tabs>
        </Box>

        {/* ============ SCROLLABLE CONTENT ============ */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            p: { xs: 2, sm: 3 },
            minHeight: 0,
          }}
        >
          {activeTab === 0 && (
            <SessionSummaryCard activity={activity} onSave={onSave} />
          )}

          {activeTab === 1 && (
            <StudentsTableCard
              activity={activity}
              studentsPage={studentsPage}
              studentsLimit={studentsLimit}
              onStudentsPageChange={onStudentsPageChange}
              onStudentsLimitChange={onStudentsLimitChange}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
