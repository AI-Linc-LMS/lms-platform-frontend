"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { Thread } from "@/lib/services/community.service";

const POLL_COLOR = "#8b5cf6";

interface PollWidgetProps {
  thread: Thread;
  onPollVote?: (threadId: number, optionIndex: number) => Promise<void>;
  isSaving?: boolean;
}

export function PollWidget({ thread, onPollVote, isSaving = false }: PollWidgetProps) {
  if (!thread.poll_options || thread.poll_options.length === 0) return null;

  const pollResults = thread.poll_results ?? thread.poll_options.map(() => 0);
  const totalVotes = pollResults.reduce((a, b) => a + b, 0);
  const hasVoted = thread.user_poll_vote !== null && thread.user_poll_vote !== undefined;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {thread.poll_options.map((option, i) => {
          const votes = pollResults[i] ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isVoted = thread.user_poll_vote === i;

          return (
            <Box
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSaving && onPollVote) onPollVote(thread.id, i);
              }}
              sx={{
                position: "relative",
                border: `1.5px solid ${isVoted ? POLL_COLOR : "var(--border-default)"}`,
                borderRadius: "8px",
                overflow: "hidden",
                cursor: isSaving || !onPollVote ? "default" : "pointer",
                transition: "border-color 0.15s",
                ...(!isSaving && onPollVote ? { "&:hover": { borderColor: POLL_COLOR } } : {}),
              }}
            >
              {hasVoted && pct > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: isVoted ? `${POLL_COLOR}1a` : "var(--surface)",
                    transition: "width 0.4s ease",
                  }}
                />
              )}
              <Box sx={{ position: "relative", px: 1.5, py: 0.875, display: "flex", alignItems: "center", gap: 1 }}>
                {isVoted && <IconWrapper icon="mdi:check-circle" size={14} color={POLL_COLOR} />}
                <Typography variant="body2" sx={{ flex: 1, fontWeight: isVoted ? 600 : 400, fontSize: "0.875rem" }}>
                  {option}
                </Typography>
                {hasVoted && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: isVoted ? POLL_COLOR : "var(--font-secondary)",
                      fontWeight: isVoted ? 700 : 500,
                      minWidth: "3ch",
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Typography variant="caption" color="var(--font-secondary)" sx={{ mt: 0.75, display: "block" }}>
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        {!hasVoted && totalVotes === 0 && " · Be the first to vote!"}
      </Typography>
    </Box>
  );
}
