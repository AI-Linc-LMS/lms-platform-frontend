"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  CircularProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";
import { config } from "@/lib/config";
import type { ArenaArgumentDto, ArenaTopicDetailDto } from "@/lib/community/widget-types";
import { useToast } from "@/components/common/Toast";
import { useImpactEconomy } from "@/lib/contexts/ImpactEconomyContext";

function ArenaDebateContent() {
  const searchParams = useSearchParams();
  const topicIdRaw = searchParams.get("topicId");
  const topicId = topicIdRaw ? parseInt(topicIdRaw, 10) : NaN;
  const { showToast } = useToast();
  const { refreshBalance } = useImpactEconomy();

  const [data, setData] = useState<ArenaTopicDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!config.communityWidgetApi || Number.isNaN(topicId)) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await communityService.getArenaTopicDetail(topicId);
    setData(res.ok ? (res.data ?? null) : null);
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const vote = async (arg: ArenaArgumentDto) => {
    if (!config.communityWidgetApi) return;
    const r = await communityService.postArenaArgumentVote(arg.id);
    if (r.ok) {
      showToast(r.data.voted ? "Upvoted" : "Vote removed", "success");
      await refreshBalance();
      await load();
    } else {
      showToast("Vote failed", "error");
    }
  };

  if (!config.communityWidgetApi) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography color="text.secondary">
            Enable <code>NEXT_PUBLIC_COMMUNITY_WIDGET_API=true</code> and open this page with a valid topicId to view the debate.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  if (Number.isNaN(topicId)) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography color="text.secondary">Missing topicId in the URL.</Typography>
        </Container>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!data?.topic) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography color="text.secondary">Topic not found or you do not have access.</Typography>
        </Container>
      </MainLayout>
    );
  }

  const { topic, arguments_a, arguments_b } = data;

  const column = (label: string, args: ArenaArgumentDto[], border: string) => (
    <Paper elevation={0} sx={{ p: 2, border: `1px solid var(--border-default)`, borderTop: `4px solid ${border}`, flex: 1, minWidth: 0 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "var(--font-primary-dark)" }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {args.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No arguments yet.
          </Typography>
        ) : (
          args.map((a) => (
            <Paper key={a.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {a.body}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">
                  {a.author_name}
                </Typography>
                <Button size="small" startIcon={<IconWrapper icon="mdi:thumb-up-outline" size={16} />} onClick={() => vote(a)} sx={{ textTransform: "none" }}>
                  {a.upvotes}
                </Button>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Paper>
  );

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: "var(--font-primary-dark)" }}>
          {topic.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Two columns: top-voted arguments per side. Use votes to surface the best counterpoints.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          {column(topic.side_a_label, arguments_a, "var(--secondary-500)")}
          {column(topic.side_b_label, arguments_b, "var(--primary-500)")}
        </Box>
        <Box sx={{ mt: 3 }}>
          <Button startIcon={<IconWrapper icon="mdi:refresh" size={18} />} onClick={load} sx={{ textTransform: "none" }}>
            Refresh
          </Button>
        </Box>
      </Container>
    </MainLayout>
  );
}

export default function ArenaDebatePage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        </MainLayout>
      }
    >
      <ArenaDebateContent />
    </Suspense>
  );
}
