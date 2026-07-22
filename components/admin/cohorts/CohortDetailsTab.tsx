"use client";

import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adminCohortsService, type CohortDetail } from "@/lib/services/admin/admin-cohorts.service";

/** Edit a cohort's basic info — title, code, description. Mirrors the assessment
 *  BasicInfoSection card look. */
export function CohortDetailsTab({ cohort, onSaved }: { cohort: CohortDetail; onSaved: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(cohort.name);
  const [code, setCode] = useState(cohort.code ?? "");
  const [description, setDescription] = useState(cohort.description ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== cohort.name || code !== (cohort.code ?? "") || description !== (cohort.description ?? "");

  async function save() {
    if (!name.trim()) {
      showToast("Give the cohort a name.", "error");
      return;
    }
    setSaving(true);
    try {
      await adminCohortsService.updateCohort(cohort.id, {
        name: name.trim(),
        code: code.trim() || null,
        description,
      });
      showToast("Saved.", "success");
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't save.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 760,
        borderRadius: "16px",
        bgcolor: "var(--card-bg)",
        border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        p: { xs: 2.5, md: 3 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: "var(--ai-violet, #7c3aed)",
            bgcolor: "color-mix(in srgb, var(--ai-violet, #7c3aed) 12%, transparent)",
          }}
        >
          <Icon icon="mdi:card-text-outline" width={20} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: "var(--font-jakarta)", fontWeight: 800, fontSize: "1.05rem", color: "var(--font-primary)" }}>
            Basics
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "var(--font-tertiary)" }}>
            The cohort's name, code and description.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <TextField
          label="Cohort name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputProps={{ maxLength: 255 }}
          helperText={`${name.length}/255`}
          fullWidth
        />
        <TextField
          label="Code (optional)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          helperText="A stable identifier, e.g. DS-2025-JAN"
          fullWidth
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={4}
          fullWidth
        />
      </Box>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={() => void save()}
          disabled={saving || !dirty}
          variant="contained"
          sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 700, px: 3, background: "var(--gradient-ai)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Box>
    </Box>
  );
}
