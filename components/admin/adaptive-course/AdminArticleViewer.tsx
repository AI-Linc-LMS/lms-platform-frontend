"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { AdaptiveArticleBody } from "@/components/adaptive-quiz/article/AdaptiveArticleBody";
import {
  READING_TIERS,
  type AdaptiveArticleDetail,
  type ReadingTier,
} from "@/lib/services/adaptive-course.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Read-only admin preview of an adaptive article: renders the content at a tier
 * (switchable — uncached tiers generate on demand) plus the auto-glossary.
 * Works on draft courses (admin endpoint, not publish-gated).
 */
export function AdminArticleViewer({ courseId, articleId }: { courseId: number; articleId: number }) {
  const { showToast } = useToast();
  const [article, setArticle] = useState<AdaptiveArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<ReadingTier>("Intermediate");
  const [html, setHtml] = useState("");
  const [tierLoading, setTierLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await adminAdaptiveCourseService.getCourseArticle(courseId, articleId);
      setArticle(d);
      setTier(d.rendered_tier || d.default_tier);
      setHtml(d.content_html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load article.");
    } finally {
      setLoading(false);
    }
  }, [courseId, articleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchTier(next: ReadingTier) {
    if (next === tier || tierLoading) return;
    setTierLoading(true);
    try {
      const res = await adminAdaptiveCourseService.renderCourseArticleTier(courseId, articleId, next);
      setTier(res.tier);
      setHtml(res.content_html);
      setArticle((a) => (a ? { ...a, available_tiers: Array.from(new Set([...a.available_tiers, res.tier])) } : a));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't render that level.", "error");
    } finally {
      setTierLoading(false);
    }
  }

  if (loading) return <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", py: 2 }}>Loading article…</Typography>;
  if (error) return <Typography sx={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 700, py: 2 }}>{error}</Typography>;
  if (!article) return null;

  const glossary = Object.entries(article.glossary ?? {});

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
      {article.concepts.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: "#a855f7", fontWeight: 800, fontSize: "0.74rem" }}>
            <Icon icon="mdi:brain" width={14} />
            Builds:
          </Box>
          {article.concepts.map((c) => (
            <Box key={c} component="span" sx={{
              px: 0.9, py: 0.25, borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
              color: "#6366f1", bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
              border: "1px solid color-mix(in srgb, #6366f1 30%, transparent)",
            }}>
              {c}
            </Box>
          ))}
        </Box>
      )}

      {/* Tier switcher */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Reading level
        </Typography>
        {READING_TIERS.map((t) => {
          const active = t === tier;
          return (
            <ButtonBase key={t} onClick={() => void switchTier(t)} disabled={tierLoading}
              sx={{ px: 1.5, py: 0.5, borderRadius: 999, fontWeight: 800, fontSize: "0.74rem",
                color: active ? "white" : "text.primary",
                background: active ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                "&:disabled": { opacity: 0.6 } }}>
              {t}
            </ButtonBase>
          );
        })}
        {tierLoading && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "#a855f7" }}>
            <Icon icon="mdi:loading" width={14} className="acb-spin" />
            <Typography sx={{ fontSize: "0.74rem", fontWeight: 700 }}>rendering…</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 240px" }, gap: 2, alignItems: "start" }}>
        <Box sx={{ borderRadius: 3, p: 2, bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)" }}>
          <AdaptiveArticleBody html={html} explainTerms={[]} onExplain={() => {}} />
        </Box>
        {glossary.length > 0 && (
          <Box sx={{ borderRadius: 3, p: 1.75, bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)", border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#a855f7", mb: 1 }}>
              Glossary · {glossary.length}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {glossary.map(([term, def]) => (
                <Box key={term}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.8rem" }}>{term}</Typography>
                  <Typography sx={{ fontSize: "0.76rem", color: "text.secondary", lineHeight: 1.4 }}>{def}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      <style jsx global>{`
        @keyframes acb-spin { to { transform: rotate(360deg); } }
        .acb-spin { animation: acb-spin 0.9s linear infinite; }
      `}</style>
    </Box>
  );
}
