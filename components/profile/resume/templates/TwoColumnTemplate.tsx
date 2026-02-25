"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

const MAROON = "#6b1c1c";
const GOLD = "#c5a03f";
const BG = "#f0ebe4";

interface TwoColumnTemplateProps {
  data: ResumeData;
}

function SectionHead({ children }: { children: string }) {
  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Typography
        sx={{
          fontSize: "0.9rem",
          fontWeight: 400,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontVariant: "small-caps",
          letterSpacing: "0.06em",
          color: MAROON,
        }}
      >
        {children}
      </Typography>
      <Box
        sx={{
          mt: 0.25,
          height: "1.5px",
          backgroundColor: `${GOLD} !important`,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      />
    </Box>
  );
}

export function TwoColumnTemplate({ data }: TwoColumnTemplateProps) {
  const fmtDateRange = (start: string, end: string, current?: boolean) => {
    if (!start) return "";
    const fmt = (d: string) => {
      if (!d) return "";
      const [y, m] = d.split("-");
      if (!m) return y;
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      return `${months[parseInt(m, 10) - 1]} ${y}`;
    };
    const s = fmt(start);
    if (current) return `${s} \u2013 Present`;
    if (!end) return s;
    return `${s} \u2013 ${fmt(end)}`;
  };

  const fmtYearRange = (start: string, end: string) => {
    if (!start) return "";
    const sy = start.split("-")[0];
    if (!end) return sy;
    const ey = end.split("-")[0];
    if (sy === ey) return sy;
    return `${sy} \u2013 ${ey}`;
  };

  return (
    <Box
      sx={{
        minHeight: "297mm",
        height: "297mm",
        width: "100%",
        backgroundColor: `${BG} !important`,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: "center", pt: 2.5, pb: 0.5 }}>
        <Typography
          sx={{
            fontSize: "1.6rem",
            fontWeight: 400,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: "#1a1a1a",
            letterSpacing: "0.02em",
          }}
        >
          {data.basicInfo.firstName} {data.basicInfo.lastName}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontStyle: "italic",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: "#4a4a4a",
            mt: -0.25,
          }}
        >
          Curriculum Vitae
        </Typography>
      </Box>

      {/* Two columns */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          px: 2,
          pb: 2,
          gap: 2.5,
          overflow: "hidden",
        }}
      >
        {/* ===== LEFT COLUMN ===== */}
        <Box sx={{ width: "48%" }}>
          {/* Work Experience */}
          <SectionHead>Work Experience</SectionHead>
          {data.workExperience.map((exp) => (
            <Box key={exp.id} sx={{ mb: 1.5 }}>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontVariant: "small-caps",
                  letterSpacing: "0.04em",
                  color: "#4a4a4a",
                  textAlign: "right",
                  mb: 0.25,
                }}
              >
                {fmtDateRange(exp.startDate, exp.endDate, exp.current)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: "#1a1a1a",
                }}
              >
                {exp.company}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: "#1a1a1a",
                  mb: 0.3,
                }}
              >
                {exp.position}
              </Typography>
              {exp.description.filter((d) => d.trim()).length > 0 && (
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    color: "#3a3a3a",
                    lineHeight: 1.5,
                    textAlign: "justify",
                  }}
                >
                  {exp.description.filter((d) => d.trim()).join(". ")}
                  {exp.description.filter((d) => d.trim()).length > 0 && "."}
                </Typography>
              )}
            </Box>
          ))}

          {/* Education */}
          <SectionHead>Education</SectionHead>
          {data.education.map((edu) => (
            <Box key={edu.id} sx={{ mb: 1.25, display: "flex", gap: 1.5 }}>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: "#4a4a4a",
                  whiteSpace: "nowrap",
                  minWidth: 55,
                  flexShrink: 0,
                  pt: 0.2,
                }}
              >
                {fmtYearRange(edu.startDate, edu.endDate)}
              </Typography>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  {edu.degree}
                </Typography>
                {edu.gpa && (
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontVariant: "small-caps",
                      letterSpacing: "0.03em",
                      color: "#3a3a3a",
                    }}
                  >
                    {edu.gpa}
                  </Typography>
                )}
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontStyle: "italic",
                    color: "#4a4a4a",
                  }}
                >
                  {edu.institution}
                  {edu.location ? `, ${edu.location}` : ""}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* ===== RIGHT COLUMN ===== */}
        <Box sx={{ width: "52%" }}>
          {/* Contact info box */}
          <Box
            sx={{
              border: "1px solid #d0c8be",
              borderRadius: 0.5,
              p: 1.25,
              mb: 0.5,
              "& > div": {
                display: "flex",
                alignItems: "flex-start",
                gap: 0.75,
                mb: 0.4,
              },
            }}
          >
            {data.basicInfo.location && (
              <Box>
                <IconWrapper icon="mdi:map-marker" size={12} color={MAROON} />
                <Typography sx={{ fontSize: "0.58rem", color: "#1a1a1a", lineHeight: 1.4 }}>
                  {data.basicInfo.location}
                </Typography>
              </Box>
            )}
            {data.basicInfo.phone && (
              <Box>
                <IconWrapper icon="mdi:phone" size={12} color={MAROON} />
                <Typography component="a" href={`tel:${data.basicInfo.phone}`} sx={{ fontSize: "0.58rem", color: "#1a1a1a", lineHeight: 1.4, textDecoration: "none" }}>
                  {data.basicInfo.phone}
                </Typography>
              </Box>
            )}
            {data.basicInfo.email && (
              <Box>
                <IconWrapper icon="mdi:email" size={12} color={MAROON} />
                <Typography component="a" href={`mailto:${data.basicInfo.email}`} sx={{ fontSize: "0.58rem", color: "#1a1a1a", lineHeight: 1.4, textDecoration: "none" }}>
                  {data.basicInfo.email}
                </Typography>
              </Box>
            )}
            {data.basicInfo.github && (
              <Box>
                <IconWrapper icon="mdi:web" size={12} color={MAROON} />
                <Typography component="a" href={`https://github.com/${data.basicInfo.github}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.58rem", color: "#1a1a1a", lineHeight: 1.4, textDecoration: "none" }}>
                  github.com/{data.basicInfo.github}
                </Typography>
              </Box>
            )}
            {data.basicInfo.linkedin && (
              <Box>
                <IconWrapper icon="mdi:linkedin" size={12} color={MAROON} />
                <Typography component="a" href={`https://linkedin.com/in/${data.basicInfo.linkedin}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.58rem", color: "#1a1a1a", lineHeight: 1.4, textDecoration: "none" }}>
                  linkedin.com/in/{data.basicInfo.linkedin}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Projects → Extra Curricular Activities style */}
          {data.projects.length > 0 && (
            <>
              <SectionHead>Projects</SectionHead>
              {data.projects.map((proj) => (
                <Box key={proj.id} sx={{ mb: 0.75, display: "flex", gap: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      color: "#4a4a4a",
                      whiteSpace: "nowrap",
                      minWidth: 30,
                      flexShrink: 0,
                      pt: 0.15,
                    }}
                  >
                    {proj.technologies?.[0] || ""}
                  </Typography>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#1a1a1a",
                        }}
                      >
                        {proj.name}
                      </Typography>
                      {proj.link && (
                        <Typography
                          component="a"
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: "0.58rem",
                            color: MAROON,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          🔗Link
                        </Typography>
                      )}
                    </Box>
                    {proj.description && (
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontStyle: "italic",
                          color: "#4a4a4a",
                        }}
                      >
                        {proj.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* Skills */}
          <SectionHead>Skills</SectionHead>
          {data.skills.filter((s) => !s.level).length > 0 ? (
            <Box>
              {data.skills
                .filter((s) => !s.level)
                .map((skill) => (
                  <Box key={skill.id} sx={{ display: "flex", gap: 1.5, mb: 0.3 }}>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontVariant: "small-caps",
                        letterSpacing: "0.04em",
                        color: "#3a3a3a",
                        minWidth: 50,
                        flexShrink: 0,
                      }}
                    >
                      {skill.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        color: "#1a1a1a",
                      }}
                    >
                      {skill.category || ""}
                    </Typography>
                  </Box>
                ))}
            </Box>
          ) : (
            <Box>
              {data.skills.slice(0, 3).map((skill) => (
                <Box key={skill.id} sx={{ display: "flex", gap: 1.5, mb: 0.3 }}>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontVariant: "small-caps",
                      letterSpacing: "0.04em",
                      color: "#3a3a3a",
                      minWidth: 50,
                      flexShrink: 0,
                    }}
                  >
                    {skill.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      color: "#1a1a1a",
                    }}
                  >
                    {skill.category || ""}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Achievements (certifications) */}
          {data.certifications.length > 0 && (
            <>
              <SectionHead>Certifications</SectionHead>
              {data.certifications.map((cert) => (
                <Box key={cert.id} sx={{ mb: 0.6, display: "flex", gap: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      color: "#4a4a4a",
                      whiteSpace: "nowrap",
                      minWidth: 30,
                      flexShrink: 0,
                      pt: 0.15,
                    }}
                  >
                    {cert.date ? cert.date.split("-")[0] : ""}
                  </Typography>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#1a1a1a",
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
                            fontSize: "0.5rem",
                            color: MAROON,
                            fontWeight: 600,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          🔗Link
                        </Typography>
                      )}
                    </Box>
                    {cert.issuer && (
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontStyle: "italic",
                          color: "#4a4a4a",
                        }}
                      >
                        {cert.issuer}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* Skill Levels */}
          {data.skills.filter((s) => s.level).length > 0 && (
            <>
              <SectionHead>Skill Levels</SectionHead>
              {data.skills
                .filter((s) => s.level)
                .map((skill) => (
                  <Box key={skill.id} sx={{ display: "flex", gap: 1.5, mb: 0.3 }}>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontVariant: "small-caps",
                        letterSpacing: "0.04em",
                        color: "#3a3a3a",
                        minWidth: 55,
                        flexShrink: 0,
                      }}
                    >
                      {skill.level && skill.level >= 4
                        ? "Good level"
                        : skill.level && skill.level >= 2
                          ? "Basic level"
                          : "Beginner"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        color: "#1a1a1a",
                      }}
                    >
                      {skill.name}
                    </Typography>
                  </Box>
                ))}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
