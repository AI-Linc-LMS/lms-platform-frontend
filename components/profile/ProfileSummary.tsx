"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button, TextField } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile } from "@/lib/services/profile.service";

interface ProfileSummaryProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const MAX_PREVIEW_LENGTH = 200;

export function ProfileSummary({
  profile,
  onSave,
}: ProfileSummaryProps) {
  const { t } = useTranslation("common");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile.bio || "",
  });

  useEffect(() => {
    if (!editing) setFormData({ bio: profile.bio || "" });
  }, [profile.bio, editing]);

  const bio = profile.bio || "";
  const shouldTruncate = bio.length > MAX_PREVIEW_LENGTH;
  const displayText = expanded || !shouldTruncate ? bio : `${bio.substring(0, MAX_PREVIEW_LENGTH)}...`;

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave = {
        bio: formData.bio || null,
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
    setFormData({
      bio: profile.bio || "",
    });
    setEditing(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12)",
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
            color: "#000000",
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
          }}
        >
          {t("profile.about")}
        </Typography>
        {!editing ? (
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
            onClick={() => {
              setFormData({ bio: profile.bio || "" });
              setEditing(true);
            }}
            sx={{
              textTransform: "none",
              color: "#0a66c2",
              fontWeight: 600,
              fontSize: "0.9375rem",
              "&:hover": {
                backgroundColor: "rgba(10, 102, 194, 0.08)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.edit")}
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="text"
              size="small"
              onClick={handleCancel}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#666666",
                "&:hover": {
                  backgroundColor: "#f3f2ef",
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
                backgroundColor: "#0a66c2",
                borderRadius: "24px",
                px: 2,
                "&:hover": {
                  backgroundColor: "#004182",
                },
                transition: "all 0.2s ease",
              }}
            >
              {saving ? t("profile.saving") : t("profile.save")}
            </Button>
          </Box>
        )}
      </Box>

      {editing ? (
        <TextField
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          fullWidth
          multiline
          rows={6}
          placeholder={t("profile.tellUsAboutYourself")}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              fontSize: "0.9375rem",
              lineHeight: 1.5,
            },
          }}
        />
      ) : (
        <Box>
          {bio ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  color: "#000000",
                  fontSize: "0.9375rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  letterSpacing: "0.01em",
                }}
              >
                {displayText}
              </Typography>
              {shouldTruncate && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{
                    textTransform: "none",
                    color: "#0a66c2",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    mt: 1,
                    px: 0,
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  {expanded ? t("profile.showLess") : t("profile.showMore")}
                </Button>
              )}
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontStyle: "italic",
              }}
            >
              {t("profile.noSummaryClickEdit")}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}
