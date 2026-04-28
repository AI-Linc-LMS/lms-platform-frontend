"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeData } from "../types";

interface TechnicalTemplateProps {
  data: ResumeData;
}

export function TechnicalTemplate({ data }: TechnicalTemplateProps) {
  const formatDate = (
    startDate: string,
    endDate: string,
    current?: boolean
  ) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      return `${year}.${month}`;
    };

    const start = formatMonth(startDate);
    const end = current ? "current" : formatMonth(endDate);
    return `${start} → ${end}`;
  };

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: "var(--surface)",
        fontFamily: "'Roboto Mono', monospace",
        minHeight: "297mm",
        overflow: "visible",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
      }}
    >
      {/* Terminal-style Header */}
      <Box
        sx={{
          backgroundColor: "var(--surface) !important",
          color: "var(--success-500)",
          p: 2,
          borderRadius: 1,
          mb: 2.5,
          fontFamily: "'Courier New', monospace",
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <Typography sx={{ fontSize: "0.7rem", color: "var(--font-secondary)", mb: 0.5 }}>
          $ whoami
        </Typography>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--success-500)",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {data.basicInfo.firstName.toLowerCase()}.
          {data.basicInfo.lastName.toLowerCase()}
        </Typography>

        {data.basicInfo.professionalTitle && (
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "var(--accent-purple)",
              fontFamily: "'Courier New', monospace",
              mt: 0.3,
            }}
          >
            // {data.basicInfo.professionalTitle}
          </Typography>
        )}

        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.3 }}>
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
                sx={{ display: "flex", alignItems: "center", gap: 0.75, textDecoration: "none", color: "inherit" }}
              >
                <Box sx={{ flexShrink: 0, display: "flex" }}>
                  <IconWrapper icon={item.icon} size={12} color="var(--success-500)" />
                </Box>
                <Typography
                  data-resume-contact-item
                  sx={{
                    fontSize: "0.75rem",
                    fontFamily: "'Courier New', monospace",
                    color: "var(--font-primary)",
                    ...(item.icon === "mdi:email-outline"
                      ? { wordBreak: "break-all" }
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
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--surface)",
              mb: 0.8,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} profile.summary()
          </Typography>
          <Box
            sx={{
              pl: 2,
              borderLeft: "3px solid var(--success-500)",
              backgroundColor: "var(--background) !important",
              p: 1.5,
              WebkitPrintColorAdjust: "exact !important",
              printColorAdjust: "exact !important",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "var(--font-secondary)",
                lineHeight: 1.6,
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              {data.basicInfo.summary}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--surface)",
              mb: 0.8,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} Skills
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 0.8,
              pl: 2,
            }}
          >
            {data.skills.map((skill) => (
              <Box
                key={skill.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontFamily: "'Courier New', monospace",
                    color: "var(--surface)",
                  }}
                >
                  {skill.name}:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "3px", height: 10 }}>
                  {[...Array(5)].map((_, index) => (
                    <Box
                      key={index}
                      component="span"
                      sx={{
                        display: "block",
                        width: 8,
                        height: 8,
                        backgroundColor:
                          index < (skill.level || 3)
                            ? "var(--success-500) !important"
                            : "var(--border-default) !important",
                        transform: "rotate(45deg)",
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
        </Box>
      )}

      {/* Experience */}
      {data.workExperience.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--surface)",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} Work Experience
          </Typography>

          {data.workExperience.map((exp, index) => (
            <Box
              key={exp.id}
              sx={{
                mb: index < data.workExperience.length - 1 ? 2 : 0,
                pl: 2,
                borderLeft: "3px solid var(--accent-purple)",
                backgroundColor: "var(--background) !important",
                p: 1.5,
                WebkitPrintColorAdjust: "exact !important",
                printColorAdjust: "exact !important",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 0.5,
                }}
              >
                <Box>
                  <Typography
                    data-resume-nowrap
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--surface)",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: "var(--accent-purple)",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    @ {exp.company}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "var(--font-secondary)",
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: "nowrap",
                    ml: 2,
                  }}
                >
                  {formatDate(exp.startDate, exp.endDate, exp.current)}
                </Typography>
              </Box>

              {exp.description.length > 0 && (
                <Box>
                  {exp.description
                    .filter((desc) => desc.trim())
                    .slice(0, 3)
                    .map((desc, descIndex) => (
                      <Typography
                        key={descIndex}
                        sx={{
                          fontSize: "0.7rem",
                          color: "var(--font-secondary)",
                          lineHeight: 1.6,
                          mb: 0.5,
                          fontFamily: "'Roboto', sans-serif",
                          "&:before": {
                            content: '"• "',
                            color: "var(--success-500)",
                            fontWeight: 700,
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

      {/* Projects */}
      {data.projects.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            data-resume-section-title
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--surface)",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} Projects
          </Typography>

          {data.projects.slice(0, 2).map((project, index) => (
            <Box
              key={project.id}
              sx={{
                mb: index < Math.min(data.projects.length, 2) - 1 ? 1.5 : 0,
                pl: 2,
                borderLeft: "3px solid var(--accent-purple)",
                backgroundColor: "var(--background) !important",
                p: 1.5,
                WebkitPrintColorAdjust: "exact !important",
                printColorAdjust: "exact !important",
              }}
            >
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
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--surface)",
                    fontFamily: "'Courier New', monospace",
                  }}
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
                      fontSize: "0.65rem",
                      color: "var(--success-500)",
                      fontWeight: 600,
                      flexShrink: 0,
                      fontFamily: "'Courier New', monospace",
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
                    fontSize: "0.7rem",
                    color: "var(--font-secondary)",
                    lineHeight: 1.5,
                    mb: 0.5,
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {project.description}
                </Typography>
              )}

              {project.technologies.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4 }}>
                  {project.technologies
                    .filter((tech) => tech.trim())
                    .slice(0, 5)
                    .map((tech, techIndex) => (
                      <Typography
                        key={techIndex}
                        sx={{
                          px: 0.8,
                          py: 0.2,
                          backgroundColor: "var(--surface) !important",
                          color: "var(--success-500)",
                          fontSize: "0.65rem",
                          fontFamily: "'Courier New', monospace",
                          border: "1px solid var(--success-500)",
                          WebkitPrintColorAdjust: "exact !important",
                          printColorAdjust: "exact !important",
                        }}
                      >
                        {tech}
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
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--surface)",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} Education
          </Typography>

          {data.education.map((edu, index) => (
            <Box
              key={edu.id}
              sx={{
                mb: index < data.education.length - 1 ? 1.5 : 0,
                pl: 2,
                borderLeft: "3px solid var(--warning-500)",
                backgroundColor: "var(--background) !important",
                p: 1.5,
                WebkitPrintColorAdjust: "exact !important",
                printColorAdjust: "exact !important",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography
                    data-resume-nowrap
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--surface)",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {edu.degree}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: "var(--font-secondary)",
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    {edu.institution}
                  </Typography>
                  {edu.gpa && (
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: "var(--warning-500)",
                        fontFamily: "'Courier New', monospace",
                        mt: 0.3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      GPA: {edu.gpa}
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "var(--font-secondary)",
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: "nowrap",
                    ml: 2,
                  }}
                >
                  {formatDate(edu.startDate, edu.endDate)}
                </Typography>
              </Box>
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
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "var(--surface)",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} Certifications
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
              pl: 2,
            }}
          >
            {data.certifications.map((cert) => (
              <Box
                key={cert.id}
                sx={{
                  backgroundColor: "var(--background) !important",
                  p: 1,
                  borderLeft: "3px solid var(--accent-purple)",
                  WebkitPrintColorAdjust: "exact !important",
                  printColorAdjust: "exact !important",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--surface)",
                      fontFamily: "'Courier New', monospace",
                      flex: 1,
                      minWidth: 0,
                    }}
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
                        color: "var(--success-500)",
                        fontWeight: 600,
                        flexShrink: 0,
                        fontFamily: "'Courier New', monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "var(--font-secondary)",
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  {cert.issuer}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
