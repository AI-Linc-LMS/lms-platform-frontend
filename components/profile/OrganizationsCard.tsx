"use client";

import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface Organization {
  id: number;
  name: string;
  role: string;
  joinedDate: string;
}

interface OrganizationsCardProps {
  organizations: Organization[];
}

export function OrganizationsCard({ organizations }: OrganizationsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        backgroundColor: "var(--background)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 4px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "var(--font-primary)",
            fontSize: "1.25rem",
          }}
        >
          {t("profile.organizations")}
        </Typography>
      </Box>

      {organizations.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {organizations.map((org) => (
            <Box
              key={org.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
                borderRadius: 1.5,
                backgroundColor: "var(--surface)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                  borderColor: "color-mix(in srgb, var(--font-primary) 14%, transparent)",
                  transform: "translateX(4px)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--surface) 72%, var(--background))",
                    },
                  }}
                >
                  <IconWrapper icon="mdi:domain" size={22} color="var(--accent-indigo)" />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "var(--font-primary)",
                      fontSize: "0.9375rem",
                      mb: 0.25,
                    }}
                  >
                    {org.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {org.role}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 3,
            px: 2,
            border: "1px dashed var(--border-default)",
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-secondary)",
              mb: 1,
            }}
          >
            {t("profile.noOrganizationsYet")}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
