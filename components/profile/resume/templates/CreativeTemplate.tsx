"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeData } from "../types";

interface CreativeTemplateProps {
  data: ResumeData;
}

export function CreativeTemplate({ data }: CreativeTemplateProps) {
  const formatDate = (startDate: string, endDate: string, current?: boolean) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(month) - 1]} ${year}`;
    };

    const start = formatMonth(startDate);
    const end = current ? "Now" : formatMonth(endDate);
    return `${start} - ${end}`;
  };

  return (
    <Box sx={{ display: "flex", minHeight: "297mm" }}>
      {/* Left Sidebar - Colorful */}
      <Box
        sx={{
          width: "30%",
          background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
          color: "#ffffff",
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
          colorAdjust: "exact !important",
        }}
      >
        {/* Profile Picture / Initials Fallback */}
        {data.basicInfo.photo ? (
          <Box
            component="img"
            src={data.basicInfo.photo}
            alt={`${data.basicInfo.firstName} ${data.basicInfo.lastName}`}
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              mx: "auto",
              border: "3px solid rgba(255, 255, 255, 0.3)",
            }}
          />
        ) : (
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              fontWeight: 700,
              mx: "auto",
              border: "3px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {data.basicInfo.firstName[0]}
            {data.basicInfo.lastName[0]}
          </Box>
        )}

        {/* Contact */}
        <Box>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              mb: 2,
              color: "rgba(255, 255, 255, 0.7)",
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
                sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25, textDecoration: "none", color: "inherit" }}
              >
                <Box sx={{ flexShrink: 0, display: "flex" }}>
                  <IconWrapper icon={item.icon} size={13} color="rgba(255,255,255,0.8)" />
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    lineHeight: 1.3,
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
          <Box>
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                mb: 2,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              SKILLS
            </Typography>

            {data.skills.map((skill) => (
              <Box key={skill.id} sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: "0.8rem", mb: 0.5 }}>
                  {skill.name}
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.2) !important",
                    borderRadius: 3,
                    overflow: "hidden",
                    WebkitPrintColorAdjust: "exact !important",
                    printColorAdjust: "exact !important",
                    colorAdjust: "exact !important",
                  }}
                >
                  <Box
                    sx={{
                      width: `${(skill.level || 3) * 20}%`,
                      height: "100%",
                      backgroundColor: "#fbbf24 !important",
                      borderRadius: 3,
                      WebkitPrintColorAdjust: "exact !important",
                      printColorAdjust: "exact !important",
                      colorAdjust: "exact !important",
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                mb: 2,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              EDUCATION
            </Typography>

            {data.education.map((edu) => (
              <Box key={edu.id} sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mb: 0.5 }}>
                  {edu.degree}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.8)" }}>
                  {edu.institution}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.6)", mt: 0.3, whiteSpace: "nowrap" }}>
                  {formatDate(edu.startDate, edu.endDate)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Right Content */}
      <Box sx={{ width: "70%", p: 4, backgroundColor: "#ffffff" }}>
        {/* Name and Title */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.5,
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {data.basicInfo.firstName} {data.basicInfo.lastName}
          </Typography>

          {data.basicInfo.professionalTitle && (
            <Typography
              sx={{
                fontSize: "1.2rem",
                color: "#6b7280",
                fontWeight: 500,
                mb: 2,
              }}
            >
              {data.basicInfo.professionalTitle}
            </Typography>
          )}

          {data.basicInfo.summary && (
            <Typography
              sx={{
                fontSize: "0.9rem",
                color: "#4b5563",
                lineHeight: 1.7,
              }}
            >
              {data.basicInfo.summary}
            </Typography>
          )}
        </Box>

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                }}
              />
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Work Experience
              </Typography>
            </Box>

            {data.workExperience.map((exp, index) => (
              <Box
                key={exp.id}
                sx={{
                  mb: index < data.workExperience.length - 1 ? 3 : 0,
                  pl: 2.5,
                  borderLeft: "2px solid #e5e7eb",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                  <Box>
                    <Typography
                      sx={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937" }}
                    >
                      {exp.position}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontWeight: 600,
                      }}
                    >
                      {exp.company}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap", ml: 2 }}
                  >
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>

                {exp.description.length > 0 && (
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                    {exp.description
                      .filter((desc) => desc.trim())
                      .map((desc, descIndex) => (
                        <Typography
                          component="li"
                          key={descIndex}
                          sx={{
                            fontSize: "0.85rem",
                            color: "#4b5563",
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

        {/* Projects */}
        {data.projects.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                }}
              />
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Projects
              </Typography>
            </Box>

            {data.projects.map((project, index) => (
              <Box
                key={project.id}
                sx={{
                  mb: index < data.projects.length - 1 ? 2.5 : 0,
                  pl: 2.5,
                  borderLeft: "2px solid #e5e7eb",
                }}
              >
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
                    sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#1f2937" }}
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
                        fontSize: "0.75rem",
                        color: "#667eea",
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
                    sx={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.6, mb: 0.5 }}
                  >
                    {project.description}
                  </Typography>
                )}

                {project.technologies.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {project.technologies
                      .filter((tech) => tech.trim())
                      .map((tech, techIndex) => (
                        <Box
                          key={techIndex}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                            color: "#ffffff",
                            fontSize: "0.7rem",
                            borderRadius: 2,
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

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                }}
              />
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Certifications
              </Typography>
            </Box>

            <Box sx={{ pl: 2.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {data.certifications.map((cert) => (
                <Box key={cert.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#1f2937", flex: 1, minWidth: 0 }}
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
                          fontSize: "0.65rem",
                          color: "#667eea",
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
                  <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {cert.issuer}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

