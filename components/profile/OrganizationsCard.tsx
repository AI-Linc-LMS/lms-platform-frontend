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
        p: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          Organizations
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "#6b7280",
          display: "block",
          mb: 2,
        }}
      >
        Your organization memberships
      </Typography>

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
                border: "1px solid #e5e7eb",
                borderRadius: 1.5,
                "&:hover": {
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:domain" size={20} color="#6366f1" />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {org.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#6b7280",
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
