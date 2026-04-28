"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeData } from "../types";

interface MinimalTemplateProps {
  data: ResumeData;
}

export function MinimalTemplate({ data }: MinimalTemplateProps) {
  const formatDate = (startDate: string, endDate: string, current?: boolean) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      return `${month}/${year}`;
    };

    const start = formatMonth(startDate);
    const end = current ? "Now" : formatMonth(endDate);
    return `${start} - ${end}`;
  };

  return (
    <Box 
      sx={{ 
        p: 3,
        height: "297mm",
        minHeight: "297mm",
        overflow: "hidden",
        backgroundColor: "var(--background)",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 300,
            color: "var(--font-primary)",
            mb: 0.3,
            letterSpacing: "-0.02em",
          }}
        >
          {data.basicInfo.firstName} {data.basicInfo.lastName}
        </Typography>

        {data.basicInfo.professionalTitle && (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "var(--font-primary)",
              mb: 1,
              fontWeight: 500,
            }}
          >
            {data.basicInfo.professionalTitle}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            color: "var(--font-secondary)",
          }}
        >
          {[
            { val: data.basicInfo.email, icon: "mdi:email-outline", label: data.basicInfo.email, href: `mailto:${data.basicInfo.email}` },
            { val: data.basicInfo.phone, icon: "mdi:phone-outline", label: data.basicInfo.phone, href: `tel:${data.basicInfo.phone}` },
            { val: data.basicInfo.location, icon: "mdi:map-marker-outline", label: data.basicInfo.location },
            { val: data.basicInfo.github, icon: "mdi:github", label: "GitHub", href: (data.basicInfo.github ?? "").startsWith("http") ? data.basicInfo.github! : `https://github.com/${data.basicInfo.github}` },
            { val: data.basicInfo.linkedin, icon: "mdi:linkedin", label: "LinkedIn", href: (data.basicInfo.linkedin ?? "").startsWith("http") ? data.basicInfo.linkedin! : `https://linkedin.com/in/${data.basicInfo.linkedin}` },
            { val: data.basicInfo.portfolio, icon: "mdi:web", label: "Portfolio", href: (data.basicInfo.portfolio ?? "").startsWith("http") ? data.basicInfo.portfolio! : `https://${data.basicInfo.portfolio}` },
            { val: data.basicInfo.leetcode, icon: "simple-icons:leetcode", label: "LeetCode", href: (data.basicInfo.leetcode ?? "").startsWith("http") ? data.basicInfo.leetcode! : `https://leetcode.com/u/${data.basicInfo.leetcode}` },
            { val: data.basicInfo.kaggle, icon: "simple-icons:kaggle", label: "Kaggle", href: (data.basicInfo.kaggle ?? "").startsWith("http") ? data.basicInfo.kaggle! : `https://kaggle.com/${data.basicInfo.kaggle}` },
            { val: data.basicInfo.hackerrank, icon: "simple-icons:hackerrank", label: "HackerRank", href: (data.basicInfo.hackerrank ?? "").startsWith("http") ? data.basicInfo.hackerrank! : `https://hackerrank.com/${data.basicInfo.hackerrank}` },
            { val: data.basicInfo.medium, icon: "simple-icons:medium", label: "Medium", href: (data.basicInfo.medium ?? "").startsWith("http") ? data.basicInfo.medium! : `https://medium.com/@${data.basicInfo.medium}` },
          ]
            .filter((item) => item.val)
            .map((item, idx) => (
              <Box
                key={idx}
                {...(item.href ? { component: "a", href: item.href, target: item.href.startsWith("mailto:") || item.href.startsWith("tel:") ? undefined : "_blank", rel: "noopener noreferrer" } : {})}
                sx={{ display: "flex", alignItems: "center", gap: 0.5, textDecoration: "none", color: "inherit" }}
              >
                <Box sx={{ flexShrink: 0, display: "flex" }}>
                  <IconWrapper icon={item.icon} size={11} color="var(--font-secondary)" />
                </Box>
                <Typography
                  data-resume-contact-item
                  sx={{
                    fontSize: "0.625rem",
                    fontWeight: 400,
                    ...(item.icon === "mdi:email-outline"
                      ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                      : { whiteSpace: "nowrap" }),
                    ...(["mdi:github", "mdi:linkedin", "mdi:web"].includes(item.icon)
                      ? { overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }
                      : {}),
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
        </Box>
      </Box>

      {/* Summary */}
      {data.basicInfo.summary && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.625rem",
              color: "var(--font-primary)",
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            {data.basicInfo.summary}
          </Typography>
        </Box>
      )}

      {/* Work Experience */}
      {data.workExperience.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Work Experience
          </Typography>

          {data.workExperience.map((exp, index) => (
            <Box key={exp.id} sx={{ mb: index < data.workExperience.length - 1 ? 2 : 0 }}>
              <Box sx={{ mb: 0.3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <Typography
                    data-resume-nowrap
                    sx={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--font-primary)" }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      color: "var(--font-secondary)",
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      ml: 2,
                    }}
                  >
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>
                <Typography
                  sx={{ fontSize: "0.625rem", color: "var(--font-secondary)", fontWeight: 400 }}
                >
                  {exp.company}
                  {exp.location && ` / ${exp.location}`}
                </Typography>
              </Box>

              {exp.description.length > 0 && (
                <Box sx={{ mt: 0.3 }}>
                  {exp.description
                    .filter((desc) => desc.trim())
                    .slice(0, 3)
                    .map((desc, descIndex) => (
                      <Typography
                        key={descIndex}
                        sx={{
                          fontSize: "0.625rem",
                          color: "var(--font-primary)",
                          lineHeight: 1.6,
                          mb: 0.5,
                          fontWeight: 300,
                          "&:before": {
                            content: '"— "',
                            color: "var(--font-tertiary)",
                          },
                        }}
                      >
                        {desc}
                      </Typography>
                    ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Education
          </Typography>

          {data.education.map((edu, index) => (
            <Box key={edu.id} sx={{ mb: index < data.education.length - 1 ? 1.5 : 0 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Typography
                  data-resume-nowrap
                  sx={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--font-primary)" }}
                >
                  {edu.degree}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "var(--font-secondary)",
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                    ml: 2,
                  }}
                >
                  {formatDate(edu.startDate, edu.endDate)}
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: "0.625rem", color: "var(--font-secondary)", fontWeight: 400 }}
              >
                {edu.institution}
                {edu.location && ` / ${edu.location}`}
              </Typography>
              {edu.gpa && (
                <Typography sx={{ fontSize: "0.625rem", color: "var(--font-secondary)", mt: 0.2, whiteSpace: "nowrap" }}>
                  {edu.gpa}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Skills
          </Typography>

          <Typography
            sx={{
              fontSize: "0.625rem",
              color: "var(--font-primary)",
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            {data.skills.map((skill) => skill.name).join(" • ")}
          </Typography>
        </Box>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Projects
          </Typography>

          {data.projects.slice(0, 2).map((project, index) => (
            <Box key={project.id} sx={{ mb: index < Math.min(data.projects.length, 2) - 1 ? 1.5 : 0 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.3,
                  gap: 1,
                }}
              >
                <Typography
                  data-resume-nowrap
                  sx={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--font-primary)" }}
                >
                  {project.name}
                </Typography>
                {project.link && (
                  <Typography
                    component="a"
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      fontSize: "0.625rem",
                      color: "var(--accent-indigo)",
                      fontWeight: 500,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                    }}
                  >
                    Link
                  </Typography>
                )}
              </Box>

              {project.description && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "var(--font-primary)",
                    lineHeight: 1.5,
                    mb: 0.3,
                    fontWeight: 300,
                  }}
                >
                  {project.description}
                </Typography>
              )}

              {project.technologies.length > 0 && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "var(--font-secondary)",
                    fontWeight: 300,
                  }}
                >
                  {project.technologies.filter((t) => t.trim()).slice(0, 5).join(" • ")}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <Box>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Certifications
          </Typography>

          {data.certifications.map((cert, index) => (
            <Box
              key={cert.id}
              sx={{
                mb: index < data.certifications.length - 1 ? 1 : 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    sx={{ fontSize: "0.625rem", fontWeight: 500, color: "var(--font-primary)", flex: 1, minWidth: 0 }}
                  >
                    {cert.name}
                  </Typography>
                  {cert.link && (
                    <Typography
                      component="a"
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: "0.55rem",
                        color: "var(--accent-indigo)",
                        fontWeight: 600,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.625rem", color: "var(--font-secondary)" }}>
                  {cert.issuer}
                </Typography>
              </Box>
              {cert.date && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "var(--font-secondary)",
                  }}
                >
                  {formatDate(cert.date, "", false)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

