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
 *
 * Two deliberate departures from the reference layout this follows:
 *
 *   - "Jump to Level N" SCROLLS. In the reference it is a paywall - a key icon on an unlock.
 *     We do not gate levels, so a button that looked like a lock would be describing a rule
 *     this product does not have. It keeps the visual rhythm of a long ladder and does the one
 *     honest thing a reader of eight levels actually wants.
 *   - a progress bar, not three stars. The stars carry no stated meaning; the bar is the
 *     learner's real position in the topic and the caption says what it counts.
 */

import { useCallback, useRef } from "react";
import { Box, ButtonBase, Stack, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PHONE } from "@/components/common/mobile/phone";
import { P, RADIUS, hairline } from "@/components/adaptive-journey/practice/practiceTokens";
import { topicProgress, type TrackLevel, type TrackTopic } from "./levels";

const RAIL = "#e2e8f0";
const CARD_MAX = 340;

/** The faint digits across a card's header, as in the reference. Decorative only. */
function HeaderTexture() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute", inset: 0, overflow: "hidden",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.68rem", lineHeight: 1.15, letterSpacing: "0.04em",
        color: "rgba(255,255,255,0.14)", userSelect: "none", pointerEvents: "none",
        whiteSpace: "pre", textAlign: "right", pr: 0.5,
      }}
    >
      {"11010011\n01100101\n10011010\n01011001"}
    </Box>
  );
}

function TopicCard({
  topic, onOpen, onPrefetch,
}: {
  topic: TrackTopic;
  onOpen: () => void;
  onPrefetch?: () => void;
}) {
  const pct = Math.round(topicProgress(topic) * 100);
  const started = topic.solved > 0;
  const done = topic.problems > 0 && topic.solved >= topic.problems;

  return (
    <Box sx={{ position: "relative", width: "100%", maxWidth: CARD_MAX, mx: "auto", pb: 1.75 }}>
      <ButtonBase
        onClick={onOpen}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
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
          position: "relative",
          px: 2, pt: 1.75, pb: 2.25,
          background: started
            ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
            : "linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)",
          color: "#fff",
        }}>
          <HeaderTexture />
          <Typography sx={{
            position: "relative",
            fontWeight: 700, fontSize: "1.02rem", lineHeight: 1.3,
            // Room for the play disc, which straddles the band's lower right corner.
            pr: 6,
          }}>
            {topic.title}
          </Typography>
        </Box>

        {/* Decorative: the card itself is the control, so this must not be a second button. */}
        <Box aria-hidden sx={{
          position: "absolute", right: 16, top: 0, transform: "translateY(38px)",
          width: 44, height: 44, borderRadius: "50%",
          backgroundColor: P.surface,
          border: `1px solid ${done ? "#a7f3d0" : "#e2e8f0"}`,
          color: done ? "#047857" : P.violet,
          display: "grid", placeItems: "center",
          boxShadow: "0 4px 12px -6px rgba(15,23,42,.35)",
        }}>
          <Icon icon={done ? "mdi:check" : "mdi:play"} width={21} />
        </Box>

        <Box sx={{ px: 2, pt: 1.75, pb: 1.5 }}>
          <Stack direction="row" gap={3} sx={{ mb: 1.25, pr: 6 }}>
            <Box>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: P.ink,
                                fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                {topic.articles}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: P.inkFaint }}>
                {topic.articles === 1 ? "Article" : "Articles"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: P.ink,
                                fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                {topic.problems}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: P.inkFaint }}>
                {topic.problems === 1 ? "Problem" : "Problems"}
              </Typography>
            </Box>
          </Stack>

          <Box aria-hidden sx={{ height: 5, borderRadius: 3, backgroundColor: "#eef2f7", mb: 0.75 }}>
            <Box sx={{
              width: `${pct}%`, height: "100%", borderRadius: 3,
              background: started ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "transparent",
            }} />
          </Box>
          <Typography sx={{ fontSize: "0.74rem", color: P.inkFaint,
                            fontVariantNumeric: "tabular-nums" }}>
            {topic.problems > 0 ? `${topic.solved}/${topic.problems} solved` : "Reading only"}
          </Typography>
        </Box>
      </ButtonBase>

      {/* The bonus badge hangs on the card's bottom edge, as in the reference - it belongs to
          the topic but is not part of the card's own surface. Silent when the topic has no
          buckets, because then there is no bonus to win. */}
      {topic.buckets > 0 ? (
        <Tooltip
          arrow
          enterTouchDelay={0}
          title={
            topic.bonusUnlocked
              ? "Topic bonus unlocked - you have covered every technique here."
              : `Topic bonus: ${topic.bucketsCovered} of ${topic.buckets} techniques covered. ` +
                "Solve one problem from each bucket."
          }
        >
          <Stack
            direction="row" alignItems="center" gap={0.4}
            data-testid="track-topic-bonus"
            data-unlocked={topic.bonusUnlocked ? "true" : "false"}
            sx={{
              position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
              px: 0.9, height: 26, borderRadius: 999, cursor: "help",
              backgroundColor: topic.bonusUnlocked ? "#ecfdf5" : P.surface,
              boxShadow: topic.bonusUnlocked ? "0 0 0 1px #a7f3d0" : hairline,
            }}
          >
            <Icon
              icon={topic.bonusUnlocked ? "mdi:gift-open-outline" : "mdi:gift-outline"}
              width={15}
              color={topic.bonusUnlocked ? "#047857" : P.inkFaint}
            />
            <Typography sx={{ fontSize: "0.7rem", fontVariantNumeric: "tabular-nums",
                              color: topic.bonusUnlocked ? "#047857" : P.inkFaint }}>
              {topic.bucketsCovered}/{topic.buckets}
            </Typography>
          </Stack>
        </Tooltip>
      ) : null}
    </Box>
  );
}

