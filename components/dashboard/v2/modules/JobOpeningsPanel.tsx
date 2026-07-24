"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { jobsV2Service, type JobV2 } from "@/lib/services/jobs-v2.service";
import { ModuleEmpty, ModuleHeader, ModulePanel, ModuleRowsSkeleton, Pill, timeUntil } from "./shared";

const GRADIENT = "linear-gradient(135deg, #10b981, #0d9488)";
const SOON_MS = 14 * 86_400_000;

function isOpen(j: JobV2): boolean {
  return j.status !== "closed" && j.status !== "completed" && j.status !== "inactive";
}
function deadlineMs(j: JobV2): number {
  if (!j.application_deadline) return Infinity;
  const ms = new Date(j.application_deadline).getTime();
  return Number.isNaN(ms) || ms < Date.now() ? Infinity : ms;
}

/** Approaching-deadline jobs first (soonest), then latest posted. */
function selectJobs(list: JobV2[]): JobV2[] {
  const now = Date.now();
  return list
    .filter(isOpen)
    .sort((a, b) => {
      const ad = deadlineMs(a), bd = deadlineMs(b);
      const aSoon = ad - now < SOON_MS, bSoon = bd - now < SOON_MS;
      if (aSoon && bSoon) return ad - bd;
      if (aSoon) return -1;
      if (bSoon) return 1;
      const ac = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bc = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bc - ac;
    })
    .slice(0, 3);
}

export function JobOpeningsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<JobV2[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    jobsV2Service
      .getJobs()
      .then((res) => { if (!cancelled) setItems(selectJobs(res?.results ?? [])); })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, []);

  if (hidden) return null;

  return (
    <ModulePanel>
      <ModuleHeader icon="mdi:briefcase-outline" title="Job openings" gradient={GRADIENT} onViewAll={() => router.push("/jobs-v2")} />
      {items == null ? (
        <ModuleRowsSkeleton rows={2} />
      ) : items.length === 0 ? (
        <ModuleEmpty icon="mdi:briefcase-search-outline" message="No open roles right now - check back soon." />
      ) : (
        <Stack spacing={1}>
          {items.map((j) => {
            const dl = timeUntil(j.application_deadline);
            const applied = j.has_applied;
            return (
              <ButtonBase
                key={j.id}
                onClick={() => router.push(`/jobs-v2/${j.id}`)}
                sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", p: 1, borderRadius: 2.5, border: "1px solid #eef2f7", "&:hover": { bgcolor: "#f0fdf9", borderColor: "#a7f3d0" } }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "#047857", bgcolor: "#d1fae5", fontWeight: 800, fontSize: "1rem" }}>
                    {(j.company_name || "?").charAt(0).toUpperCase()}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0f172a" }}>{j.job_title}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
                      <Typography noWrap sx={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, maxWidth: 120 }}>
                        {j.company_name}{j.location ? ` · ${j.location}` : ""}
                      </Typography>
                      {applied ? (
                        <Pill icon="mdi:check" color="#15803d" bg="#f0fdf4">Applied</Pill>
                      ) : dl ? (
                        <Pill icon="mdi:timer-sand" color={dl.soon ? "#b91c1c" : "#475569"} bg={dl.soon ? "#fef2f2" : "#f1f5f9"}>Closes {dl.text}</Pill>
                      ) : null}
                    </Stack>
                  </Box>
                  <Icon icon="mdi:chevron-right" width={18} color="#cbd5e1" />
                </Stack>
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    </ModulePanel>
  );
}
