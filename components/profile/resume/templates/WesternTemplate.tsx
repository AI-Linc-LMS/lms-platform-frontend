"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

// AltaCV-inspired "Western" style: two columns, serif/sans hierarchy, accent colors
const COLORS = {
  name: "#000000",
  tagline: "#8F0D0D",
  heading: "#450808",
  headingRule: "#E7D192",
  accent: "#8F0D0D",
  emphasis: "#2E2E2E",
  body: "#666666",
};

interface WesternTemplateProps {
  data: ResumeData;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontSize: "1.1rem",
        fontWeight: 700,
        fontFamily: "Georgia, serif",
        color: COLORS.heading,
        mb: 1,
        pb: 0.5,
        borderBottom: `2px solid ${COLORS.headingRule}`,
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
      }}
    >
      {children}
    </Typography>
  );
}

export function WesternTemplate({ data }: WesternTemplateProps) {
  const formatDate = (
    startDate: string,
    endDate: string,
    current?: boolean
  ) => {
    const formatMonth = (date: string) => {
      if (!date) return "";
      const [year, month] = date.split("-");
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    };
    const start = formatMonth(startDate);
    const end = current ? "Present" : formatMonth(endDate);
    return `${start} — ${end}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "297mm",
        height: "297mm",
        width: "100%",
        backgroundColor: "#ffffff",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
      }}
    >
      {/* Header: name, tagline, photo (right), personal info */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          px: 2.5,
          pt: 1.5,
          pb: 1,
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: "1.75rem",
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              color: COLORS.name,
              lineHeight: 1.2,
            }}
          >
            {data.basicInfo.firstName} {data.basicInfo.lastName}
          </Typography>
          {data.basicInfo.professionalTitle && (
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: COLORS.tagline,
                fontWeight: 600,
                mt: 0.25,
              }}
            >
              {data.basicInfo.professionalTitle}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.25,
              mt: 1,
              fontSize: "0.7rem",
              color: COLORS.body,
            }}
          >
            {data.basicInfo.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:email" size={14} color={COLORS.body} />
                <Typography component="a" href={`mailto:${data.basicInfo.email}`} sx={{ fontSize: "0.7rem", textDecoration: "none", color: "inherit" }}>
                  {data.basicInfo.email}
                </Typography>
              </Box>
            )}
            {data.basicInfo.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:phone" size={14} color={COLORS.body} />
                <Typography component="a" href={`tel:${data.basicInfo.phone}`} sx={{ fontSize: "0.7rem", textDecoration: "none", color: "inherit" }}>
                  {data.basicInfo.phone}
                </Typography>
              </Box>
            )}
            {data.basicInfo.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:map-marker" size={14} color={COLORS.body} />
                <Typography component="span" sx={{ fontSize: "0.7rem" }}>
                  {data.basicInfo.location}
                </Typography>
              </Box>
            )}
            {data.basicInfo.linkedin && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:linkedin" size={14} color={COLORS.body} />
                <Typography component="a" href={`https://linkedin.com/in/${data.basicInfo.linkedin}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.7rem", textDecoration: "none", color: "inherit" }}>
                  linkedin.com/in/{data.basicInfo.linkedin}
                </Typography>
              </Box>
            )}
            {data.basicInfo.github && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:github" size={14} color={COLORS.body} />
                <Typography component="a" href={`https://github.com/${data.basicInfo.github}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.7rem", textDecoration: "none", color: "inherit" }}>
                  github.com/{data.basicInfo.github}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        {data.basicInfo.photo && (
          <Box
            component="img"
            src={data.basicInfo.photo}
            alt=""
            crossOrigin="anonymous"
            sx={{
              width: "2.8cm",
              height: "2.8cm",
              objectFit: "cover",
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {/* Two columns: 60% left, 40% right */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          px: 2.5,
          pb: 2,
        }}
      >
        {/* Left column — Experience, Projects */}
        <Box sx={{ width: "60%", pr: 1.5 }}>
          {data.workExperience.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <SectionTitle>Work Experience</SectionTitle>
              {data.workExperience.map((exp) => (
                <Box key={exp.id} sx={{ mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: COLORS.emphasis,
                    }}
                  >
                    {exp.position}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: COLORS.accent,
                      fontWeight: 600,
                    }}
                  >
                    {exp.company}
                  </Typography>
                  <Typography sx={{ fontSize: "0.65rem", color: COLORS.body }}>
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                    {exp.location ? ` • ${exp.location}` : ""}
                  </Typography>
                  {exp.description.length > 0 && (
                    <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                      {exp.description
                        .filter((d) => d.trim())
                        .map((d, i) => (
                          <Typography
                            key={i}
                            component="li"
                            sx={{
                              fontSize: "0.65rem",
                              color: COLORS.body,
                              lineHeight: 1.4,
                              mb: 0.25,
                            }}
                          >
                            {d}
                          </Typography>
                        ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {data.projects.length > 0 && (
            <Box>
              <SectionTitle>Projects</SectionTitle>
              {data.projects.map((proj) => (
                <Box key={proj.id} sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: COLORS.emphasis,
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
                          fontSize: "0.65rem",
                          color: COLORS.accent,
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
                        fontSize: "0.65rem",
                        color: COLORS.body,
                        lineHeight: 1.4,
                        mt: 0.25,
                      }}
                    >
                      {proj.description}
                    </Typography>
                  )}
                  {proj.technologies.filter((t) => t.trim()).length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                      {proj.technologies
                        .filter((t) => t.trim())
                        .map((t, i) => (
                          <Box
                            key={i}
                            sx={{
                              px: 0.75,
                              py: 0.2,
                              fontSize: "0.6rem",
                              backgroundColor: "#f5f5f5",
                              color: COLORS.body,
                              borderRadius: 0.5,
                              WebkitPrintColorAdjust: "exact !important",
                              printColorAdjust: "exact !important",
                            }}
                          >
                            {t}
                          </Box>
                        ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Right column — Philosophy, Most Proud Of, Strengths, Languages, Education */}
        <Box
          sx={{
            width: "40%",
            pl: 1.5,
            borderLeft: `2px solid ${COLORS.headingRule}`,
          }}
        >
          {data.basicInfo.summary && (
            <Box sx={{ mb: 2 }}>
              <SectionTitle>Summary</SectionTitle>
              <Typography
                component="blockquote"
                sx={{
                  fontSize: "0.7rem",
                  color: COLORS.body,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  m: 0,
                  pl: 1.5,
                  borderLeft: `3px solid ${COLORS.accent}`,
                }}
              >
                &ldquo;{data.basicInfo.summary}&rdquo;
              </Typography>
            </Box>
          )}

          {data.certifications.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <SectionTitle>Certifications</SectionTitle>
              {data.certifications.map((cert) => (
                <Box key={cert.id} sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: COLORS.emphasis,
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
                          fontSize: "0.58rem",
                          color: COLORS.accent,
                          fontWeight: 600,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔗Link
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.65rem",
                      color: COLORS.body,
                    }}
                  >
                    {cert.issuer}
                    {cert.date ? ` • ${formatDate(cert.date, "", false)}` : ""}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {data.skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <SectionTitle>Skills</SectionTitle>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {data.skills.map((skill) => (
                  <Box
                    key={skill.id}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 1,
                      py: 0.5,
                      fontSize: "0.65rem",
                      lineHeight: 1,
                      backgroundColor: "#f0e6d8 !important",
                      color: COLORS.emphasis,
                      borderRadius: 0.5,
                      fontWeight: 500,
                      WebkitPrintColorAdjust: "exact !important",
                      printColorAdjust: "exact !important",
                      colorAdjust: "exact !important",
                    }}
                  >
                    {skill.name}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {data.skills.some((s) => s.level != null) && (
            <Box sx={{ mb: 2 }}>
              <SectionTitle>Skill Levels</SectionTitle>
              {data.skills
                .filter((s) => s.level != null)
                .map((skill) => (
                  <Box key={skill.id} sx={{ mb: 0.75 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: COLORS.emphasis,
                        }}
                      >
                        {skill.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.65rem",
                          color: COLORS.body,
                        }}
                      >
                        {skill.level ?? 0}/5
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "2px", height: 6 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Box
                          key={i}
                          component="span"
                          sx={{
                            display: "block",
                            width: 20,
                            height: 6,
                            borderRadius: 1,
                            backgroundColor:
                              i <= (skill.level ?? 0)
                                ? `${COLORS.accent} !important`
                                : "#e0e0e0 !important",
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

          {data.education.length > 0 && (
            <Box>
              <SectionTitle>Education</SectionTitle>
              {data.education.map((edu) => (
                <Box key={edu.id} sx={{ mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: COLORS.emphasis,
                    }}
                  >
                    {edu.degree}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: COLORS.accent,
                      fontWeight: 600,
                    }}
                  >
                    {edu.institution}
                  </Typography>
                  <Typography sx={{ fontSize: "0.65rem", color: COLORS.body }}>
                    {formatDate(edu.startDate, edu.endDate)}
                    {edu.location ? ` • ${edu.location}` : ""}
                  </Typography>
                  {edu.gpa && (
                    <Typography
                      sx={{ fontSize: "0.65rem", color: COLORS.body, mt: 0.25 }}
                    >
                      GPA: {edu.gpa}
                    </Typography>
                  )}
                  {edu.description && (
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        color: COLORS.body,
                        mt: 0.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {edu.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
