"use client";

import { Box, Typography, Divider } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeData } from "../types";

interface ClassicTemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const formatDate = (
    startDate: string,
    endDate: string,
    current?: boolean
  ) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
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
        p: 3,
        height: "297mm",
        minHeight: "297mm",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#1f2937",
            mb: 0.3,
          }}
        >
          {data.basicInfo.firstName} {data.basicInfo.lastName}
        </Typography>

        {data.basicInfo.professionalTitle && (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "#6b7280",
              mb: 1,
              fontStyle: "italic",
            }}
          >
            {data.basicInfo.professionalTitle}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 1.5,
            flexWrap: "wrap",
            color: "#4b5563",
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
                  <IconWrapper icon={item.icon} size={11} color="#4b5563" />
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.625rem",
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

      <Divider sx={{ mb: 2, borderColor: "#1f2937", borderWidth: 1 }} />

      {/* Summary */}
      {data.basicInfo.summary && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.8,
              textTransform: "uppercase",
            }}
          >
            Professional Summary
          </Typography>
          <Typography
            sx={{
              fontSize: "0.625rem",
              color: "#374151",
              lineHeight: 1.6,
              textAlign: "justify",
            }}
          >
            {data.basicInfo.summary}
          </Typography>
        </Box>
      )}

      {/* Work Experience */}
      {data.workExperience.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 1,
              textTransform: "uppercase",
            }}
          >
            Work Experience
          </Typography>

          {data.workExperience.map((exp, index) => (
            <Box
              key={exp.id}
              sx={{ mb: index < data.workExperience.length - 1 ? 1.5 : 0 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 0.3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      color: "#4b5563",
                      fontStyle: "italic",
                    }}
                  >
                    {exp.company}
                    {exp.location && `, ${exp.location}`}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#6b7280",
                    fontStyle: "italic",
                    whiteSpace: "nowrap",
                    ml: 2,
                  }}
                >
                  {formatDate(exp.startDate, exp.endDate, exp.current)}
                </Typography>
              </Box>

              {exp.description.length > 0 && (
                <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
                  {exp.description
                    .filter((desc) => desc.trim())
                    .slice(0, 3)
                    .map((desc, descIndex) => (
                      <Typography
                        component="li"
                        key={descIndex}
                        sx={{
                          fontSize: "0.625rem",
                          color: "#374151",
                          lineHeight: 1.6,
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
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 1,
              textTransform: "uppercase",
            }}
          >
            Education
          </Typography>

          {data.education.map((edu, index) => (
            <Box
              key={edu.id}
              sx={{ mb: index < data.education.length - 1 ? 1.5 : 0 }}
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
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {edu.degree}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      color: "#4b5563",
                      fontStyle: "italic",
                    }}
                  >
                    {edu.institution}
                    {edu.location && `, ${edu.location}`}
                  </Typography>
                  {edu.gpa && (
                    <Typography
                      sx={{ fontSize: "0.625rem", color: "#6b7280", mt: 0.3, whiteSpace: "nowrap" }}
                    >
                      GPA: {edu.gpa}
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#6b7280",
                    fontStyle: "italic",
                    whiteSpace: "nowrap",
                    ml: 2,
                  }}
                >
                  {formatDate(edu.startDate, edu.endDate)}
                </Typography>
              </Box>

              {edu.description && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#374151",
                    mt: 0.3,
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

      {/* Skills */}
      {data.skills.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.8,
              textTransform: "uppercase",
            }}
          >
            Skills
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {data.skills.map((skill, index) => (
              <Typography
                key={skill.id}
                sx={{
                  fontSize: "0.625rem",
                  color: "#374151",
                }}
              >
                {skill.name}
                {index < data.skills.length - 1 && " •"}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.8,
              textTransform: "uppercase",
            }}
          >
            Projects
          </Typography>

          {data.projects.slice(0, 2).map((project, index) => (
            <Box
              key={project.id}
              sx={{
                mb: index < Math.min(data.projects.length, 2) - 1 ? 1.5 : 0,
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
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#1f2937",
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
                      color: "#1d4ed8",
                      fontWeight: 600,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                    }}
                  >
                    🔗Link
                  </Typography>
                )}
              </Box>

              {project.description && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#374151",
                    lineHeight: 1.5,
                    mb: 0.3,
                  }}
                >
                  {project.description}
                </Typography>
              )}

              {project.technologies.length > 0 && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  Technologies:{" "}
                  {project.technologies
                    .filter((t) => t.trim())
                    .slice(0, 5)
                    .join(", ")}
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
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.8,
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
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "#1f2937",
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
                        color: "#1d4ed8",
                        fontWeight: 600,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.625rem", color: "#4b5563" }}>
                  {cert.issuer}
                </Typography>
              </Box>
              {cert.date && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#6b7280",
                    fontStyle: "italic",
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
