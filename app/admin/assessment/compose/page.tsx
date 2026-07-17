"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { AiPromptField } from "@/components/admin/assessment/shared";
import {
  startAssessmentComposer,
  type ComposerPreset,
} from "@/lib/services/admin/admin-assessment-composer.service";

const EXAMPLES = [
  "45-min proctored cybersecurity screening · 10 MCQ medium + 2 hard coding",
  "Week 1 final for Data Science, 30 fixed questions, non-adaptive",
  "Quick 15-min SQL diagnostic, auto-graded, no proctoring",
];

const BLUEPRINTS: {
  preset: Exclude<ComposerPreset, "">;
  label: string;
  icon: string;
  starter: string;
}[] = [
  {
    preset: "proctored_screening",
    label: "Proctored screening",
    icon: "mdi:shield-check-outline",
    starter: "45-min proctored screening — 10 medium MCQs + 2 hard coding problems",
  },
  {
    preset: "final_exam",
    label: "Course final exam",
    icon: "mdi:target",
    starter: "Course final exam, 30 questions, comprehensive, non-adaptive, 90 minutes",
  },
  {
    preset: "coding_challenge",
    label: "Coding challenge",
    icon: "mdi:code-tags",
    starter: "Coding challenge — 3 DSA problems, 90 minutes, auto-graded",
  },
];

export default function AssessmentComposePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [brief, setBrief] = useState("");
  const [preset, setPreset] = useState<ComposerPreset>("");
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async () => {
    if (!brief.trim() || submitting) return;
    try {
      setSubmitting(true);
      const job = await startAssessmentComposer(config.clientId, {
        brief: brief.trim(),
        preset: preset || undefined,
      });
      router.push(`/admin/assessment/compose/${job.job_id}`);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "Failed to start the composer";
      showToast(msg, "error");
      setSubmitting(false);
    }
  };

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "var(--canvas)", minHeight: "100%" }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/admin/assessment")}
          sx={{ mb: 2, color: "var(--ai-violet)", textTransform: "none" }}
        >
          Back to assessments
        </Button>

        {/* AI hero band */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--radius-card)",
            p: { xs: 3, md: 4 },
            color: "#fff",
            background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #be185d 100%)",
            boxShadow: "0 24px 48px -24px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.16)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              mb: 1.5,
            }}
          >
            <IconWrapper icon="mdi:auto-fix" size={15} /> AI ASSESSMENT COMPOSER
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: { xs: "1.6rem", md: "2.2rem" },
              lineHeight: 1.15,
              mb: 1,
            }}
          >
            Describe it — we&apos;ll build the whole thing.
          </Typography>
          <Typography sx={{ opacity: 0.9, maxWidth: 620, mb: 2.5 }}>
            Type a plain-English brief. AI drafts sections, questions, difficulty balance, timing,
            and proctoring — you just review and publish. No forms to fight.
          </Typography>

          {/* Brief input — dark surface so the violet button pops */}
          <Box
            sx={{
              "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.95)" },
              "& textarea": { color: "#1a1a1a" },
            }}
          >
            <AiPromptField
              value={brief}
              onChange={setBrief}
              onSubmit={handleGenerate}
              submitting={submitting}
              examples={EXAMPLES}
            />
          </Box>
        </Box>

        {/* Blueprints */}
        <Typography
          sx={{ mt: 4, mb: 1.5, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", color: "var(--font-tertiary)" }}
        >
          OR START FROM A BLUEPRINT
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
          {BLUEPRINTS.map((bp) => {
            const active = preset === bp.preset;
            return (
              <Box
                key={bp.preset}
                onClick={() => {
                  setPreset(bp.preset);
                  setBrief(bp.starter);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 2,
                  borderRadius: "var(--radius-card)",
                  cursor: "pointer",
                  bgcolor: "var(--card-bg)",
                  border: active
                    ? "1.5px solid var(--ai-violet)"
                    : "1px solid var(--border-default)",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": { boxShadow: "0 10px 24px -16px color-mix(in srgb, var(--ai-violet) 60%, transparent)" },
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--ai-violet)",
                    bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg) 88%)",
                  }}
                >
                  <IconWrapper icon={bp.icon} size={20} />
                </Box>
                <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", flexGrow: 1 }}>
                  {bp.label}
                </Typography>
                <IconWrapper icon="mdi:chevron-right" size={20} color="var(--font-tertiary)" />
              </Box>
            );
          })}
        </Box>
      </Box>
    </MainLayout>
  );
}
