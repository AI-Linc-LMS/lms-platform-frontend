"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  adminLiveActivitiesService,
  WebinarDetail,
} from "@/lib/services/admin/admin-live-activities.service";
import { SectionCard, InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

interface Props {
  liveClassId: number;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75, borderBottom: "1px solid var(--border-default)" }}>
      <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 500, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}

/** Email tab — read-only mirror of the contact/email settings the template applied. */
export function WebinarEmailSection({ liveClassId }: Props) {
  const { t } = useTranslation("common");
  const [detail, setDetail] = useState<WebinarDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
          {t(
            "adminLiveSessions.emailMirrorNote",
            "Contact and email settings are inherited from the webinar template. Edit them in Zoom."
          )}
        </InfoCallout>
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
      </Box>
    </SectionCard>
  );
}
