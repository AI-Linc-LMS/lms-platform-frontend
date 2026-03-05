"use client";

import React, { memo } from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import { MapPin, DollarSign, Calendar } from "lucide-react";
import type { Job } from "@/lib/job-portal-v2";

interface JobCardProps {
  job: Job;
  href?: string;
}

const JobCardComponent = ({ job, href }: JobCardProps) => {
  const linkHref = href ?? `/job-portal/job?id=${job.id}`;
  const isDeadlinePassed = job.application_deadline
    ? new Date(job.application_deadline) < new Date()
    : false;

  return (
    <Paper
      elevation={0}
      component={Link}
      href={linkHref}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        marginBottom: 2,
        border: "1px solid",
        borderColor: "rgba(0, 0, 0, 0.12)",
        backgroundColor: "#ffffff",
        transition: "all 0.2s ease",
        width: "100%",
        maxWidth: "100%",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        "&:hover": {
          borderColor: "rgba(0, 0, 0, 0.2)",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, width: "100%" }}>
        <Avatar
          src={job.company_logo ?? undefined}
          alt={job.company_name}
          sx={{
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "#6366f1",
            color: "#ffffff",
            fontSize: { xs: "1rem", md: "1.25rem" },
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {job.company_name?.[0]?.toUpperCase() || "C"}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  mb: 0.5,
                  color: "#1a1f2e",
                  lineHeight: 1.3,
                }}
              >
                {job.role || "Job Title"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                {job.company_name || "Company"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Chip
                label={job.job_type === "internship" ? "Internship" : "Job"}
                size="small"
                variant="outlined"
                sx={{
                  textTransform: "capitalize",
                  borderColor: "#6366f1",
                  color: "#6366f1",
                }}
              />
              {job.already_applied && (
                <Chip
                  label="Applied"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    color: "#16a34a",
                    border: "none",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              mb: 1.5,
              alignItems: "center",
            }}
          >
            {job.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <MapPin size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {job.location}
                </Typography>
              </Box>
            )}
            {job.compensation && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <DollarSign size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {job.compensation}
                </Typography>
              </Box>
            )}
            {job.application_deadline && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Calendar size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: isDeadlinePassed ? "error.main" : "text.secondary",
                  }}
                >
                  {isDeadlinePassed ? "Deadline passed" : `Deadline: ${job.application_deadline}`}
                </Typography>
              </Box>
            )}
          </Box>

          {job.job_description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                mb: 1.5,
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {job.job_description}
            </Typography>
          )}

          {job.tags && job.tags.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              {job.tags.slice(0, 5).map((tag, index) => (
                <Chip
                  key={index}
                  label={String(tag || "")}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 26,
                    fontSize: "0.75rem",
                    backgroundColor: "transparent",
                    color: "#6366f1",
                    borderColor: "#6366f1",
                    fontWeight: 500,
                  }}
                />
              ))}
              {job.tags.length > 5 && (
                <Chip
                  label={`+${job.tags.length - 5} more`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 26,
                    fontSize: "0.75rem",
                    color: "#6366f1",
                    borderColor: "#6366f1",
                  }}
                />
              )}
            </Box>
          )}

          {job.already_applied ? (
            <Typography
              component="span"
              variant="body2"
              sx={{
                display: "inline-block",
                px: 2.5,
                py: 0.75,
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              Applied
            </Typography>
          ) : (
            <Button
              variant="contained"
              component="span"
              sx={{
                borderRadius: 2,
                backgroundColor: "#6366f1",
                color: "#ffffff",
                textTransform: "none",
                px: 2.5,
                py: 0.75,
                fontSize: "0.875rem",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#4f46e5",
                },
              }}
            >
              View Details
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export const JobCardV2 = memo(JobCardComponent, (prev, next) => prev.job.id === next.job.id);
JobCardV2.displayName = "JobCardV2";
