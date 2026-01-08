"use client";

import { Box, Typography } from "@mui/material";
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
        backgroundColor: "#ffffff",
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
            color: "#000000",
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
              color: "#000000",
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
            fontSize: "0.625rem",
            color: "#666666",
            fontWeight: 400,
          }}
        >
          {data.basicInfo.email && <Typography sx={{ fontSize: "0.625rem" }}>{data.basicInfo.email}</Typography>}
          {data.basicInfo.phone && <Typography sx={{ fontSize: "0.625rem" }}>{data.basicInfo.phone}</Typography>}
          {data.basicInfo.location && (
            <Typography sx={{ fontSize: "0.625rem" }}>{data.basicInfo.location}</Typography>
          )}
          {data.basicInfo.github && (
            <Typography sx={{ fontSize: "0.625rem" }}>github.com/{data.basicInfo.github}</Typography>
          )}
          {data.basicInfo.linkedin && (
            <Typography sx={{ fontSize: "0.625rem" }}>linkedin.com/in/{data.basicInfo.linkedin}</Typography>
          )}
        </Box>
      </Box>

      {/* Summary */}
      {data.basicInfo.summary && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.625rem",
              color: "#333333",
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
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#000000",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Experience
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
                    sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#000000" }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      color: "#666666",
                      fontWeight: 400,
                    }}
                  >
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>
                <Typography
                  sx={{ fontSize: "0.625rem", color: "#666666", fontWeight: 400 }}
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
                          color: "#333333",
                          lineHeight: 1.5,
                          mb: 0.3,
                          fontWeight: 300,
                          "&:before": {
                            content: '"— "',
                            color: "#999999",
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
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#000000",
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
                  sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#000000" }}
                >
                  {edu.degree}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#666666",
                    fontWeight: 400,
                  }}
                >
                  {formatDate(edu.startDate, edu.endDate)}
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: "0.625rem", color: "#666666", fontWeight: 400 }}
              >
                {edu.institution}
                {edu.location && ` / ${edu.location}`}
              </Typography>
              {edu.gpa && (
                <Typography sx={{ fontSize: "0.625rem", color: "#666666", mt: 0.2 }}>
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
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#000000",
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
              color: "#333333",
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
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#000000",
              mb: 1,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Projects
          </Typography>

          {data.projects.slice(0, 2).map((project, index) => (
            <Box key={project.id} sx={{ mb: index < Math.min(data.projects.length, 2) - 1 ? 1.5 : 0 }}>
              <Typography
                sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#000000", mb: 0.3 }}
              >
                {project.name}
              </Typography>

              {project.description && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#333333",
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
                    color: "#666666",
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
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#000000",
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
                <Typography
                  sx={{ fontSize: "0.625rem", fontWeight: 500, color: "#000000" }}
                >
                  {cert.name}
                </Typography>
                <Typography sx={{ fontSize: "0.625rem", color: "#666666" }}>
                  {cert.issuer}
                </Typography>
              </Box>
              {cert.date && (
                <Typography
                  sx={{
                    fontSize: "0.625rem",
                    color: "#666666",
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

