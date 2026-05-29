"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CountUp,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useViewportEntrance,
} from "@/components/scorecard/shared";
import type {
  ActionPanel,
  PendingTask,
  PriorityAction,
  RecommendedContentItem,
  UpcomingAssessment,
} from "@/lib/types/scorecard.types";

interface ActionPanelSectionProps {
  data: ActionPanel;
}

const ACCENT = "var(--accent-indigo)";
const ACCENT_DARK = "var(--accent-indigo-dark)";
const AMBER = "#f59e0b";
const EMERALD = "#10b981";
const PURPLE = "#a855f7";
const CYAN = "#06b6d4";
const RED = "#ef4444";

const PRIORITY_ICON: Record<string, string> = {
  mcq: "mdi:format-list-checks",
  revise: "mdi:book-open-page-variant",
  video: "mdi:play-circle-outline",
  interview: "mdi:account-voice",
  assessment: "mdi:clipboard-check",
};

const PRIORITY_ACCENT: Record<string, string> = {
  mcq: ACCENT,
  revise: AMBER,
  video: EMERALD,
  interview: PURPLE,
  assessment: CYAN,
};

const TYPE_LABEL: Record<string, string> = {
  mcq: "Practice",
  revise: "Revise",
  video: "Watch",
  interview: "Interview",
  assessment: "Assessment",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const ms = d.getTime() - Date.now();
    if (ms < 0) {
      const overdueDays = Math.floor(Math.abs(ms) / (1000 * 60 * 60 * 24));
      if (overdueDays === 0) return "due today";
      if (overdueDays === 1) return "1d overdue";
      return `${overdueDays}d overdue`;
    }
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    if (days < 7) return `in ${days}d`;
    if (days < 30) return `in ${Math.floor(days / 7)}w`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

function HeroAction({ action }: { action: PriorityAction }) {
  const accent = PRIORITY_ACCENT[action.type] ?? ACCENT;
  const icon = PRIORITY_ICON[action.type] ?? "mdi:flash-outline";
  const isLink = !!action.actionUrl;
  const label = TYPE_LABEL[action.type] ?? "Action";

  return (
    <Box
      component={isLink ? Link : "div"}
      {...(isLink && action.actionUrl ? { href: action.actionUrl } : {})}
      sx={{
        position: "relative",
        display: "block",
        p: { xs: 2.5, md: 3.25 },
        borderRadius: 3.5,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 18%, transparent) 0%, color-mix(in srgb, ${accent} 4%, transparent) 100%)`,
        border: `1px solid color-mix(in srgb, ${accent} 32%, transparent)`,
        boxShadow: `0 30px 60px -32px color-mix(in srgb, ${accent} 55%, transparent)`,
        textDecoration: "none",
        color: "inherit",
        cursor: isLink ? "pointer" : "default",
        overflow: "hidden",
        transition: "all 0.25s ease",
        "&:hover": isLink
          ? {
              transform: "translateY(-3px)",
              borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
              boxShadow: `0 36px 70px -28px color-mix(in srgb, ${accent} 70%, transparent)`,
            }
          : undefined,
      }}
    >
      {/* Decorative pattern */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 240,
          height: 240,
          opacity: 0.15,
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          mb: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.45,
            px: 0.9,
            py: 0.4,
            borderRadius: 999,
            bgcolor: accent,
            color: "#fff",
            boxShadow: `0 8px 18px -10px color-mix(in srgb, ${accent} 75%, transparent)`,
          }}
        >
          <IconWrapper icon="mdi:flash" size={12} color="#fff" />
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Next best action
          </Typography>
        </Box>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.4,
            px: 0.75,
            py: 0.3,
            borderRadius: 999,
            bgcolor: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
            border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
          }}
        >
          <IconWrapper icon={icon} size={11} color={accent} />
          <Typography
            sx={{
              fontWeight: 800,
              color: accent,
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1.75, md: 2.5 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box
          sx={{
            width: { xs: 56, sm: 68 },
            height: { xs: 56, sm: 68 },
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 65%, #000) 100%)`,
            color: "#fff",
            flexShrink: 0,
            boxShadow: `0 16px 32px -14px color-mix(in srgb, ${accent} 75%, transparent), inset 0 -4px 10px color-mix(in srgb, ${accent} 35%, transparent)`,
          }}
        >
          <IconWrapper icon={icon} size={32} color="#fff" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component="h3"
            sx={{
              fontWeight: 900,
              color: "var(--font-primary)",
              fontSize: { xs: "1.35rem", sm: "1.6rem", md: "1.85rem" },
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
            }}
          >
            {action.title}
          </Typography>
          <Typography
            sx={{
              color: "var(--font-secondary)",
              fontSize: { xs: "0.88rem", sm: "0.95rem" },
              mt: 0.5,
              lineHeight: 1.5,
              maxWidth: 520,
            }}
          >
            {action.description}
          </Typography>
        </Box>

        {isLink && (
          <Box
            sx={{
              alignSelf: { xs: "stretch", sm: "center" },
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              px: 2,
              py: 1.15,
              borderRadius: 999,
              background: "var(--font-primary)",
              color: "var(--card-bg)",
              fontWeight: 800,
              fontSize: "0.82rem",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              boxShadow: "0 18px 30px -16px rgba(15, 23, 42, 0.5)",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "translateX(3px)" },
            }}
          >
            Take action
            <IconWrapper icon="mdi:arrow-right" size={16} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function SecondaryActionCard({ action, index }: { action: PriorityAction; index: number }) {
  const accent = PRIORITY_ACCENT[action.type] ?? ACCENT;
  const icon = PRIORITY_ICON[action.type] ?? "mdi:flash-outline";
  const isLink = !!action.actionUrl;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.05 },
        },
      }}
    >
      <Box
        component={isLink ? Link : "div"}
        {...(isLink && action.actionUrl ? { href: action.actionUrl } : {})}
        sx={{
          position: "relative",
          display: "block",
          p: 2,
          borderRadius: 2.5,
          border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
          textDecoration: "none",
          color: "inherit",
          cursor: isLink ? "pointer" : "default",
          transition: "all 0.2s ease",
          "&:hover": isLink
            ? {
                transform: "translateY(-2px)",
                borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
                boxShadow: `0 20px 36px -22px color-mix(in srgb, ${accent} 50%, transparent)`,
              }
            : undefined,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 3,
            background: `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 30%, transparent) 100%)`,
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.75, ml: 0.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `color-mix(in srgb, ${accent} 18%, transparent)`,
              color: accent,
            }}
          >
            <IconWrapper icon={icon} size={16} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                color: "var(--font-primary)",
                fontSize: "0.95rem",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              {action.title}
            </Typography>
          </Box>
          {isLink && (
            <Box
              sx={{
                color: accent,
                display: "flex",
                alignItems: "center",
                opacity: 0.8,
              }}
            >
              <IconWrapper icon="mdi:arrow-top-right" size={16} />
            </Box>
          )}
        </Box>
        <Typography
          variant="body2"
          sx={{ color: "var(--font-secondary)", fontSize: "0.82rem", lineHeight: 1.5, ml: 0.5 }}
        >
          {action.description}
        </Typography>
      </Box>
    </motion.div>
  );
}

