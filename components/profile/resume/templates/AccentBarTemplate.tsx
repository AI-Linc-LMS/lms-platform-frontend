"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeData } from "../types";

const ACCENT = "var(--success-500)";

interface AccentBarTemplateProps {
  data: ResumeData;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography
      data-resume-section-title
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "var(--font-primary)",
        textTransform: "uppercase",
        mb: 1.25,
        pb: 0.5,
        borderBottom: `2px solid ${ACCENT}`,
      }}
    >
      {children}
    </Typography>
  );
}

export function AccentBarTemplate({ data }: AccentBarTemplateProps) {
  const formatDate = (start: string, end: string, current?: boolean) => {
    if (!start) return "";
    const fmt = (d: string) => {
      if (!d) return "";
      const [y, m] = d.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
    };
    return current ? `${fmt(start)} - Present` : `${fmt(start)} - ${fmt(end)}`;
  };

  return (
    <Box
      sx={{
        minHeight: "297mm",
        width: "100%",
        backgroundColor: "var(--background)",
        WebkitPrintColorAdjust: "exact !important",
        printColorAdjust: "exact !important",
        colorAdjust: "exact !important",
      }}
    >
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--font-primary)" }}>
          {data.basicInfo.firstName} {data.basicInfo.lastName}
        </Typography>
        {data.basicInfo.professionalTitle && (
          <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", mt: 0.25 }}>
            {data.basicInfo.professionalTitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          height: 6,
          backgroundColor: `${ACCENT} !important`,
          WebkitPrintColorAdjust: "exact !important",
          printColorAdjust: "exact !important",
          colorAdjust: "exact !important",
        }}
      />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 1.5,
            color: "var(--font-secondary)",
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
                  <IconWrapper icon={item.icon} size={11} color={ACCENT} />
                </Box>
                <Typography
                  data-resume-contact-item
                  sx={{
                    fontSize: "0.65rem",
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

        {data.basicInfo.summary && (
          <Typography sx={{ fontSize: "0.65rem", color: "var(--font-secondary)", lineHeight: 1.6, mb: 2 }}>
            {data.basicInfo.summary}
          </Typography>
        )}

        {data.workExperience.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Work Experience</SectionTitle>
            {data.workExperience.map((exp) => (
              <Box key={exp.id} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5 }}>
                  <Box>
                    <Typography data-resume-nowrap sx={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--font-primary)" }}>
                      {exp.position}
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: ACCENT }}>{exp.company}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", whiteSpace: "nowrap", ml: 2 }}>
                    {formatDate(exp.startDate, exp.endDate, exp.current)}
                  </Typography>
                </Box>
                {exp.location && (
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", mb: 0.5 }}>{exp.location}</Typography>
                )}
                {exp.description.filter((d) => d.trim()).length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {exp.description.filter((d) => d.trim()).map((d, i) => (
                      <Typography key={i} component="li" sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", lineHeight: 1.6, mb: 0.5 }}>
                        {d}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.education.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Education</SectionTitle>
            {data.education.map((edu) => (
              <Box key={edu.id} sx={{ mb: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography data-resume-nowrap sx={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--font-primary)" }}>{edu.degree}</Typography>
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", whiteSpace: "nowrap", ml: 2 }}>
                    {formatDate(edu.startDate, edu.endDate)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.65rem", color: ACCENT }}>{edu.institution}</Typography>
                {edu.gpa && (
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", whiteSpace: "nowrap" }}>GPA: {edu.gpa}</Typography>
                )}
                {edu.description && (
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", lineHeight: 1.45 }}>{edu.description}</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.skills.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Skills</SectionTitle>
            <Typography sx={{ fontSize: "0.65rem", color: "var(--font-secondary)" }}>
              {data.skills.map((s) => s.name).join(" \u2022 ")}
            </Typography>
          </Box>
        )}

        {data.projects.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>Projects</SectionTitle>
            {data.projects.map((proj) => (
              <Box key={proj.id} sx={{ mb: 1.25 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography data-resume-nowrap sx={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--font-primary)" }}>{proj.name}</Typography>
                  {proj.link && (
                    <Typography
                      component="a"
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.6rem", color: ACCENT, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap", textDecoration: "none" }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                {proj.description && (
                  <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)", lineHeight: 1.45 }}>{proj.description}</Typography>
                )}
                {proj.technologies.filter((t) => t.trim()).length > 0 && (
                  <Typography sx={{ fontSize: "0.58rem", color: "var(--font-secondary)", mt: 0.25 }}>
                    {proj.technologies.filter((t) => t.trim()).join(", ")}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {data.certifications.length > 0 && (
          <Box>
            <SectionTitle>Certifications</SectionTitle>
            {data.certifications.map((cert) => (
              <Box key={cert.id} sx={{ mb: 0.75 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--font-primary)", flex: 1, minWidth: 0 }}>{cert.name}</Typography>
                  {cert.link && (
                    <Typography
                      component="a"
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontSize: "0.55rem", color: ACCENT, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      Link
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.6rem", color: "var(--font-secondary)" }}>
                  {cert.issuer}
                  {cert.date ? ` \u2022 ${cert.date.split("-")[0]}` : ""}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
