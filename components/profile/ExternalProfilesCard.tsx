"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, TextField, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile } from "@/lib/services/profile.service";

interface ExternalProfilesCardProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  onRemoveSection?: () => void;
}

export function ExternalProfilesCard({
  profile,
  onSave,
  onRemoveSection,
}: ExternalProfilesCardProps) {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState({
    portfolio_website_url: profile.portfolio_website_url || "",
    leetcode_url: profile.leetcode_url || "",
    hackerrank_url: profile.hackerrank_url || "",
    kaggle_url: profile.kaggle_url || "",
    medium_url: profile.medium_url || "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const syncFormFromProfile = () => ({
    portfolio_website_url: profile.portfolio_website_url || "",
    leetcode_url: profile.leetcode_url || "",
    hackerrank_url: profile.hackerrank_url || "",
    kaggle_url: profile.kaggle_url || "",
    medium_url: profile.medium_url || "",
  });

  useEffect(() => {
    if (!editing) setFormData(syncFormFromProfile());
  }, [profile, editing]);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
    };

  const platformBaseUrls: Record<string, string> = {
    leetcode_url: "https://leetcode.com/",
    hackerrank_url: "https://www.hackerrank.com/",
    kaggle_url: "https://www.kaggle.com/",
    medium_url: "https://medium.com/@",
  };

  const normalizeUrl = (field: string, value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.includes(".")) {
      return `https://${trimmed}`;
    }
    const base = platformBaseUrls[field];
    if (base) {
      return `${base}${trimmed}`;
    }
    return `https://${trimmed}`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave = {
        portfolio_website_url: normalizeUrl("portfolio_website_url", formData.portfolio_website_url),
        leetcode_url: normalizeUrl("leetcode_url", formData.leetcode_url),
        hackerrank_url: normalizeUrl("hackerrank_url", formData.hackerrank_url),
        kaggle_url: normalizeUrl("kaggle_url", formData.kaggle_url),
        medium_url: normalizeUrl("medium_url", formData.medium_url),
      };
      await onSave(dataToSave);
      setEditing(false);
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      portfolio_website_url: profile.portfolio_website_url || "",
      leetcode_url: profile.leetcode_url || "",
      hackerrank_url: profile.hackerrank_url || "",
      kaggle_url: profile.kaggle_url || "",
      medium_url: profile.medium_url || "",
    });
    setEditing(false);
  };

  const formatUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const getProfileValue = (field: keyof typeof formData): string => {
    switch (field) {
      case "portfolio_website_url":
        return profile.portfolio_website_url || "";
      case "leetcode_url":
        return profile.leetcode_url || "";
      case "hackerrank_url":
        return profile.hackerrank_url || "";
      case "kaggle_url":
        return profile.kaggle_url || "";
      case "medium_url":
        return profile.medium_url || "";
      default:
        return "";
    }
  };

  const renderField = (
    label: string,
    field: keyof typeof formData,
    placeholder: string,
    icon?: string
  ) => {
    const profileValue = getProfileValue(field);
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
          backgroundColor: profileValue ? "var(--background)" : "var(--surface)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: profileValue ? "color-mix(in srgb, var(--surface) 85%, var(--background))" : "var(--surface)",
            borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
            transform: profileValue ? "translateY(-1px)" : "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: profileValue ? "color-mix(in srgb, var(--surface) 85%, var(--background))" : "color-mix(in srgb, var(--surface) 72%, var(--background))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <IconWrapper 
                icon={icon} 
                size={20} 
                color={profileValue ? "var(--accent-indigo)" : "var(--font-secondary)"} 
              />
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.75,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {label}
            </Typography>
            {editing ? (
              <TextField
                value={formData[field]}
                onChange={handleChange(field)}
                fullWidth
                size="small"
                placeholder={placeholder}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profileValue ? "var(--font-primary)" : "var(--font-secondary)",
                  fontWeight: profileValue ? 500 : 400,
                  fontSize: "0.9375rem",
                }}
              >
                {profileValue ? (
                  <Box
                    component="a"
                    href={formatUrl(profileValue)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      color: "var(--accent-indigo)",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "var(--accent-indigo-dark)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {profileValue}
                    </Box>
                    <IconWrapper icon="mdi:open-in-new" size={16} color="var(--accent-indigo)" />
                  </Box>
                ) : (
                  <Box
                    component="span"
                    sx={{
                      fontStyle: "italic",
                      color: "var(--font-tertiary)",
                    }}
                  >
                    {t("profile.notAdded")}
                  </Box>
                )}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
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
          {t("profile.externalProfiles")}
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
            onClick={() => {
              setFormData(syncFormFromProfile());
              setEditing(true);
            }}
            sx={{
              textTransform: "none",
              color: "var(--accent-indigo)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.edit")}
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
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
                backgroundColor: "var(--accent-indigo)",
                borderRadius: "24px",
                px: 2,
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {saving ? t("profile.saving") : t("profile.save")}
            </Button>
          </Box>
        )}
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {renderField(
          t("profile.portfolio"),
          "portfolio_website_url",
          "https://yourportfolio.com",
          "mdi:web"
        )}
        {renderField(
          t("profile.leetcode"),
          "leetcode_url",
          "https://leetcode.com/username",
          "mdi:code-tags"
        )}
        {renderField(
          t("profile.hackerrank"),
          "hackerrank_url",
          "https://www.hackerrank.com/username",
          "mdi:code-braces"
        )}
        {renderField(
          t("profile.kaggle"),
          "kaggle_url",
          "https://www.kaggle.com/username",
          "mdi:chart-box"
        )}
        {renderField(
          t("profile.medium"),
          "medium_url",
          "https://medium.com/@username",
          "mdi:book-open-variant"
        )}
      </Box>
    </Paper>
  );
}
