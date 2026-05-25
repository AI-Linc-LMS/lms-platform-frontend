"use client";

import { ReactNode } from "react";
import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AttachmentList } from "./AttachmentList";
import {
  ReopenHistoryEntry,
  ResolutionHistoryEntry,
  Ticket,
} from "@/lib/services/ticket.service";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function initialsFor(
  name: string | null | undefined,
  email?: string | null,
): string {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

interface BubbleProps {
  tone: "user" | "admin" | "reopen";
  authorLabel: string;
  authorEmail?: string | null;
  meta?: ReactNode;
  body?: string;
  attachments?: string[];
  attachmentsHeading?: string;
  badge?: string;
  trailing?: ReactNode;
}

function Bubble({
  tone,
  authorLabel,
  authorEmail,
  meta,
  body,
  attachments,
  attachmentsHeading,
  badge,
  trailing,
}: BubbleProps) {
  const palette =
    tone === "admin"
      ? {
          paperBg: "var(--surface-success-light)",
          paperBorder: "var(--ticket-success-border)",
          paperShadow: "0 1px 2px rgba(22,163,74,0.06)",
          avatarBg: "var(--ats-success-muted)",
          avatarColor: "var(--font-light)",
          authorColor: "var(--ticket-success-strong)",
          metaColor: "var(--ats-success-muted)",
          bodyColor: "var(--ticket-success-deep)",
          icon: "mdi:check",
          badgeBg: "var(--ticket-success-soft)",
          badgeBorder: "var(--ticket-success-border)",
          badgeColor: "var(--ticket-success-strong)",
        }
      : tone === "reopen"
        ? {
            paperBg: "var(--ticket-reopen-bg)",
            paperBorder: "var(--ticket-reopen-border)",
            paperShadow: "0 1px 2px rgba(249,115,22,0.05)",
            avatarBg: "var(--ticket-reopen)",
            avatarColor: "var(--font-light)",
            authorColor: "var(--warning-strong)",
            metaColor: "var(--ticket-reopen-strong)",
            bodyColor: "var(--ticket-reopen-deep)",
            icon: "mdi:lock-reset",
            badgeBg: "var(--ticket-reopen-soft)",
            badgeBorder: "var(--ticket-reopen-border)",
            badgeColor: "var(--warning-strong)",
          }
        : {
            paperBg: "var(--card-bg)",
            paperBorder: "var(--border-default)",
            paperShadow: "0 1px 2px rgba(15,23,42,0.04)",
            avatarBg: "var(--surface-blue-light)",
            avatarColor: "var(--ticket-brand-hover)",
            authorColor: "var(--ticket-text-strong)",
            metaColor: "var(--font-tertiary)",
            bodyColor: "var(--font-primary-dark)",
            icon: "",
            badgeBg: "var(--info-surface)",
            badgeBorder: "var(--info-border)",
            badgeColor: "var(--ticket-brand-hover)",
          };

  return (
    <Paper
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px solid ${palette.paperBorder}`,
        backgroundColor: palette.paperBg,
        boxShadow: palette.paperShadow,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: palette.avatarBg,
            color: palette.avatarColor,
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {palette.icon ? (
            <IconWrapper icon={palette.icon} size={18} color={palette.avatarColor} />
          ) : (
            initialsFor(authorLabel, authorEmail)
          )}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: "wrap" }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: palette.authorColor }}
            >
              {authorLabel}
            </Typography>
            {badge && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 0.875,
                  py: 0.125,
                  borderRadius: 999,
                  backgroundColor: palette.badgeBg,
                  border: `1px solid ${palette.badgeBorder}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    letterSpacing: 0.4,
                    color: palette.badgeColor,
                    textTransform: "uppercase",
                  }}
                >
                  {badge}
                </Typography>
              </Box>
            )}
            {meta && (
              <Typography
                variant="caption"
                sx={{ color: palette.metaColor, fontSize: "0.7rem" }}
              >
                {meta}
              </Typography>
            )}
          </Stack>
          {body && (
            <Typography
              variant="body2"
              sx={{
                mt: 1.25,
                color: palette.bodyColor,
                whiteSpace: "pre-wrap",
                lineHeight: 1.65,
              }}
            >
              {body}
            </Typography>
          )}
          {attachments && attachments.length > 0 && (
            <AttachmentList
              urls={attachments}
              heading={attachmentsHeading}
            />
          )}
          {trailing}
        </Box>
      </Stack>
    </Paper>
  );
}

interface ThreadProps {
  ticket: Ticket;
  raiserName: string;
  raiserEmail?: string | null;
  trailing?: ReactNode;
  currentResolutionExtra?: ReactNode;
}

export function TicketThread({
  ticket,
  raiserName,
  raiserEmail,
  trailing,
  currentResolutionExtra,
}: ThreadProps) {
  const pastResolutions: ResolutionHistoryEntry[] = ticket.resolution_history || [];
  const pastReopens: ReopenHistoryEntry[] = ticket.reopen_history || [];
  const pairs = Math.max(pastResolutions.length, pastReopens.length);

  return (
    <Stack spacing={2.5}>
      <Bubble
        tone="user"
        authorLabel={raiserName}
        authorEmail={raiserEmail}
        meta="raised this ticket"
        body={ticket.description}
        attachments={ticket.user_attachments}
        attachmentsHeading={
          ticket.user_attachments?.length ? "Your attachments" : undefined
        }
      />

      {Array.from({ length: pairs }).map((_, i) => {
        const res = pastResolutions[i];
        const reopen = pastReopens[i];
        return (
          <Box key={`pair-${i}`} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {res && (
              <Bubble
                tone="admin"
                authorLabel={res.resolved_by_name || "Support Team"}
                authorEmail={res.resolved_by_email}
                meta={
                  res.resolved_at
                    ? `responded on ${formatDateTime(res.resolved_at)}`
                    : undefined
                }
                badge={`Response #${i + 1}`}
                body={res.notes || "Your issue has been resolved."}
                attachments={res.attachments}
                attachmentsHeading={
                  res.attachments?.length ? "Files from support" : undefined
                }
              />
            )}
            {reopen && (
              <Bubble
                tone="reopen"
                authorLabel={
                  reopen.by === "admin"
                    ? "Reopened by admin"
                    : `${raiserName} reopened the ticket`
                }
                meta={`on ${formatDateTime(reopen.reopened_at)}`}
                badge={`Reopen #${i + 1}`}
                body={reopen.details}
                attachments={reopen.attachments}
                attachmentsHeading={
                  reopen.attachments?.length ? "Added attachments" : undefined
                }
              />
            )}
          </Box>
        );
      })}

      {ticket.status === "RESOLVED" && (
        <Bubble
          tone="admin"
          authorLabel={
            ticket.resolved_by_user?.full_name ||
            ticket.resolved_by_user?.email ||
            "Support Team"
          }
          authorEmail={ticket.resolved_by_user?.email}
          meta={
            ticket.resolved_at
              ? `resolved on ${formatDateTime(ticket.resolved_at)}`
              : undefined
          }
          badge="Latest response"
          body={
            ticket.admin_resolution_notes || "Your issue has been resolved."
          }
          attachments={ticket.admin_attachments}
          attachmentsHeading={
            ticket.admin_attachments?.length ? "Files from support" : undefined
          }
          trailing={currentResolutionExtra}
        />
      )}

      {trailing}
    </Stack>
  );
}
