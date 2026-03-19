"use client";

import React from "react";
import {
  Box,
  Typography,
  Popover,
  Button,
  List,
  ListItemButton,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Bell, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatRelativeTime } from "@/lib/utils/date-utils";
import type { Notification } from "@/lib/services/notification.service";

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bgColor: string }
> = {
  course_enrolled: { icon: "mdi:book-plus", color: "#6366f1", bgColor: "rgba(99, 102, 241, 0.12)" },
  job_published: { icon: "mdi:briefcase-plus", color: "#059669", bgColor: "rgba(5, 150, 105, 0.12)" },
  job_status_change: { icon: "mdi:briefcase-clock", color: "#0d9488", bgColor: "rgba(13, 148, 136, 0.12)" },
  course_completed: { icon: "mdi:check-circle", color: "#16a34a", bgColor: "rgba(22, 163, 74, 0.12)" },
  assessment_available: { icon: "mdi:clipboard-check", color: "#7c3aed", bgColor: "rgba(124, 58, 237, 0.12)" },
  mock_interview_completed: { icon: "mdi:video-account", color: "#ea580c", bgColor: "rgba(234, 88, 12, 0.12)" },
  community_thread: { icon: "mdi:forum", color: "#2563eb", bgColor: "rgba(37, 99, 235, 0.12)" },
  community_reply: { icon: "mdi:reply", color: "#0891b2", bgColor: "rgba(8, 145, 178, 0.12)" },
  custom: { icon: "mdi:bell", color: "#6b7280", bgColor: "rgba(107, 114, 128, 0.12)" },
};

const getNotificationConfig = (type: string) =>
  NOTIFICATION_TYPE_CONFIG[type] ?? NOTIFICATION_TYPE_CONFIG.custom;

function EmptyNotificationsIllustration() {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 100"
      width={100}
      height={84}
      sx={{ flexShrink: 0, opacity: 0.7 }}
    >
      <circle cx="60" cy="35" r="18" fill="none" stroke="#9ca3af" strokeWidth="2" opacity={0.5} />
      <path
        d="M45 55 L45 75 Q45 85 60 85 Q75 85 75 75 L75 55"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity={0.5}
      />
      <line x1="35" y1="35" x2="25" y2="25" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <line x1="85" y1="35" x2="95" y2="25" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <circle cx="55" cy="50" r="3" fill="#9ca3af" opacity={0.3} />
      <circle cx="65" cy="50" r="3" fill="#9ca3af" opacity={0.3} />
    </Box>
  );
}

interface NotificationPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onNotificationClick: (n: Notification) => void;
  onMarkAllRead: () => void;
}

export function NotificationPopover({
  anchorEl,
  onClose,
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllRead,
}: NotificationPopoverProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          mt: 1.5,
          minWidth: 380,
          maxWidth: 420,
          maxHeight: 480,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(249, 250, 251, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={18} color="#6366f1" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {unreadCount} unread
              </Typography>
            )}
          </Box>
        </Box>
        {unreadCount > 0 && (
          <Button
            size="small"
            variant="text"
            onClick={onMarkAllRead}
            startIcon={<CheckCheck size={14} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#6366f1",
              "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
            }}
          >
            Mark all read
          </Button>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ maxHeight: 360, overflow: "auto" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 5,
              gap: 1.5,
            }}
          >
            <CircularProgress size={36} sx={{ color: "#6366f1" }} />
            <Typography variant="body2" color="text.secondary">
              Loading notifications...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
              px: 2,
            }}
          >
            <EmptyNotificationsIllustration />
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                mt: 1.5,
                fontWeight: 500,
              }}
            >
              No notifications yet
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                textAlign: "center",
                mt: 0.5,
              }}
            >
              We&apos;ll notify you when something new arrives
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n) => {
              const config = getNotificationConfig(n.notification_type);
              return (
                <ListItemButton
                  key={n.id}
                  onClick={() => onNotificationClick(n)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    gap: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderBottom: "none" },
                    backgroundColor: n.is_read ? "transparent" : "rgba(99, 102, 241, 0.04)",
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      backgroundColor: n.is_read
                        ? "rgba(0,0,0,0.02)"
                        : "rgba(99, 102, 241, 0.08)",
                    },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: config.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon={config.icon} size={20} color={config.color} />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.is_read ? 500 : 600,
                          color: "text.primary",
                          lineHeight: 1.4,
                        }}
                      >
                        {n.title}
                      </Typography>
                      {!n.is_read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#6366f1",
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.8125rem",
                        mt: 0.25,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {n.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        mt: 0.5,
                        display: "block",
                        fontSize: "0.75rem",
                      }}
                    >
                      {formatRelativeTime(n.created_at)}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Popover>
  );
}

interface NotificationBellProps {
  unreadCount: number;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <Tooltip
      title={hasUnread ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "Notifications"}
      arrow
      placement="bottom"
    >
      <Box
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        sx={{ display: "inline-flex" }}
      >
        <IconButton
          aria-label="Notifications"
          onClick={onClick}
          sx={{
            position: "relative",
            color: hasUnread ? "#6366f1" : "text.secondary",
            width: 44,
            height: 44,
            borderRadius: 2,
            backgroundColor: hasUnread ? "rgba(99, 102, 241, 0.1)" : "transparent",
            border: "1px solid",
            borderColor: hasUnread ? "rgba(99, 102, 241, 0.3)" : "transparent",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: hasUnread ? "rgba(99, 102, 241, 0.16)" : "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
              borderColor: hasUnread ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.2)",
            },
          }}
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          invisible={unreadCount === 0}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.7rem",
              minWidth: 20,
              height: 20,
              fontWeight: 700,
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "2px solid #fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            },
          }}
        >
          <Bell size={22} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Badge>
      </IconButton>
      </Box>
    </Tooltip>
  );
}
