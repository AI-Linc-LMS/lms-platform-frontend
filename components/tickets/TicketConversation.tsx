"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar, Box, Button, CircularProgress, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AttachmentList } from "./AttachmentList";
import {
  ticketService,
  type Ticket,
  type TicketComment,
} from "@/lib/services/ticket.service";

/**
 * The ticket conversation: replies from either side, and a box to add one.
 *
 * Rendered BESIDE TicketThread rather than inside it. That component shows resolutions and
 * reopens, which are state changes with their own history; a reply is someone talking. The
 * backend keeps them in separate stores for the same reason, and merging them here would put a
 * "thanks, that worked" in the same list as "this ticket was closed".
 *
 * Until this existed the only things that could happen to a ticket were RESOLVE and REOPEN, so
 * an admin needing one more detail had to resolve the ticket to ask for it — closing a
 * conversation that had never happened.
 */
function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

function CommentBubble({ comment }: { comment: TicketComment }) {
  const staff = comment.side === "staff";
  const name = comment.author?.full_name || comment.author?.email || (staff ? "Support" : "Learner");
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="flex-start"
      sx={{ flexDirection: staff ? "row-reverse" : "row" }}
    >
      <Avatar
        sx={{
          width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
          bgcolor: staff ? "var(--primary-100)" : "var(--surface-hover)",
          color: staff ? "var(--primary-700)" : "var(--font-secondary)",
        }}
      >
        {initials(name)}
      </Avatar>
      <Paper
        sx={{
          p: 1.75, borderRadius: 3, maxWidth: "80%", boxShadow: "none",
          border: "1px solid var(--border-light)",
          backgroundColor: staff ? "var(--primary-50)" : "var(--surface)",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.82rem" }}>{name}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--font-tertiary)" }}>
            {formatWhen(comment.created_at)}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {comment.body}
        </Typography>
        {comment.attachments?.length ? (
          <Box sx={{ mt: 1.25 }}>
            <AttachmentList urls={comment.attachments} dense />
          </Box>
        ) : null}
      </Paper>
    </Stack>
  );
}

interface Props {
  ticket: Ticket;
  clientId: number;
  /** Shown above the composer when the ticket is closed. */
  readOnlyNote?: string;
}

export function TicketConversation({ ticket, clientId, readOnlyNote }: Props) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      setComments(await ticketService.listComments(clientId, ticket.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the conversation");
    } finally {
      setLoading(false);
    }
  }, [clientId, ticket.id]);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await ticketService.addComment(clientId, ticket.id, { body: text });
      setComments((prev) => [...prev, created]);
      setBody("");
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      // Keep what they typed. Losing a written reply to a failed request is worse than the
      // failure itself.
      setError(e instanceof Error ? e.message : "Failed to send your reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 }, borderRadius: 3, boxShadow: "none",
        border: "1px solid var(--border-light)", backgroundColor: "var(--card-bg)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <IconWrapper icon="mdi:forum-outline" size={20} color="var(--font-secondary)" />
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Conversation</Typography>
        {comments.length > 0 && (
          <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
            {comments.length} {comments.length === 1 ? "reply" : "replies"}
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={22} />
        </Stack>
      ) : comments.length === 0 ? (
        <Typography sx={{ fontSize: "0.86rem", color: "var(--font-secondary)", mb: 2 }}>
          No replies yet. Ask a question or add anything that might help.
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {comments.map((c) => <CommentBubble key={c.id} comment={c} />)}
          <div ref={endRef} />
        </Stack>
      )}

      {readOnlyNote ? (
        <Typography sx={{ fontSize: "0.8rem", color: "var(--font-tertiary)" }}>
          {readOnlyNote}
        </Typography>
      ) : (
        <Stack spacing={1}>
          <TextField
            multiline
            minRows={2}
            maxRows={8}
            fullWidth
            size="small"
            placeholder="Write a reply…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sending}
          />
          {error && (
            <Typography sx={{ fontSize: "0.8rem", color: "var(--error-500)" }}>
              {error}
            </Typography>
          )}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={send}
              disabled={!body.trim() || sending}
              startIcon={
                sending ? <CircularProgress size={14} color="inherit" />
                        : <IconWrapper icon="mdi:send" size={16} />
              }
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              {sending ? "Sending…" : "Send reply"}
            </Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
