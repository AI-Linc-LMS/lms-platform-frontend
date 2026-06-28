"use client";

import { Box, ButtonBase, IconButton, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type {
  CsvCoursePlan,
  CsvPlanModule,
  CsvPlanSubmodule,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { makeRowUid, type ContentType } from "./types";

const CONTENT_ICON: Record<ContentType, { icon: string; label: string }> = {
  article: { icon: "mdi:book-open-variant", label: "Article" },
  quiz: { icon: "mdi:tune-vertical", label: "Quiz" },
  presentation: { icon: "mdi:presentation", label: "Presentation" },
  coding: { icon: "mdi:robot-happy-outline", label: "Coding" },
  video: { icon: "mdi:play-circle-outline", label: "Video" },
};

const ROLE_LABEL: Record<string, string> = {
  week: "Week",
  topic: "Topic",
  description: "Description",
  key_concepts: "Skills",
};

/**
 * Editable preview of an AI-parsed CSV plan. The admin vets exactly what will be
 * built — weeks, topics, the skills each topic teaches, and which content each
 * gets — and can rename, delete, or add modules/submodules before generating.
 * Every edit emits the full updated plan upward so the live estimate stays in sync.
 */
export function EditableCsvPlanPreview({
  plan,
  onChange,
  contentTypes,
}: {
  plan: CsvCoursePlan;
  onChange: (plan: CsvCoursePlan) => void;
  contentTypes: ContentType[];
}) {
  const setModules = (modules: CsvPlanModule[]) => onChange({ ...plan, modules });

  const updateModule = (mi: number, patch: Partial<CsvPlanModule>) =>
    setModules(plan.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)));

  const deleteModule = (mi: number) =>
    setModules(plan.modules.filter((_, i) => i !== mi).map((m, i) => ({ ...m, week: i + 1 })));

  const addModule = () =>
    setModules([
      ...plan.modules,
      {
        week: plan.modules.length + 1,
        title: `Week ${plan.modules.length + 1}`,
        submodules: [{ title: "New topic", description: "", key_concepts: [], _uid: makeRowUid() }],
        _uid: makeRowUid(),
      },
    ]);

  const updateSub = (mi: number, si: number, patch: Partial<CsvPlanSubmodule>) =>
    updateModule(mi, {
      submodules: plan.modules[mi].submodules.map((s, i) => (i === si ? { ...s, ...patch } : s)),
    });

  const deleteSub = (mi: number, si: number) =>
    updateModule(mi, { submodules: plan.modules[mi].submodules.filter((_, i) => i !== si) });

  const addSub = (mi: number) =>
    updateModule(mi, {
      submodules: [
        ...plan.modules[mi].submodules,
        { title: "New topic", description: "", key_concepts: [], _uid: makeRowUid() },
      ],
    });

  const totalTopics = plan.modules.reduce((n, m) => n + m.submodules.length, 0);
  const mapping = Object.entries(plan.column_mapping || {}).filter(([, v]) => v);
  const activeContent = contentTypes.filter((c) => CONTENT_ICON[c]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Review &amp; edit the course plan</Typography>
        <Box component="span" sx={chipSx("#6366f1")}>
          {plan.modules.length} {plan.modules.length === 1 ? "week" : "weeks"}
        </Box>
        <Box component="span" sx={chipSx("#a855f7")}>
          {totalTopics} {totalTopics === 1 ? "topic" : "topics"}
        </Box>
      </Box>

      {/* Column mapping */}
      {mapping.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
          <Typography sx={{ fontSize: "0.76rem", color: "text.secondary", fontWeight: 700 }}>
            AI column mapping:
          </Typography>
          {mapping.map(([role, col]) => (
            <Box key={role} component="span" sx={chipSx("#10b981")}>
              {ROLE_LABEL[role] ?? role} ← {col}
            </Box>
          ))}
        </Box>
      )}

      {/* Warnings */}
      {(plan.warnings || []).length > 0 && (
        <Box
          sx={{
            borderRadius: 3,
            p: 1.5,
            bgcolor: "color-mix(in srgb, #f59e0b 10%, transparent)",
            border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
          }}
        >
          {plan.warnings.map((w, i) => (
            <Typography
              key={i}
              sx={{ fontSize: "0.78rem", color: "#b45309", display: "flex", gap: 0.5, alignItems: "flex-start" }}
            >
              <Icon icon="mdi:alert-outline" width={15} style={{ marginTop: 2, flexShrink: 0 }} />
              {w}
            </Typography>
          ))}
        </Box>
      )}

      {/* Modules */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {plan.modules.map((mod, mi) => (
          <Box
            key={mod._uid ?? mi}
            sx={{
              borderRadius: 4,
              p: 2,
              bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="span"
                sx={{
                  flexShrink: 0, px: 1, py: 0.4, borderRadius: 2, fontSize: "0.7rem", fontWeight: 900,
                  color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                }}
              >
                W{mod.week}
              </Box>
              <TextField
                variant="standard"
                value={mod.title}
                onChange={(e) => updateModule(mi, { title: e.target.value })}
                fullWidth
                InputProps={{ disableUnderline: true, sx: { fontWeight: 800, fontSize: "0.95rem" } }}
              />
              <IconButton
                size="small"
                aria-label="Delete week"
                onClick={() => deleteModule(mi)}
                sx={{ color: "#ef4444" }}
              >
                <Icon icon="mdi:trash-can-outline" width={18} />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
              {mod.submodules.map((sub, si) => (
                <Box
                  key={sub._uid ?? si}
                  sx={{
                    borderRadius: 3,
                    p: 1.25,
                    bgcolor: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Icon icon="mdi:circle-small" width={20} style={{ color: "#a855f7", flexShrink: 0 }} />
                    <TextField
                      variant="standard"
                      value={sub.title}
                      onChange={(e) => updateSub(mi, si, { title: e.target.value })}
                      fullWidth
                      placeholder="Topic title"
                      InputProps={{ disableUnderline: true, sx: { fontWeight: 700, fontSize: "0.86rem" } }}
                    />
                    <IconButton
                      size="small"
                      aria-label="Delete topic"
                      onClick={() => deleteSub(mi, si)}
                      sx={{ color: "#ef4444", flexShrink: 0 }}
                    >
                      <Icon icon="mdi:close" width={16} />
                    </IconButton>
                  </Box>
                  <TextField
                    variant="standard"
                    value={sub.description}
                    onChange={(e) => updateSub(mi, si, { description: e.target.value })}
                    fullWidth
                    placeholder="Short description (optional)"
                    multiline
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "0.78rem", color: "text.secondary", pl: 2.5 },
                    }}
                  />
                  {(sub.key_concepts || []).length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5, pl: 2.5 }}>
                      {sub.key_concepts.map((c, ci) => (
                        <Box key={ci} component="span" sx={chipSx("#6366f1", true)}>
                          {c}
                        </Box>
                      ))}
                    </Box>
                  )}
                  {activeContent.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1, mt: 0.75, pl: 2.5, flexWrap: "wrap" }}>
                      {activeContent.map((c) => (
                        <Box
                          key={c}
                          sx={{ display: "inline-flex", alignItems: "center", gap: 0.3, color: "text.disabled" }}
                        >
                          <Icon icon={CONTENT_ICON[c].icon} width={13} />
                          <Typography component="span" sx={{ fontSize: "0.68rem", fontWeight: 700 }}>
                            {CONTENT_ICON[c].label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
              <ButtonBase
                onClick={() => addSub(mi)}
                sx={{
                  alignSelf: "flex-start", gap: 0.4, fontSize: "0.78rem", fontWeight: 700, color: "#6366f1",
                  px: 1, py: 0.5, borderRadius: 2,
                }}
              >
                <Icon icon="mdi:plus" width={16} /> Add topic
              </ButtonBase>
            </Box>
          </Box>
        ))}
      </Box>

      <ButtonBase
        onClick={addModule}
        sx={{
          alignSelf: "flex-start", gap: 0.5, fontSize: "0.82rem", fontWeight: 800, color: "#6366f1",
          px: 1.5, py: 0.75, borderRadius: 999,
          border: "1px dashed color-mix(in srgb, #6366f1 45%, transparent)",
        }}
      >
        <Icon icon="mdi:plus" width={17} /> Add week
      </ButtonBase>
    </Box>
  );
}

function chipSx(color: string, soft = false) {
  return {
    px: 1,
    py: 0.25,
    borderRadius: 999,
    fontSize: soft ? "0.7rem" : "0.74rem",
    fontWeight: 700,
    color,
    bgcolor: `color-mix(in srgb, ${color} ${soft ? 12 : 14}%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
    whiteSpace: "nowrap" as const,
  };
}
