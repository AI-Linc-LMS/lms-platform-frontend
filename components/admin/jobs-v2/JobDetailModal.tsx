"use client";

import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MapPin, Briefcase, Tag, Calendar, Clock, ExternalLink, GraduationCap } from "lucide-react";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobDetailIllustration } from "@/components/jobs-v2/illustrations";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { formatJobPassoutYear } from "@/lib/services/jobs-v2.service";

interface JobDetailModalProps {
  open: boolean;
  onClose: () => void;
  job: JobV2 | null;
  onEdit?: (job: JobV2) => void;
  onDelete?: (job: JobV2) => void;
}

const formatDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      backgroundColor: "var(--card-bg)",
      mb: 2,
      transition: "box-shadow 0.2s, border-color 0.2s",
      "&:hover": {
        borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
        boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      {icon && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={18} style={{ color: "var(--accent-indigo)" }} />
        </Box>
      )}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const InfoPill = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 1,
      borderRadius: 1.5,
      backgroundColor: "var(--card-bg)",
      border: "1px solid",
      borderColor: "divider",
      flex: "1 1 140px",
      minWidth: 0,
    }}
  >
    <Box sx={{ color: "var(--accent-indigo)", flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export function JobDetailModal({
  open,
  onClose,
  job,
  onEdit,
  onDelete,
}: JobDetailModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (!job) return null;

  const skills = [
    ...(job.mandatory_skills ?? []),
    ...(job.key_skills ?? []),
  ].filter(Boolean);
  const courses = job.courses ?? [];
  const collegeMappings = job.college_mappings ?? [];
  const passoutYearDisplay = formatJobPassoutYear(job.applicable_passout_year);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
          boxShadow: fullScreen ? "none" : "0 25px 50px -12px color-mix(in srgb, var(--font-primary) 30%, transparent)",
          maxHeight: fullScreen ? "100%" : "90vh",
        },
      }}
    >
      {/* Hero header with illustration */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: { xs: 2, md: 3 },
          p: 3,
          background:
            "linear-gradient(135deg, var(--background) 0%, var(--surface) 50%, var(--border-default) 100%)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: { xs: "100%", md: 200 },
            height: { xs: 140, md: 160 },
          }}
        >
          <JobDetailIllustration width={180} height={150} primaryColor="var(--accent-indigo)" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
            <Avatar
              src={job.company_logo}
              alt={job.company_name}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: "var(--accent-indigo)",
                border: "2px solid var(--font-light)",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                fontSize: "1.25rem",
              }}
            >
              {job.company_name?.[0]?.toUpperCase() || "C"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "var(--font-primary)" }}>
                {job.job_title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {job.company_name}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                <Chip
                  label={job.job_type ?? "Job"}
                  size="small"
                  sx={{
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                    color: "var(--accent-indigo)",
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={job.is_published ? "Published" : "Draft"}
                  size="small"
                  sx={{
                    backgroundColor: job.is_published ? "color-mix(in srgb, var(--success-500) 16%, transparent)" : "color-mix(in srgb, var(--font-secondary) 16%, transparent)",
                    color: job.is_published ? "var(--success-500)" : "var(--font-secondary)",
                    fontWeight: 500,
                  }}
                />
                {job.employment_type && (
                  <Chip
                    label={job.employment_type}
                    size="small"
                    sx={{
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                      color: "var(--accent-indigo)",
                      border: "1px solid color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                    }}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: 2,
          backgroundColor: "var(--background)",
          maxHeight: fullScreen ? "calc(100vh - 220px)" : "calc(90vh - 220px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Quick info pills */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          {job.location && (
            <InfoPill icon={<MapPin size={18} />} label="Location" value={job.location} />
          )}
          {job.years_of_experience && (
            <InfoPill icon={<Briefcase size={18} />} label="Experience" value={job.years_of_experience} />
          )}
          {job.salary && (
            <InfoPill icon={<Tag size={18} />} label="Salary" value={job.salary} />
          )}
          {passoutYearDisplay && (
            <InfoPill
              icon={<GraduationCap size={18} />}
              label="Passout year"
              value={passoutYearDisplay}
            />
          )}
          <InfoPill icon={<Calendar size={18} />} label="Created" value={formatDate(job.created_at)} />
          {job.application_deadline && (
            <InfoPill icon={<Clock size={18} />} label="Closing Date" value={formatDate(job.application_deadline)} />
          )}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          <Box>
            {job.job_description && (
              <SectionCard title="Job Description" icon="mdi:text-box-outline">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.secondary" }}>
                  {job.job_description}
                </Typography>
              </SectionCard>
            )}

            {job.role_process && (
              <SectionCard title="Role Process" icon="mdi:format-list-checks">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.secondary" }}>
                  {job.role_process}
                </Typography>
              </SectionCard>
            )}

            {job.company_info && (
              <SectionCard title="About Company" icon="mdi:information-outline">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.secondary" }}>
                  {job.company_info}
                </Typography>
              </SectionCard>
            )}
          </Box>

          <Box>
            {skills.length > 0 && (
              <SectionCard title="Key Skills" icon="mdi:tag-multiple-outline">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {skills.map((s, i) => (
                    <Chip
                      key={i}
                      label={s}
                      size="small"
                      sx={{
                        borderColor: "var(--accent-indigo)",
                        color: "var(--accent-indigo)",
                        fontWeight: 500,
                        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                      }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </SectionCard>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {job.industry_type && (
                <SectionCard title="Industry" icon="mdi:factory">
                  <Typography variant="body2" color="text.secondary">{job.industry_type}</Typography>
                </SectionCard>
              )}
              {job.department && (
                <SectionCard title="Department" icon="mdi:domain">
                  <Typography variant="body2" color="text.secondary">{job.department}</Typography>
                </SectionCard>
              )}
              {job.education && (
                <SectionCard title="Education" icon="mdi:school-outline">
                  <Typography variant="body2" color="text.secondary">{job.education}</Typography>
                </SectionCard>
              )}
              {job.role_category && (
                <SectionCard title="Role Category" icon="mdi:briefcase-outline">
                  <Typography variant="body2" color="text.secondary">{job.role_category}</Typography>
                </SectionCard>
              )}
            </Box>

            {(job.ug_requirements || job.pg_requirements) && (
              <SectionCard title="Requirements" icon="mdi:certificate-outline">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {job.ug_requirements && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>UG</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: "block" }}>{job.ug_requirements}</Typography>
                    </Box>
                  )}
                  {job.pg_requirements && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>PG</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: "block" }}>{job.pg_requirements}</Typography>
                    </Box>
                  )}
                </Box>
              </SectionCard>
            )}

            {courses.length > 0 && (
              <SectionCard title="Mapped Courses" icon="mdi:book-open-page-variant-outline">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {courses.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.title}
                      size="small"
                      sx={{ backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)", color: "var(--accent-indigo)", fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </SectionCard>
            )}

            {collegeMappings.length > 0 && (
              <SectionCard title="Targeted Colleges" icon="mdi:domain">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {collegeMappings.map((m, i) => (
                    <Chip key={i} label={m.college_name} size="small" variant="outlined" sx={{ borderColor: "divider" }} />
                  ))}
                </Box>
              </SectionCard>
            )}

            {job.apply_link && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "var(--card-bg)",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Apply Link</Typography>
                <Box
                  component="a"
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "var(--accent-indigo)",
                    fontWeight: 500,
                    textDecoration: "none",
                    wordBreak: "break-all",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  <ExternalLink size={16} />
                  {job.apply_link}
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          backgroundColor: "var(--card-bg)",
          borderTop: "1px solid",
          borderColor: "divider",
          gap: 1,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          {onDelete && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                onClose();
                onDelete(job);
              }}
              startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Delete
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 500 }}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="contained"
              onClick={() => {
                onClose();
                onEdit(job);
              }}
              startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Edit Job
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
