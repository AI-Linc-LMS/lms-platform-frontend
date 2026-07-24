"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { communityService, type Thread } from "@/lib/services/community.service";
import { avatarColor } from "../parts";
import { ModuleEmpty, ModuleHeader, ModulePanel, ModuleRowsSkeleton } from "./shared";

const GRADIENT = "linear-gradient(135deg, #a855f7, #ec4899)";

function netScore(t: Thread): number {
  return (t.upvotes ?? 0) - (t.downvotes ?? 0);
}

export function CommunityHighlightsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<Thread[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    communityService
      .getThreads({ sort: "popular" })
      .then((list) => {
        if (cancelled) return;
        // Server sorts by popularity; guard with a client sort in case it doesn't.
        const top = [...(list ?? [])].sort((a, b) => netScore(b) - netScore(a)).slice(0, 3);
        setItems(top);
      })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, []);

  if (hidden) return null;

  return (
    <ModulePanel>
      <ModuleHeader icon="mdi:forum-outline" title="Community highlights" gradient={GRADIENT} onViewAll={() => router.push("/community")} />
      {items == null ? (
        <ModuleRowsSkeleton rows={3} />
      ) : items.length === 0 ? (
        <ModuleEmpty icon="mdi:message-outline" message="No community posts yet - start the conversation." />
      ) : (
        <Stack spacing={1}>
          {items.map((t) => {
            const name = t.author?.name || t.author?.user_name || "Member";
            return (
              <ButtonBase
                key={t.id}
                onClick={() => router.push(`/community/${t.id}`)}
                sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", p: 1, borderRadius: 2.5, border: "1px solid #eef2f7", "&:hover": { bgcolor: "#fdf4ff", borderColor: "#f0abfc" } }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: "0.85rem", bgcolor: avatarColor(name) }}>
                    {name.charAt(0).toUpperCase()}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {t.is_pinned && (
                      <Typography component="span" sx={{ fontSize: "0.62rem", fontWeight: 800, color: "#c026d3", mr: 0.5 }}>
                        <Icon icon="mdi:pin" width={11} style={{ verticalAlign: "-2px" }} /> PINNED
                      </Typography>
                    )}
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0f172a" }}>{t.title}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.4 }}>
                      <Typography noWrap sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600, maxWidth: 96 }}>{name}</Typography>
                      <Stack direction="row" spacing={0.3} alignItems="center">
                        <Icon icon="mdi:arrow-up-bold" width={13} color="#a855f7" />
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#7c3aed" }}>{netScore(t)}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.3} alignItems="center">
                        <Icon icon="mdi:comment-outline" width={12} color="#94a3b8" />
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>{t.comments_count ?? 0}</Typography>
                      </Stack>
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
