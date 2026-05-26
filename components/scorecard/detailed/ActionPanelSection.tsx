"use client";

import Link from "next/link";
import { Box, Chip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Reveal, gridStagger } from "@/components/scorecard/shared";
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

const PRIORITY_ICON: Record<string, string> = {
  mcq: "mdi:format-list-checks",
  revise: "mdi:book-open-page-variant",
  video: "mdi:play-circle-outline",
  interview: "mdi:account-voice",
  assessment: "mdi:clipboard-check",
};

const PRIORITY_ACCENT: Record<string, string> = {
  mcq: "var(--accent-indigo)",
  revise: "#f59e0b",
  video: "#10b981",
  interview: "#a855f7",
  assessment: "#0a66c2",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const ms = d.getTime() - Date.now();
    if (ms < 0) return "overdue";
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    if (days < 7) return `in ${days} days`;
    if (days < 30) return `in ${Math.floor(days / 7)} weeks`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function ActionCard({ action }: { action: PriorityAction }) {
  const accent = PRIORITY_ACCENT[action.type] ?? "var(--accent-indigo)";
  const icon = PRIORITY_ICON[action.type] ?? "mdi:flash-outline";
  const isLink = !!action.actionUrl;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        component={isLink ? Link : "div"}
        {...(isLink && action.actionUrl ? { href: action.actionUrl } : {})}
        sx={{
          position: "relative",
          display: "block",
          p: { xs: 1.5, sm: 1.75 },
          borderRadius: 2.5,
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 8%, transparent) 0%, transparent 100%)`,
          textDecoration: "none",
          color: "inherit",
          cursor: isLink ? "pointer" : "default",
          transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
          ...(isLink && {
            "&:hover": {
              transform: "translateY(-1px)",
              borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
              boxShadow: `0 18px 40px -24px color-mix(in srgb, ${accent} 40%, transparent)`,
            },
          }),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
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
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.9rem" }}
          >
            {action.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem", lineHeight: 1.45 }}>
          {action.description}
        </Typography>
      </Box>
    </motion.div>
  );
}

function ContentCard({ item }: { item: RecommendedContentItem }) {
  const icon = PRIORITY_ICON[item.type] ?? "mdi:bookmark-outline";
  const accent = PRIORITY_ACCENT[item.type] ?? "var(--accent-indigo)";
  const isLink = !!item.url;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        component={isLink ? Link : "div"}
        {...(isLink && item.url ? { href: item.url } : {})}
        sx={{
          display: "block",
          p: 1.5,
          borderRadius: 2,
          border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          bgcolor: "var(--card-bg)",
          textDecoration: "none",
          color: "inherit",
          cursor: isLink ? "pointer" : "default",
          transition: "border-color 0.18s ease, transform 0.18s ease",
          ...(isLink && {
            "&:hover": {
              borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
              transform: "translateY(-1px)",
            },
          }),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Box sx={{ color: accent }}>
            <IconWrapper icon={icon} size={14} />
          </Box>
          <Chip
            size="small"
            label={item.type.toUpperCase()}
            sx={{
              height: 18,
              fontSize: "0.62rem",
              fontWeight: 700,
              bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)`,
              color: accent,
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.85rem", lineHeight: 1.3, mb: 0.25 }}>
          {item.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
          {item.reason}
        </Typography>
      </Box>
    </motion.div>
  );
}

function PendingTaskRow({ task }: { task: PendingTask }) {
  const isOverdue = task.dueDate ? new Date(task.dueDate).getTime() < Date.now() : false;
  return (
    <Box
      component={task.url ? Link : "div"}
      {...(task.url ? { href: task.url } : {})}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1.25,
        borderRadius: 1.5,
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        bgcolor: "var(--card-bg)",
        textDecoration: "none",
        color: "inherit",
        ...(task.url && {
          "&:hover": { borderColor: "color-mix(in srgb, var(--accent-indigo) 40%, transparent)" },
        }),
      }}
    >
      <Box sx={{ color: isOverdue ? "#ef4444" : "var(--accent-indigo)" }}>
        <IconWrapper icon={isOverdue ? "mdi:alert-circle-outline" : "mdi:clock-outline"} size={16} />
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          fontSize: "0.85rem",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.title}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: isOverdue ? "#ef4444" : "var(--font-secondary)",
          fontSize: "0.72rem",
        }}
      >
        {formatRelative(task.dueDate)}
      </Typography>
    </Box>
  );
}

