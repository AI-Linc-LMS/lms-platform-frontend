"use client";

import { Box, Typography, Divider } from "@mui/material";
import { ResumeData } from "../types";

interface ExecutiveTemplateProps {
  data: ResumeData;
}

export function ExecutiveTemplate({ data }: ExecutiveTemplateProps) {
  const formatDate = (
    startDate: string,
    endDate: string,
    current?: boolean
  ) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      return `${month}/${year}`;
    };

    const start = formatMonth(startDate);
    const end = current ? "Present" : formatMonth(endDate);
    return `${start} - ${end}`;
  };

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: "#ffffff",
        height: "297mm",
        minHeight: "297mm",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
      }}
    >
      {/* Header with dark background */}
      <Box
        sx={{
          backgroundColor: "#1a1a1a !important",
          color: "#ffffff",
          p: 2.5,
          mx: -3,
          mt: -3,
          mb: 2.5,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <Typography
          sx={{
            fontSize: "2rem",
            fontWeight: 700,
            mb: 0.5,
            letterSpacing: "-0.01em",
          }}
        >
          {data.basicInfo.firstName} {data.basicInfo.lastName}
        </Typography>

        {data.basicInfo.professionalTitle && (
          <Typography
            sx={{
              fontSize: "1rem",
              color: "#d4af37",
              fontWeight: 500,
              mb: 1.5,
            }}
          >
            {data.basicInfo.professionalTitle}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            fontSize: "0.85rem",
            color: "#cccccc",
          }}
        >
          {data.basicInfo.email && (
            <Typography sx={{ fontSize: "0.85rem" }}>
              {data.basicInfo.email}
            </Typography>
          )}
          {data.basicInfo.phone && (
            <Typography sx={{ fontSize: "0.85rem" }}>
              {data.basicInfo.phone}
            </Typography>
          )}
          {data.basicInfo.location && (
            <Typography sx={{ fontSize: "0.85rem" }}>
              {data.basicInfo.location}
            </Typography>
          )}
          {data.basicInfo.github && (
            <Typography sx={{ fontSize: "0.85rem" }}>
              github.com/{data.basicInfo.github}
            </Typography>
          )}
          {data.basicInfo.linkedin && (
            <Typography sx={{ fontSize: "0.85rem" }}>
              linkedin.com/in/{data.basicInfo.linkedin}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Executive Summary */}
      {data.basicInfo.summary && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#1a1a1a",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Executive Summary
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#4a4a4a",
              lineHeight: 1.6,
            }}
          >
            {data.basicInfo.summary}
          </Typography>
        </Box>
      )}

      {/* Professional Experience */}
      {data.workExperience.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#1a1a1a",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Professional Experience
          </Typography>

          {data.workExperience.map((exp, index) => (
            <Box
              key={exp.id}
              sx={{ mb: index < data.workExperience.length - 1 ? 2 : 0 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      color: "#d4af37",
                      fontWeight: 600,
                    }}
                  >
                    {exp.company}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    whiteSpace: "nowrap",
                    ml: 2,
                  }}
                >
                  {formatDate(exp.startDate, exp.endDate, exp.current)}
                </Typography>
              </Box>

              {exp.location && (
                <Typography
                  sx={{ fontSize: "0.75rem", color: "#6b7280", mb: 0.5 }}
                >
                  {exp.location}
                </Typography>
              )}

              {exp.description.length > 0 && (
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {exp.description
                    .filter((desc) => desc.trim())
                    .slice(0, 3)
                    .map((desc, descIndex) => (
                      <Typography
                        component="li"
                        key={descIndex}
                        sx={{
                          fontSize: "0.75rem",
                          color: "#4a4a4a",
                          lineHeight: 1.5,
                          mb: 0.3,
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
            sx={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#1a1a1a",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Education
          </Typography>

          {data.education.map((edu, index) => (
            <Box
              key={edu.id}
              sx={{ mb: index < data.education.length - 1 ? 1.5 : 0 }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#1a1a1a",
                    }}
                  >
                    {edu.degree}
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "#4a4a4a" }}>
                    {edu.institution}
                  </Typography>
                  {edu.gpa && (
                    <Typography
                      sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.3 }}
                    >
                      GPA: {edu.gpa}
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
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

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
        {/* Skills */}
        {data.skills.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#1a1a1a",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Core Competencies
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {data.skills.slice(0, 6).map((skill) => (
                <Box key={skill.id}>
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "#4a4a4a", mb: 0.3 }}
                  >
                    {skill.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {[...Array(5)].map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 24,
                          height: 3,
                          backgroundColor:
                            index < (skill.level || 3)
                              ? "#d4af37 !important"
                              : "#e5e7eb !important",
                          WebkitPrintColorAdjust: "exact !important",
                          printColorAdjust: "exact !important",
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#1a1a1a",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Certifications
            </Typography>

            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 1 }}>
                <Typography
                  sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#1a1a1a" }}
                >
                  {cert.name}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "#4a4a4a" }}>
                  {cert.issuer}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Projects */}
      {data.projects.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#1a1a1a",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Key Projects
          </Typography>

          {data.projects.slice(0, 2).map((project, index) => (
            <Box
              key={project.id}
              sx={{
                mb: index < Math.min(data.projects.length, 2) - 1 ? 1.5 : 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  mb: 0.3,
                }}
              >
                {project.name}
              </Typography>
              {project.description && (
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#4a4a4a",
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
                    fontSize: "0.7rem",
                    color: "#d4af37",
                    fontStyle: "italic",
                  }}
                >
                  {project.technologies
                    .filter((t) => t.trim())
                    .slice(0, 5)
                    .join(" • ")}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
