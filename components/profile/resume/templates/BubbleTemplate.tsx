"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BubbleTemplateProps {
  data: ResumeData;
}

const ICON_SIZE = 28;
const TIMELINE_DOT = 8;
const TIMELINE_COLOR = "#d1d5db";

function BubbleSectionHead({
  icon,
  children,
}: {
  icon: string;
  children: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25, mt: 2 }}>
      <Box
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: "50%",
          border: "2px solid #1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <IconWrapper icon={icon} size={14} color="#1f2937" />
      </Box>
      <Typography
        sx={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#1f2937",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function SidebarSectionHead({
  icon,
  children,
}: {
  icon: string;
  children: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25, mt: 2.5 }}>
      <Box
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: "50%",
          border: "2px solid #1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <IconWrapper icon={icon} size={14} color="#1f2937" />
      </Box>
      <Typography
        sx={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#1f2937",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function TimelineEvent({
  startYear,
  endYear,
  children,
}: {
  startYear?: string;
  endYear?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, position: "relative", mb: 2 }}>
      {/* Year labels + timeline */}
      <Box
        sx={{
          width: 50,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          position: "relative",
          pt: 0.25,
        }}
      >
        {endYear && (
          <Typography sx={{ fontSize: "0.55rem", color: "#6b7280", lineHeight: 1.2 }}>
            {endYear}
          </Typography>
        )}
        {startYear && (
          <Typography sx={{ fontSize: "0.55rem", color: "#6b7280", lineHeight: 1.2 }}>
            {startYear}
          </Typography>
        )}
      </Box>
      {/* Timeline dot + line */}
      <Box
        sx={{
          width: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          pt: 0.5,
        }}
      >
        <Box
          sx={{
            width: TIMELINE_DOT,
            height: TIMELINE_DOT,
            borderRadius: "50%",
            backgroundColor: `${TIMELINE_COLOR} !important`,
            flexShrink: 0,
            WebkitPrintColorAdjust: "exact !important",
            printColorAdjust: "exact !important",
            colorAdjust: "exact !important",
          }}
        />
        <Box
          sx={{
            width: 3,
            flex: 1,
            backgroundColor: `${TIMELINE_COLOR} !important`,
            WebkitPrintColorAdjust: "exact !important",
            printColorAdjust: "exact !important",
            colorAdjust: "exact !important",
          }}
        />
      </Box>
      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function BubbleTemplate({ data }: BubbleTemplateProps) {
  const getYear = (d: string) => (d ? d.split("-")[0] : "");

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
      {/* ===== LEFT COLUMN (timeline) ===== */}
      <Box sx={{ width: "62%", p: 2.5, minWidth: 0, overflow: "hidden" }}>
        {/* Header: photo + name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
          {data.basicInfo.photo && (
            <Box
              component="img"
              src={data.basicInfo.photo}
              alt=""
              crossOrigin="anonymous"
              sx={{
                width: 70,
                height: 70,
                objectFit: "cover",
                borderRadius: "50%",
                flexShrink: 0,
              }}
            />
          )}
          <Box>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: "#1f2937" }}>
              {data.basicInfo.firstName} {data.basicInfo.lastName}
            </Typography>
            {data.basicInfo.professionalTitle && (
              <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {data.basicInfo.professionalTitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Profile (summary) */}
        {data.basicInfo.summary && (
          <>
            <BubbleSectionHead icon="mdi:text-box-outline">Profile</BubbleSectionHead>
            <Typography
              sx={{ fontSize: "0.62rem", color: "#4b5563", lineHeight: 1.5, pl: 0.5 }}
            >
              {data.basicInfo.summary}
            </Typography>
          </>
        )}

        {/* Work Experience */}
        {data.workExperience.length > 0 && (
          <>
            <BubbleSectionHead icon="mdi:briefcase-outline">Work Experience</BubbleSectionHead>
            {data.workExperience.map((exp) => (
              <TimelineEvent
                key={exp.id}
                startYear={getYear(exp.startDate)}
                endYear={exp.current ? "present" : getYear(exp.endDate)}
              >
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#1f2937" }}>
                  {exp.position}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", fontStyle: "italic", color: "#6b7280" }}>
                  {exp.company}
                  {exp.location ? `, ${exp.location}` : ""}
                </Typography>
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.25 }}>
                    {exp.description.filter((d) => d.trim()).map((d, i) => (
                      <Typography key={i} component="li" sx={{ fontSize: "0.58rem", color: "#4b5563", lineHeight: 1.4 }}>
                        {d}
                      </Typography>
                    ))}
                  </Box>
                )}
              </TimelineEvent>
            ))}
          </>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <>
            <BubbleSectionHead icon="mdi:school-outline">Education</BubbleSectionHead>
            {data.education.map((edu) => (
              <TimelineEvent
                key={edu.id}
                startYear={getYear(edu.startDate)}
                endYear={getYear(edu.endDate)}
              >
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#1f2937" }}>
                  {edu.degree}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", fontStyle: "italic", color: "#6b7280" }}>
                  {edu.institution}
                  {edu.location ? `, ${edu.location}` : ""}
                </Typography>
                {edu.description && (
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.25 }}>
                    <Typography component="li" sx={{ fontSize: "0.58rem", color: "#4b5563", lineHeight: 1.4 }}>
                      {edu.description}
                    </Typography>
                  </Box>
                )}
              </TimelineEvent>
            ))}
          </>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <>
            <BubbleSectionHead icon="mdi:target">Projects</BubbleSectionHead>
            {data.projects.map((proj) => (
              <TimelineEvent key={proj.id}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#1f2937" }}>
                    {proj.name}
                  </Typography>
                  {proj.link && (
                    <Typography
                      component="a"
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.58rem", color: "#1f2937", fontWeight: 600, flexShrink: 0 }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                {proj.description && (
                  <Typography sx={{ fontSize: "0.58rem", color: "#4b5563", lineHeight: 1.4 }}>
                    {proj.description}
                  </Typography>
                )}
              </TimelineEvent>
            ))}
          </>
        )}
      </Box>

      {/* ===== RIGHT SIDEBAR ===== */}
      <Box
        sx={{
          width: "38%",
          backgroundColor: "#f3f4f6 !important",
          p: 2.5,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
          colorAdjust: "exact !important",
        }}
      >
        {/* Contact */}
        <SidebarSectionHead icon="mdi:card-account-details-outline">Contact</SidebarSectionHead>
        <Box sx={{ "& > div": { display: "flex", alignItems: "flex-start", gap: 1, mb: 1 } }}>
          {data.basicInfo.email && (
            <Box>
              <IconWrapper icon="mdi:email-outline" size={14} color="#1f2937" />
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#1f2937" }}>Email</Typography>
                <Typography component="a" href={`mailto:${data.basicInfo.email}`} sx={{ fontSize: "0.58rem", color: "#4b5563", textDecoration: "none" }}>{data.basicInfo.email}</Typography>
              </Box>
            </Box>
          )}
          {data.basicInfo.phone && (
            <Box>
              <IconWrapper icon="mdi:phone-outline" size={14} color="#1f2937" />
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#1f2937" }}>Phone</Typography>
                <Typography component="a" href={`tel:${data.basicInfo.phone}`} sx={{ fontSize: "0.58rem", color: "#4b5563", textDecoration: "none" }}>{data.basicInfo.phone}</Typography>
              </Box>
            </Box>
          )}
          {data.basicInfo.location && (
            <Box>
              <IconWrapper icon="mdi:home-outline" size={14} color="#1f2937" />
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#1f2937" }}>Address</Typography>
                <Typography sx={{ fontSize: "0.58rem", color: "#4b5563" }}>{data.basicInfo.location}</Typography>
              </Box>
            </Box>
          )}
          {data.basicInfo.github && (
            <Box>
              <IconWrapper icon="mdi:web" size={14} color="#1f2937" />
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#1f2937" }}>Website</Typography>
                <Typography component="a" href={`https://github.com/${data.basicInfo.github}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.58rem", color: "#4b5563", textDecoration: "none" }}>github.com/{data.basicInfo.github}</Typography>
              </Box>
            </Box>
          )}
          {data.basicInfo.linkedin && (
            <Box>
              <IconWrapper icon="mdi:linkedin" size={14} color="#1f2937" />
              <Box>
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#1f2937" }}>LinkedIn</Typography>
                <Typography component="a" href={`https://linkedin.com/in/${data.basicInfo.linkedin}`} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.58rem", color: "#4b5563", textDecoration: "none" }}>linkedin.com/in/{data.basicInfo.linkedin}</Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Skills */}
        {data.skills.length > 0 && (
          <>
            <SidebarSectionHead icon="mdi:lightning-bolt">Skills</SidebarSectionHead>
            {data.skills.map((skill) => (
              <Box key={skill.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#1f2937 !important",
                    flexShrink: 0,
                    WebkitPrintColorAdjust: "exact !important",
                    printColorAdjust: "exact !important",
                    colorAdjust: "exact !important",
                  }}
                />
                <Typography sx={{ fontSize: "0.62rem", color: "#1f2937" }}>{skill.name}</Typography>
              </Box>
            ))}
          </>
        )}

        {/* Certifications (mapped from "Languages" in the LaTeX) */}
        {data.certifications.length > 0 && (
          <>
            <SidebarSectionHead icon="mdi:certificate-outline">Certifications</SidebarSectionHead>
            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1f2937", flex: 1, minWidth: 0 }}>
                    {cert.name}
                  </Typography>
                  {cert.link && (
                    <Typography
                      component="a"
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.52rem", color: "#4b5563", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      🔗Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.58rem", color: "#6b7280" }}>
                  {cert.issuer}
                </Typography>
                {cert.date && (
                  <Typography sx={{ fontSize: "0.55rem", color: "#6b7280" }}>
                    {cert.date.split("-")[0]}
                  </Typography>
                )}
              </Box>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
