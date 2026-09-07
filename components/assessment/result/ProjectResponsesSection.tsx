"use client";

import { useMemo, useState } from "react";
import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { ProjectResponseItem } from "@/lib/services/assessment.service";
import { projectVerdict } from "./projectVerdict";

/**
 * The review a learner gets after a take-home project.
 *
 * The backend has returned `user_responses.project_responses` since `_project_responses`
 * was added -- brief, run verdict, rubric feedback and the learner's own files -- but the
 * result page only ever rendered quiz, coding and written sections. A project-only paper
 * therefore opened on a score with "Attempted 0/0" under it and nothing to review, which
 * is what this section fixes.
 */

const htmlContentSx = {
  "& p": { mb: 1.5, lineHeight: 1.8, color: "var(--font-secondary)", fontSize: "0.9375rem" },
  "& li": { mb: 0.75, lineHeight: 1.7, color: "var(--font-secondary)", fontSize: "0.9375rem" },
  "& br": { display: "block", content: '""', marginTop: "0.5em" },
  "& pre": { whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" },
  "& code": { fontFamily: "var(--font-mono, monospace)", fontSize: "0.875rem" },
};

interface ProjectResponsesSectionProps {
  projectResponses: ProjectResponseItem[];
}

export function ProjectResponsesSection({ projectResponses }: ProjectResponsesSectionProps) {
  const [index, setIndex] = useState(0);
  const [fileTab, setFileTab] = useState(0);

  const item = projectResponses[index];
  const filePaths = useMemo(
    () => Object.keys(item?.files ?? {}).sort(),
    [item],
  );

  if (!item) return null;

  const verdict = projectVerdict(item);
  const activePath = filePaths[Math.min(fileTab, filePaths.length - 1)];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        backgroundColor: "var(--card-bg)",
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        mb: 4,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          mb: 2,
          fontSize: { xs: "1.125rem", sm: "1.25rem" },
        }}
      >
        Project review ({projectResponses.length}{" "}
        {projectResponses.length === 1 ? "project" : "projects"})
      </Typography>

      {projectResponses.length > 1 && (
        <Tabs
          value={index}
          onChange={(_, v) => {
            setIndex(v);
            setFileTab(0);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: "1px solid var(--border-default)" }}
        >
          {projectResponses.map((p, i) => (
            <Tab
              key={p.project_id}
              label={p.title || `Project ${i + 1}`}
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          ))}
        </Tabs>
      )}

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontWeight: 800, color: "var(--font-primary)" }}>{item.title}</Typography>
        <Chip size="small" label={verdict.label} sx={{ bgcolor: verdict.bg, color: verdict.color, fontWeight: 700 }} />
        {item.runtime ? (
          <Chip size="small" variant="outlined" label={item.runtime.replace(/_/g, " ")} />
        ) : null}
        {typeof item.max_marks === "number" ? (
          <Chip size="small" variant="outlined" label={`${item.max_marks} marks`} />
        ) : null}
      </Stack>

      {/* The brief. Without it the learner could not see what they had been asked to build. */}
      {item.brief_html ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
            The brief
          </Typography>
          <Box sx={htmlContentSx} dangerouslySetInnerHTML={{ __html: item.brief_html }} />
        </Box>
      ) : null}

      {/* Rubric feedback, once an assessor has confirmed it. */}
      {item.criteria && item.criteria.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
            How it was marked
          </Typography>
          <Stack spacing={1}>
            {item.criteria.map((c, i) => (
              <Box
                key={`${c.title ?? c.label ?? "criterion"}-${i}`}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: "0.9rem" }}>
                    {c.title || c.label || `Criterion ${i + 1}`}
                  </Typography>
                  {c.comment ? (
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                      {c.comment}
                    </Typography>
                  ) : null}
                </Box>
                <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", whiteSpace: "nowrap" }}>
                  {c.awarded ?? 0}
                  {typeof c.max_marks === "number" ? ` / ${c.max_marks}` : ""}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      {item.summary ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
            Assessor's summary
          </Typography>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.9375rem" }}>{item.summary}</Typography>
        </Box>
      ) : null}

      {/* What the learner actually wrote. */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
          Your solution
        </Typography>

        {filePaths.length === 0 ? (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: "1px dashed var(--border-default)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {item.submitted
                ? "No files were saved against this project."
                : "You did not start this project."}
            </Typography>
          </Box>
        ) : (
          <>
            <Tabs
              value={Math.min(fileTab, filePaths.length - 1)}
              onChange={(_, v) => setFileTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: "1px solid var(--border-default)", mb: 1 }}
            >
              {filePaths.map((path) => (
                <Tab
                  key={path}
                  label={path}
                  sx={{ textTransform: "none", fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem" }}
                />
              ))}
            </Tabs>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                maxHeight: 420,
                overflow: "auto",
                borderRadius: 2,
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--surface)",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                color: "var(--font-primary)",
                whiteSpace: "pre",
              }}
            >
              {activePath ? item.files?.[activePath] ?? "" : ""}
            </Box>
          </>
        )}
      </Box>

      {/* The automated run's output, when there was one. */}
      {item.log ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
            Checks that ran
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              maxHeight: 260,
              overflow: "auto",
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--surface)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.78rem",
              whiteSpace: "pre-wrap",
              color: "var(--font-secondary)",
            }}
          >
            {item.log}
          </Box>
        </Box>
      ) : null}

      {verdict.awaiting ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <IconWrapper icon="mdi:clock-outline" size={16} />
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            This project has not been marked yet, so it is not counted in the score above.
          </Typography>
        </Stack>
      ) : null}
    </Paper>
  );
}
