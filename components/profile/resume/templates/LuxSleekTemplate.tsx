"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

const CVBLUE = "#304263";

interface LuxSleekTemplateProps {
  data: ResumeData;
}

function HeadLeft({ children }: { children: string }) {
  return (
    <Box sx={{ mt: 2.5, mb: 0.75 }}>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 700,
          fontVariant: "small-caps",
          letterSpacing: "0.06em",
          color: "#ffffff",
        }}
      >
        {children}
      </Typography>
      <Box
        sx={{
          mt: 0.25,
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.5) !important",
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      />
    </Box>
  );
}

function HeadRight({ children }: { children: string }) {
  return (
    <Box sx={{ mt: 2, mb: 0.5 }}>
      <Typography
        sx={{
          fontSize: "1.05rem",
          fontWeight: 400,
          fontVariant: "small-caps",
          letterSpacing: "0.04em",
          color: CVBLUE,
        }}
      >
        {children}
      </Typography>
      <Box
        sx={{
          mt: -0.25,
          height: "1.5px",
          backgroundColor: `${CVBLUE} !important`,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      />
    </Box>
  );
}

export function LuxSleekTemplate({ data }: LuxSleekTemplateProps) {
  const fmtDate = (start: string, end: string, current?: boolean) => {
    if (!start) return "";
    const fmt = (d: string) => {
      if (!d) return "";
      const [y, m] = d.split("-");
      return m ? `${y}.${m.padStart(2, "0")}` : y;
    };
    const s = fmt(start);
    if (current) return `${s}\u2013pres.`;
    if (!end) return s;
    return `${s}\u2013${fmt(end)}`;
  };

  const fmtYear = (start: string, end: string) => {
    if (!start) return "";
    const sy = start.split("-")[0];
    if (!end) return sy;
    const ey = end.split("-")[0];
    return `${sy}\u2013${ey}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "297mm",
        height: "297mm",
        width: "100%",
        backgroundColor: "#ffffff",
        fontFamily: "'Fira Sans', 'Segoe UI', 'Roboto', sans-serif",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
      }}
    >
      {/* ===== LEFT SIDEBAR ===== */}
      <Box
        sx={{
          width: "33%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: `${CVBLUE} !important`,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        {/* Darker top bar */}
        <Box
          sx={{
            height: 6,
            backgroundColor: `${CVBLUE} !important`,
            flexShrink: 0,
            WebkitPrintColorAdjust: "exact !important",
            printColorAdjust: "exact !important",
          }}
        />
        {/* Sidebar content */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "rgba(48,66,99,0.92) !important",
            color: "#ffffff",
            px: 2,
            pt: 2,
            pb: 2,
            WebkitPrintColorAdjust: "exact !important",
            printColorAdjust: "exact !important",
          }}
        >
          {/* Name */}
          <Typography
            sx={{
              fontSize: "1.15rem",
              lineHeight: 1.3,
              mb: 1.5,
            }}
          >
            {data.basicInfo.firstName}{" "}
            <Box
              component="span"
              sx={{ fontWeight: 700, fontVariant: "small-caps", letterSpacing: "0.04em" }}
            >
              {data.basicInfo.lastName}
            </Box>
          </Typography>

          {/* Oval photo */}
          {data.basicInfo.photo && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Box
                component="img"
                src={data.basicInfo.photo}
                alt=""
                crossOrigin="anonymous"
                sx={{
                  width: "65%",
                  aspectRatio: "3/4",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            </Box>
          )}

          {/* Profile */}
          <HeadLeft>Profile</HeadLeft>
          {data.basicInfo.summary && (
            <Typography
              sx={{
                fontSize: "0.62rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {data.basicInfo.summary}
            </Typography>
          )}

          {/* Contact details */}
          <HeadLeft>Contact details</HeadLeft>
          <Box sx={{ "& > div": { display: "flex", alignItems: "flex-start", gap: 0.75, mb: 0.5 } }}>
            {data.basicInfo.email && (
              <Box>
                <IconWrapper icon="mdi:at" size={12} color="#ffffff" />
                <Typography component="a" href={`mailto:${data.basicInfo.email}`} sx={{ fontSize: "0.58rem", lineHeight: 1.4, textDecoration: "none", color: "inherit" }}>
                  {data.basicInfo.email}
                </Typography>
              </Box>
            )}
            {data.basicInfo.phone && (
              <Box>
                <IconWrapper icon="mdi:cellphone" size={12} color="#ffffff" />
                <Typography component="a" href={`tel:${data.basicInfo.phone}`} sx={{ fontSize: "0.58rem", lineHeight: 1.4, textDecoration: "none", color: "inherit" }}>
                  {data.basicInfo.phone}
                </Typography>
              </Box>
            )}
            {data.basicInfo.github && (
              <Box>
                <IconWrapper icon="mdi:web" size={12} color="#ffffff" />
                <Typography component="a" href={`https://github.com/${data.basicInfo.github}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.58rem", lineHeight: 1.4, textDecoration: "none", color: "inherit" }}>
                  github.com/{data.basicInfo.github}
                </Typography>
              </Box>
            )}
            {data.basicInfo.linkedin && (
              <Box>
                <IconWrapper icon="mdi:linkedin" size={12} color="#ffffff" />
                <Typography component="a" href={`https://linkedin.com/in/${data.basicInfo.linkedin}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.58rem", lineHeight: 1.4, textDecoration: "none", color: "inherit" }}>
                  linkedin.com/in/{data.basicInfo.linkedin}
                </Typography>
              </Box>
            )}
            {data.basicInfo.location && (
              <Box>
                <IconWrapper icon="mdi:email-outline" size={12} color="#ffffff" />
                <Typography sx={{ fontSize: "0.58rem", lineHeight: 1.4 }}>
                  {data.basicInfo.location}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Skills */}
          <HeadLeft>Skills</HeadLeft>
          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 1.8,
              "& li": {
                fontSize: "0.62rem",
                lineHeight: 1.5,
                mb: 0.15,
                color: "rgba(255,255,255,0.92)",
                "::marker": { fontSize: "0.55rem" },
              },
            }}
          >
            {data.skills.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ===== RIGHT COLUMN ===== */}
      <Box
        sx={{
          flex: 1,
          px: 2.5,
          pt: 1.5,
          pb: 2,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Experience */}
        <HeadRight>Work Experience</HeadRight>
        {data.workExperience.map((exp) => (
          <Box key={exp.id} sx={{ mb: 1.25 }}>
            {/* Title line: SMALL-CAPS POSITION at *Company (Location).* **dates** */}
            <Typography
              sx={{ fontSize: "0.72rem", color: "#1f2937", lineHeight: 1.4 }}
            >
              <Box
                component="span"
                sx={{ fontVariant: "small-caps", fontWeight: 600, letterSpacing: "0.02em" }}
              >
                {exp.position}
              </Box>
              {" at "}
              <Box component="span" sx={{ fontStyle: "italic" }}>
                {exp.company}
                {exp.location ? ` (${exp.location}).` : "."}
              </Box>
              {"  "}
              <Box component="span" sx={{ fontWeight: 700, whiteSpace: "nowrap", float: "right" }}>
                {fmtDate(exp.startDate, exp.endDate, exp.current)}
              </Box>
            </Typography>
            {/* Description with diamond bullets */}
            {exp.description.filter((d) => d.trim()).length > 0 && (
              <Box sx={{ mt: 0.25 }}>
                {exp.description
                  .filter((d) => d.trim())
                  .map((d, i) => (
                    <Typography
                      key={i}
                      sx={{
                        fontSize: "0.62rem",
                        color: "#4b5563",
                        lineHeight: 1.45,
                      }}
                    >
                      <Box component="span" sx={{ fontSize: "0.5rem", mr: 0.5 }}>◇</Box>
                      {d}
                    </Typography>
                  ))}
              </Box>
            )}
          </Box>
        ))}

        {/* Education */}
        <HeadRight>Education</HeadRight>
        {data.education.map((edu) => (
          <Box key={edu.id} sx={{ mb: 1.25 }}>
            <Typography
              sx={{ fontSize: "0.72rem", color: "#1f2937", lineHeight: 1.4 }}
            >
              <Box
                component="span"
                sx={{ fontVariant: "small-caps", fontWeight: 600, letterSpacing: "0.02em" }}
              >
                {edu.degree}.
              </Box>
              {" "}
              <Box component="span" sx={{ fontStyle: "italic" }}>
                {edu.institution}.
              </Box>
              {"  "}
              <Box component="span" sx={{ fontWeight: 700, whiteSpace: "nowrap", float: "right" }}>
                {fmtYear(edu.startDate, edu.endDate)}
              </Box>
            </Typography>
            {edu.description && (
              <Typography
                sx={{ fontSize: "0.62rem", color: "#4b5563", lineHeight: 1.45 }}
              >
                <Box component="span" sx={{ fontSize: "0.5rem", mr: 0.5 }}>◇</Box>
                {edu.description}
              </Typography>
            )}
          </Box>
        ))}

        {/* Projects */}
        {data.projects.length > 0 && (
          <>
            <HeadRight>Projects</HeadRight>
            {data.projects.map((proj) => (
              <Box key={proj.id} sx={{ mb: 1.25 }}>
                <Typography
                  sx={{ fontSize: "0.72rem", color: "#1f2937", lineHeight: 1.4 }}
                >
                  <Box
                    component="span"
                    sx={{ fontVariant: "small-caps", fontWeight: 600, letterSpacing: "0.02em" }}
                  >
                    {proj.name}.
                  </Box>
                  {proj.link && (
                    <>
                      {"  "}
                      <Typography
                        component="a"
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: "0.62rem",
                          color: CVBLUE,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          float: "right",
                        }}
                      >
                        🔗Link
                      </Typography>
                    </>
                  )}
                </Typography>
                {proj.description && (
                  <Typography
                    sx={{ fontSize: "0.62rem", color: "#4b5563", lineHeight: 1.45 }}
                  >
                    <Box component="span" sx={{ fontSize: "0.5rem", mr: 0.5 }}>◇</Box>
                    {proj.description}
                  </Typography>
                )}
                {proj.technologies.filter((t) => t.trim()).length > 0 && (
                  <Typography
                    sx={{ fontSize: "0.62rem", color: "#4b5563", lineHeight: 1.45 }}
                  >
                    <Box component="span" sx={{ fontSize: "0.5rem", mr: 0.5 }}>◇</Box>
                    {proj.technologies.filter((t) => t.trim()).join(", ")}
                  </Typography>
                )}
              </Box>
            ))}
          </>
        )}

        {/* Additional education (Certifications) */}
        {data.certifications.length > 0 && (
          <>
            <HeadRight>Certifications</HeadRight>
            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 1.25 }}>
                <Typography
                  sx={{ fontSize: "0.72rem", color: "#1f2937", lineHeight: 1.4 }}
                >
                  <Box
                    component="span"
                    sx={{ fontVariant: "small-caps", fontWeight: 600, letterSpacing: "0.02em" }}
                  >
                    {cert.name}.
                  </Box>
                  {" "}
                  <Box component="span" sx={{ fontStyle: "italic" }}>
                    {cert.issuer}.
                  </Box>
                  {cert.link && (
                    <>
                      {"  "}
                      <Box
                        component="a"
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: "0.55rem",
                          color: CVBLUE,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        🔗Link
                      </Box>
                    </>
                  )}
                  {cert.date && (
                    <>
                      {"  "}
                      <Box component="span" sx={{ fontWeight: 700, whiteSpace: "nowrap", float: "right" }}>
                        {cert.date.split("-")[0]}
                      </Box>
                    </>
                  )}
                </Typography>
              </Box>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
