"use client";

import { Box, Typography } from "@mui/material";
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
        backgroundColor: "#fafafa",
        fontFamily: "'Roboto Mono', monospace",
        minHeight: "297mm",
        overflow: "visible",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
      }}
    >
      {/* Terminal-style Header */}
      <Box
        sx={{
          backgroundColor: "#282a36 !important",
          color: "#50fa7b",
          p: 2,
          borderRadius: 1,
          mb: 2.5,
          fontFamily: "'Courier New', monospace",
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <Typography sx={{ fontSize: "0.7rem", color: "#6272a4", mb: 0.5 }}>
          $ whoami
        </Typography>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#50fa7b",
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
              color: "#8be9fd",
              fontFamily: "'Courier New', monospace",
              mt: 0.3,
            }}
          >
            // {data.basicInfo.professionalTitle}
          </Typography>
        )}

        <Box sx={{ mt: 1.5, fontSize: "0.7rem", color: "#f8f8f2" }}>
          {data.basicInfo.email && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontFamily: "'Courier New', monospace",
              }}
            >
              email: {data.basicInfo.email}
            </Typography>
          )}
          {data.basicInfo.phone && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontFamily: "'Courier New', monospace",
              }}
            >
              phone: {data.basicInfo.phone}
            </Typography>
          )}
          {data.basicInfo.location && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontFamily: "'Courier New', monospace",
              }}
            >
              location: {data.basicInfo.location}
            </Typography>
          )}
          {data.basicInfo.github && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontFamily: "'Courier New', monospace",
              }}
            >
              github: {data.basicInfo.github}
            </Typography>
          )}
          {data.basicInfo.linkedin && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontFamily: "'Courier New', monospace",
              }}
            >
              linkedin: {data.basicInfo.linkedin}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Summary */}
      {data.basicInfo.summary && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#282a36",
              mb: 0.8,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} profile.summary()
          </Typography>
          <Box
            sx={{
              pl: 2,
              borderLeft: "3px solid #50fa7b",
              backgroundColor: "#ffffff !important",
              p: 1.5,
              WebkitPrintColorAdjust: "exact !important",
              printColorAdjust: "exact !important",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "#44475a",
                lineHeight: 1.5,
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
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#282a36",
              mb: 0.8,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} skills.list()
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
                    color: "#282a36",
                  }}
                >
                  {skill.name}:
                </Typography>
                <Box sx={{ display: "flex", gap: 0.4 }}>
                  {[...Array(5)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 7,
                        height: 7,
                        backgroundColor:
                          index < (skill.level || 3)
                            ? "#50fa7b !important"
                            : "#e5e7eb !important",
                        transform: "rotate(45deg)",
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

      {/* Experience */}
      {data.workExperience.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#282a36",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} experience.query()
          </Typography>

          {data.workExperience.map((exp, index) => (
            <Box
              key={exp.id}
              sx={{
                mb: index < data.workExperience.length - 1 ? 2 : 0,
                pl: 2,
                borderLeft: "3px solid #8be9fd",
                backgroundColor: "#ffffff !important",
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
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#282a36",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: "#8be9fd",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    @ {exp.company}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "#6272a4",
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
                          color: "#44475a",
                          lineHeight: 1.5,
                          mb: 0.3,
                          fontFamily: "'Roboto', sans-serif",
                          "&:before": {
                            content: '"• "',
                            color: "#50fa7b",
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
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#282a36",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} projects.showcase()
          </Typography>

          {data.projects.slice(0, 2).map((project, index) => (
            <Box
              key={project.id}
              sx={{
                mb: index < Math.min(data.projects.length, 2) - 1 ? 1.5 : 0,
                pl: 2,
                borderLeft: "3px solid #ff79c6",
                backgroundColor: "#ffffff !important",
                p: 1.5,
                WebkitPrintColorAdjust: "exact !important",
                printColorAdjust: "exact !important",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#282a36",
                  mb: 0.3,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {project.name}
              </Typography>

              {project.description && (
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "#44475a",
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
                          backgroundColor: "#282a36 !important",
                          color: "#50fa7b",
                          fontSize: "0.65rem",
                          fontFamily: "'Courier New', monospace",
                          border: "1px solid #50fa7b",
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
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#282a36",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} education.credentials()
          </Typography>

          {data.education.map((edu, index) => (
            <Box
              key={edu.id}
              sx={{
                mb: index < data.education.length - 1 ? 1.5 : 0,
                pl: 2,
                borderLeft: "3px solid #f1fa8c",
                backgroundColor: "#ffffff !important",
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
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#282a36",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {edu.degree}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: "#6272a4",
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    {edu.institution}
                  </Typography>
                  {edu.gpa && (
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: "#f1fa8c",
                        fontFamily: "'Courier New', monospace",
                        mt: 0.3,
                      }}
                    >
                      GPA: {edu.gpa}
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "#6272a4",
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
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#282a36",
              mb: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {">"} certifications.verify()
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
                  backgroundColor: "#ffffff !important",
                  p: 1,
                  borderLeft: "3px solid #bd93f9",
                  WebkitPrintColorAdjust: "exact !important",
                  printColorAdjust: "exact !important",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#282a36",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {cert.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "#6272a4",
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
