"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { communityService } from "@/lib/services/community.service";

const countsKey = (threadId: number) => `ailinc_community_poll_counts_${threadId}`;
const voteKey = (threadId: number) => `ailinc_community_poll_vote_${threadId}`;

type PollOption = { id: number; text: string; votes: number };

function loadCountsLocal(threadId: number, n: number): number[] {
  try {
    const raw = localStorage.getItem(countsKey(threadId));
    if (!raw) return Array(n).fill(0);
    const arr = JSON.parse(raw) as number[];
    if (!Array.isArray(arr) || arr.length !== n) return Array(n).fill(0);
    return arr.map((v) => (typeof v === "number" && v >= 0 ? v : 0));
  } catch {
    return Array(n).fill(0);
  }
}

function saveCountsLocal(threadId: number, counts: number[]) {
  try {
    localStorage.setItem(countsKey(threadId), JSON.stringify(counts));
  } catch {
    /* ignore */
  }
}

function loadVoteIndexLocal(threadId: number): number | null {
  try {
    const raw = localStorage.getItem(voteKey(threadId));
    if (raw == null) return null;
    const n = JSON.parse(raw);
    return typeof n === "number" ? n : null;
  } catch {
    return null;
  }
}

function saveVoteIndexLocal(threadId: number, index: number) {
  try {
    localStorage.setItem(voteKey(threadId), JSON.stringify(index));
  } catch {
    /* ignore */
  }
}

interface PollBlockProps {
  threadId: number;
  optionTexts: string[];
  title?: string;
  onVoted?: () => void;
  compact?: boolean;
}

export function PollBlock({
  threadId,
  optionTexts,
  title = "Poll",
  onVoted,
  compact = false,
}: PollBlockProps) {
  const optionTextsKey = JSON.stringify(optionTexts.filter((t) => t.length > 0));

  const [options, setOptions] = useState<PollOption[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [serverMode, setServerMode] = useState(false);

  const syncFromServer = useCallback(
    async (texts: string[]) => {
      const n = texts.length;
      if (n < 2) {
        setOptions([]);
        return;
      }
      const remote = await communityService.getPollState(threadId);
      if (remote) {
        setServerMode(true);
        const counts = texts.map((text, i) => remote.counts[i] ?? 0);
        setOptions(
          texts.map((text, i) => ({
            id: i + 1,
            text,
            votes: counts[i] ?? 0,
          }))
        );
        const vi = remote.my_vote_index;
        setHasVoted(vi !== null && vi !== undefined);
        setVotedIndex(
          vi !== null && vi !== undefined && vi >= 0 ? vi : null
        );
        return;
      }
      setServerMode(false);
      const counts = loadCountsLocal(threadId, n);
      const vi = loadVoteIndexLocal(threadId);
      setOptions(
        texts.map((text, i) => ({
          id: i + 1,
          text,
          votes: counts[i] ?? 0,
        }))
      );
      setHasVoted(vi !== null);
      setVotedIndex(vi);
    },
    [threadId]
  );

  useEffect(() => {
    queueMicrotask(() => {
      let texts: string[] = [];
      try {
        texts = optionTextsKey ? (JSON.parse(optionTextsKey) as string[]) : [];
      } catch {
        texts = [];
      }
      void syncFromServer(texts);
    });
  }, [threadId, optionTextsKey, syncFromServer]);

  const totalVotes = options.reduce((a, o) => a + o.votes, 0);

  const handleVote = useCallback(
    async (optionId: number) => {
      if (hasVoted) return;
      const index = optionId - 1;
      if (serverMode) {
        const remote = await communityService.postPollVote(threadId, index);
        if (remote) {
          setOptions((prev) =>
            prev.map((o) => ({
              ...o,
              votes: remote.counts[o.id - 1] ?? o.votes,
            }))
          );
          setHasVoted(true);
          setVotedIndex(remote.my_vote_index ?? index);
          onVoted?.();
          return;
        }
      }
      setOptions((prev) => {
        const next = prev.map((o) =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o
        );
        saveCountsLocal(
          threadId,
          next.map((o) => o.votes)
        );
        return next;
      });
      setHasVoted(true);
      setVotedIndex(index);
      saveVoteIndexLocal(threadId, index);
      onVoted?.();
    },
    [hasVoted, threadId, onVoted, serverMode]
  );

  if (options.length < 2) return null;

  return (
    <Box
      sx={{
        mt: compact ? 1 : 2,
        mb: compact ? 2 : 3,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{ mb: 0.5, color: "var(--font-primary-dark)" }}
      >
        {title}
      </Typography>
      {options.map((option) => {
        const percentage =
          totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        return (
          <Box
            key={option.id}
            sx={{ position: "relative", overflow: "hidden", borderRadius: 2 }}
          >
            {!hasVoted ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => void handleVote(option.id)}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  py: 1.5,
                  borderColor: "var(--border-light)",
                  color: "var(--font-muted)",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--primary-200)",
                  },
                }}
              >
                {option.text}
              </Button>
            ) : (
              <Box
                sx={{
                  backgroundColor: "var(--surface)",
                  position: "relative",
                  py: 1.5,
                  px: 2,
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${percentage}%`,
                    backgroundColor:
                      "color-mix(in srgb, var(--primary-200) 55%, transparent)",
                    zIndex: -1,
                    transition: "width 0.5s ease-out",
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ color: "var(--font-primary-dark)" }}
                  >
                    {option.text}
                    {votedIndex === option.id - 1 ? " · your vote" : ""}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: "var(--primary-600)" }}
                  >
                    {percentage}%
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
      {hasVoted && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
        </Typography>
      )}
    </Box>
  );
}