/** The short rail stub, and the bracket that joins a two-card row back to the centre line. */
function Connector({ span }: { span: 1 | 2 }) {
  if (span === 1) {
    return <Box aria-hidden sx={{ width: 2, height: 22, mx: "auto", backgroundColor: RAIL }} />;
  }
  return (
    <Box aria-hidden sx={{ height: 22, mx: "auto", maxWidth: 820, position: "relative",
                           [PHONE]: { height: 14 } }}>
      <Box sx={{ position: "absolute", left: "50%", top: 0, width: 2, height: 11,
                 backgroundColor: RAIL, transform: "translateX(-1px)" }} />
      <Box sx={{ position: "absolute", left: "25%", right: "25%", top: 10, height: 2,
                 backgroundColor: RAIL, [PHONE]: { display: "none" } }} />
      <Box sx={{ position: "absolute", left: "25%", top: 10, width: 2, height: 12,
                 backgroundColor: RAIL, [PHONE]: { display: "none" } }} />
      <Box sx={{ position: "absolute", right: "25%", top: 10, width: 2, height: 12,
                 backgroundColor: RAIL, [PHONE]: { display: "none" } }} />
    </Box>
  );
}

export function LevelTrack({
  levels, onOpenTopic, onPrefetchTopic,
}: {
  levels: TrackLevel[];
  onOpenTopic: (submoduleId: number) => void;
  onPrefetchTopic?: (submoduleId: number) => void;
}) {
  const refs = useRef<Record<number, HTMLElement | null>>({});
  const jump = useCallback((level: number) => {
    refs.current[level]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (levels.length === 0) {
    return (
      <Typography sx={{ color: P.inkFaint, fontSize: "0.9rem" }}>
        This course has no practice topics yet.
      </Typography>
    );
  }

  return (
    <Box data-testid="level-track" sx={{ position: "relative", pb: 2 }}>
      {levels.map((lvl, i) => {
        const next = levels[i + 1];
        const span: 1 | 2 = lvl.topics.length > 1 ? 2 : 1;
        return (
          <Box
            key={lvl.moduleId}
            data-testid="track-level"
            ref={(el: HTMLElement | null) => { refs.current[lvl.level] = el; }}
            sx={{ position: "relative", scrollMarginTop: 90 }}
          >
            {i > 0 ? (
              <Box aria-hidden sx={{ width: 2, height: 28, mx: "auto", backgroundColor: RAIL }} />
            ) : null}

            <Stack alignItems="center">
              <Box sx={{
                px: 2.25, py: 0.6, borderRadius: 999,
                backgroundColor: P.surface, boxShadow: hairline,
              }}>
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: P.ink }}>
                  Level {lvl.level}
                </Typography>
              </Box>
            </Stack>

            <Connector span={span} />

            {/* `auto-FIT` here, the opposite of the choice inside a bucket and for the opposite
                reason. The rail runs down the middle, so a level holding ONE topic must put that
                card under the rail. auto-fill keeps its empty tracks, so the lone card sat in the
                first one and floated left of the line meant to connect it; auto-fit collapses
                them and `justifyContent: center` centres the single track that is left. */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(260px, ${CARD_MAX}px))`,
              justifyContent: "center",
              gap: 2,
              maxWidth: 820, mx: "auto",
              [PHONE]: { gridTemplateColumns: "1fr", gap: 1.5 },
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

            {next ? (
              <>
                <Box aria-hidden sx={{ width: 2, height: 22, mx: "auto", backgroundColor: RAIL }} />
                <Stack alignItems="center">
                  <ButtonBase
                    data-testid="jump-to-level"
                    onClick={() => jump(next.level)}
                    aria-label={`Scroll to Level ${next.level}`}
                    sx={{
                      px: 2, gap: 0.75, height: 38, borderRadius: 999,
                      backgroundColor: "#fff7ed",
                      boxShadow: "0 0 0 1px #fed7aa",
                      color: "#9a3412", fontSize: "0.84rem", fontWeight: 600,
                      "&:hover": { backgroundColor: "#ffedd5" },
                      "&:focus-visible": { boxShadow: `0 0 0 2px ${P.canvas}, 0 0 0 4px ${P.violet}` },
                    }}
                  >
                    <Icon icon="mdi:arrow-down" width={16} />
                    Jump to Level {next.level}
                  </ButtonBase>
                </Stack>
              </>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

export default LevelTrack;
