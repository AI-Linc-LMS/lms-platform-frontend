"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  WebinarDetail,
} from "@/lib/services/admin/admin-live-activities.service";
import { getZoomApiErrorMessage } from "@/lib/utils/live-session-errors";
import { SectionCard, InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

interface Props {
  liveClassId: number;
  /** Editing pushes changes to Zoom; only sensible for scheduled/upcoming webinars. */
  editable?: boolean;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75, borderBottom: "1px solid var(--border-default)" }}>
      <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 500, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}

/** Email tab — contact/email settings mirrored from Zoom, editable in place when allowed. */
export function WebinarEmailSection({ liveClassId, editable = false }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [detail, setDetail] = useState<WebinarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable field state (seeded from detail when entering edit mode).
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState(false);
  const [registrationRequired, setRegistrationRequired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminLiveActivitiesService.getWebinarDetail(liveClassId);
      setDetail(d);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminLiveActivitiesService
      .getWebinarDetail(liveClassId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [liveClassId]);

  const startEdit = () => {
    if (!detail) return;
    setContactName(detail.contact_name ?? "");
    setContactEmail(detail.contact_email ?? "");
    setConfirmationEmail(detail.registrants_confirmation_email === true);
    setRegistrationEmail(detail.registrants_email_notification === true);
    setRegistrationRequired(detail.approval_type !== 2);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!detail) return;
    const input: {
      contact_name?: string;
      contact_email?: string;
      registrants_confirmation_email?: boolean;
      registrants_email_notification?: boolean;
      approval_type?: number;
    } = {};
    if (contactName !== (detail.contact_name ?? "")) input.contact_name = contactName;
    if (contactEmail !== (detail.contact_email ?? "")) input.contact_email = contactEmail;
    if (confirmationEmail !== (detail.registrants_confirmation_email === true))
      input.registrants_confirmation_email = confirmationEmail;
    if (registrationEmail !== (detail.registrants_email_notification === true))
      input.registrants_email_notification = registrationEmail;
    const desiredApproval = registrationRequired ? 0 : 2;
    if ((detail.approval_type !== 2) !== registrationRequired) input.approval_type = desiredApproval;

    if (Object.keys(input).length === 0) {
      showToast(t("adminLiveSessions.noChanges", "No changes to save"), "info");
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      const res = await adminLiveActivitiesService.editWebinar(liveClassId, input);
      if (res.status === "error") {
        showToast(getZoomApiErrorMessage(res.message), "error");
        return;
      }
      showToast(t("adminLiveSessions.emailSettingsSaved", "Email settings updated"), "success");
      setEditing(false);
      await load();
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const yesNo = (v: unknown) =>
    v === true ? t("adminLiveSessions.on", "On") : v === false ? t("adminLiveSessions.off", "Off") : "—";

  return (
    <SectionCard title={t("adminLiveSessions.emailSettings", "Email settings")} icon="mdi:email-fast-outline">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <InfoCallout icon="mdi:information-outline">
          {editable
            ? t("adminLiveSessions.emailEditableNote", "Contact and email settings come from the webinar template. Edits here are pushed to Zoom.")
            : t("adminLiveSessions.emailMirrorNote", "Contact and email settings are inherited from the webinar template. Edit them in Zoom.")}
        </InfoCallout>

        {!editing ? (
          <>
            <Box>
              <Row label={t("adminLiveSessions.contactName", "Contact name")} value={detail?.contact_name || "—"} />
              <Row label={t("adminLiveSessions.contactEmail", "Contact email")} value={detail?.contact_email || "—"} />
              <Row label={t("adminLiveSessions.confirmationEmail", "Confirmation email")} value={yesNo(detail?.registrants_confirmation_email)} />
              <Row label={t("adminLiveSessions.registrationEmail", "Registration email")} value={yesNo(detail?.registrants_email_notification)} />
              <Row
                label={t("adminLiveSessions.registrationRequiredLabel", "Registration required")}
                value={detail?.approval_type === 2 ? t("adminLiveSessions.no", "No") : t("adminLiveSessions.yes", "Yes")}
              />
            </Box>
            {editable && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconWrapper icon="mdi:pencil-outline" size={16} />}
                onClick={startEdit}
                sx={{ textTransform: "none", alignSelf: "flex-start", mt: 1 }}
              >
                {t("adminLiveSessions.editEmailSettings", "Edit email settings")}
              </Button>
            )}
          </>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("adminLiveSessions.contactName", "Contact name")}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label={t("adminLiveSessions.contactEmail", "Contact email")}
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              fullWidth
              size="small"
            />
            <FormControlLabel
              control={<Switch checked={confirmationEmail} onChange={(e) => setConfirmationEmail(e.target.checked)} />}
              label={t("adminLiveSessions.confirmationEmail", "Confirmation email")}
            />
            <FormControlLabel
              control={<Switch checked={registrationEmail} onChange={(e) => setRegistrationEmail(e.target.checked)} />}
              label={t("adminLiveSessions.registrationEmail", "Registration email")}
            />
            <FormControlLabel
              control={<Switch checked={registrationRequired} onChange={(e) => setRegistrationRequired(e.target.checked)} />}
              label={t("adminLiveSessions.registrationRequiredLabel", "Registration required")}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
              >
                {saving ? <CircularProgress size={18} color="inherit" /> : t("adminLiveSessions.save", "Save")}
              </Button>
              <Button size="small" onClick={() => setEditing(false)} disabled={saving}>
                {t("adminLiveSessions.cancel", "Cancel")}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}
