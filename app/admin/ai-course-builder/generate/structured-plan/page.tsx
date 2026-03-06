"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import Link from "next/link";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  aiCourseBuilderService,
  type StructuredModule,
  type StructuredSubmodule,
} from "@/lib/services/admin/ai-course-builder.service";
import type { OutlineConfig } from "@/lib/services/admin/ai-course-builder.service";
import { OutlineConfigForm } from "@/components/admin/ai-course-builder/OutlineConfigForm";

const defaultConfig: OutlineConfig = {
  content_types: ["Quiz", "Article"],
  include_coding_problems: false,
  difficulty_level: "Medium",
  articles_per_submodule: 1,
  quizzes_per_submodule: 1,
  questions_per_quiz: 5,
  coding_problems_per_submodule: 0,
};

const emptySubmodule: StructuredSubmodule = { title: "", description: "" };
const emptyModule: StructuredModule = {
  week: 1,
  title: "",
  description: "",
  submodules: [{ ...emptySubmodule }],
};

function addSubmodule(mod: StructuredModule): StructuredModule {
  return {
    ...mod,
    submodules: [...mod.submodules, { ...emptySubmodule }],
  };
}

function removeSubmodule(
  mod: StructuredModule,
  index: number
): StructuredModule {
  const sub = mod.submodules.filter((_, i) => i !== index);
  return {
    ...mod,
    submodules: sub.length ? sub : [{ ...emptySubmodule }],
  };
}

function updateSubmodule(
  mod: StructuredModule,
  index: number,
  field: keyof StructuredSubmodule,
  value: string
): StructuredModule {
  const sub = [...mod.submodules];
  sub[index] = { ...sub[index], [field]: value };
  return { ...mod, submodules: sub };
}

