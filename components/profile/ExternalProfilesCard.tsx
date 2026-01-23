"use client";

import { Box, Paper, Typography, TextField, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState } from "react";
import { UserProfile } from "@/lib/services/profile.service";

interface ExternalProfilesCardProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function ExternalProfilesCard({
  profile,
  onSave,
}: ExternalProfilesCardProps) {
  const [formData, setFormData] = useState({
    portfolio_website_url: profile.portfolio_website_url || "",
    leetcode_url: profile.leetcode_url || "",
    hackerrank_url: profile.hackerrank_url || "",
    kaggle_url: profile.kaggle_url || "",
    medium_url: profile.medium_url || "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
    };

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave = {
        portfolio_website_url: formData.portfolio_website_url || "",
        leetcode_url: formData.leetcode_url || "",
        hackerrank_url: formData.hackerrank_url || "",
        kaggle_url: formData.kaggle_url || "",
        medium_url: formData.medium_url || "",
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
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: profileValue ? "#ffffff" : "#f9fafb",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: profileValue ? "#f3f2ef" : "#f9fafb",
            borderColor: "rgba(0,0,0,0.12)",
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
                backgroundColor: profileValue ? "#f3f2ef" : "#e9e7e3",
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
                color={profileValue ? "#0a66c2" : "#666666"} 
              />
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666666",
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
                  color: profileValue ? "#000000" : "#666666",
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
                      color: "#0a66c2",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "#004182",
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
                    <IconWrapper icon="mdi:open-in-new" size={16} color="#0a66c2" />
                  </Box>
                ) : (
                  <Box
                    component="span"
                    sx={{
                      fontStyle: "italic",
                      color: "#9ca3af",
                    }}
                  >
                    Not added
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
          }}
        >
          External Profiles
        </Typography>
        {!editing ? (
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
            onClick={() => setEditing(true)}
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
            Edit
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
                borderColor: "#e5e7eb",
                color: "#6b7280",
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: "#d1d5db",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Cancel
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
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>
        )}
      </Box>

      <Box 
        sx={{ 
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {renderField(
          "Portfolio Website",
          "portfolio_website_url",
          "https://yourportfolio.com",
          "mdi:web"
        )}
        {renderField(
          "LeetCode Profile",
          "leetcode_url",
          "https://leetcode.com/username",
          "mdi:code-tags"
        )}
        {renderField(
          "HackerRank Profile",
          "hackerrank_url",
          "https://www.hackerrank.com/username",
          "mdi:code-braces"
        )}
        {renderField(
          "Kaggle Profile",
          "kaggle_url",
          "https://www.kaggle.com/username",
          "mdi:chart-box"
        )}
        {renderField(
          "Medium Profile",
          "medium_url",
          "https://medium.com/@username",
          "mdi:book-open-variant"
        )}
      </Box>
    </Paper>
  );
}
