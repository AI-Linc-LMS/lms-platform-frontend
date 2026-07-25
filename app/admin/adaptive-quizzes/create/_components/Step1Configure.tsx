"use client";

import type { ReactNode } from "react";
import { Box, Chip, IconButton, Slider, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  reconcileMatrix,
  totalQuestions,
  type AdaptiveQuizDraft,
  type DifficultyCell,
} from "@/lib/stores/adaptive-quiz-draft";
import { AdaptiveInfoTip } from "@/components/adaptive-quiz/shared/AdaptiveInfoTip";
import { confidenceTier } from "@/lib/utils/adaptive-confidence";

interface Step1ConfigureProps {
  draft: AdaptiveQuizDraft;
  setDraft: (next: AdaptiveQuizDraft) => void;
}

const DIFFICULTIES: Array<keyof DifficultyCell> = ["Easy", "Medium", "Hard"];
const DIFFICULTY_COLORS: Record<keyof DifficultyCell, string> = {
  Easy: "#10b981",
  Medium: "#6366f1",
  Hard: "#ef4444",
};

function prettySkill(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Step1Configure({ draft, setDraft }: Step1ConfigureProps) {
  const total = totalQuestions(draft.matrix);

  function handleAddSkill(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned || draft.sub_skills.includes(cleaned)) return;
    const nextSkills = [...draft.sub_skills, cleaned];
    setDraft({ ...draft, sub_skills: nextSkills, matrix: reconcileMatrix(draft.matrix, nextSkills) });
  }

  function handleRemoveSkill(skill: string) {
    const nextSkills = draft.sub_skills.filter((s) => s !== skill);
    setDraft({ ...draft, sub_skills: nextSkills, matrix: reconcileMatrix(draft.matrix, nextSkills) });
  }

  function handleCellChange(skill: string, diff: keyof DifficultyCell, value: number) {
    const safeValue = Math.max(0, Math.min(10, Math.round(value)));
    setDraft({
      ...draft,
      matrix: { ...draft.matrix, [skill]: { ...draft.matrix[skill], [diff]: safeValue } },
    });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <TextField
          label="Quiz title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          fullWidth
          placeholder="e.g. AWS Core Concepts - Adaptive"
          required
        />
        <TextField
          label="Topic (what the AI generates around)"
          value={draft.topic}
          onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
          fullWidth
          placeholder="e.g. AWS Cloud Fundamentals"
          required
        />
      </Box>
      <TextField
        label="Instructions for the student (optional)"
        value={draft.instructions}
        onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
        fullWidth
        multiline
        minRows={2}
        placeholder="e.g. Difficulty adapts to your answers - there's no hard time limit."
      />

      {/* Sub-skills */}
      <Box>
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, mb: 0.5 }}>
          Sub-skills <span style={{ color: "#ef4444" }}>*</span>
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}>
          The engine targets one sub-skill at a time and the heatmap measures each independently. Add 2–5 for best results.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
          {draft.sub_skills.map((s) => (
            <Chip
              key={s}
              label={prettySkill(s)}
              onDelete={() => handleRemoveSkill(s)}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Box>
        <TextField
          placeholder="Type a sub-skill and press Enter…"
          fullWidth
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              const value = (e.target as HTMLInputElement).value;
              handleAddSkill(value);
              (e.target as HTMLInputElement).value = "";
            }
          }}
        />
      </Box>

      {/* Difficulty matrix */}
      {draft.sub_skills.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 800 }}>
              Question mix
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 700 }}>
              Total: <span style={{ color: "#6366f1" }}>{total}</span> question{total === 1 ? "" : "s"}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1.5fr) repeat(3, 1fr)",
              gap: 1,
              alignItems: "center",
              p: 2,
              borderRadius: 3,
              bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
            }}
          >
            <Box />
            {DIFFICULTIES.map((d) => (
              <Typography
                key={d}
                sx={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: DIFFICULTY_COLORS[d],
                  textAlign: "center",
                }}
              >
                {d}
              </Typography>
            ))}
            {draft.sub_skills.map((skill) => (
              <Box key={skill} sx={{ display: "contents" }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>{prettySkill(skill)}</Typography>
                {DIFFICULTIES.map((d) => (
                  <Box key={d} sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => handleCellChange(skill, d, (draft.matrix[skill]?.[d] ?? 0) - 1)}
                      disabled={(draft.matrix[skill]?.[d] ?? 0) <= 0}
                      sx={{ p: 0.25 }}
                      aria-label={`Fewer ${d} for ${skill}`}
                    >
                      <Icon icon="mdi:minus" width={14} />
                    </IconButton>
                    <Typography
                      sx={{
                        minWidth: 26,
                        textAlign: "center",
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {draft.matrix[skill]?.[d] ?? 0}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCellChange(skill, d, (draft.matrix[skill]?.[d] ?? 0) + 1)}
                      disabled={(draft.matrix[skill]?.[d] ?? 0) >= 10}
                      sx={{ p: 0.25 }}
                      aria-label={`More ${d} for ${skill}`}
                    >
                      <Icon icon="mdi:plus" width={14} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Engine tunables */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
          border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
        }}
      >
        <SliderRow
          label="Question limits per attempt"
          help="The shortest and longest a quiz can run. The AI will pick somewhere in between based on how quickly each student's level becomes clear."
          value={[draft.min_questions, draft.max_questions]}
          min={3}
          max={Math.max(draft.max_questions, 25)}
          onChange={(next) => {
            if (!Array.isArray(next)) return;
            const [min, max] = next;
            setDraft({
              ...draft,
              min_questions: Math.min(min, max),
              max_questions: Math.max(min, max),
            });
          }}
          range
        />
        <SliderRow
          label={`Confidence target · ${confidenceTier(draft.se_threshold).name}`}
          help={confidenceTier(draft.se_threshold).typicalLength + " - " + confidenceTier(draft.se_threshold).blurb}
          infoTip={
            <AdaptiveInfoTip title="How confident before we stop?" placement="bottom">
              <p>
                After each answer, the AI gets a clearer sense of how strong
                the student is on each skill. This setting tells it{" "}
                <strong>how sure it needs to be before ending the quiz</strong>.
              </p>
              <p>
                Think of it like asking a friend to guess your height. After
                one glance they have a rough idea. After a tape measure they're
                certain. Tighter = more measurements; quicker = stop sooner with
                an approximate read.
              </p>
              <p>
                <strong>Tight read</strong> - keeps asking until very confident.
                Usually 15–20 questions. Use for placement tests or high-stakes
                grading.
                <br />
                <strong>Balanced</strong> - the default. Usually 10–14
                questions. Good for homework, practice, and most classroom use.
                <br />
                <strong>Quick check</strong> - stops earlier with a rougher read.
                Usually 6–9 questions. Use for warm-ups or pulse checks.
              </p>
              <p style={{ opacity: 0.7, fontSize: "0.74rem" }}>
                Question limits below act as safety rails - the quiz won't end
                before your minimum, and won't go past your maximum, even if the
                AI hasn't hit the confidence target yet.
              </p>
            </AdaptiveInfoTip>
          }
          value={draft.se_threshold}
          min={0.2}
          max={0.6}
          step={0.05}
          onChange={(v) => setDraft({ ...draft, se_threshold: v as number })}
        />
        <SliderRow
          label={`Hint tokens · ${draft.hint_tokens}`}
          help="Hints the student can spend per session. Using one lowers inferred mastery for that sub-skill."
          value={draft.hint_tokens}
          min={0}
          max={5}
          step={1}
          onChange={(v) => setDraft({ ...draft, hint_tokens: v as number })}
        />
        <Box>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>Pre-submit confidence prompt</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.5, mb: 0.75 }}>
            Asks the student "how sure are you?" before each submit. Adds a confident-wrong signal that helps detect misconceptions.
          </Typography>
          <Chip
            label={draft.confidence_prompt_enabled ? "Enabled" : "Disabled"}
            color={draft.confidence_prompt_enabled ? "success" : "default"}
            onClick={() => setDraft({ ...draft, confidence_prompt_enabled: !draft.confidence_prompt_enabled })}
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </Box>
    </Box>
  );
}

interface SliderRowProps {
  label: string;
  help?: string;
  /** Optional info-tip rendered next to the label - for jargon like SE. */
  infoTip?: ReactNode;
  value: number | number[];
  min: number;
  max: number;
  step?: number;
  range?: boolean;
  onChange: (next: number | number[]) => void;
}

function SliderRow({ label, help, infoTip, value, min, max, step = 1, range, onChange }: SliderRowProps) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>{label}</Typography>
        {infoTip}
      </Box>
      {help && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.5 }}>{help}</Typography>}
      <Box sx={{ px: 1, mt: 0.5 }}>
        <Slider
          value={value}
          onChange={(_, next) => onChange(next as number | number[])}
          min={min}
          max={max}
          step={step}
          marks={range ? false : undefined}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}
