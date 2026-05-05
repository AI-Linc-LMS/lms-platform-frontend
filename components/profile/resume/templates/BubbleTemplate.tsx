"use client";

import { Box, Typography } from "@mui/material";
import { ResumeData } from "../types";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BubbleTemplateProps {
  data: ResumeData;
}

const ICON_SIZE = 28;
const TIMELINE_DOT = 8;
const TIMELINE_COLOR = "color-mix(in srgb, var(--border-default) 85%, var(--font-secondary))";

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
          border: "2px solid var(--font-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <IconWrapper icon={icon} size={14} color="var(--font-primary)" />
      </Box>
      <Typography
        data-resume-section-title
        sx={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--font-primary)",
          whiteSpace: "nowrap",
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
          border: "2px solid var(--font-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
        }}
      >
        <IconWrapper icon={icon} size={14} color="var(--font-primary)" />
      </Box>
      <Typography
        data-resume-section-title
        sx={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--font-primary)",
          whiteSpace: "nowrap",
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
          <Typography sx={{ fontSize: "0.55rem", color: "var(--font-secondary)", lineHeight: 1.2 }}>
            {endYear}
          </Typography>
        )}
        {startYear && (
          <Typography sx={{ fontSize: "0.55rem", color: "var(--font-secondary)", lineHeight: 1.2 }}>
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
            display: "block",
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
            display: "block",
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
        backgroundColor: "var(--background)",
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
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--font-primary)" }}>
              {data.basicInfo.firstName} {data.basicInfo.lastName}
            </Typography>
            {data.basicInfo.professionalTitle && (
              <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
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
              sx={{ fontSize: "0.62rem", color: "var(--font-secondary)", lineHeight: 1.6, pl: 0.5 }}
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
                <Typography data-resume-nowrap sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--font-primary)" }}>
                  {exp.position}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", fontStyle: "italic", color: "var(--font-secondary)" }}>
                  {exp.company}
                  {exp.location ? `, ${exp.location}` : ""}
                </Typography>
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.25 }}>
                    {exp.description.filter((d) => d.trim()).map((d, i) => (
                      <Typography key={i} component="li" sx={{ fontSize: "0.58rem", color: "var(--font-secondary)", lineHeight: 1.4 }}>
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
                <Typography data-resume-nowrap sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--font-primary)" }}>
                  {edu.degree}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", fontStyle: "italic", color: "var(--font-secondary)" }}>
                  {edu.institution}
                  {edu.location ? `, ${edu.location}` : ""}
                </Typography>
                {edu.description && (
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.25 }}>
                    <Typography component="li" sx={{ fontSize: "0.58rem", color: "var(--font-secondary)", lineHeight: 1.4 }}>
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography data-resume-nowrap sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--font-primary)" }}>
                    {proj.name}
                  </Typography>
                  {proj.link && (
                    <Typography
                      component="a"
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.58rem", color: "var(--font-primary)", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap", textDecoration: "none" }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                {proj.description && (
                  <Typography sx={{ fontSize: "0.58rem", color: "var(--font-secondary)", lineHeight: 1.4 }}>
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
          backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background)) !important",
          p: 2.5,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
          colorAdjust: "exact !important",
        }}
      >
        {/* Contact */}
        <SidebarSectionHead icon="mdi:card-account-details-outline">Contact</SidebarSectionHead>
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
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, textDecoration: "none", color: "inherit" }}
            >
              <Box sx={{ flexShrink: 0, display: "flex" }}>
                <IconWrapper icon={item.icon} size={14} color="var(--font-primary)" />
              </Box>
              <Typography
                data-resume-contact-item
                sx={{
                  fontSize: "0.58rem",
                  color: "var(--font-secondary)",
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

        {/* Skills */}
        {data.skills.length > 0 && (
          <>
            <SidebarSectionHead icon="mdi:lightning-bolt">Skills</SidebarSectionHead>
            {data.skills.map((skill) => (
              <Box key={skill.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                <Box
                  sx={{
                    display: "block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "var(--font-primary) !important",
                    flexShrink: 0,
                    WebkitPrintColorAdjust: "exact !important",
                    printColorAdjust: "exact !important",
                    colorAdjust: "exact !important",
                  }}
                />
                <Typography sx={{ fontSize: "0.62rem", color: "var(--font-primary)" }}>{skill.name}</Typography>
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
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--font-primary)", flex: 1, minWidth: 0 }}>
                    {cert.name}
                  </Typography>
                  {cert.link && (
                    <Typography
                      component="a"
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.52rem", color: "var(--font-secondary)", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.58rem", color: "var(--font-secondary)" }}>
                  {cert.issuer}
                </Typography>
                {cert.date && (
                  <Typography sx={{ fontSize: "0.55rem", color: "var(--font-secondary)" }}>
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
