"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  IconButton,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adminAdaptiveQuizService,
  type AdminAdaptiveQuiz,
} from "@/lib/services/admin/admin-adaptive-quiz.service";

interface QuizListRowProps {
  quiz: AdminAdaptiveQuiz;
  onAfterToggle?: (next: AdminAdaptiveQuiz) => void;
  onAfterDelete?: (configId: number) => void;
  onRequestDelete: (quiz: AdminAdaptiveQuiz) => void;
}

function prettySkill(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function QuizListRow({ quiz, onAfterToggle, onRequestDelete }: QuizListRowProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(quiz.is_active);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    if (toggling) return;
    const previous = isActive;
    setIsActive(!previous);
    setToggling(true);
    try {
      const res = await adminAdaptiveQuizService.toggleActive(quiz.config_id);
      setIsActive(res.is_active);
      onAfterToggle?.({ ...quiz, is_active: res.is_active });
    } catch {
      // Roll back optimistic flip on failure.
      setIsActive(previous);
    } finally {
      setToggling(false);
    }
  }

  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 700 }}>{quiz.title}</TableCell>
      <TableCell>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {quiz.target_skills.length === 0 && (
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontStyle: "italic" }}>
              auto-derived
            </Typography>
          )}
          {quiz.target_skills.slice(0, 4).map((s) => (
            <Box
              key={s}
              sx={{
                px: 0.9,
                py: 0.3,
                borderRadius: 999,
                fontSize: "0.66rem",
                fontWeight: 700,
                color: "text.secondary",
                bgcolor: "color-mix(in srgb, currentColor 7%, transparent)",
                border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
              }}
            >
              {prettySkill(s)}
            </Box>
          ))}
          {quiz.target_skills.length > 4 && (
            <Typography sx={{ fontSize: "0.66rem", color: "text.secondary", alignSelf: "center" }}>
              +{quiz.target_skills.length - 4}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {quiz.min_questions}–{quiz.max_questions}
      </TableCell>
      <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
        {quiz.mcq_count}
      </TableCell>
      <TableCell align="center">
        <Tooltip title={isActive ? "Disable for learners" : "Enable for learners"}>
          <Switch checked={isActive} disabled={toggling} onChange={handleToggle} />
        </Tooltip>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Edit">
          <IconButton
            onClick={() => router.push(`/admin/adaptive-quizzes/${quiz.config_id}/edit`)}
            size="small"
            aria-label="Edit adaptive quiz"
          >
            <Icon icon="mdi:pencil-outline" width={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            onClick={() => onRequestDelete(quiz)}
            size="small"
            aria-label="Delete adaptive quiz"
            sx={{ color: "#ef4444" }}
          >
            <Icon icon="mdi:trash-can-outline" width={18} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
