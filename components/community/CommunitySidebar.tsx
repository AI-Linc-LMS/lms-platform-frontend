"use client";

import React from "react";
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
const STUDY_CHANNELS = [
  { id: "c1", name: "Computer Science", activeUsers: 42, icon: "mdi:laptop" },
  { id: "c2", name: "Mathematics", activeUsers: 15, icon: "mdi:function-variant" },
  { id: "c3", name: "Career Prep", activeUsers: 89, icon: "mdi:briefcase-outline" },
  { id: "c4", name: "General Discussion", activeUsers: 120, icon: "mdi:forum-outline" },
];

export function CommunitySidebar() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            mb: 2,
            color: "var(--font-primary-dark)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Study Channels
        </Typography>
        <Paper elevation={0} sx={{ border: "1px solid var(--border-default)", borderRadius: 2, overflow: "hidden", bgcolor: "var(--card-bg)" }}>
          <List disablePadding>
            {STUDY_CHANNELS.map((channel, index) => (
              <React.Fragment key={channel.id}>
                <ListItem disablePadding>
                  <ListItemButton sx={{ py: 1.5, px: 2, "&:hover": { backgroundColor: "var(--surface)" } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                      <IconWrapper icon={channel.icon} size={20} color="var(--font-secondary)" />
                      <ListItemText
                        primary={channel.name}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 500,
                          color: "var(--font-muted)",
                        }}
                      />
                      <Chip
                        label={`${channel.activeUsers} active`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          backgroundColor: "var(--surface-blue-light)",
                          color: "var(--primary-700)",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < STUDY_CHANNELS.length - 1 && (
                  <Box sx={{ height: "1px", backgroundColor: "var(--border-default)" }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Placeholder for future filters or trending tags */}
      <Box>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            mb: 2,
            color: "var(--font-primary-dark)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Trending Tags
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {["#React", "#MachineLearning", "#FinalExams", "#Internships"].map(tag => (
            <Chip 
              key={tag}
              label={tag}
              size="small"
              sx={{
                backgroundColor: "var(--surface)",
                color: "var(--font-secondary)",
                border: "1px solid var(--border-default)",
                "&:hover": { backgroundColor: "var(--primary-50)", cursor: "pointer" },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
