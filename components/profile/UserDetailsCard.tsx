"use client";

import { Box, Paper, Typography, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface DetailItem {
  icon: string;
  label: string;
  value: string;
  copyable?: boolean;
  linkable?: boolean;
  url?: string;
}

interface UserDetailsCardProps {
  username: string;
  emailAddress: string;
  socialLinks?: {
    github: string;
    linkedin: string;
  };
  externalProfiles?: {
    portfolio_website_url?: string;
    leetcode_url?: string;
    hackerrank_url?: string;
    kaggle_url?: string;
    medium_url?: string;
  };
}

export function UserDetailsCard({
  username,
  emailAddress,
  socialLinks,
  externalProfiles,
}: UserDetailsCardProps) {
  const formatUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const details: DetailItem[] = [
    {
      icon: "mdi:account",
      label: "Username",
      value: username,
    },
    {
      icon: "mdi:email",
      label: "Email address",
      value: emailAddress,
      copyable: true,
    },
    ...(socialLinks?.github
      ? [
          {
            icon: "mdi:github",
            label: "GitHub",
            value: `https://github.com/${socialLinks.github}`,
            copyable: true,
            linkable: true,
            url: `https://github.com/${socialLinks.github}`,
          },
        ]
      : []),
    ...(socialLinks?.linkedin
      ? [
          {
            icon: "mdi:linkedin",
            label: "LinkedIn",
            value: `https://www.linkedin.com/in/${socialLinks.linkedin}`,
            copyable: true,
            linkable: true,
            url: `https://www.linkedin.com/in/${socialLinks.linkedin}`,
          },
        ]
      : []),
    ...(externalProfiles?.portfolio_website_url
      ? [
          {
            icon: "mdi:web",
            label: "Portfolio",
            value: externalProfiles.portfolio_website_url,
            copyable: true,
            linkable: true,
            url: formatUrl(externalProfiles.portfolio_website_url),
          },
        ]
      : []),
    ...(externalProfiles?.leetcode_url
      ? [
          {
            icon: "mdi:code-tags",
            label: "LeetCode",
            value: externalProfiles.leetcode_url,
            copyable: true,
            linkable: true,
            url: formatUrl(externalProfiles.leetcode_url),
          },
        ]
      : []),
    ...(externalProfiles?.hackerrank_url
      ? [
          {
            icon: "mdi:code-braces",
            label: "HackerRank",
            value: externalProfiles.hackerrank_url,
            copyable: true,
            linkable: true,
            url: formatUrl(externalProfiles.hackerrank_url),
          },
        ]
      : []),
    ...(externalProfiles?.kaggle_url
      ? [
          {
            icon: "mdi:chart-box",
            label: "Kaggle",
            value: externalProfiles.kaggle_url,
            copyable: true,
            linkable: true,
            url: formatUrl(externalProfiles.kaggle_url),
          },
        ]
      : []),
    ...(externalProfiles?.medium_url
      ? [
          {
            icon: "mdi:book-open-variant",
            label: "Medium",
            value: externalProfiles.medium_url,
            copyable: true,
            linkable: true,
            url: formatUrl(externalProfiles.medium_url),
          },
        ]
      : []),
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {details.map((detail, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "#f3f2ef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#e9e7e3",
                },
              }}
            >
              <IconWrapper icon={detail.icon} size={22} color="#0a66c2" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  display: "block",
                  mb: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {detail.label}
              </Typography>
              <Tooltip title={detail.value} arrow placement="top">
                {detail.linkable && detail.url ? (
                  <Box
                    component="a"
                    href={detail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "block",
                      textDecoration: "none",
                      color: "#0a66c2",
                      "&:hover": {
                        textDecoration: "underline",
                        color: "#004182",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.9375rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                    >
                      {detail.value}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#000000",
                      fontWeight: 500,
                      fontSize: "0.9375rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "default",
                    }}
                  >
                    {detail.value}
                  </Typography>
                )}
              </Tooltip>
            </Box>
            {detail.copyable && (
              <Tooltip title="Copy to clipboard" arrow placement="top">
                <Box
                  sx={{
                    cursor: "pointer",
                    p: 1,
                    borderRadius: "50%",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#f3f2ef",
                      transform: "scale(1.1)",
                    },
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(detail.value);
                  }}
                >
                  <IconWrapper
                    icon="mdi:content-copy"
                    size={16}
                    color="#9ca3af"
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
