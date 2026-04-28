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
  course_enrolled: {
    icon: "mdi:book-plus",
    color: "var(--accent-indigo)",
    bgColor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
  },
  job_published: {
    icon: "mdi:briefcase-plus",
    color: "var(--success-500)",
    bgColor: "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
  },
  job_status_change: {
    icon: "mdi:briefcase-clock",
    color: "var(--accent-purple)",
    bgColor: "color-mix(in srgb, var(--accent-purple) 12%, var(--surface) 88%)",
  },
  course_completed: {
    icon: "mdi:check-circle",
    color: "var(--success-500)",
    bgColor: "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
  },
  assessment_available: {
    icon: "mdi:clipboard-check",
    color: "var(--accent-purple)",
    bgColor: "color-mix(in srgb, var(--accent-purple) 12%, var(--surface) 88%)",
  },
  mock_interview_completed: {
    icon: "mdi:video-account",
    color: "var(--warning-500)",
    bgColor: "color-mix(in srgb, var(--warning-500) 12%, var(--surface) 88%)",
  },
  community_thread: {
    icon: "mdi:forum",
    color: "var(--accent-indigo)",
    bgColor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
  },
  community_reply: {
    icon: "mdi:reply",
    color: "var(--accent-indigo)",
    bgColor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
  },
  custom: {
    icon: "mdi:bell",
    color: "var(--font-secondary)",
    bgColor: "color-mix(in srgb, var(--font-secondary) 12%, var(--surface) 88%)",
  },
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
      sx={{ flexShrink: 0, opacity: 0.7, color: "var(--font-tertiary)" }}
    >
      <circle cx="60" cy="35" r="18" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5} />
      <path
        d="M45 55 L45 75 Q45 85 60 85 Q75 85 75 75 L75 55"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity={0.5}
      />
      <line x1="35" y1="35" x2="25" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <line x1="85" y1="35" x2="95" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <circle cx="55" cy="50" r="3" fill="currentColor" opacity={0.3} />
      <circle cx="65" cy="50" r="3" fill="currentColor" opacity={0.3} />
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
          boxShadow:
            "0 12px 40px color-mix(in srgb, var(--font-primary) 14%, transparent), 0 4px 12px color-mix(in srgb, var(--font-primary) 10%, transparent)",
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
          backgroundColor: "var(--surface)",
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
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={18} color="var(--accent-indigo)" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
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
              color: "var(--accent-indigo)",
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" },
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
            <CircularProgress size={36} sx={{ color: "var(--accent-indigo)" }} />
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
                    backgroundColor: n.is_read
                      ? "transparent"
                      : "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      backgroundColor: n.is_read
                        ? "color-mix(in srgb, var(--font-primary) 4%, transparent)"
                        : "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
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
                            backgroundColor: "var(--accent-indigo)",
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
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
                        color: "var(--font-tertiary)",
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
            color: hasUnread ? "var(--accent-indigo)" : "text.secondary",
            width: 44,
            height: 44,
            borderRadius: 2,
            backgroundColor: hasUnread
              ? "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)"
              : "transparent",
            border: "1px solid",
            borderColor: hasUnread
              ? "color-mix(in srgb, var(--accent-indigo) 32%, var(--border-default) 68%)"
              : "transparent",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: hasUnread
                ? "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)"
                : "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
              color: "var(--accent-indigo)",
              borderColor: hasUnread
                ? "color-mix(in srgb, var(--accent-indigo) 50%, var(--border-default) 50%)"
                : "color-mix(in srgb, var(--accent-indigo) 20%, var(--border-default) 80%)",
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
              backgroundColor: "var(--error-500)",
              color: "var(--font-light)",
              border: "2px solid var(--card-bg)",
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 14%, transparent)",
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
