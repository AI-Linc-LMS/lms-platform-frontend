"use client";

import { useState } from "react";
import { Box, ButtonBase, Collapse, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { ALL_CONTENT_TYPES, ALL_DIFFICULTIES, type ContentType, type Difficulty } from "./types";

const CONTENT_META: Record<ContentType, { label: string; icon: string }> = {
  article: { label: "Adaptive Article", icon: "mdi:book-open-variant" },
  quiz: { label: "Adaptive Quiz", icon: "mdi:tune-vertical" },
  coding: { label: "AI Coding Mentor", icon: "mdi:robot-happy-outline" },
  video: { label: "Video Companion", icon: "mdi:play-circle-outline" },
};

/**
 * Generation settings shared by both creation modes (describe + CSV). Everything
 * lives in an Advanced drawer (collapsed by default) — content types, difficulty
 * span, questions per skill cell, articles per submodule, IRT length bounds,
 * confidence capture, the coding copy-paste toggle, and the Vimeo match note.
 * Sensible defaults (all four content types, all difficulties, 1 article) apply
 * without opening it. Lives below the mode panels so switching modes never
 * resets these.
 */
export function SharedGenerationConfig({
  contentTypes,
  onToggleContentType,
  difficulties,
  onToggleDifficulty,
  questionsPerCell,
  onQuestionsPerCellChange,
  articlesPerSubmodule,
  onArticlesPerSubmoduleChange,
  minQuestions,
  onMinQuestionsChange,
  maxQuestions,
  onMaxQuestionsChange,
  confidence,
  onConfidenceChange,
  codingClipboard,
  onCodingClipboardChange,
}: {
  contentTypes: ContentType[];
  onToggleContentType: (t: ContentType) => void;
  difficulties: Difficulty[];
  onToggleDifficulty: (d: Difficulty) => void;
  questionsPerCell: number;
  onQuestionsPerCellChange: (v: number) => void;
  articlesPerSubmodule: number;
  onArticlesPerSubmoduleChange: (v: number) => void;
  minQuestions: number;
  onMinQuestionsChange: (v: number) => void;
  maxQuestions: number;
  onMaxQuestionsChange: (v: number) => void;
  confidence: boolean;
  onConfidenceChange: (v: boolean) => void;
  codingClipboard: boolean;
  onCodingClipboardChange: (v: boolean) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasCoding = contentTypes.includes("coding");
  const hasVideo = contentTypes.includes("video");

  return (
    <Box>
      <ButtonBase
        onClick={() => setAdvancedOpen((v) => !v)}
        sx={{ gap: 0.5, fontWeight: 800, fontSize: "0.9rem", color: "text.primary", py: 0.5 }}
      >
        <Icon icon={advancedOpen ? "mdi:chevron-down" : "mdi:chevron-right"} width={22} />
        <Icon icon="mdi:cog-outline" width={17} />
        Advanced settings
      </ButtonBase>
      {!advancedOpen && (
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", pl: 3.5, mt: -0.25 }}>
          Defaults: quiz, article, AI mentor &amp; video · all difficulties · 1 article / submodule. Open to customise.
        </Typography>
      )}
      <Collapse in={advancedOpen} unmountOnExit>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            mt: 1.75,
            pl: 1.5,
            borderLeft: "2px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          }}
        >
          {/* Content types */}
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 1 }}>
              Content types (per submodule)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {ALL_CONTENT_TYPES.map((key) => (
                <Pill
                  key={key}
                  active={contentTypes.includes(key)}
                  onClick={() => onToggleContentType(key)}
                  icon={CONTENT_META[key].icon}
                >
                  {CONTENT_META[key].label}
                </Pill>
              ))}
            </Box>
          </Box>

          {/* Difficulty tiers */}
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 1 }}>
              Difficulty tiers (quizzes span these)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {ALL_DIFFICULTIES.map((d) => (
                <Pill key={d} active={difficulties.includes(d)} onClick={() => onToggleDifficulty(d)}>
                  {d}
                </Pill>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Questions per skill cell"
              type="number"
              value={questionsPerCell}
              onChange={(e) => onQuestionsPerCellChange(clamp(Number(e.target.value), 1, 10))}
              sx={{ width: 220 }}
            />
            <TextField
              label="Articles per submodule"
              type="number"
              value={articlesPerSubmodule}
              onChange={(e) => onArticlesPerSubmoduleChange(clamp(Number(e.target.value), 1, 5))}
              helperText="Default 1 · up to 5"
              sx={{ width: 220 }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Min questions / quiz"
              type="number"
              value={minQuestions}
              // Floor can't exceed the cap, so the stopping rule stays consistent.
              onChange={(e) => onMinQuestionsChange(clamp(Number(e.target.value), 1, maxQuestions))}
              helperText="Floor — fewest asked before it can stop early"
              sx={{ width: 200 }}
            />
            <TextField
              label="Max questions / quiz"
              type="number"
              value={maxQuestions}
              // Cap can't drop below the floor.
              onChange={(e) => onMaxQuestionsChange(clamp(Number(e.target.value), minQuestions, 100))}
              helperText="Cap — always ends by here · set = min for fixed length"
              sx={{ width: 200 }}
            />
          </Box>

          <FormControlLabel
            control={<Switch checked={confidence} onChange={(e) => onConfidenceChange(e.target.checked)} />}
            label="Confidence capture (Guess / Unsure / Sure / Certain under each question)"
          />

          {hasCoding && (
            <Box
              component="button"
              onClick={() => onCodingClipboardChange(!codingClipboard)}
              sx={{
                all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.75,
                fontSize: "0.82rem", fontWeight: 700, color: "text.secondary",
              }}
            >
              <Icon
                icon={codingClipboard ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"}
                width={18}
                style={{ color: codingClipboard ? "#6366f1" : undefined }}
              />
              Allow copy-paste in the coding editor
              <Typography component="span" sx={{ fontSize: "0.74rem", color: "text.disabled" }}>
                (off = anti-paste hardening; changeable per set later)
              </Typography>
            </Box>
          )}

          {hasVideo && (
            <Typography
              sx={{ fontSize: "0.78rem", color: "text.secondary", display: "flex", gap: 0.5, alignItems: "center" }}
            >
              <Icon icon="mdi:information-outline" width={16} />
              We AI-match a transcribed Vimeo video per submodule from your catalog (review &amp; swap after). Sync
              the catalog first if it&apos;s empty.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function Pill({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        px: 2, py: 0.85, borderRadius: 999, fontWeight: 800, fontSize: "0.82rem", gap: 0.5,
        color: active ? "white" : "text.primary",
        background: active
          ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
          : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
        border: active
          ? "1px solid transparent"
          : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
      }}
    >
      {icon && <Icon icon={icon} width={15} />}
      {children}
    </ButtonBase>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
