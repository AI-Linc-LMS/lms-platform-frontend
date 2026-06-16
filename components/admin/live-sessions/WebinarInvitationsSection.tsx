"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  Panelist,
  Registrant,
  WebinarInvitation,
} from "@/lib/services/admin/admin-live-activities.service";
import { getZoomApiErrorMessage, copyToClipboard } from "@/lib/utils/live-session-errors";
import { parseStudentCSV } from "@/lib/utils/csv-parser";
import { SectionCard, InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

interface Props {
  liveClassId: number;
}

/** Invitations tab: registration link + copy invite, panelist manager, registrant manager. */
export function WebinarInvitationsSection({ liveClassId }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [invitation, setInvitation] = useState<WebinarInvitation | null>(null);
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPanelistName, setNewPanelistName] = useState("");
  const [newPanelistEmail, setNewPanelistEmail] = useState("");
  const [newRegName, setNewRegName] = useState("");
  const [newRegEmail, setNewRegEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const panelistCsvRef = useRef<HTMLInputElement>(null);
  const registrantCsvRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      adminLiveActivitiesService.getWebinarInvitation(liveClassId),
      adminLiveActivitiesService.getPanelists(liveClassId),
      adminLiveActivitiesService.getRegistrants(liveClassId, "approved"),
    ]).then(([inv, pan, reg]) => {
      if (inv.status === "fulfilled") setInvitation(inv.value);
      if (pan.status === "fulfilled") setPanelists(pan.value);
      if (reg.status === "fulfilled") setRegistrants(reg.value);
      setLoading(false);
    });
  }, [liveClassId]);

  useEffect(() => {
    load();
  }, [load]);

  const addPanelists = async (items: Array<{ name?: string; email: string }>) => {
    if (!items.length) return;
    try {
      setBusy(true);
      const res = await adminLiveActivitiesService.addPanelists(liveClassId, items);
      if (res.status === "error") {
        showToast(getZoomApiErrorMessage(res.message), "error");
        return;
      }
      setPanelists(res.data?.panelists ?? panelists);
      showToast(res.message || t("adminLiveSessions.panelistsAdded", "Panelists added"), "success");
      setNewPanelistName("");
      setNewPanelistEmail("");
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setBusy(false);
    }
  };

  const addRegistrants = async (items: Array<{ name?: string; email: string }>) => {
    if (!items.length) return;
    try {
      setBusy(true);
      const res = await adminLiveActivitiesService.addRegistrants(liveClassId, items);
      if (res.status === "error") {
        showToast(getZoomApiErrorMessage(res.message), "error");
        return;
      }
      const failed = res.data?.failed?.length ?? 0;
      showToast(
        res.message || t("adminLiveSessions.registrantsAdded", "Registrants added"),
        failed ? "info" : "success"
      );
      setNewRegName("");
      setNewRegEmail("");
      const fresh = await adminLiveActivitiesService.getRegistrants(liveClassId, "approved");
      setRegistrants(fresh);
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setBusy(false);
    }
  };

  const deletePanelist = async (id?: string) => {
    if (!id) return;
    try {
      await adminLiveActivitiesService.deletePanelist(liveClassId, id);
      setPanelists((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    }
  };

  const handleCsv = async (file: File, kind: "panelist" | "registrant") => {
    const text = await file.text();
    const parsed = parseStudentCSV(text);
    if (!parsed.students.length) {
      showToast(t("adminLiveSessions.csvNoRows", "No valid rows found (need name,email columns)."), "error");
      return;
    }
    const items = parsed.students.map((s) => ({ name: s.name, email: s.email }));
    if (kind === "panelist") await addPanelists(items);
    else await addRegistrants(items);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const registrationUrl = invitation?.registration_url || "";
  const shareUrl = registrationUrl || invitation?.join_url || "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Invitation / registration link */}
      <SectionCard title={t("adminLiveSessions.invitation", "Invitation")} icon="mdi:email-outline">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {shareUrl ? (
            <>
              <TextField
                label={registrationUrl ? t("adminLiveSessions.registrationLink", "Registration link") : t("adminLiveSessions.joinLink", "Join link")}
                value={shareUrl}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:link-variant" size={16} />}
                  onClick={() => copyToClipboard(shareUrl, showToast, t("adminLiveSessions.linkCopied", "Link copied"))}
                >
                  {t("adminLiveSessions.copyLink", "Copy link")}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<IconWrapper icon="mdi:content-copy" size={16} />}
                  onClick={() => copyToClipboard(invitation?.invitation_text || shareUrl, showToast, t("adminLiveSessions.invitationCopied", "Invitation copied"))}
                  sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
                >
                  {t("adminLiveSessions.copyInvitation", "Copy invitation")}
                </Button>
              </Box>
            </>
          ) : (
            <InfoCallout icon="mdi:information-outline">
              {t("adminLiveSessions.noInvitationYet", "No registration or join link is available yet for this webinar.")}
            </InfoCallout>
          )}
        </Box>
      </SectionCard>

      {/* Panelists */}
      <SectionCard
        title={`${t("adminLiveSessions.panelists", "Panelists")} (${panelists.length})`}
        icon="mdi:account-tie-outline"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <TextField
              label={t("adminLiveSessions.name", "Name")}
              value={newPanelistName}
              onChange={(e) => setNewPanelistName(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              label={t("adminLiveSessions.email", "Email")}
              value={newPanelistEmail}
              onChange={(e) => setNewPanelistEmail(e.target.value)}
              size="small"
              sx={{ flex: 1.5, minWidth: 160 }}
            />
            <Button
              variant="contained"
              disabled={busy || !newPanelistEmail.trim()}
              onClick={() => addPanelists([{ name: newPanelistName.trim(), email: newPanelistEmail.trim() }])}
              sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
            >
              {t("adminLiveSessions.add", "Add")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:file-upload-outline" size={16} />}
              onClick={() => panelistCsvRef.current?.click()}
              disabled={busy}
            >
              {t("adminLiveSessions.importCsv", "Import CSV")}
            </Button>
            <input
              ref={panelistCsvRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsv(f, "panelist");
                e.target.value = "";
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
            {t("adminLiveSessions.panelistCsvHint", "CSV columns: name, email. Zoom allows up to 100 panelists.")}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
            {t(
              "adminLiveSessions.panelistLinkHint",
              "Each panelist gets a unique join link — use the link icon to copy it and send it to them (Zoom does not email panelists automatically)."
            )}
          </Typography>
          {panelists.length > 0 && (
            <List dense>
              {panelists.map((p) => (
                <ListItem
                  key={p.id || p.email}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {p.join_url && (
                        <IconButton
                          edge="end"
                          onClick={() =>
                            copyToClipboard(
                              p.join_url!,
                              showToast,
                              t("adminLiveSessions.panelistLinkCopied", "Panelist join link copied")
                            )
                          }
                          aria-label="copy join link"
                          title={t("adminLiveSessions.copyPanelistLink", "Copy this panelist's unique join link")}
                        >
                          <IconWrapper icon="mdi:link-variant" size={18} />
                        </IconButton>
                      )}
                      <IconButton edge="end" onClick={() => deletePanelist(p.id)} aria-label="remove">
                        <IconWrapper icon="mdi:close" size={18} />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={p.name || p.email}
                    secondary={p.name ? p.email : undefined}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </SectionCard>

      {/* Registrants */}
      <SectionCard
        title={`${t("adminLiveSessions.registrants", "Registrants")} (${registrants.length})`}
        icon="mdi:account-multiple-plus-outline"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <TextField
              label={t("adminLiveSessions.name", "Name")}
              value={newRegName}
              onChange={(e) => setNewRegName(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              label={t("adminLiveSessions.email", "Email")}
              value={newRegEmail}
              onChange={(e) => setNewRegEmail(e.target.value)}
              size="small"
              sx={{ flex: 1.5, minWidth: 160 }}
            />
            <Button
              variant="contained"
              disabled={busy || !newRegEmail.trim()}
              onClick={() => addRegistrants([{ name: newRegName.trim(), email: newRegEmail.trim() }])}
              sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
            >
              {t("adminLiveSessions.add", "Add")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:file-upload-outline" size={16} />}
              onClick={() => registrantCsvRef.current?.click()}
              disabled={busy}
            >
              {t("adminLiveSessions.importCsv", "Import CSV")}
            </Button>
            <input
              ref={registrantCsvRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsv(f, "registrant");
                e.target.value = "";
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
            {t("adminLiveSessions.registrantCsvHint", "CSV columns: name, email. Registrants receive Zoom's confirmation email.")}
          </Typography>
          {registrants.length > 0 && (
            <>
              <Divider />
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {registrants.slice(0, 50).map((r) => (
                  <Chip key={r.id || r.email} size="small" label={r.email} />
                ))}
                {registrants.length > 50 && (
                  <Chip size="small" label={`+${registrants.length - 50}`} />
                )}
              </Box>
            </>
          )}
        </Box>
      </SectionCard>
    </Box>
  );
}
