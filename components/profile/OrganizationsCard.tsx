"use client";

import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PROFILE, TILE_GRADIENT } from "./theme/profileTokens";

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
        borderRadius: 4,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)",
        backgroundColor: "var(--background)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 16px 34px -20px rgba(30,27,75,0.34)",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: TILE_GRADIENT,
            }}
          >
            <IconWrapper icon="mdi:office-building-outline" size={17} />
          </Box>
          <Typography
            component="h3"
            sx={{
              fontWeight: 800,
              color: PROFILE.ink,
              fontSize: "0.95rem",
              lineHeight: 1.2,
              letterSpacing: "-0.2px",
            }}
          >
            {t("profile.organizations")}
          </Typography>
        </Box>
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
