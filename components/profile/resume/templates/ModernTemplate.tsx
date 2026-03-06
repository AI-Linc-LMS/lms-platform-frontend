"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ModernTemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const formatDate = (
    startDate: string,
    endDate: string,
    current?: boolean
  ) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[parseInt(month) - 1]} ${year}`;
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
      {/* Left Sidebar */}
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
        {/* Contact Info */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              mb: 2,
              color: "#94a3b8",
              whiteSpace: "nowrap",
            }}
          >
            CONTACT
          </Typography>

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
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, textDecoration: "none", color: "inherit" }}
              >
                <Box sx={{ flexShrink: 0, display: "flex" }}>
                  <IconWrapper icon={item.icon} size={16} color="#94a3b8" />
                </Box>
                <Typography
                  data-resume-contact-item
                  sx={{
                    fontSize: "0.625rem",
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

        {/* Skills */}
        {data.skills.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              data-resume-section-title
              sx={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                mb: 2,
                color: "#94a3b8",
              }}
            >
              SKILLS
            </Typography>

            {data.skills.map((skill) => (
              <Box key={skill.id} sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: "0.625rem", mb: 0.5 }}>
                  {skill.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "4px", height: 6 }}>
                  {[...Array(5)].map((_, index) => (
                    <Box
                      key={index}
                      component="span"
                      sx={{
                        display: "block",
                        width: 24,
                        height: 6,
                        backgroundColor:
                          index < (skill.level || 3)
                            ? "#6366f1 !important"
                            : "#334155 !important",
                        borderRadius: 2,
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

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <Box>
            <Typography
              data-resume-section-title
              sx={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                mb: 2,
                color: "#94a3b8",
              }}
            >
              CERTIFICATIONS
            </Typography>

            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.625rem", fontWeight: 600, flex: 1, minWidth: 0 }}>
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
                        color: "#6366f1",
                        fontWeight: 600,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.625rem", color: "#94a3b8" }}>
                  {cert.issuer}
                </Typography>
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

      {/* Right Content */}
      <Box
        sx={{
          width: "65%",
          p: 4,
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1e293b",
              mb: 0.5,
            }}
          >
            {data.basicInfo.firstName} {data.basicInfo.lastName}
          </Typography>
          {data.basicInfo.professionalTitle && (
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: "#6366f1",
                fontWeight: 600,
                mb: 2,
              }}
            >
              {data.basicInfo.professionalTitle}
            </Typography>
          )}

          {data.basicInfo.summary && (
            <Typography
              sx={{
                fontSize: "0.625rem",
                color: "#475569",
                lineHeight: 1.6,
              }}
            >
              {data.basicInfo.summary}
            </Typography>
          )}
        </Box>

        {/* Work Experience */}
        {data.workExperience.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              data-resume-section-title
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
              <Box
                key={exp.id}
                sx={{ mb: 2.5, backgroundColor: "transparent" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 0.5,
                    backgroundColor: "transparent",
                  }}
                >
                  <Box sx={{ backgroundColor: "transparent" }}>
                    <Typography
                      data-resume-nowrap
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        backgroundColor: "transparent",
                      }}
                    >
                      {exp.position}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.625rem",
                        color: "#6366f1",
                        fontWeight: 500,
                        backgroundColor: "transparent",
                      }}
                    >
                      {exp.company}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.625rem", color: "#64748b", whiteSpace: "nowrap", ml: 2 }}>
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>

                {exp.location && (
                  <Typography
                    sx={{ fontSize: "0.625rem", color: "#64748b", mb: 1 }}
                  >
                    {exp.location}
                  </Typography>
                )}

                {exp.description.length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {exp.description
                      .filter((desc) => desc.trim())
                      .map((desc, index) => (
                        <Typography
                          component="li"
                          key={index}
                          sx={{
                            fontSize: "0.625rem",
                            color: "#475569",
                            lineHeight: 1.5,
                            mb: 0.5,
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
          <Box sx={{ mb: 3 }}>
            <Typography
              data-resume-section-title
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
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {edu.degree}
                    </Typography>
                    <Typography sx={{ fontSize: "0.625rem", color: "#6366f1" }}>
                      {edu.institution}
                    </Typography>
                    {edu.location && (
                      <Typography
                        sx={{ fontSize: "0.625rem", color: "#64748b" }}
                      >
                        {edu.location}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: "0.625rem", color: "#64748b", whiteSpace: "nowrap", ml: 2 }}>
                    {formatDate(edu.startDate, edu.endDate)}
                  </Typography>
                </Box>

                {edu.gpa && (
                  <Typography
                    sx={{ fontSize: "0.625rem", color: "#475569", mt: 0.5, whiteSpace: "nowrap" }}
                  >
                    GPA: {edu.gpa}
                  </Typography>
                )}

                {edu.description && (
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      color: "#475569",
                      mt: 0.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {edu.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <Box>
            <Typography
              data-resume-section-title
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                    gap: 1,
                  }}
                >
                  <Typography
                    data-resume-nowrap
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#1e293b",
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
                        fontSize: "0.625rem",
                        color: "#6366f1",
                        fontWeight: 600,
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
                      color: "#475569",
                      lineHeight: 1.5,
                      mb: 0.5,
                    }}
                  >
                    {project.description}
                  </Typography>
                )}

                {project.technologies.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {project.technologies
                      .filter((tech) => tech.trim())
                      .map((tech, index) => (
                        <Box
                          key={index}
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
    </Box>
  );
}
