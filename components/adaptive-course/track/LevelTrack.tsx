"use client";

/**
 * The course as a ladder of levels, each holding the topics taught at it.
 *
 * A second way into the same content, not a second copy of it: every card opens the submodule
 * page the course page already opens, and the counts come from the same payload. What it adds
 * is the shape of the path - how many levels there are, which one you are on, and how much of
 * a level is left - which a scrolling list of 28 modules does not show.
 *
 * Levels are drawn in course order and never gated here. Whether a topic can be opened is the
 * submodule page's decision and the server's; a tree that greyed out a level on its own would
 * be a second, quieter lock rule that could disagree with the real one.
 */

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PHONE } from "@/components/common/mobile/phone";
import { P, RADIUS, hairline } from "@/components/adaptive-journey/practice/practiceTokens";
import { topicProgress, type TrackLevel, type TrackTopic } from "./levels";

const RAIL = "#e2e8f0";

function TopicCard({
  topic, onOpen, onPrefetch,
}: {
  topic: TrackTopic;
  onOpen: () => void;
  onPrefetch?: () => void;
}) {
  const pct = Math.round(topicProgress(topic) * 100);
  const started = topic.solved > 0;
  return (
    <ButtonBase
      onClick={onOpen}
      onMouseEnter={onPrefetch}
      data-testid="track-topic"
      sx={{
        display: "block", textAlign: "left", width: "100%",
        borderRadius: `${RADIUS.card}px`,
        backgroundColor: P.surface,
        boxShadow: hairline,
        overflow: "hidden",
        transition: "box-shadow .15s",
        "&:hover": { boxShadow: `0 0 0 1px ${P.violet}33, 0 6px 20px -12px rgba(15,23,42,.35)` },
        "&:focus-visible": { boxShadow: `0 0 0 2px ${P.canvas}, 0 0 0 4px ${P.violet}` },
        [PHONE]: { minHeight: 44 },
      }}
    >
      <Box sx={{
        px: 2, py: 1.5,
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "#fff",
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", lineHeight: 1.3 }}>
          {topic.title}
        </Typography>
      </Box>

      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" alignItems="baseline" gap={2} sx={{ mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: P.ink,
                              fontVariantNumeric: "tabular-nums" }}>
              {topic.articles}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: P.inkFaint }}>
              {topic.articles === 1 ? "Article" : "Articles"}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: P.ink,
                              fontVariantNumeric: "tabular-nums" }}>
              {topic.problems}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: P.inkFaint }}>
              {topic.problems === 1 ? "Problem" : "Problems"}
            </Typography>
          </Box>
        </Stack>

        {/* A bar, not stars. Stars in the reference carry no defined meaning; this is the
            learner's actual position in the topic and says what it counts. */}
        <Box aria-hidden sx={{ height: 5, borderRadius: 3, backgroundColor: "#eef2f7", mb: 0.75 }}>
          <Box sx={{
            width: `${pct}%`, height: "100%", borderRadius: 3,
            background: started
              ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
              : "transparent",
          }} />
        </Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography sx={{ fontSize: "0.74rem", color: P.inkFaint,
                            fontVariantNumeric: "tabular-nums" }}>
            {topic.problems > 0 ? `${topic.solved}/${topic.problems} solved` : "Reading only"}
          </Typography>
          {topic.buckets > 0 ? (
            <Stack direction="row" alignItems="center" gap={0.5}
                   data-testid="track-topic-bonus"
                   data-unlocked={topic.bonusUnlocked ? "true" : "false"}>
              <Icon
                icon={topic.bonusUnlocked ? "mdi:gift-open-outline" : "mdi:gift-outline"}
                width={15}
                color={topic.bonusUnlocked ? "#047857" : P.inkFaint}
              />
              <Typography sx={{ fontSize: "0.72rem",
                                color: topic.bonusUnlocked ? "#047857" : P.inkFaint,
                                fontVariantNumeric: "tabular-nums" }}>
                {topic.bucketsCovered}/{topic.buckets}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </ButtonBase>
  );
}

export function LevelTrack({
  levels, onOpenTopic, onPrefetchTopic,
}: {
  levels: TrackLevel[];
  onOpenTopic: (submoduleId: number) => void;
  onPrefetchTopic?: (submoduleId: number) => void;
}) {
  if (levels.length === 0) {
    return (
      <Typography sx={{ color: P.inkFaint, fontSize: "0.9rem" }}>
        This course has no practice topics yet.
      </Typography>
    );
  }

  return (
    <Box data-testid="level-track" sx={{ position: "relative", pb: 2 }}>
      {levels.map((lvl, i) => (
        <Box key={lvl.moduleId} data-testid="track-level" sx={{ position: "relative" }}>
          {/* The rail between levels. Behind the cards, so a card never sits on a line. */}
          {i > 0 ? (
            <Box aria-hidden sx={{
              width: 2, height: 34, mx: "auto", backgroundColor: RAIL,
            }} />
          ) : null}

          <Stack alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{
              px: 2, py: 0.5, borderRadius: 999,
              backgroundColor: P.surface, boxShadow: hairline,
            }}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: P.ink }}>
                Level {lvl.level}
              </Typography>
            </Box>
          </Stack>

          {/* `auto-FIT` here, which is the opposite of the choice inside a bucket, for the
              opposite reason. The rail between levels runs down the middle, so a level holding
              one topic must put that card under the rail. auto-fill keeps its empty tracks, so
              the lone card sat in the first one and floated left of the line meant to connect
              it; auto-fit collapses them and `justifyContent: center` then centres the one
              track that is left. The max of 340px stops that single card stretching wide. */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 340px))",
            justifyContent: "center",
            gap: 2,
            maxWidth: 820, mx: "auto",
            [PHONE]: { gridTemplateColumns: "1fr" },
          }}>
            {lvl.topics.map((t) => (
              <TopicCard
                key={t.submoduleId}
                topic={t}
                onOpen={() => onOpenTopic(t.submoduleId)}
                onPrefetch={onPrefetchTopic ? () => onPrefetchTopic(t.submoduleId) : undefined}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default LevelTrack;
