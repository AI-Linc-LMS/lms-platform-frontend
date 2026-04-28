"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile, Certification } from "@/lib/services/profile.service";

function getCredentialLinkUrl(url: string | undefined): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  const u = url.trim();
  if (u.startsWith("/")) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin && u.startsWith(origin)) {
    try {
      const parsed = new URL(u);
      const target = parsed.searchParams.get("url") ?? parsed.searchParams.get("to") ?? parsed.searchParams.get("redirect") ?? parsed.searchParams.get("target");
      if (target && (target.startsWith("http://") || target.startsWith("https://"))) return target;
    } catch {

    }
    return null;
  }
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

interface CertificationsSectionProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  onRemoveSection?: () => void;
}

export function CertificationsSection({
  profile,
  onSave,
  onRemoveSection,
}: CertificationsSectionProps) {
  const { t } = useTranslation();
  const [certifications, setCertifications] = useState<Certification[]>(profile.certifications || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Certification>({
    id: "",
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiration_date: "",
    credential_id: "",
    credential_url: "",
  });

  useEffect(() => {
    if (!editing && editingIndex === null) setCertifications(profile.certifications || []);
  }, [profile.certifications, editing, editingIndex]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave: Partial<UserProfile> = {
        certifications: certifications.map((cert): Certification => ({
          id: cert.id,
          name: cert.name,
          issuing_organization: cert.issuing_organization,
          issue_date: cert.issue_date ?? "",
          expiration_date: cert.expiration_date || undefined,
          credential_id: cert.credential_id || undefined,
          credential_url: cert.credential_url || undefined,
        })),
      };
      await onSave(dataToSave);
      setEditing(false);
    } catch (error) {
      // Silently handle profile save error
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCertifications(profile.certifications || []);
    setEditing(false);
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      name: "",
      issuing_organization: "",
      issue_date: "",
      expiration_date: "",
      credential_id: "",
      credential_url: "",
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setFormData(certifications[index]);
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const toISODate = (val: string): string => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toISOString().split("T")[0];
  };

  const handleDialogSave = async () => {
    const newCertification: Certification = {
      ...formData,
      id: formData.id || Date.now().toString(),
      issue_date: toISODate(formData.issue_date),
      expiration_date: toISODate(formData.expiration_date || ""),
    };

    let updated: Certification[];
    if (editingIndex !== null) {
      updated = [...certifications];
      updated[editingIndex] = newCertification;
    } else {
      updated = [...certifications, newCertification];
    }
    setCertifications(updated);
    setDialogOpen(false);
    setEditingIndex(null);

    if (editingIndex === null && certifications.length === 0) {
      try {
        setSaving(true);
        await onSave({
          certifications: updated.map((cert) => ({
            id: cert.id,
            name: cert.name,
            issuing_organization: cert.issuing_organization,
            issue_date: cert.issue_date ?? "",
            expiration_date: cert.expiration_date || undefined,
            credential_id: cert.credential_id || undefined,
            credential_url: cert.credential_url || undefined,
          })),
        });
      } catch {
        // handled by parent
      } finally {
        setSaving(false);
      }
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
          borderRadius: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 3 },
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
          transition: "box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 4px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary)",
              fontSize: "1.25rem",
            }}
          >
            {t("profile.certifications")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {onRemoveSection && (
            <Button
              variant="text"
              size="small"
              startIcon={<IconWrapper icon="mdi:close" size={16} />}
              onClick={onRemoveSection}
              sx={{
                textTransform: "none",
                color: "var(--font-secondary)",
                fontWeight: 500,
                fontSize: "0.8125rem",
                "&:hover": { backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)", color: "var(--error-500)" },
              }}
            >
              Remove
            </Button>
          )}
          {!editing ? (
            <Button
              variant="text"
              size="small"
              startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
              onClick={() => setEditing(true)}
              sx={{
                textTransform: "none",
                color: "var(--accent-indigo)",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
                },
              }}
            >
              {t("profile.edit")}
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconWrapper icon="mdi:plus" size={16} />}
                onClick={handleAddNew}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "var(--accent-purple)",
                  color: "var(--accent-indigo)",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "var(--accent-indigo-dark)",
                    backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
                  },
                }}
              >
              {t("profile.add")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
                disabled={saving}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "var(--border-default)",
                  color: "var(--font-secondary)",
                  borderRadius: 1.5,
                  "&:hover": {
                    borderColor: "color-mix(in srgb, var(--border-default) 85%, var(--font-secondary))",
                    backgroundColor: "var(--surface)",
                  },
                }}
              >
              {t("profile.cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
                disabled={saving}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "var(--accent-purple)",
                  borderRadius: 1.5,
                  "&:hover": {
                    backgroundColor: "var(--accent-indigo-dark)",
                  },
                }}
              >
                {saving ? t("profile.saving") : t("profile.save")}
              </Button>
            </Box>
          )}
          </Box>
        </Box>

        {certifications.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {certifications.map((cert, index) => (
              <Box
                key={cert.id || index}
                sx={{
                  p: 2,
                  border: "1px solid var(--border-default)",
                  borderRadius: 1.5,
                  backgroundColor: "var(--surface)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "var(--font-primary)",
                        mb: 0.5,
                      }}
                    >
                      {cert.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--accent-indigo)",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {cert.issuing_organization}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Issued {formatDate(cert.issue_date)}
                      {cert.expiration_date && ` • Expires ${formatDate(cert.expiration_date)}`}
                      {cert.credential_id && ` • Credential ID: ${cert.credential_id}`}
                    </Typography>
                    {(() => {
                      const linkUrl = getCredentialLinkUrl(cert.credential_url);
                      return linkUrl ? (
                        <Box
                          component="a"
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "var(--accent-indigo)",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            mt: 0.5,
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          <IconWrapper icon="mdi:link" size={16} color="var(--accent-purple)" />
                          View Credential
                        </Box>
                      ) : null;
                    })()}
                  </Box>
                  {editing && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(index)}
                        sx={{
                          color: "var(--accent-indigo)",
                          "&:hover": {
                            backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
                          },
                        }}
                      >
                        <IconWrapper icon="mdi:pencil" size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(index)}
                        sx={{
                          color: "var(--error-500)",
                          "&:hover": {
                            backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)",
                          },
                        }}
                      >
                        <IconWrapper icon="mdi:delete" size={18} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 2,
              border: "1px dashed color-mix(in srgb, var(--font-primary) 14%, transparent)",
              borderRadius: 2,
              backgroundColor: "var(--surface)",
            }}
          >
            <IconWrapper icon="mdi:certificate" size={48} color="var(--font-tertiary)" />
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                mt: 2,
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              {t("profile.noCertificationsYet")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-tertiary)",
                mt: 0.5,
                fontSize: "0.8125rem",
                display: "block",
              }}
            >
              {t("profile.clickEditToAddCertifications")}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              onClick={handleAddNew}
              sx={{
                mt: 2,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "var(--accent-indigo)",
                borderRadius: 2,
                px: 2.5,
                py: 1,
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {t("profile.add")} {t("profile.certifications")}
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            boxShadow: "0 4px 16px color-mix(in srgb, var(--font-primary) 14%, transparent)",
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: "100vh", sm: "90vh" },
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            pb: { xs: 1.5, sm: 1 },
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 3 },
            borderBottom: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <IconWrapper 
            icon="mdi:certificate" 
            size={20} 
            color="var(--accent-indigo)" 
          />
          <Typography
            component="span"
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary)",
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
            }}
          >
            {editingIndex !== null ? t("profile.editCertification") : t("profile.addCertification")}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: { xs: 3, sm: 3.5 } }}>
            <TextField
              label="Certification Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Issuing Organization"
              value={formData.issuing_organization}
              onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Issue Date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Expiration Date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Credential ID"
              value={formData.credential_id}
              onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., ABC123XYZ"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
            <TextField
              label="Credential URL"
              value={formData.credential_url}
              onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
              fullWidth
              size="small"
              placeholder="https://..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: "0.9375rem",
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            borderTop: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
            gap: { xs: 0.75, sm: 1 },
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "var(--font-secondary)",
              borderRadius: { xs: 1.5, sm: 1.5 },
              px: { xs: 2, sm: 2 },
              py: { xs: 1, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            {t("profile.cancel")}
          </Button>
          <Button
            onClick={handleDialogSave}
            variant="contained"
            disabled={!formData.name || !formData.issuing_organization || !formData.issue_date}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--accent-indigo)",
              borderRadius: "24px",
              px: { xs: 3, sm: 3 },
              py: { xs: 1, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
              },
              "&:disabled": {
                backgroundColor: "var(--border-default)",
                color: "var(--font-tertiary)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
