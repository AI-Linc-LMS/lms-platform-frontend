"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";

const ACCENT = "#0d9488";

interface AccentBarTemplateProps {
  data: ResumeData;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "#0f172a",
        textTransform: "uppercase",
        mb: 1.25,
        pb: 0.5,
        borderBottom: `2px solid ${ACCENT}`,
      }}
    >
      {children}
    </Typography>
  );
}

export function AccentBarTemplate({ data }: AccentBarTemplateProps) {
  const formatDate = (start: string, end: string, current?: boolean) => {
    if (!start) return "";
    const fmt = (d: string) => {
      if (!d) return "";
      const [y, m] = d.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
    };
    return current ? `${fmt(start)} - Present` : `${fmt(start)} - ${fmt(end)}`;
  };

  return (
    <Box
      sx={{
        minHeight: "297mm",
        width: "100%",
        backgroundColor: "#ffffff",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
      }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>
          {data.basicInfo.firstName} {data.basicInfo.lastName}
        </Typography>
        {data.basicInfo.professionalTitle && (
          <Typography sx={{ fontSize: "0.85rem", color: "#475569", mt: 0.25 }}>
            {data.basicInfo.professionalTitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          height: 6,
          backgroundColor: `${ACCENT} !important`,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
          colorAdjust: "exact !important",
        }}
      />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 1.5,
            fontSize: "0.65rem",
            color: "#64748b",
          }}
        >
          {data.basicInfo.email && <a href={`mailto:${data.basicInfo.email}`} style={{ textDecoration: "none", color: "inherit" }}>{data.basicInfo.email}</a>}
          {data.basicInfo.phone && <span>|</span>}
          {data.basicInfo.phone && <a href={`tel:${data.basicInfo.phone}`} style={{ textDecoration: "none", color: "inherit" }}>{data.basicInfo.phone}</a>}
          {data.basicInfo.location && <span>|</span>}
          {data.basicInfo.location && <span>{data.basicInfo.location}</span>}
          {data.basicInfo.linkedin && <span>|</span>}
          {data.basicInfo.linkedin && <a href={`https://linkedin.com/in/${data.basicInfo.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>linkedin.com/in/{data.basicInfo.linkedin}</a>}
          {data.basicInfo.github && <span>|</span>}
          {data.basicInfo.github && <a href={`https://github.com/${data.basicInfo.github}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>github.com/{data.basicInfo.github}</a>}
        </Box>

        {data.basicInfo.summary && (
          <Typography sx={{ fontSize: "0.65rem", color: "#475569", lineHeight: 1.5, mb: 2 }}>
            {data.basicInfo.summary}
          </Typography>
        )}

        {data.workExperience.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Work Experience</SectionTitle>
            {data.workExperience.map((exp) => (
              <Box key={exp.id} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#0f172a" }}>
                      {exp.position}
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: ACCENT }}>{exp.company}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.6rem", color: "#64748b" }}>
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>
                {exp.location && (
                  <Typography sx={{ fontSize: "0.6rem", color: "#64748b", mb: 0.5 }}>{exp.location}</Typography>
                )}
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {exp.description.filter((d) => d.trim()).map((d, i) => (
                      <Typography key={i} component="li" sx={{ fontSize: "0.6rem", color: "#475569", lineHeight: 1.45 }}>
                        {d}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.education.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Education</SectionTitle>
            {data.education.map((edu) => (
              <Box key={edu.id} sx={{ mb: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#0f172a" }}>{edu.degree}</Typography>
                  <Typography sx={{ fontSize: "0.6rem", color: "#64748b" }}>
                    {formatDate(edu.startDate, edu.endDate)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.65rem", color: ACCENT }}>{edu.institution}</Typography>
                {edu.gpa && (
                  <Typography sx={{ fontSize: "0.6rem", color: "#475569" }}>GPA: {edu.gpa}</Typography>
                )}
                {edu.description && (
                  <Typography sx={{ fontSize: "0.6rem", color: "#475569", lineHeight: 1.45 }}>{edu.description}</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.skills.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Skills</SectionTitle>
            <Typography sx={{ fontSize: "0.65rem", color: "#475569" }}>
              {data.skills.map((s) => s.name).join(" \u2022 ")}
            </Typography>
          </Box>
        )}

        {data.projects.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Projects</SectionTitle>
            {data.projects.map((proj) => (
              <Box key={proj.id} sx={{ mb: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#0f172a" }}>{proj.name}</Typography>
                  {proj.link && (
                    <Typography
                      component="a"
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.6rem", color: ACCENT, fontWeight: 600 }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                {proj.description && (
                  <Typography sx={{ fontSize: "0.6rem", color: "#475569", lineHeight: 1.45 }}>{proj.description}</Typography>
                )}
                {proj.technologies.filter((t) => t.trim()).length > 0 && (
                  <Typography sx={{ fontSize: "0.58rem", color: "#64748b", mt: 0.25 }}>
                    {proj.technologies.filter((t) => t.trim()).join(", ")}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.certifications.length > 0 && (
          <Box>
            <SectionTitle>Certifications</SectionTitle>
            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 0.75 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "#0f172a", flex: 1, minWidth: 0 }}>{cert.name}</Typography>
                  {cert.link && (
                    <Typography
                      component="a"
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.55rem", color: ACCENT, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748b" }}>
                  {cert.issuer}
                  {cert.date ? ` \u2022 ${cert.date.split("-")[0]}` : ""}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