function ContentCard({ item, index }: { item: RecommendedContentItem; index: number }) {
  const icon = PRIORITY_ICON[item.type] ?? "mdi:bookmark-outline";
  const accent = PRIORITY_ACCENT[item.type] ?? ACCENT;
  const isLink = !!item.url;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.04 },
        },
      }}
    >
      <Box
        component={isLink ? Link : "div"}
        {...(isLink && item.url ? { href: item.url } : {})}
        sx={{
          position: "relative",
          display: "block",
          p: 1.75,
          borderRadius: 2.25,
          border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
          bgcolor: "color-mix(in srgb, var(--card-bg) 94%, transparent)",
          textDecoration: "none",
          color: "inherit",
          cursor: isLink ? "pointer" : "default",
          height: "100%",
          transition: "all 0.2s ease",
          "&:hover": isLink
            ? {
                transform: "translateY(-2px)",
                borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
                boxShadow: `0 16px 26px -18px color-mix(in srgb, ${accent} 45%, transparent)`,
              }
            : undefined,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `color-mix(in srgb, ${accent} 18%, transparent)`,
              color: accent,
            }}
          >
            <IconWrapper icon={icon} size={14} />
          </Box>
          <Box
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 999,
              bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                color: accent,
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {TYPE_LABEL[item.type] ?? item.type}
            </Typography>
          </Box>
        </Box>
        <Typography
          sx={{
            fontWeight: 800,
            color: "var(--font-primary)",
            fontSize: "0.92rem",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            mb: 0.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "var(--font-secondary)", fontSize: "0.75rem", lineHeight: 1.45 }}
        >
          {item.reason}
        </Typography>
      </Box>
    </motion.div>
  );
}

