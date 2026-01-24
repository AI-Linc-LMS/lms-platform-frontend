"use client";

import { Box, Paper, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
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
    github: profile.social_links?.github || "",
    linkedin: profile.social_links?.linkedin || "",
    college_name: profile.college_name || "",
    degree_type: profile.degree_type || "",
    branch: profile.branch || "",
    graduation_year: profile.graduation_year || "",
    city: profile.city || "",
    state: profile.state || "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
    };

  const handleSelectChange = (field: keyof typeof formData) => (e: any) => {
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
        date_of_birth: formData.date_of_birth || null,
        emailNotification: false,
        inAppNotification: true,
        social_links: {
          linkedin: formData.linkedin || "",
          github: formData.github || "",
        },
        college_name: formData.college_name || "",
        degree_type: formData.degree_type || "",
        branch: formData.branch || "",
        graduation_year: formData.graduation_year || "",
        city: formData.city || "",
        state: formData.state || "",
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
      github: profile.social_links?.github || "",
      linkedin: profile.social_links?.linkedin || "",
      college_name: profile.college_name || "",
      degree_type: profile.degree_type || "",
      branch: profile.branch || "",
      graduation_year: profile.graduation_year || "",
      city: profile.city || "",
      state: profile.state || "",
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
              disabled={saving || !formData.first_name || !formData.last_name}
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 2.5 } }}>
        {/* Row 1: First Name & Last Name */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: { xs: 1.5, sm: 2 },
            mb: { xs: 0, sm: 0 },
          }}
        >
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: { xs: 1, sm: 1.5 },
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.first_name ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:account" size={16} color="#0a66c2" />
            <Typography
              variant="caption"
              sx={{
                  color: "#666666",
                  fontSize: { xs: "0.6875rem", sm: "0.75rem" },
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              First Name
            </Typography>
            </Box>
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
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.first_name ? "#000000" : "#9ca3af",
                  fontWeight: profile.first_name ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.first_name ? "normal" : "italic",
                }}
              >
                {profile.first_name || "Not provided"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.last_name ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:account" size={18} color="#0a66c2" />
            <Typography
              variant="caption"
              sx={{
                  color: "#666666",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Last Name
            </Typography>
            </Box>
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
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.last_name ? "#000000" : "#9ca3af",
                  fontWeight: profile.last_name ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.last_name ? "normal" : "italic",
                }}
              >
                {profile.last_name || "Not provided"}
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
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.phone_number ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:phone" size={16} color="#0a66c2" />
            <Typography
              variant="caption"
              sx={{
                  color: "#666666",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Phone Number
            </Typography>
            </Box>
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
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.phone_number ? "#000000" : "#9ca3af",
                  fontWeight: profile.phone_number ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.phone_number ? "normal" : "italic",
                }}
              >
                {profile.phone_number || "Not provided"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.date_of_birth ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:calendar" size={16} color="#0a66c2" />
            <Typography
              variant="caption"
              sx={{
                  color: "#666666",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Date of Birth
            </Typography>
            </Box>
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
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.date_of_birth ? "#000000" : "#9ca3af",
                  fontWeight: profile.date_of_birth ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.date_of_birth ? "normal" : "italic",
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
                  : "Not provided"}
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
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.social_links?.github ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:github" size={16} color="#0a66c2" />
            <Typography
              variant="caption"
              sx={{
                  color: "#666666",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              GitHub Profile
            </Typography>
            </Box>
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
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.social_links?.github ? "#0a66c2" : "#9ca3af",
                  fontWeight: profile.social_links?.github ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.social_links?.github ? "normal" : "italic",
                }}
              >
                {profile.social_links?.github ? (
                  <Box
                    component="a"
                    href={`https://github.com/${profile.social_links.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "#0a66c2",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "#004182",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box component="span" sx={{ color: "#9ca3af" }}>
                      github.com/
                    </Box>
                    {profile.social_links.github}
                  </Box>
                ) : (
                  "Not provided"
                )}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.social_links?.linkedin ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:linkedin" size={16} color="#0a66c2" />
            <Typography
              variant="caption"
              sx={{
                  color: "#666666",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              LinkedIn Profile
            </Typography>
            </Box>
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
                    fontSize: "0.9375rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.social_links?.linkedin ? "#0a66c2" : "#9ca3af",
                  fontWeight: profile.social_links?.linkedin ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.social_links?.linkedin ? "normal" : "italic",
                }}
              >
                {profile.social_links?.linkedin ? (
                  <Box
                    component="a"
                    href={`https://www.linkedin.com/in/${profile.social_links.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "#0a66c2",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "#004182",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box component="span" sx={{ color: "#9ca3af" }}>
                      linkedin.com/in/
                    </Box>
                    {profile.social_links.linkedin}
                  </Box>
                ) : (
                  "Not provided"
                )}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 4: College Name & Degree Type */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.college_name ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:school" size={16} color="#0a66c2" />
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                College / University Name
              </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.college_name}
                onChange={handleChange("college_name")}
                fullWidth
                size="small"
                placeholder="Enter college/university name"
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
                  color: profile.college_name ? "#000000" : "#9ca3af",
                  fontWeight: profile.college_name ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.college_name ? "normal" : "italic",
                }}
              >
                {profile.college_name || "Not provided"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.degree_type ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:certificate" size={16} color="#0a66c2" />
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Degree Type
              </Typography>
            </Box>
            {editing ? (
              <FormControl fullWidth size="small">
                <Select
                  value={formData.degree_type}
                  onChange={handleSelectChange("degree_type")}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    fontSize: "0.9375rem",
                  }}
                >
                  <MenuItem value="">Select degree type</MenuItem>
                  <MenuItem value="B.Tech">B.Tech</MenuItem>
                  <MenuItem value="BCA">BCA</MenuItem>
                  <MenuItem value="B.Sc">B.Sc</MenuItem>
                  <MenuItem value="MCA">MCA</MenuItem>
                  <MenuItem value="M.Tech">M.Tech</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.degree_type ? "#000000" : "#9ca3af",
                  fontWeight: profile.degree_type ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.degree_type ? "normal" : "italic",
                }}
              >
                {profile.degree_type || "Not provided"}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 5: Branch & Graduation Year */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.branch ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:book-open-page-variant" size={16} color="#0a66c2" />
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Branch / Major
              </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.branch}
                onChange={handleChange("branch")}
                fullWidth
                size="small"
                placeholder="e.g., CSE, IT, ECE, Mechanical"
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
                  color: profile.branch ? "#000000" : "#9ca3af",
                  fontWeight: profile.branch ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.branch ? "normal" : "italic",
                }}
              >
                {profile.branch || "Not provided"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.graduation_year ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:calendar-check" size={16} color="#0a66c2" />
          <Typography
            variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Graduation Year
              </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.graduation_year}
                onChange={handleChange("graduation_year")}
                fullWidth
                size="small"
                type="number"
                placeholder="e.g., 2024"
                inputProps={{ min: 1900, max: 2100 }}
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
                  color: profile.graduation_year ? "#000000" : "#9ca3af",
                  fontWeight: profile.graduation_year ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.graduation_year ? "normal" : "italic",
                }}
              >
                {profile.graduation_year || "Not provided"}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 6: City & State */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.city ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:map-marker" size={16} color="#0a66c2" />
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
                }}
              >
                City
              </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.city}
                onChange={handleChange("city")}
                fullWidth
                size="small"
                placeholder="Enter city"
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
                  color: profile.city ? "#000000" : "#9ca3af",
                  fontWeight: profile.city ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.city ? "normal" : "italic",
                }}
              >
                {profile.city || "Not provided"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: profile.state ? "#ffffff" : "#f9fafb",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#f3f2ef",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:map-marker-outline" size={16} color="#0a66c2" />
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                State
          </Typography>
            </Box>
          {editing ? (
            <TextField
                value={formData.state}
                onChange={handleChange("state")}
              fullWidth
              size="small"
                placeholder="Enter state"
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
                  color: profile.state ? "#000000" : "#9ca3af",
                  fontWeight: profile.state ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.state ? "normal" : "italic",
                }}
              >
                {profile.state || "Not provided"}
            </Typography>
          )}
          </Box>
        </Box>

      </Box>
    </Paper>
  );
}
