"use client";

import React, { useState, useCallback, memo } from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
} from "@mui/material";
import { Job } from "@/lib/services/jobs.service";
import {
  MapPin,
  Heart,
  ExternalLink,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface JobCardProps {
  job: Job;
}

const JobCardComponent = ({ job }: JobCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsFavorite(prev => !prev);
  }, []);

  const handleApply = useCallback(() => {
    window.open(job.job_url, "_blank");
  }, [job.job_url]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        marginBottom: 2,
        border: "1px solid",
        borderColor: "color-mix(in srgb, var(--font-primary) 15%, transparent)",
        backgroundColor: "var(--card-bg)",
        transition: "all 0.2s ease",
        width: "100%",
        maxWidth: "100%",
        "&:hover": {
          borderColor: "color-mix(in srgb, var(--font-primary) 24%, transparent)",
          boxShadow: "0 1px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, width: "100%" }}>
        {/* Company Logo - Always show */}
        <Avatar
          src={job.company_logo}
          alt={job.company_name}
          sx={{
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "var(--accent-indigo)",
            color: "var(--font-light)",
            fontSize: { xs: "1rem", md: "1.25rem" },
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {job.company_name?.[0]?.toUpperCase() || "C"}
        </Avatar>

        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          {/* Header */}
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
                  color: "var(--font-primary)",
                  lineHeight: 1.3,
                }}
              >
                {job.job_title || "Job Title"}
              </Typography>
              <Tooltip
                title={job.company_name || "Company Name"}
                arrow
                placement="top"
                enterDelay={300}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    mb: 0.5,
                    cursor: "help",
                  }}
                >
                  {job.company_name || "Company Name"}
                </Typography>
              </Tooltip>
              {job.rating && (
                <Tooltip
                  title={`Rating: ${String(job.rating)}`}
                  arrow
                  placement="top"
                  enterDelay={300}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                      mb: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      cursor: "help",
                    }}
                  >
                    {String(job.rating)}
                  </Typography>
                </Tooltip>
              )}
            </Box>
            <IconButton
              onClick={handleFavorite}
              size="small"
              sx={{
                color: isFavorite ? "var(--accent-indigo)" : "text.secondary",
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
              }}
            >
              <Heart size={18} fill={isFavorite ? "var(--accent-indigo)" : "none"} />
            </IconButton>
          </Box>

          {/* Job Details */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              mb: 1.5,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MapPin size={14} style={{ color: "var(--font-secondary)" }} />
              <Typography
                variant="body2"
                sx={{ fontSize: "0.875rem", color: "text.secondary" }}
              >
                {job.location || "Location not specified"}
              </Typography>
            </Box>
            {job.experience && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Briefcase size={14} style={{ color: "var(--font-secondary)" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {String(job.experience)}
                </Typography>
              </Box>
            )}
            {job.salary && (
              <Tooltip
                title={`Salary: ${String(job.salary)}`}
                arrow
                placement="top"
                enterDelay={300}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <DollarSign size={14} style={{ color: "var(--font-secondary)" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.875rem",
                      color: "text.secondary",
                      fontWeight: 500,
                      cursor: "help",
                    }}
                  >
                    {String(job.salary).includes("$") ||
                    String(job.salary).includes("₹") ||
                    String(job.salary).includes("€") ||
                    String(job.salary).includes("£")
                      ? String(job.salary).replace(/^[$₹€£]\s*/, "")
                      : String(job.salary)}
                  </Typography>
                </Box>
              </Tooltip>
            )}
            {job.job_post_date && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Clock size={14} style={{ color: "var(--font-secondary)" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {String(job.job_post_date)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Description */}
          {job.job_description && (
            <Tooltip
              title={String(job.job_description)}
              arrow
              placement="top"
              enterDelay={300}
            >
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
                  cursor: "help",
                }}
              >
                {String(job.job_description)}
              </Typography>
            </Tooltip>
          )}

          {/* Tags */}
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
                    color: "var(--accent-indigo)",
                    borderColor: "var(--accent-indigo)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                      borderColor: "var(--accent-indigo-dark)",
                    },
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
                    backgroundColor: "transparent",
                    color: "var(--accent-indigo)",
                    borderColor: "var(--accent-indigo)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                      borderColor: "var(--accent-indigo-dark)",
                    },
                  }}
                />
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 1.5,
              flexWrap: { xs: "wrap", sm: "nowrap" },
            }}
          >
            <Button
              variant="contained"
              onClick={handleApply}
              sx={{
                borderRadius: 2,
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                textTransform: "none",
                px: { xs: 2, md: 2.5 },
                py: 0.75,
                fontSize: "0.875rem",
                fontWeight: 600,
                boxShadow: "none",
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
                minWidth: { xs: "auto", sm: 120 },
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                  boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                },
              }}
            >
              Easy Apply
            </Button>
            <Button
              variant="outlined"
              onClick={handleApply}
              startIcon={<ExternalLink size={16} />}
              sx={{
                borderRadius: 2,
                borderColor: "var(--accent-indigo)",
                color: "var(--accent-indigo)",
                textTransform: "none",
                px: { xs: 2, md: 2.5 },
                py: 0.75,
                fontSize: "0.875rem",
                fontWeight: 600,
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
                minWidth: { xs: "auto", sm: 140 },
                "&:hover": {
                  borderColor: "var(--accent-indigo-dark)",
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 7%, transparent)",
                },
              }}
            >
              View Details
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export const JobCard = memo(JobCardComponent, (prevProps, nextProps) => {
  return prevProps.job.id === nextProps.job.id;
});
JobCard.displayName = "JobCard";
