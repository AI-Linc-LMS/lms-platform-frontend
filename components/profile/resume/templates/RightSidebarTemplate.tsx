"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

interface RightSidebarTemplateProps {
  data: ResumeData;
}

export function RightSidebarTemplate({ data }: RightSidebarTemplateProps) {
  const formatDate = (startDate: string, endDate: string, current?: boolean) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    };
    const start = formatMonth(startDate);
    const end = current ? "Present" : formatMonth(endDate);
    return `${start} - ${end}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "297mm",
        height: "297mm",
        width: "100%",
        backgroundColor: "#ffffff",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
      }}
    >
      {/* Left: Main content */}
      <Box sx={{ width: "65%", p: 4, minWidth: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
            {data.basicInfo.firstName} {data.basicInfo.lastName}
          </Typography>
          {data.basicInfo.professionalTitle && (
            <Typography sx={{ fontSize: "0.875rem", color: "#6366f1", fontWeight: 600, mb: 2 }}>
              {data.basicInfo.professionalTitle}
            </Typography>
          )}
          {data.basicInfo.summary && (
            <Typography sx={{ fontSize: "0.625rem", color: "#475569", lineHeight: 1.6 }}>
              {data.basicInfo.summary}
            </Typography>
          )}
        </Box>

        {data.workExperience.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#1e293b",
                mb: 2,
                pb: 0.5,
                borderBottom: "2px solid #6366f1",
              }}
            >
              WORK EXPERIENCE
            </Typography>
            {data.workExperience.map((exp) => (
              <Box key={exp.id} sx={{ mb: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b" }}>
                      {exp.position}
                    </Typography>
                    <Typography sx={{ fontSize: "0.625rem", color: "#6366f1", fontWeight: 500 }}>
                      {exp.company}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.625rem", color: "#64748b" }}>
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>
                {exp.location && (
                  <Typography sx={{ fontSize: "0.625rem", color: "#64748b", mb: 1 }}>{exp.location}</Typography>
                )}
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {exp.description.filter((d) => d.trim()).map((d, i) => (
                      <Typography key={i} component="li" sx={{ fontSize: "0.625rem", color: "#475569", lineHeight: 1.5, mb: 0.5 }}>
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
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#1e293b",
                mb: 2,
                pb: 0.5,
                borderBottom: "2px solid #6366f1",
              }}
            >
              EDUCATION
            </Typography>
            {data.education.map((edu) => (
              <Box key={edu.id} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b" }}>{edu.degree}</Typography>
                    <Typography sx={{ fontSize: "0.625rem", color: "#6366f1" }}>{edu.institution}</Typography>
                    {edu.location && (
                      <Typography sx={{ fontSize: "0.625rem", color: "#64748b" }}>{edu.location}</Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: "0.625rem", color: "#64748b" }}>
                    {formatDate(edu.startDate, edu.endDate)}
                  </Typography>
                </Box>
                {edu.gpa && (
                  <Typography sx={{ fontSize: "0.625rem", color: "#475569", mt: 0.5 }}>GPA: {edu.gpa}</Typography>
                )}
                {edu.description && (
                  <Typography sx={{ fontSize: "0.625rem", color: "#475569", mt: 0.5, lineHeight: 1.5 }}>
                    {edu.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.projects.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#1e293b",
                mb: 2,
                pb: 0.5,
                borderBottom: "2px solid #6366f1",
              }}
            >
              PROJECTS
            </Typography>
            {data.projects.map((project) => (
              <Box key={project.id} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, gap: 1 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b" }}>
                    {project.name}
                  </Typography>
                  {project.link && (
                    <Typography
                      component="a"
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.625rem", color: "#6366f1", fontWeight: 600, flexShrink: 0 }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                {project.description && (
                  <Typography sx={{ fontSize: "0.625rem", color: "#475569", lineHeight: 1.5, mb: 0.5 }}>
                    {project.description}
                  </Typography>
                )}
                {project.technologies.filter((t) => t.trim()).length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {project.technologies.filter((t) => t.trim()).map((tech, i) => (
                      <Box
                        key={i}
                        sx={{
                          px: 1,
                          py: 0.25,
                          backgroundColor: "#f1f5f9 !important",
                          color: "#475569",
                          fontSize: "0.625rem",
                          borderRadius: 1,
                          fontWeight: 500,
                          WebkitPrintColorAdjust: "exact !important",
                          printColorAdjust: "exact !important",
                        }}
                      >
                        {tech}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Right: Sidebar */}
      <Box
        sx={{
          width: "35%",
          backgroundColor: "#1e293b !important",
          color: "#ffffff",
          p: 4,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
          colorAdjust: "exact !important",
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", mb: 2, color: "#94a3b8" }}>
            CONTACT
          </Typography>
          {data.basicInfo.email && (
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "flex-start" }}>
              <IconWrapper icon="mdi:email" size={16} color="#94a3b8" />
              <Typography component="a" href={`mailto:${data.basicInfo.email}`} sx={{ fontSize: "0.625rem", wordBreak: "break-word", textDecoration: "none", color: "inherit" }}>{data.basicInfo.email}</Typography>
            </Box>
          )}
          {data.basicInfo.phone && (
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
              <IconWrapper icon="mdi:phone" size={16} color="#94a3b8" />
              <Typography component="a" href={`tel:${data.basicInfo.phone}`} sx={{ fontSize: "0.625rem", textDecoration: "none", color: "inherit" }}>{data.basicInfo.phone}</Typography>
            </Box>
          )}
          {data.basicInfo.location && (
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "flex-start" }}>
              <IconWrapper icon="mdi:map-marker" size={16} color="#94a3b8" />
              <Typography sx={{ fontSize: "0.625rem" }}>{data.basicInfo.location}</Typography>
            </Box>
          )}
          {data.basicInfo.github && (
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
              <IconWrapper icon="mdi:github" size={16} color="#94a3b8" />
              <Typography component="a" href={`https://github.com/${data.basicInfo.github}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.625rem", textDecoration: "none", color: "inherit" }}>github.com/{data.basicInfo.github}</Typography>
            </Box>
          )}
          {data.basicInfo.linkedin && (
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
              <IconWrapper icon="mdi:linkedin" size={16} color="#94a3b8" />
              <Typography component="a" href={`https://linkedin.com/in/${data.basicInfo.linkedin}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.625rem", textDecoration: "none", color: "inherit" }}>linkedin.com/in/{data.basicInfo.linkedin}</Typography>
            </Box>
          )}
        </Box>

        {data.skills.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", mb: 2, color: "#94a3b8" }}>
              SKILLS
            </Typography>
            {data.skills.map((skill) => (
              <Box key={skill.id} sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: "0.625rem", mb: 0.5 }}>{skill.name}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "4px", height: 6 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Box
                      key={i}
                      component="span"
                      sx={{
                        display: "block",
                        width: 24,
                        height: 6,
                        borderRadius: 2,
                        backgroundColor: i <= (skill.level ?? 3) ? "#6366f1 !important" : "#334155 !important",
                        WebkitPrintColorAdjust: "exact !important",
                        printColorAdjust: "exact !important",
                        colorAdjust: "exact !important",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {data.certifications.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", mb: 2, color: "#94a3b8" }}>
              CERTIFICATIONS
            </Typography>
            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.625rem", fontWeight: 600, flex: 1, minWidth: 0 }}>{cert.name}</Typography>
                  {cert.link && (
                    <Typography
                      component="a"
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.55rem", color: "#6366f1", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.625rem", color: "#94a3b8" }}>{cert.issuer}</Typography>
                {cert.date && (
                  <Typography sx={{ fontSize: "0.625rem", color: "#94a3b8" }}>
                    {formatDate(cert.date, "", false)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