function TaskRow({ task, index }: { task: PendingTask; index: number }) {
  const isOverdue = task.dueDate ? new Date(task.dueDate).getTime() < Date.now() : false;
  const accent = isOverdue ? RED : ACCENT;
  const isLink = !!task.url;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -8 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.03 },
        },
      }}
    >
      <Box
        component={isLink ? Link : "div"}
        {...(isLink ? { href: task.url! } : {})}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          p: 1.5,
          borderRadius: 2,
          border: `1px solid color-mix(in srgb, ${isOverdue ? RED : "var(--border-default)"} ${isOverdue ? "28%" : "65%"}, transparent)`,
          bgcolor: isOverdue
            ? `color-mix(in srgb, ${RED} 6%, transparent)`
            : "color-mix(in srgb, var(--card-bg) 94%, transparent)",
          textDecoration: "none",
          color: "inherit",
          cursor: isLink ? "pointer" : "default",
          transition: "all 0.2s ease",
          "&:hover": isLink
            ? {
                borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
                transform: "translateX(3px)",
              }
            : undefined,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `color-mix(in srgb, ${accent} 18%, transparent)`,
            color: accent,
            flexShrink: 0,
          }}
        >
          <IconWrapper
            icon={isOverdue ? "mdi:alert-circle-outline" : "mdi:clock-outline"}
            size={15}
          />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              fontSize: "0.88rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {task.title}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 0.85,
            py: 0.3,
            borderRadius: 999,
            bgcolor: `color-mix(in srgb, ${accent} ${isOverdue ? "16%" : "12%"}, transparent)`,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color: accent,
              fontSize: "0.68rem",
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatRelative(task.dueDate)}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

