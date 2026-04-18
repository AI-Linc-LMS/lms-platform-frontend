"use client";

import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import Link from "next/link";
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
import { JobV2, formatJobPassoutYear } from "@/lib/services/jobs-v2.service";
import { formatDistanceToNow } from "@/lib/utils/date-utils";
import { jobsV2Service } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import {
  MapPin,
  Heart,
  Clock,
  Briefcase,
  ChevronRight,
  Banknote,
  GraduationCap,
} from "lucide-react";
import { formatJobDescriptionBody } from "@/lib/utils/format-job-description";

interface JobCardV2Props {
  job: JobV2;
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  /** Query string without `?` — e.g. `page=2&page_size=20` to preserve list state on detail/back. */
  jobsListQuery?: string;
}

const JobCardV2Component = ({ job, onFavoriteChange, jobsListQuery }: JobCardV2Props) => {
  const { showToast } = useToast();
  const { isAdminMode } = useAdminMode();
  const [isFavorite, setIsFavorite] = useState(job.is_favourited ?? false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(job.is_favourited ?? false);
  }, [job.is_favourited]);

  const handleFavorite = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (favoriteLoading) return;
      setFavoriteLoading(true);
      const nextState = !isFavorite;
      setIsFavorite(nextState);
      try {
        const res = await jobsV2Service.toggleFavorite(job.id);
        setIsFavorite(res.favorited);
        onFavoriteChange?.(job.id, res.favorited);
        if (res.message) {
          showToast(res.message, "info");
        }
      } catch (err) {
        setIsFavorite(!nextState);
        showToast((err as Error)?.message ?? "Failed to update favorite", "error");
      } finally {
        setFavoriteLoading(false);
      }
    },
    [job.id, isFavorite, favoriteLoading, onFavoriteChange, showToast]
  );

  const getPostedLabel = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "Recently";
      return formatDistanceToNow(d);
    } catch {
      return "Recently";
    }
  };

  const chipLabels = useMemo(() => {
    const dedupe = (items: unknown[], max: number): string[] => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const x of items) {
        const s = String(x ?? "").trim();
        if (!s) continue;
        const k = s.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(s);
        if (out.length >= max) break;
      }
      return out;
    };
    const fromSkills = [...(job.mandatory_skills ?? []), ...(job.key_skills ?? [])];
    if (fromSkills.length > 0) return dedupe(fromSkills, 5);
    return dedupe(job.tags ?? [], 5);
  }, [job.mandatory_skills, job.key_skills, job.tags]);
  const passoutYear = formatJobPassoutYear(job.applicable_passout_year);
  const descriptionPreview = useMemo(
    () => formatJobDescriptionBody(job.job_description),
    [job.job_description]
  );

  return (
    <Paper
      elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
        borderRadius: 2.5,
        marginBottom: 2,
        border: "1px solid",
        borderColor: "rgba(99, 102, 241, 0.12)",
        backgroundColor: "#ffffff",
        transition: "all 0.2s ease",
        width: "100%",
        maxWidth: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        "&:hover": {
          borderColor: "rgba(99, 102, 241, 0.35)",
          boxShadow: "0 8px 24px rgba(99, 102, 241, 0.12)",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, width: "100%" }}>
        <Avatar
          src={job.company_logo}
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
            <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  mb: 0.5,
                  color: "#1a1f2e",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {job.job_title || "Job Title"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                {job.company_name || "Company Name"}
              </Typography>
            </Box>
            {!isAdminMode && (
              <Tooltip title={isFavorite ? "Remove from favourites" : "Add to favourites"} arrow>
                <IconButton
                  onClick={handleFavorite}
                  size="small"
                  disabled={favoriteLoading}
                  sx={{
                    color: isFavorite ? "#6366f1" : "text.secondary",
                    "&:hover": {
                      backgroundColor: "rgba(99, 102, 241, 0.08)",
                    },
                  }}
                >
                  <Heart size={18} fill={isFavorite ? "#6366f1" : "none"} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1, sm: 1.5 },
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
            {job.years_of_experience && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Briefcase size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {job.years_of_experience}
                </Typography>
              </Box>
            )}
            {passoutYear && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <GraduationCap size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  Passout {passoutYear}
                </Typography>
              </Box>
            )}
            {job.salary && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Banknote size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  {job.salary}
                </Typography>
              </Box>
            )}
            {job.created_at && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Clock size={14} style={{ color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {getPostedLabel(job.created_at)}
                </Typography>
              </Box>
            )}
          </Box>

          {descriptionPreview && (
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
              {descriptionPreview}
            </Typography>
          )}

          {chipLabels.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                {chipLabels.map((tag, index) => (
                <Chip
                  key={`${tag}-${index}`}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 26,
                    fontSize: "0.75rem",
                    backgroundColor: "rgba(99, 102, 241, 0.04)",
                    color: "#6366f1",
                    borderColor: "rgba(99, 102, 241, 0.3)",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "rgba(99, 102, 241, 0.1)",
                      borderColor: "#6366f1",
                    },
                  }}
                />
              ))}
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 1.5,
              flexWrap: { xs: "wrap", sm: "nowrap" },
            }}
          >
            <Button
              component={Link}
              href={
                jobsListQuery
                  ? `/jobs-v2/${job.id}?${jobsListQuery}`
                  : `/jobs-v2/${job.id}`
              }
              variant="contained"
              endIcon={<ChevronRight size={16} />}
              sx={{
                borderRadius: 2,
                backgroundColor: "#6366f1",
                color: "#ffffff",
                textTransform: "none",
                px: { xs: 2, md: 2.5 },
                py: 0.75,
                fontSize: "0.875rem",
                fontWeight: 600,
                boxShadow: "none",
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
                minWidth: { xs: "auto", sm: 140 },
                "&:hover": {
                  backgroundColor: "#4f46e5",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
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

export const JobCardV2 = memo(JobCardV2Component, (prevProps, nextProps) => {
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.is_favourited === nextProps.job.is_favourited &&
    prevProps.job.applicable_passout_year === nextProps.job.applicable_passout_year &&
    prevProps.jobsListQuery === nextProps.jobsListQuery
  );
});
JobCardV2.displayName = "JobCardV2";
