"use client";

import { Box, Paper, Typography, TextField, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useState } from "react";
import { UserProfile } from "@/lib/services/profile.service";

interface PersonalInformationCardProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

export function PersonalInformationCard({
  profile,
  onSave,
}: PersonalInformationCardProps) {
  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone_number: profile.phone_number || "",
    date_of_birth: profile.date_of_birth || "",
    bio: profile.bio || "",
    github: profile.social_links?.github || "",
    linkedin: profile.social_links?.linkedin || "",
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
      // Prepare data in the exact format required by API
      const dataToSave = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        bio: formData.bio || "",
        date_of_birth: formData.date_of_birth || null,
        emailNotification: false,
        inAppNotification: true,
        social_links: {
          linkedin: formData.linkedin || "",
          github: formData.github || "",
        },
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
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      phone_number: profile.phone_number || "",
      date_of_birth: profile.date_of_birth || "",
      bio: profile.bio || "",
      github: profile.social_links?.github || "",
      linkedin: profile.social_links?.linkedin || "",
    });
    setEditing(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        mb: 3,
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
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          Personal Information
        </Typography>
        {!editing ? (
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
            onClick={() => setEditing(true)}
            sx={{
              textTransform: "none",
              color: "#6366f1",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              },
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
              disabled={saving || !formData.first_name || !formData.last_name}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#6366f1",
                borderRadius: 1.5,
                "&:hover": {
                  backgroundColor: "#4f46e5",
                },
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Row 1: First Name & Last Name */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              First Name
            </Typography>
            {editing ? (
              <TextField
                value={formData.first_name}
                onChange={handleChange("first_name")}
                fullWidth
                size="small"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profile.first_name || "-"}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Last Name
            </Typography>
            {editing ? (
              <TextField
                value={formData.last_name}
                onChange={handleChange("last_name")}
                fullWidth
                size="small"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profile.last_name || "-"}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 2: Phone Number & Date of Birth */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Phone Number
            </Typography>
            {editing ? (
              <TextField
                value={formData.phone_number}
                onChange={handleChange("phone_number")}
                fullWidth
                size="small"
                type="tel"
                placeholder="+1 (555) 123-4567"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profile.phone_number || "-"}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Date of Birth
            </Typography>
            {editing ? (
              <TextField
                value={formData.date_of_birth}
                onChange={handleChange("date_of_birth")}
                fullWidth
                size="small"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "-"}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 3: GitHub & LinkedIn */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              GitHub Profile
            </Typography>
            {editing ? (
              <TextField
                value={formData.github}
                onChange={handleChange("github")}
                fullWidth
                size="small"
                placeholder="username"
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{
                        color: "#9ca3af",
                        fontSize: "0.875rem",
                        mr: 0.5,
                      }}
                    >
                      github.com/
                    </Box>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profile.social_links?.github ? (
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Box component="span" sx={{ color: "#9ca3af" }}>
                      github.com/
                    </Box>
                    {profile.social_links.github}
                  </Box>
                ) : (
                  "-"
                )}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              LinkedIn Profile
            </Typography>
            {editing ? (
              <TextField
                value={formData.linkedin}
                onChange={handleChange("linkedin")}
                fullWidth
                size="small"
                placeholder="username"
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{
                        color: "#9ca3af",
                        fontSize: "0.875rem",
                        mr: 0.5,
                      }}
                    >
                      linkedin.com/in/
                    </Box>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
              >
                {profile.social_links?.linkedin ? (
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Box component="span" sx={{ color: "#9ca3af" }}>
                      linkedin.com/in/
                    </Box>
                    {profile.social_links.linkedin}
                  </Box>
                ) : (
                  "-"
                )}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 4: Bio (Full Width at Bottom) */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "block",
              mb: 0.5,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Bio
          </Typography>
          {editing ? (
            <TextField
              value={formData.bio}
              onChange={handleChange("bio")}
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Tell us about yourself..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#1f2937",
                fontWeight: 500,
                whiteSpace: "pre-wrap",
              }}
            >
              {profile.bio || "-"}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