function UpcomingRow({ row, index }: { row: UpcomingAssessment; index: number }) {
  const isLink = !!row.url;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: 8 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.03 },
        },
      }}
    >
      <Box
        component={isLink ? Link : "div"}
        {...(isLink ? { href: row.url! } : {})}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          p: 1.5,
          borderRadius: 2,
          border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
          bgcolor: "color-mix(in srgb, var(--card-bg) 94%, transparent)",
          textDecoration: "none",
          color: "inherit",
          cursor: isLink ? "pointer" : "default",
          transition: "all 0.2s ease",
          "&:hover": isLink
            ? {
                borderColor: `color-mix(in srgb, ${CYAN} 50%, transparent)`,
                transform: "translateX(3px)",
              }
            : undefined,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${CYAN} 0%, color-mix(in srgb, ${CYAN} 60%, #000) 100%)`,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:calendar-star" size={15} color="#fff" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              fontSize: "0.88rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.72rem", mt: 0.25, display: "block" }}
          >
            {row.duration > 0 ? `${row.duration} min` : "Duration —"}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 0.85,
            py: 0.3,
            borderRadius: 999,
            bgcolor: `color-mix(in srgb, ${CYAN} 14%, transparent)`,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color: CYAN,
              fontSize: "0.68rem",
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatRelative(row.date)}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export function ActionPanelSection({ data }: ActionPanelSectionProps) {
  const entrance = useViewportEntrance();
  const isEmpty =
    data.priorityActions.length === 0 &&
    data.recommendedContent.length === 0 &&
    data.pendingTasks.length === 0 &&
    data.upcomingAssessments.length === 0;

  const sortedActions = useMemo(
    () => [...data.priorityActions].sort((a, b) => a.priority - b.priority),
    [data.priorityActions],
  );
  const heroAction = sortedActions[0];
  const secondaryActions = sortedActions.slice(1);

  const overdueCount = useMemo(
    () =>
      data.pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now())
        .length,
    [data.pendingTasks],
  );

  // Sub-section list collapses — each subsection caps at TASKS_PREVIEW etc.
  // and shows a toggle when there's more. Keeps the Action Panel scannable
  // when the backend returns a long list of recommended content / open loops.
  const TASKS_PREVIEW = 5;
  const UPCOMING_PREVIEW = 5;
  const RECOMMENDED_PREVIEW = 6;
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const visibleTasks = showAllTasks ? data.pendingTasks : data.pendingTasks.slice(0, TASKS_PREVIEW);
  const visibleUpcoming = showAllUpcoming ? data.upcomingAssessments : data.upcomingAssessments.slice(0, UPCOMING_PREVIEW);
  const visibleRecommended = showAllRecommended ? data.recommendedContent : data.recommendedContent.slice(0, RECOMMENDED_PREVIEW);

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          `radial-gradient(60% 75% at 100% 0%, color-mix(in srgb, ${ACCENT} 18%, transparent), transparent 60%)`,
          `radial-gradient(50% 65% at 0% 100%, color-mix(in srgb, ${CYAN} 14%, transparent), transparent 60%)`,
          `radial-gradient(35% 55% at 50% 50%, color-mix(in srgb, ${ACCENT} 5%, transparent), transparent 75%)`,
        ]}
      >
        <SectionHero
          chapter="Chapter 11"
          title="Action Panel"
          subtitle="Your next moves — pulled from weak areas, pending tasks, and upcoming assessments. One click each."
          iconBadge={{
            icon: "mdi:lightning-bolt-outline",
            gradient: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
          }}
          rightSlot={
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.75,
                py: 1,
                borderRadius: 999,
                bgcolor: `color-mix(in srgb, ${ACCENT} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${ACCENT} 25%, transparent)`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  color: ACCENT_DARK,
                }}
              >
                <IconWrapper icon="mdi:flash" size={14} color={ACCENT_DARK} />
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    color: ACCENT_DARK,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <CountUp value={data.priorityActions.length} duration={1} />
                </Typography>
              </Box>
              <Box sx={{ height: 18, width: 1, bgcolor: "color-mix(in srgb, var(--border-default) 80%, transparent)" }} />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  color: overdueCount > 0 ? RED : "var(--font-secondary)",
                }}
              >
                <IconWrapper
                  icon={overdueCount > 0 ? "mdi:alert" : "mdi:clock-outline"}
                  size={14}
                  color={overdueCount > 0 ? RED : "var(--font-secondary)"}
                />
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    color: overdueCount > 0 ? RED : "var(--font-secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <CountUp value={overdueCount} duration={1} />
                </Typography>
              </Box>
            </Box>
          }
        />

        {isEmpty ? (
          <Box
            sx={{
              py: { xs: 6, sm: 8 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
              bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
              color: "var(--font-secondary)",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                borderRadius: 3,
                background: `linear-gradient(135deg, ${EMERALD} 0%, color-mix(in srgb, ${EMERALD} 60%, #000) 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 18px 32px -16px color-mix(in srgb, ${EMERALD} 60%, transparent)`,
              }}
            >
              <IconWrapper icon="mdi:check-circle-outline" size={36} color="#fff" />
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: "var(--font-primary)",
                fontSize: "1.1rem",
                letterSpacing: "-0.02em",
                mt: 2,
              }}
            >
              All caught up.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, maxWidth: 360, mx: "auto" }}
            >
              Nothing urgent right now. Keep up the momentum on your course path.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Hero next-best-action */}
            {heroAction && (
              <Box
                component={motion.div}
                variants={fadeRise}
                {...entrance}
                sx={{ mb: { xs: 3, md: 4 } }}
              >
                <HeroAction action={heroAction} />
              </Box>
            )}

            {/* Secondary actions row */}
            {secondaryActions.length > 0 && (
              <Box sx={{ mb: { xs: 3.5, md: 4.5 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "0.66rem",
                    }}
                  >
                    Other priorities
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--border-default) 80%, transparent), transparent)",
                    }}
                  />
                </Box>
                <motion.div
                  variants={gridStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  }}
                >
                  {secondaryActions.map((a, i) => (
                    <SecondaryActionCard key={a.id} action={a} index={i} />
                  ))}
                </motion.div>
              </Box>
            )}

            {/* KPI rail */}
            <Box
              component={motion.div}
              variants={gridStagger}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                borderBottom:
                  "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {[
                {
                  label: "Priority actions",
                  value: data.priorityActions.length,
                  accent: ACCENT,
                },
                {
                  label: "Recommended",
                  value: data.recommendedContent.length,
                  accent: EMERALD,
                },
                {
                  label: "Pending tasks",
                  value: data.pendingTasks.length,
                  accent: overdueCount > 0 ? RED : AMBER,
                },
                {
                  label: "Upcoming tests",
                  value: data.upcomingAssessments.length,
                  accent: CYAN,
                },
              ].map((kpi, idx, arr) => (
                <Box
                  key={kpi.label}
                  component={motion.div}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
                    },
                  }}
                  sx={{
                    position: "relative",
                    py: { xs: 2.25, md: 2.75 },
                    px: { xs: 1.5, sm: 2 },
                    borderRight: {
                      xs:
                        idx % 2 !== 1
                          ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                          : "none",
                      md:
                        idx !== arr.length - 1
                          ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                          : "none",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 28,
                      height: 2,
                      background: kpi.accent,
                    },
                  }}
                >
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.65rem", sm: "2.1rem", md: "2.55rem" },
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <CountUp value={kpi.value} duration={1.2} />
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      display: "block",
                      mt: 1,
                    }}
                  >
                    {kpi.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Tasks + Upcoming, side by side */}
            {(data.pendingTasks.length > 0 || data.upcomingAssessments.length > 0) && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
                  gap: { xs: 3, md: 3 },
                  mb: { xs: 3.5, md: 4.5 },
                }}
              >
                {data.pendingTasks.length > 0 && (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5,
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--font-secondary)",
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            fontSize: "0.66rem",
                          }}
                        >
                          Open loops
                        </Typography>
                        <Typography
                          component="h3"
                          sx={{
                            fontWeight: 800,
                            color: "var(--font-primary)",
                            fontSize: "1.15rem",
                            letterSpacing: "-0.02em",
                            mt: 0.25,
                          }}
                        >
                          Pending tasks
                        </Typography>
                      </Box>
                      {overdueCount > 0 && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.4,
                            borderRadius: 999,
                            bgcolor: `color-mix(in srgb, ${RED} 14%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${RED} 28%, transparent)`,
                            color: RED,
                          }}
                        >
                          <IconWrapper icon="mdi:alert" size={12} color={RED} />
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.66rem",
                              color: RED,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            {overdueCount} overdue
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <motion.div
                      variants={gridStagger}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.1 }}
                      style={{ display: "grid", gap: 8 }}
                    >
                      {visibleTasks.map((task, i) => (
                        <TaskRow key={task.id} task={task} index={i} />
                      ))}
                    </motion.div>
                    {data.pendingTasks.length > TASKS_PREVIEW && (
                      <ShowAllToggle
                        expanded={showAllTasks}
                        onToggle={() => setShowAllTasks((v) => !v)}
                        total={data.pendingTasks.length}
                        preview={TASKS_PREVIEW}
                        label="tasks"
                      />
                    )}
                  </Box>
                )}

                {data.upcomingAssessments.length > 0 && (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          fontSize: "0.66rem",
                        }}
                      >
                        On the calendar
                      </Typography>
                      <Typography
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          color: "var(--font-primary)",
                          fontSize: "1.15rem",
                          letterSpacing: "-0.02em",
                          mt: 0.25,
                        }}
                      >
                        Upcoming assessments
                      </Typography>
                    </Box>
                    <motion.div
                      variants={gridStagger}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.1 }}
                      style={{ display: "grid", gap: 8 }}
                    >
                      {visibleUpcoming.map((row, i) => (
                        <UpcomingRow key={row.id} row={row} index={i} />
                      ))}
                    </motion.div>
                    {data.upcomingAssessments.length > UPCOMING_PREVIEW && (
                      <ShowAllToggle
                        expanded={showAllUpcoming}
                        onToggle={() => setShowAllUpcoming((v) => !v)}
                        total={data.upcomingAssessments.length}
                        preview={UPCOMING_PREVIEW}
                        label="upcoming"
                      />
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Recommended content */}
            {data.recommendedContent.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--font-secondary)",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontSize: "0.66rem",
                      }}
                    >
                      Hand-picked for you
                    </Typography>
                    <Typography
                      component="h3"
                      sx={{
                        fontWeight: 800,
                        color: "var(--font-primary)",
                        fontSize: { xs: "1.2rem", sm: "1.35rem" },
                        letterSpacing: "-0.02em",
                        mt: 0.25,
                      }}
                    >
                      Recommended content
                    </Typography>
                  </Box>
                </Box>
                <motion.div
                  variants={gridStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.05 }}
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  }}
                >
                  {visibleRecommended.map((item, i) => (
                    <ContentCard key={item.id} item={item} index={i} />
                  ))}
                </motion.div>
                {data.recommendedContent.length > RECOMMENDED_PREVIEW && (
                  <ShowAllToggle
                    expanded={showAllRecommended}
                    onToggle={() => setShowAllRecommended((v) => !v)}
                    total={data.recommendedContent.length}
                    preview={RECOMMENDED_PREVIEW}
                    label="picks"
                  />
                )}
              </Box>
            )}
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}

/** Shared "Show all N / Show recent M" pill. Used by the three collapsible
 *  subsections inside Action Panel so each list stays scannable. */
function ShowAllToggle({
  expanded,
  onToggle,
  total,
  preview,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  total: number;
  preview: number;
  label: string;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          appearance: "none",
          border: `1px solid color-mix(in srgb, ${ACCENT} 28%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${ACCENT} 6%, transparent)`,
          color: ACCENT_DARK,
          fontWeight: 800,
          fontSize: "0.72rem",
          letterSpacing: "0.04em",
          px: 1.75,
          py: 0.6,
          borderRadius: 999,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          transition: "all 0.18s ease",
          "&:hover": {
            borderColor: ACCENT,
            backgroundColor: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
          },
        }}
        aria-expanded={expanded}
      >
        <IconWrapper icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={14} />
        {expanded ? `Show recent ${preview}` : `Show all ${total} ${label}`}
      </Box>
    </Box>
  );
}
