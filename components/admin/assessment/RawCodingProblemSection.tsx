"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminAssessmentService,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";

const MAX_PROBLEMS = 3;
const DIFFICULTY_LEVELS: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
const LANGUAGES = ["Python", "Java", "JavaScript", "C++", "C", "Go", "Ruby", "Other"];

export interface RawProblemSlot {
  id: string;
  raw_problem: string;
}

interface RawCodingProblemSectionProps {
  codingProblemIds: number[];
  onCodingProblemIdsChange: (ids: number[]) => void;
  generatedProblems: CodingProblemListItem[];
  onGeneratedProblemsChange: (problems: CodingProblemListItem[]) => void;
}

export function RawCodingProblemSection({
  codingProblemIds,
  onCodingProblemIdsChange,
  generatedProblems,
  onGeneratedProblemsChange,
}: RawCodingProblemSectionProps) {
  const { showToast } = useToast();
  const [slots, setSlots] = useState<RawProblemSlot[]>([
    { id: "1", raw_problem: "" },
  ]);
  const [difficultyLevel, setDifficultyLevel] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [programmingLanguage, setProgrammingLanguage] = useState("Python");
  const [generating, setGenerating] = useState(false);

  const addSlot = () => {
    if (slots.length >= MAX_PROBLEMS) return;
    setSlots((prev) => [...prev, { id: String(Date.now()), raw_problem: "" }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, value: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, raw_problem: value } : s))
    );
  };

  const rawProblemsStrings = slots
    .map((s) => s.raw_problem.trim())
    .filter((t) => t.length > 0);

  const handleGenerate = async () => {
    if (rawProblemsStrings.length === 0) {
      showToast("Enter at least one problem in the text area(s)", "error");
      return;
    }

    try {
      setGenerating(true);
      const data = await adminAssessmentService.generateCodingProblemsFromRawBatch(
        config.clientId,
        {
          raw_problems: rawProblemsStrings,
          difficulty_level: difficultyLevel,
          programming_language: programmingLanguage,
        }
      );

      const newIds = data.coding_problem_ids || [];
      const newProblems = data.coding_problems || [];

      const updatedIds = [...new Set([...codingProblemIds, ...newIds])];
      onCodingProblemIdsChange(updatedIds);
      onGeneratedProblemsChange([...generatedProblems, ...newProblems]);

      showToast(
        `Successfully created ${newIds.length} coding problem(s)`,
        "success"
      );

      setSlots([{ id: String(Date.now()), raw_problem: "" }]);
    } catch (error: any) {
      showToast(
        error?.message || "Failed to create coding problem(s)",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Add Your Problem
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280" }}>
        Paste your problem statement (title, description, I/O, constraints). You can add up to {MAX_PROBLEMS} problems.
      </Typography>

      <Paper sx={{ p: 3, bgcolor: "#f9fafb" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty (applies to all)</InputLabel>
              <Select
                value={difficultyLevel}
                label="Difficulty (applies to all)"
                onChange={(e) =>
                  setDifficultyLevel(e.target.value as "Easy" | "Medium" | "Hard")
                }
              >
                {DIFFICULTY_LEVELS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Programming language (applies to all)</InputLabel>
              <Select
                value={
                  LANGUAGES.includes(programmingLanguage)
                    ? programmingLanguage
                    : "Other"
                }
                label="Programming language (applies to all)"
                onChange={(e) => setProgrammingLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {programmingLanguage === "Other" && (
            <TextField
              size="small"
              label="Specify language"
              value={
                LANGUAGES.includes(programmingLanguage) ? "" : programmingLanguage
              }
              onChange={(e) => setProgrammingLanguage(e.target.value)}
              placeholder="e.g. Rust, Kotlin"
              fullWidth
            />
          )}

          <Divider />

          {slots.map((slot, index) => (
            <Box key={slot.id}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Problem {index + 1}
                </Typography>
                {slots.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeSlot(slot.id)}
                    sx={{ color: "#ef4444" }}
                    aria-label="Remove problem slot"
                  >
                    <IconWrapper icon="mdi:close" size={18} />
                  </IconButton>
                )}
              </Box>
              <TextField
                label="Problem statement (raw text)"
                value={slot.raw_problem}
                onChange={(e) => updateSlot(slot.id, e.target.value)}
                fullWidth
                multiline
                minRows={6}
                maxRows={12}
                placeholder={"Title: Two Sum\nGiven an array of integers nums and an integer target...\n\nInput/Output, constraints..."}
                sx={{ mb: 2 }}
              />
            </Box>
          ))}

          {slots.length < MAX_PROBLEMS && (
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              onClick={addSlot}
              sx={{ alignSelf: "flex-start" }}
            >
              Add another problem
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={generating || rawProblemsStrings.length === 0}
            startIcon={
              generating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:send" size={18} />
              )
            }
            sx={{ bgcolor: "#6366f1", alignSelf: "flex-start" }}
          >
            {generating ? "Creating..." : "Create coding problem(s)"}
          </Button>
        </Box>
      </Paper>

      {generatedProblems.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Created problems ({generatedProblems.length})
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {generatedProblems.map((p) => (
                <Box
                  component="li"
                  key={p.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                    py: 0.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {p.title || `Problem #${p.id}`}
                    </Typography>
                    {p.difficulty_level && (
                      <Typography variant="caption" sx={{ color: "#6b7280" }}>
                        {p.difficulty_level}
                        {p.programming_language && ` · ${p.programming_language}`}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      onGeneratedProblemsChange(
                        generatedProblems.filter((x) => x.id !== p.id)
                      );
                      onCodingProblemIdsChange(
                        codingProblemIds.filter((id) => id !== p.id)
                      );
                    }}
                    sx={{ color: "#ef4444", flexShrink: 0 }}
                  >
                    <IconWrapper icon="mdi:delete-outline" size={18} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