export default function GenerateStructuredPlanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [modules, setModules] = useState<StructuredModule[]>([
    { ...emptyModule },
  ]);
  const [config, setConfig] = useState<OutlineConfig>(defaultConfig);

  const addModule = () => {
    const nextWeek =
      modules.length > 0
        ? Math.max(...modules.map((m) => m.week), 0) + 1
        : 1;
    setModules((p) => [...p, { ...emptyModule, week: nextWeek }]);
  };

  const removeModule = (index: number) => {
    if (modules.length <= 1) return;
    setModules((p) => p.filter((_, i) => i !== index));
  };

  const updateModule = (
    index: number,
    field: keyof StructuredModule,
    value: string | number
  ) => {
    setModules((p) => {
      const next = [...p];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!title.trim()) err.title = t("adminAICourseBuilder.courseTitleRequired");
    modules.forEach((mod, i) => {
      const num = i + 1;
      if (!mod.title.trim()) err[`module_${i}_title`] = t("adminAICourseBuilder.moduleTitleRequired", { num });
      const emptySubs = mod.submodules.every(
        (s) => !s.title.trim() && !s.description.trim()
      );
      if (mod.submodules.length === 0 || emptySubs) {
        err[`module_${i}_submodules`] = t("adminAICourseBuilder.moduleSubmodulesRequired", { num });
      } else {
        const firstWithTitle = mod.submodules.some((s) => s.title.trim());
        if (!firstWithTitle) {
          err[`module_${i}_submodules`] = t("adminAICourseBuilder.moduleSubmodulesRequiredAlt", { num });
        }
      }
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payloadModules = modules.map((mod, i) => ({
      week: mod.week && mod.week >= 1 ? mod.week : i + 1,
      title: mod.title.trim(),
      description: mod.description?.trim() || undefined,
      submodules: mod.submodules
        .filter((s) => s.title.trim() || s.description.trim())
        .map((s) => ({
          title: s.title.trim() || "Untitled",
          description: s.description.trim() || "",
        })),
    }));

    const invalid = payloadModules.filter(
      (m) => !m.submodules.length
    );
    if (invalid.length > 0) {
      setErrors({
        module_0_submodules: t("adminAICourseBuilder.eachModuleOneSubmodule"),
      });
      return;
    }

    try {
      setSubmitting(true);
      await aiCourseBuilderService.generateOutline({
        input_type: "structured_plan",
        title: title.trim(),
        modules: payloadModules,
        config,
      });
      showToast(t("adminAICourseBuilder.outlineGenerationStarted"), "success");
      router.push("/admin/ai-course-builder");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("adminAICourseBuilder.failedToGenerateOutline");
      showToast(message, "error");
      try {
        if (typeof message === "string" && message.includes("{")) {
          const parsed = JSON.parse(
            message.substring(message.indexOf("{"))
          ) as Record<string, string | string[]>;
          const fieldErrors: Record<string, string> = {};
          Object.entries(parsed).forEach(([key, val]) => {
            fieldErrors[key] = Array.isArray(val) ? val.join(", ") : val;
          });
          setErrors(fieldErrors);
        }
      } catch {
        // ignore
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Link
            href="/admin/ai-course-builder"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#6366f1",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            <IconWrapper icon="mdi:arrow-left" size={20} />
            {t("adminAICourseBuilder.backToAICourseBuilder")}
          </Link>
        </Box>

        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#111827", mb: 1 }}
        >
          {t("adminAICourseBuilder.generateFromStructuredPlanTitle")}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
          {t("adminAICourseBuilder.generateFromStructuredPlanSubtitle")}
        </Typography>

        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            maxWidth: 900,
          }}
        >
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t("adminAICourseBuilder.courseTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              size="small"
              sx={{ mb: 3 }}
              required
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              {t("adminAICourseBuilder.modulesAndSubmodules")}
            </Typography>

            {modules.map((mod, modIndex) => (
              <Card
                key={modIndex}
                variant="outlined"
                sx={{ mb: 2, borderRadius: 2 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
                      {t("adminAICourseBuilder.moduleLabel", { num: modIndex + 1 })}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => removeModule(modIndex)}
                      disabled={modules.length === 1}
                      sx={{ color: "#ef4444" }}
                    >
                      <IconWrapper icon="mdi:delete-outline" size={20} />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("adminAICourseBuilder.week")}
                    type="number"
                    value={mod.week === 0 ? "" : mod.week}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateModule(
                        modIndex,
                        "week",
                        v === "" ? 0 : parseInt(v, 10) || 0
                      );
                    }}
                    inputProps={{ min: 0 }}
                    sx={{ mt: 1, mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("adminAICourseBuilder.moduleTitleLabel")}
                    value={mod.title}
                    onChange={(e) =>
                      updateModule(modIndex, "title", e.target.value)
                    }
                    error={!!errors[`module_${modIndex}_title`]}
                    helperText={errors[`module_${modIndex}_title`]}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("adminAICourseBuilder.moduleDescriptionOptional")}
                    value={mod.description ?? ""}
                    onChange={(e) =>
                      updateModule(modIndex, "description", e.target.value)
                    }
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />

                  <Typography
                    variant="caption"
                    sx={{ color: "#6b7280", display: "block", mb: 1 }}
                  >
                    {t("adminAICourseBuilder.submodules")}
                  </Typography>
                  {mod.submodules.map((sub, subIndex) => (
                    <Box
                      key={subIndex}
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <TextField
                        size="small"
                        label={t("adminAICourseBuilder.submoduleTitle")}
                        value={sub.title}
                        onChange={(e) =>
                          setModules((p) =>
                            p.map((m, i) =>
                              i === modIndex
                                ? updateSubmodule(m, subIndex, "title", e.target.value)
                                : m
                            )
                          )
                        }
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label={t("adminAICourseBuilder.description")}
                        value={sub.description}
                        onChange={(e) =>
                          setModules((p) =>
                            p.map((m, i) =>
                              i === modIndex
                                ? updateSubmodule(m, subIndex, "description", e.target.value)
                                : m
                            )
                          )
                        }
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() =>
                          setModules((p) =>
                            p.map((m, i) =>
                              i === modIndex
                                ? removeSubmodule(m, subIndex)
                                : m
                            )
                          )
                        }
                        disabled={mod.submodules.length <= 1}
                        sx={{ color: "#ef4444" }}
                      >
                        <IconWrapper icon="mdi:close" size={18} />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                    onClick={() =>
                      setModules((p) =>
                        p.map((m, i) => (i === modIndex ? addSubmodule(m) : m))
                      )
                    }
                  >
                    {t("adminAICourseBuilder.addSubmodule")}
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button
              startIcon={<IconWrapper icon="mdi:plus" size={20} />}
              onClick={addModule}
              sx={{ mb: 3 }}
            >
              {t("adminAICourseBuilder.addModule")}
            </Button>

            <Box sx={{ mb: 3 }}>
              <OutlineConfigForm config={config} onChange={setConfig} />
            </Box>

            {errors.module_0_submodules && (
              <Typography
                variant="body2"
                color="error"
                sx={{ mb: 2 }}
              >
                {errors.module_0_submodules}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {t("adminAICourseBuilder.generating")}
                  </>
                ) : (
                  t("adminAICourseBuilder.generateOutline")
                )}
              </Button>
              <Button
                component={Link}
                href="/admin/ai-course-builder"
                variant="outlined"
                disabled={submitting}
              >
                {t("adminAICourseBuilder.cancel")}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </MainLayout>
  );
}
