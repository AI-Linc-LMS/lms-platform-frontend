"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminSkillsService,
  type AttachedSkill,
  type Skill,
  type SkillContentType,
  type SkillSuggestion,
} from "@/lib/services/admin/admin-skills.service";

export interface SkillMappingDialogProps {
  open: boolean;
  onClose: () => void;
  contentType: SkillContentType;
  contentId: number;
  /** Optional label shown in the header to identify the row being tagged. */
  contentTitle?: string;
  /** Notified after a successful save with the new skill ids. */
  onSaved?: (skillIds: number[]) => void;
}

type SelectionMap = Map<number, Skill>;

function SkillChip({
  label,
  selected,
  onClick,
  variant = "default",
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "ai";
  icon?: React.ReactNode;
}) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      icon={icon as any}
      color={selected ? "primary" : "default"}
      variant={selected ? "filled" : "outlined"}
      sx={{
        fontWeight: 600,
        borderColor:
          variant === "ai" && !selected
            ? "var(--accent-amber, #f59e0b)"
            : undefined,
        bgcolor:
          variant === "ai" && !selected
            ? "color-mix(in srgb, var(--accent-amber, #f59e0b) 12%, transparent)"
            : undefined,
      }}
    />
  );
}

export function SkillMappingDialog({
  open,
  onClose,
  contentType,
  contentId,
  contentTitle,
  onSaved,
}: SkillMappingDialogProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectionMap>(new Map());
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadEverything = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const [skills, attached] = await Promise.all([
        adminSkillsService.listSkills(),
        adminSkillsService.getMappings(contentType, contentId),
      ]);
      setAllSkills(skills);
      const byId = new Map(skills.map((s) => [s.id, s]));
      const initial: SelectionMap = new Map();
      attached.forEach((a: AttachedSkill) => {
        const s = byId.get(a.id);
        if (s) initial.set(s.id, s);
      });
      setSelected(initial);
    } catch (error) {
      console.warn("SkillMappingDialog load failed:", error);
      showToast("Failed to load skills", "error");
    } finally {
      setLoading(false);
    }
  }, [open, contentType, contentId, showToast]);

  useEffect(() => {
    if (open) {
      void loadEverything();
    }
  }, [open, loadEverything]);

  const filteredSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSkills;
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category || "").toLowerCase().includes(q)
    );
  }, [allSkills, search]);

  const toggleSelected = useCallback((skill: Skill) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(skill.id)) {
        next.delete(skill.id);
      } else {
        next.set(skill.id, skill);
      }
      return next;
    });
  }, []);

  const handleAiSuggest = useCallback(async () => {
    setSuggesting(true);
    try {
      const result = await adminSkillsService.suggestSkills(
        contentType,
        contentId
      );
      setSuggestions(result);
      if (result.length === 0) {
        showToast("No suggestions returned for this content.", "info");
      }
    } catch (error) {
      console.warn("AI suggest failed:", error);
      showToast(
        "AI suggestion failed - try again or tag manually.",
        "error"
      );
    } finally {
      setSuggesting(false);
    }
  }, [contentType, contentId, showToast]);

  const handleAcceptSuggestion = useCallback(
    async (s: SkillSuggestion) => {
      // If this suggestion matches an existing skill, just select it.
      const existing = allSkills.find(
        (x) => x.name.toLowerCase() === s.name.toLowerCase()
      );
      if (existing) {
        toggleSelected(existing);
        return;
      }
      // Otherwise create the skill, add it to the catalog, and select it.
      try {
        const created = await adminSkillsService.createSkill({ name: s.name });
        setAllSkills((prev) => [...prev, created]);
        setSelected((prev) => {
          const next = new Map(prev);
          next.set(created.id, created);
          return next;
        });
        showToast(`Created skill "${created.name}"`, "success");
      } catch (error) {
        console.warn("Create from suggestion failed:", error);
        showToast("Could not create that skill.", "error");
      }
    },
    [allSkills, toggleSelected, showToast]
  );

  const handleCreateSkill = useCallback(async () => {
    const name = newSkillName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await adminSkillsService.createSkill({ name });
      setAllSkills((prev) => [...prev, created]);
      setSelected((prev) => {
        const next = new Map(prev);
        next.set(created.id, created);
        return next;
      });
      setNewSkillName("");
      showToast(`Skill "${created.name}" created and selected.`, "success");
    } catch (error: any) {
      const msg =
        error?.response?.data?.error || "Could not create skill.";
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  }, [newSkillName, showToast]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const ids = Array.from(selected.keys());
      const saved = await adminSkillsService.setMappings(
        contentType,
        contentId,
        ids
      );
      showToast(
        `Saved ${saved.length} skill${saved.length === 1 ? "" : "s"}.`,
        "success"
      );
      onSaved?.(saved);
      onClose();
    } catch (error) {
      console.warn("Save mappings failed:", error);
      showToast("Failed to save skills.", "error");
    } finally {
      setSaving(false);
    }
  }, [selected, contentType, contentId, onSaved, onClose, showToast]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "background.paper", borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--font-primary)" }}>
            Tag with skills
          </Typography>
          {contentTitle && (
            <Typography variant="body2" color="text.secondary">
              {contentTitle.length > 96
                ? `${contentTitle.slice(0, 96)}…`
                : contentTitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} disabled={saving} aria-label="Close dialog">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  AI suggestions
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    suggesting ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <IconWrapper icon="mdi:auto-fix" size={16} />
                    )
                  }
                  onClick={handleAiSuggest}
                  disabled={suggesting}
                  sx={{ textTransform: "none" }}
                >
                  {suggestions.length ? "Re-run suggestions" : "Suggest with AI"}
                </Button>
              </Box>
              {suggestions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Click <strong>Suggest with AI</strong> to propose skills from this content.
                  Suggestions are not saved until you click Save.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {suggestions.map((s) => {
                    const isSelected = Array.from(selected.values()).some(
                      (sk) => sk.name.toLowerCase() === s.name.toLowerCase()
                    );
                    return (
                      <SkillChip
                        key={`${s.name}-${s.confidence}`}
                        label={`${s.name} · ${Math.round(s.confidence * 100)}%${s.exists ? "" : " · new"}`}
                        selected={isSelected}
                        variant="ai"
                        onClick={() => handleAcceptSuggestion(s)}
                        icon={<IconWrapper icon="mdi:sparkles" size={14} />}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Skill catalog
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search skills by name or category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              {filteredSkills.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No skills match - create one below or click <strong>Suggest with AI</strong>.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {filteredSkills.map((s) => (
                    <SkillChip
                      key={s.id}
                      label={s.category ? `${s.name} · ${s.category}` : s.name}
                      selected={selected.has(s.id)}
                      onClick={() => toggleSelected(s)}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo, #6366f1) 6%, transparent)",
                borderRadius: 1.5,
                p: 1.5,
              }}
            >
              <TextField
                size="small"
                fullWidth
                placeholder="Create a new skill (e.g. 'React Hooks')"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateSkill();
                }}
                disabled={creating}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => void handleCreateSkill()}
                disabled={creating || !newSkillName.trim()}
                sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                startIcon={
                  creating ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:plus" size={16} />
                  )
                }
              >
                Add skill
              </Button>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          {selected.size} selected
        </Typography>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={loading || saving}
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{ textTransform: "none" }}
        >
          Save skills
        </Button>
      </DialogActions>
    </Dialog>
  );
}
