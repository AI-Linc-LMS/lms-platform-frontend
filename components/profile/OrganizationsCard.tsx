"use client";

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
            color: "#000000",
            fontSize: "1.25rem",
          }}
        >
          Organizations
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
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 1.5,
                backgroundColor: "#f9fafb",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#f3f2ef",
                  borderColor: "rgba(0,0,0,0.12)",
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
                    backgroundColor: "#f3f2ef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#e9e7e3",
                    },
                  }}
                >
                  <IconWrapper icon="mdi:domain" size={22} color="#0a66c2" />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#000000",
                      fontSize: "0.9375rem",
                      mb: 0.25,
                    }}
                  >
                    {org.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#666666",
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
            border: "1px dashed #e5e7eb",
            borderRadius: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              mb: 1,
            }}
          >
            No organizations yet
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
