"use client";

import { useState, useEffect } from "react";
import { MuiTelInput } from "mui-tel-input";
import { CountrySelect } from "@/components/profile/CountrySelect";
import { validateMandatoryProfile } from "@/lib/schemas/profile.schema";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";
import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, TextField, Button, MenuItem, Select, FormControl } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { UserProfile } from "@/lib/services/profile.service";
import { PROFILE, TILE_GRADIENT } from "./theme/profileTokens";
import { CollegeAutocomplete } from "@/components/profile/CollegeAutocomplete";

interface PersonalInformationCardProps {
  profile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const GENDER_LABEL_KEYS: Record<string, string> = {
  male: "profile.genderMale",
  female: "profile.genderFemale",
  non_binary: "profile.genderNonBinary",
  prefer_not_to_say: "profile.genderPreferNotToSay",
  other: "profile.genderOther",
};

export function PersonalInformationCard({
  profile,
  onSave,
}: PersonalInformationCardProps) {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone_number: profile.phone_number || "",
    date_of_birth: profile.date_of_birth || "",
    gender: profile.gender || "",
    country: profile.country || "",
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { refresh: refreshProfileGate } = useProfileGate();

  const syncFormFromProfile = () => ({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone_number: profile.phone_number || "",
    date_of_birth: profile.date_of_birth || "",
    gender: profile.gender || "",
    country: profile.country || "",
    github: profile.social_links?.github || "",
    linkedin: profile.social_links?.linkedin || "",
    college_name: profile.college_name || "",
    degree_type: profile.degree_type || "",
    branch: profile.branch || "",
    graduation_year: profile.graduation_year || "",
    city: profile.city || "",
    state: profile.state || "",
  });

  useEffect(() => {
    if (!editing) setFormData(syncFormFromProfile());
  }, [profile, editing]);

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
        // Checked here for speed of feedback only. accounts/validators.py is the authority,
    // and its message wins if something still gets through.
    const problems = validateMandatoryProfile(formData);
    if (Object.keys(problems).length > 0) {
      setFieldErrors(problems);
      return;
    }
    setFieldErrors({});
try {
      setSaving(true);
      // API: partial body OK; optional fields use null when empty (matches GET response shape)
      const dataToSave: Partial<UserProfile> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender.trim() ? formData.gender : null,
        country: formData.country.trim() ? formData.country : null,
        social_links: {
          linkedin: formData.linkedin || "",
          github: formData.github || "",
        },
        college_name: formData.college_name || null,
        degree_type: formData.degree_type || null,
        branch: formData.branch || null,
        graduation_year: formData.graduation_year || null,
        city: formData.city || null,
        state: formData.state || null,
      };
      await onSave(dataToSave);
      setFieldErrors({});
      setEditing(false);
      // The rail widget and the sidebar locks read the gate, so refresh it here rather than
      // making the learner reload to see what they just unlocked.
      void refreshProfileGate();
    } catch (error) {
      // Previously swallowed entirely, so a rejected save looked like a successful one.
      const resp = (error as { response?: { data?: Record<string, unknown> } })?.response;
      const data = resp?.data ?? {};
      const perField: Record<string, string> = {};
      for (const key of Object.keys(data)) {
        const val = (data as Record<string, unknown>)[key];
        if (Array.isArray(val) && typeof val[0] === "string") perField[key] = val[0];
        else if (typeof val === "string" && key !== "detail") perField[key] = val;
      }
      setFieldErrors(perField);
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
      gender: profile.gender || "",
      country: profile.country || "",
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
        border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
        borderRadius: 4,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 16px 34px -20px rgba(30,27,75,0.34)",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: TILE_GRADIENT,
            }}
          >
            <IconWrapper icon="mdi:account-details-outline" size={17} />
          </Box>
          <Typography
            component="h3"
            sx={{
              fontWeight: 800,
              color: PROFILE.ink,
              fontSize: "0.95rem",
              lineHeight: 1.2,
              letterSpacing: "-0.2px",
            }}
          >
            {t("profile.personalInformation")}
          </Typography>
        </Box>
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
            <LoadingButton
              variant="contained"
              size="small"
              onClick={handleSave}
              loading={saving}
              loadingText={t("profile.saving")}
              disabled={!formData.first_name || !formData.last_name}
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
              {t("profile.save")}
            </LoadingButton>
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.first_name ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:account" size={16} color="var(--accent-indigo)" />
            <Typography
              variant="caption"
              sx={{
                  color: "var(--font-secondary)",
                  fontSize: { xs: "0.6875rem", sm: "0.75rem" },
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("profile.firstName")}
            </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.first_name}
                onChange={handleChange("first_name")}
                error={Boolean(fieldErrors.first_name)}
                helperText={fieldErrors.first_name}
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
                  color: profile.first_name ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.first_name ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.first_name ? "normal" : "italic",
                }}
              >
                {profile.first_name || t("profile.notProvided")}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.last_name ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IconWrapper icon="mdi:account" size={18} color="var(--accent-indigo)" />
            <Typography
              variant="caption"
              sx={{
                  color: "var(--font-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("profile.lastName")}
            </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.last_name}
                onChange={handleChange("last_name")}
                error={Boolean(fieldErrors.last_name)}
                helperText={fieldErrors.last_name}
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
                  color: profile.last_name ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.last_name ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.last_name ? "normal" : "italic",
                }}
              >
                {profile.last_name || t("profile.notProvided")}
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.phone_number ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:phone" size={16} color="var(--accent-indigo)" />
            <Typography
              variant="caption"
              sx={{
                  color: "var(--font-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("profile.phoneNumber")}
            </Typography>
            </Box>
            {editing ? (
              <MuiTelInput
                value={formData.phone_number || ""}
                defaultCountry="IN"
                // MuiTelInput emits a spaced value ("+91 98765 43210"); the server wants E.164,
                // so the spaces come out here rather than at save time where they would be
                // easy to miss.
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, phone_number: (v || "").replace(/\s+/g, "") }))
                }
                fullWidth
                size="small"
                required
                error={Boolean(fieldErrors.phone_number)}
                helperText={fieldErrors.phone_number || "Include your country code."}
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
                  color: profile.phone_number ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.phone_number ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.phone_number ? "normal" : "italic",
                }}
              >
                {profile.phone_number || t("profile.notProvided")}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.date_of_birth ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:calendar" size={16} color="var(--accent-indigo)" />
            <Typography
              variant="caption"
              sx={{
                  color: "var(--font-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("profile.dateOfBirth")}
            </Typography>
            </Box>
            {editing ? (
              <TextField
                value={formData.date_of_birth}
                onChange={handleChange("date_of_birth")}
                required
                error={Boolean(fieldErrors.date_of_birth)}
                helperText={fieldErrors.date_of_birth}
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
                  color: profile.date_of_birth ? "var(--font-primary)" : "var(--font-tertiary)",
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
                  : t("profile.notProvided")}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 3: Gender & Country */}
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.gender ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:gender-male-female" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.gender")}
              </Typography>
            </Box>
            {editing ? (
              <FormControl fullWidth size="small">
                <Select
                  value={formData.gender}
                  onChange={handleSelectChange("gender")}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    fontSize: "0.9375rem",
                  }}
                >
                  <MenuItem value="">{t("profile.genderNotSpecified")}</MenuItem>
                  <MenuItem value="male">{t("profile.genderMale")}</MenuItem>
                  <MenuItem value="female">{t("profile.genderFemale")}</MenuItem>
                  <MenuItem value="non_binary">{t("profile.genderNonBinary")}</MenuItem>
                  <MenuItem value="prefer_not_to_say">{t("profile.genderPreferNotToSay")}</MenuItem>
                  <MenuItem value="other">{t("profile.genderOther")}</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.gender ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.gender ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.gender ? "normal" : "italic",
                }}
              >
                {profile.gender
                  ? GENDER_LABEL_KEYS[profile.gender]
                    ? t(GENDER_LABEL_KEYS[profile.gender])
                    : profile.gender
                  : t("profile.notProvided")}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.country ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:earth" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.country")}
              </Typography>
            </Box>
            {editing ? (
              <CountrySelect
                value={formData.country || ""}
                onChange={(name) => setFormData((prev) => ({ ...prev, country: name }))}
                label=""
                required
                error={Boolean(fieldErrors.country)}
                helperText={fieldErrors.country}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.country ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.country ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.country ? "normal" : "italic",
                }}
              >
                {profile.country || t("profile.notProvided")}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 4: GitHub & LinkedIn */}
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.social_links?.github ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:github" size={16} color="var(--accent-indigo)" />
            <Typography
              variant="caption"
              sx={{
                  color: "var(--font-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("profile.githubProfile")}
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
                        color: "var(--font-tertiary)",
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
                  color: profile.social_links?.github ? "var(--accent-indigo)" : "var(--font-tertiary)",
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
                      color: "var(--accent-indigo)",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "var(--accent-indigo-dark)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box component="span" sx={{ color: "var(--font-tertiary)" }}>
                      github.com/
                    </Box>
                    {profile.social_links.github}
                  </Box>
                ) : (
                  t("profile.notProvided")
                )}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.social_links?.linkedin ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:linkedin" size={16} color="var(--accent-indigo)" />
            <Typography
              variant="caption"
              sx={{
                  color: "var(--font-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {t("profile.linkedinProfile")}
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
                        color: "var(--font-tertiary)",
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
                  color: profile.social_links?.linkedin ? "var(--accent-indigo)" : "var(--font-tertiary)",
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
                      color: "var(--accent-indigo)",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "var(--accent-indigo-dark)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box component="span" sx={{ color: "var(--font-tertiary)" }}>
                      linkedin.com/in/
                    </Box>
                    {profile.social_links.linkedin}
                  </Box>
                ) : (
                  t("profile.notProvided")
                )}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 5: College Name & Degree Type */}
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.college_name ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:school" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.collegeName")}
              </Typography>
            </Box>
            {editing ? (
              <CollegeAutocomplete
                value={formData.college_name || ""}
                onChange={(name) => setFormData({ ...formData, college_name: name })}
                placeholder="Search or type your college/university"
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: profile.college_name ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.college_name ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.college_name ? "normal" : "italic",
                }}
              >
                {profile.college_name || t("profile.notProvided")}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.degree_type ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:certificate" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.degreeType")}
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
                  color: profile.degree_type ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.degree_type ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.degree_type ? "normal" : "italic",
                }}
              >
                {profile.degree_type || t("profile.notProvided")}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 6: Branch & Graduation Year */}
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.branch ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:book-open-page-variant" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.branch")}
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
                  color: profile.branch ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.branch ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.branch ? "normal" : "italic",
                }}
              >
                {profile.branch || t("profile.notProvided")}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.graduation_year ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:calendar-check" size={16} color="var(--accent-indigo)" />
          <Typography
            variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.graduationYear")}
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
                  color: profile.graduation_year ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.graduation_year ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.graduation_year ? "normal" : "italic",
                }}
              >
                {profile.graduation_year || t("profile.notProvided")}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row 7: City & State */}
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
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.city ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:map-marker" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
                }}
              >
                {t("profile.city")}
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
                  color: profile.city ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.city ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.city ? "normal" : "italic",
                }}
              >
                {profile.city || t("profile.notProvided")}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
              backgroundColor: profile.state ? "var(--background)" : "var(--surface)",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, mb: { xs: 0.75, sm: 1 } }}>
              <IconWrapper icon="mdi:map-marker-outline" size={16} color="var(--accent-indigo)" />
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("profile.state")}
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
                  color: profile.state ? "var(--font-primary)" : "var(--font-tertiary)",
                  fontWeight: profile.state ? 500 : 400,
                  fontSize: "0.9375rem",
                  fontStyle: profile.state ? "normal" : "italic",
                }}
              >
                {profile.state || t("profile.notProvided")}
            </Typography>
          )}
          </Box>
        </Box>

      </Box>
    </Paper>
  );
}
