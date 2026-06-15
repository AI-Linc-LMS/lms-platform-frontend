"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  MeetingPreset,
  MeetingTemplate,
} from "@/lib/services/admin/admin-live-activities.service";
import { getZoomApiErrorMessage } from "@/lib/utils/live-session-errors";
import { InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

interface MeetingPresetsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SETTINGS_PLACEHOLDER = `{
  "waiting_room": true,
  "mute_upon_entry": true,
  "join_before_host": false
}`;

/** Manage reusable Zoom meeting-setting presets for this client. */
export function MeetingPresetsDialog({ open, onClose }: MeetingPresetsDialogProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [presets, setPresets] = useState<MeetingPreset[]>([]);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // New-preset form
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [settingsJson, setSettingsJson] = useState("");
  const [jsonError, setJsonError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      adminLiveActivitiesService.listPresets(),
      adminLiveActivitiesService.getMeetingTemplates(),
    ])
      .then(([p, tpl]) => {
        if (p.status === "fulfilled") setPresets(p.value);
        if (tpl.status === "fulfilled") setTemplates(tpl.value);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const resetForm = () => {
    setName("");
    setTemplateId("");
    setIsDefault(false);
    setSettingsJson("");
    setJsonError(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast(t("adminLiveSessions.presetNameRequired", "Preset name is required"), "error");
      return;
    }
    let settings: Record<string, unknown> = {};
    if (settingsJson.trim()) {
      try {
        settings = JSON.parse(settingsJson);
        setJsonError(false);
      } catch {
        setJsonError(true);
        showToast(t("adminLiveSessions.invalidJson", "Settings must be valid JSON"), "error");
        return;
      }
    }
    try {
      setSaving(true);
      await adminLiveActivitiesService.createPreset({
        name: name.trim(),
        settings,
        template_id: templateId || undefined,
        is_default: isDefault,
      });
      showToast(t("adminLiveSessions.presetCreated", "Preset created"), "success");
      resetForm();
      load();
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await adminLiveActivitiesService.deletePreset(id);
      showToast(t("adminLiveSessions.presetDeleted", "Preset deleted"), "success");
      load();
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("adminLiveSessions.presetsTitle", "Meeting presets")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <InfoCallout icon="mdi:information-outline">
            {t(
              "adminLiveSessions.presetsHint",
              "Presets are reusable Zoom settings you can apply when creating a meeting. Cloud recording stays on regardless, so attendance and transcripts keep working."
            )}
          </InfoCallout>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : presets.length === 0 ? (
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
            {t("adminLiveSessions.noPresets", "No presets yet.")}
          </Typography>
        ) : (
          <List dense>
            {presets.map((p) => (
              <ListItem
                key={p.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    aria-label="delete"
                  >
                    {deletingId === p.id ? (
                      <CircularProgress size={18} />
                    ) : (
                      <IconWrapper icon="mdi:delete-outline" size={20} />
                    )}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${p.name}${p.is_default ? ` (${t("adminLiveSessions.default", "default")})` : ""}`}
                  secondary={
                    p.template_id
                      ? `${t("adminLiveSessions.meetingTemplate", "Zoom template")}: ${p.template_id}`
                      : undefined
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("adminLiveSessions.newPreset", "New preset")}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={t("adminLiveSessions.presetName", "Preset name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            required
          />
          {templates.length > 0 && (
            <TextField
              select
              label={t("adminLiveSessions.meetingTemplate", "Zoom template (optional)")}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">{t("adminLiveSessions.none")}</MenuItem>
              {templates.map((tpl) => (
                <MenuItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label={t("adminLiveSessions.presetSettingsJson", "Settings (JSON, optional)")}
            value={settingsJson}
            onChange={(e) => {
              setSettingsJson(e.target.value);
              if (jsonError) setJsonError(false);
            }}
            placeholder={SETTINGS_PLACEHOLDER}
            multiline
            rows={5}
            fullWidth
            size="small"
            error={jsonError}
            helperText={
              jsonError
                ? t("adminLiveSessions.invalidJson", "Settings must be valid JSON")
                : t("adminLiveSessions.presetSettingsHelper", "Raw Zoom meeting settings object.")
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label={t("adminLiveSessions.makeDefaultPreset", "Pre-select this preset by default")}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t("adminLiveSessions.close", "Close")}</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          sx={{
            bgcolor: "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
          }}
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("adminLiveSessions.createPreset", "Create preset")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
