"use client";

import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Chip } from "@mui/material";
import type {
  UserProfile,
  Skill,
  Experience,
  Education,
  Project,
  Certification,
  Achievement,
} from "@/lib/services/profile.service";

interface AdminProfileSectionsReadOnlyProps {
  profile: UserProfile;
}

function formatDate(val: string | undefined): string {
  if (!val) return "";
  if (/^\d{4}-\d{2}$/.test(val)) return val;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  } catch {
    return val;
  }
}

export function AdminProfileSectionsReadOnly({ profile }: AdminProfileSectionsReadOnlyProps) {
  const { t } = useTranslation("common");
  const skills = profile.skills ?? [];
  const experience = profile.experience ?? [];
  const education = profile.education ?? [];
  const projects = profile.projects ?? [];
  const certifications = profile.certifications ?? [];
  const achievements = profile.achievements ?? [];

  const hasAny =
    skills.length > 0 ||
    experience.length > 0 ||
    education.length > 0 ||
    projects.length > 0 ||
    certifications.length > 0 ||
    achievements.length > 0;

  if (!hasAny) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {skills.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("profile.skills")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {skills.map((s: Skill | string, i: number) => (
              <Chip
                key={i}
                label={typeof s === "string" ? s : s.name}
                size="small"
                sx={{
                  backgroundColor: "rgba(10, 102, 194, 0.08)",
                  color: "#0a66c2",
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {experience.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("profile.experience")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {experience.map((exp: Experience, i: number) => (
              <Box
                key={i}
                sx={{
                  py: 1.5,
                  borderBottom: i < experience.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {exp.position} at {exp.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(exp.start_date)} – {exp.current ? "Present" : formatDate(exp.end_date)}
                  {exp.location && ` • ${exp.location}`}
                </Typography>
                {exp.description && (
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {exp.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {education.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("profile.education")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {education.map((edu: Education, i: number) => (
              <Box
                key={i}
                sx={{
                  py: 1.5,
                  borderBottom: i < education.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {[edu.degree, edu.field_of_study].filter(Boolean).join(" in ") || edu.institution}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {edu.institution}
                  {(edu.start_date || edu.end_date) && ` • ${formatDate(edu.start_date)} – ${formatDate(edu.end_date)}`}
                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                </Typography>
                {edu.description && (
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {edu.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {projects.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("profile.projects")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {projects.map((proj: Project, i: number) => (
              <Box
                key={i}
                sx={{
                  py: 1.5,
                  borderBottom: i < projects.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {proj.name}
                </Typography>
                {(proj.start_date || proj.end_date) && (
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(proj.start_date)} – {proj.current ? "Present" : formatDate(proj.end_date)}
                  </Typography>
                )}
                {proj.description && (
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {proj.description}
                  </Typography>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                    {proj.technologies.map((tech, j) => (
                      <Chip key={j} label={tech} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
                {proj.url && (
                  <Typography
                    component="a"
                    href={proj.url.startsWith("http") ? proj.url : `https://${proj.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ color: "#0a66c2", mt: 0.5, display: "inline-block" }}
                  >
                    {proj.url}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {certifications.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("profile.certifications")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {certifications.map((cert: Certification, i: number) => (
              <Box
                key={i}
                sx={{
                  py: 1.5,
                  borderBottom: i < certifications.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {cert.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cert.issuing_organization}
                  {cert.issue_date && ` • ${formatDate(cert.issue_date)}`}
                  {cert.expiration_date && ` – ${formatDate(cert.expiration_date)}`}
                </Typography>
                {cert.credential_url && (
                  <Typography
                    component="a"
                    href={cert.credential_url.startsWith("http") ? cert.credential_url : `https://${cert.credential_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ color: "#0a66c2", mt: 0.5, display: "inline-block" }}
                  >
                    View credential
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {achievements.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t("profile.achievements")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {achievements.map((ach: Achievement, i: number) => (
              <Box
                key={i}
                sx={{
                  py: 1.5,
                  borderBottom: i < achievements.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {ach.title}
                </Typography>
                {(ach.organization || ach.date) && (
                  <Typography variant="body2" color="text.secondary">
                    {[ach.organization, ach.date].filter(Boolean).join(" • ")}
                  </Typography>
                )}
                {ach.description && (
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {ach.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