function UpcomingRow({ row }: { row: UpcomingAssessment }) {
  return (
    <Box
      component={row.url ? Link : "div"}
      {...(row.url ? { href: row.url } : {})}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1.25,
        borderRadius: 1.5,
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        bgcolor: "var(--card-bg)",
        textDecoration: "none",
        color: "inherit",
        ...(row.url && {
          "&:hover": { borderColor: "color-mix(in srgb, var(--accent-cyan, #06b6d4) 40%, transparent)" },
        }),
      }}
    >
      <Box sx={{ color: "var(--accent-cyan, #06b6d4)" }}>
        <IconWrapper icon="mdi:calendar-star" size={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            fontSize: "0.85rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
          {row.duration > 0 ? `${row.duration} min` : "—"}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--accent-cyan, #0891b2)", fontSize: "0.72rem" }}>
        {formatRelative(row.date)}
      </Typography>
    </Box>
  );
}

export function ActionPanelSection({ data }: ActionPanelSectionProps) {
  const isEmpty =
    data.priorityActions.length === 0 &&
    data.recommendedContent.length === 0 &&
    data.pendingTasks.length === 0 &&
    data.upcomingAssessments.length === 0;

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            backgroundImage: [
              "radial-gradient(55% 70% at 100% 0%, color-mix(in srgb, var(--accent-indigo) 18%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 0% 100%, color-mix(in srgb, var(--accent-cyan, #06b6d4) 14%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              pb: { xs: 2.5, md: 3 },
              mb: { xs: 2.5, md: 3 },
              borderBottom:
                "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 12px 24px -12px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                flexShrink: 0,
              }}
            >
              <IconWrapper icon="mdi:lightning-bolt-outline" size={22} color="#fff" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "var(--font-primary)",
                  fontSize: { xs: "1.05rem", sm: "1.2rem" },
                  lineHeight: 1.25,
                }}
              >
                Action Panel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", mt: 0.25 }}>
                Your next moves — pulled from weak areas, pending tasks, and upcoming assessments.
              </Typography>
            </Box>
          </Box>

          {isEmpty ? (
            <Box
              sx={{
                py: { xs: 4, sm: 5 },
                textAlign: "center",
                borderRadius: 2,
                border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:lightning-bolt-outline" size={42} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Nothing urgent right now. Keep up the momentum on your course path.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 2.5 }}>
              {data.priorityActions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
                    Priority actions
                  </Typography>
                  <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    {data.priorityActions.map((a) => (
                      <ActionCard key={a.id} action={a} />
                    ))}
                  </motion.div>
                </Box>
              )}

              {data.recommendedContent.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
                    Recommended content
                  </Typography>
                  <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    {data.recommendedContent.map((item) => (
                      <ContentCard key={item.id} item={item} />
                    ))}
                  </motion.div>
                </Box>
              )}

              {data.pendingTasks.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
                    Pending tasks
                  </Typography>
                  <Box sx={{ display: "grid", gap: 8 / 8 }}>
                    {data.pendingTasks.map((task) => (
                      <PendingTaskRow key={task.id} task={task} />
                    ))}
                  </Box>
                </Box>
              )}

              {data.upcomingAssessments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
                    Upcoming assessments
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    {data.upcomingAssessments.map((row) => (
                      <UpcomingRow key={row.id} row={row} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
