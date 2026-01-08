"use client";

import { Box, Paper, Typography, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface DetailItem {
  icon: string;
  label: string;
  value: string;
  copyable?: boolean;
}

interface UserDetailsCardProps {
  username: string;
  emailAddress: string;
  socialLinks?: {
    github: string;
    linkedin: string;
  };
}

export function UserDetailsCard({
  username,
  emailAddress,
  socialLinks,
}: UserDetailsCardProps) {
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
          },
        ]
      : []),
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        mb: 3,
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
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconWrapper icon={detail.icon} size={20} color="#6b7280" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#6b7280",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  display: "block",
                  mb: 0.25,
                }}
              >
                {detail.label}
              </Typography>
              <Tooltip title={detail.value} arrow placement="top">
                <Typography
                  variant="body2"
                  sx={{
                    color: "#1f2937",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "default",
                  }}
                >
                  {detail.value}
                </Typography>
              </Tooltip>
            </Box>
            {detail.copyable && (
              <Tooltip title="Copy to clipboard" arrow placement="top">
                <Box
                  sx={{
                    cursor: "pointer",
                    p: 0.5,
                    borderRadius: 1,
                    "&:hover": {
                      backgroundColor: "#f3f4f6",
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
