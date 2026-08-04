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
import { ArticleBodySkeleton } from "@/components/courses/CourseSkeletons";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

/**
 * Admin view of an adaptive article: renders the content at a tier (switchable — uncached tiers
 * generate on demand, at cost, which the pills now say) plus the auto-glossary.
 *
 * Editable. It was read-only, so the only way to fix a typo in a 2000-word hand-written article
 * was to delete it and retype the whole thing — while `updateContent` sat in the service with
 * zero callers and a live PATCH route behind it.
 *
 * Works on draft courses (admin endpoint, not publish-gated).
 */
export function AdminArticleViewer({
  courseId,
  articleId,
  submoduleId,
  onSaved,
}: {
  courseId: number;
  articleId: number;
  /** Editing needs the submodule: the content route is scoped through it. */
  submoduleId?: number;
  onSaved?: () => void;
}) {
  const { showToast } = useToast();
  const [article, setArticle] = useState<AdaptiveArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<ReadingTier>("Intermediate");
  const [html, setHtml] = useState("");
  const [tierLoading, setTierLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const saveEdit = useCallback(async () => {
    if (!submoduleId || savingEdit) return;
    setSavingEdit(true);
    try {
      // Saves into the tier currently on screen, not a flattened article — a generated article
      // carries several, and rewriting all of them would drop the levels the admin was not
      // looking at.
      await adminAdaptiveCourseService.updateContent(submoduleId, "article", articleId, {
        body: draft,
        reading_tier: tier,
      });
      setHtml(draft);
      setEditing(false);
      showToast("Article saved.", "success");
      onSaved?.();
    } catch (e) {
      // Stays open holding what was typed: a failed save must not also lose the edit.
      showToast(getAxiosErrorDetail(e, "Couldn't save the article."), "error");
    } finally {
      setSavingEdit(false);
    }
  }, [submoduleId, savingEdit, draft, tier, articleId, showToast, onSaved]);

  const load = useCallback(async () => {
    try {
      const d = await adminAdaptiveCourseService.getCourseArticle(courseId, articleId);
      setArticle(d);
      setTier(d.rendered_tier || d.default_tier);
      setHtml(d.content_html);
    } catch (e) {
      setError(getAxiosErrorDetail(e, "Couldn't load article."));
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
      showToast(getAxiosErrorDetail(e, "Couldn't render that level."), "error");
    } finally {
      setTierLoading(false);
    }
  }

  if (loading) return <ArticleBodySkeleton />;
  if (error) return <Typography sx={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 700, py: 2 }}>{error}</Typography>;
  if (!article) return null;

  const glossary = Object.entries(article.glossary ?? {});
  // Which reading levels actually exist. Anything not in here costs a model call to produce.
  const available = article.available_tiers ?? [];

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
          // A tier that has never been rendered is not a view filter — clicking it calls the
          // model and writes a new tier onto the article, at cost. These pills looked identical
          // to the ones that just switch view, so an admin checking their own hand-written
          // article could spend credits (and overwrite their words) by clicking what they
          // reasonably read as a tab.
          const needsGeneration = !available.includes(t);
          return (
            <ButtonBase
              key={t}
              onClick={() => {
                if (needsGeneration && !window.confirm(
                  `"${t}" has not been written yet. Generating it uses AI credits and adds a new ` +
                  `reading level to this article. Continue?`
                )) return;
                void switchTier(t);
              }}
              disabled={tierLoading}
              title={needsGeneration ? "Not written yet — generating this level uses AI credits" : undefined}
              sx={{ px: 1.5, py: 0.5, borderRadius: 999, fontWeight: 800, fontSize: "0.74rem", gap: 0.4,
                color: active ? "white" : needsGeneration ? "text.secondary" : "text.primary",
                background: active ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                border: active ? "1px solid transparent" : `1px ${needsGeneration ? "dashed" : "solid"} color-mix(in srgb, var(--border-default) 75%, transparent)`,
                "&:disabled": { opacity: 0.6 } }}>
              {needsGeneration && <Icon icon="mdi:auto-fix" width={12} />}
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
          {/* Editing is offered only where the route can be reached — the content PATCH is
              scoped through the submodule, so without one there is nothing to save into. */}
          {submoduleId && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 1.25 }}>
              {editing ? (
                <>
                  <ButtonBase
                    onClick={() => setEditing(false)}
                    disabled={savingEdit}
                    sx={{ px: 1.6, py: 0.55, borderRadius: 999, fontWeight: 800, fontSize: "0.76rem", color: "text.secondary" }}
                  >
                    Cancel
                  </ButtonBase>
                  <ButtonBase
                    onClick={() => void saveEdit()}
                    disabled={savingEdit || !draft.trim()}
                    sx={{ px: 1.8, py: 0.55, borderRadius: 999, fontWeight: 800, fontSize: "0.76rem", color: "white", gap: 0.5,
                      background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", "&:disabled": { opacity: 0.6 } }}
                  >
                    <Icon icon="mdi:content-save-outline" width={14} />
                    {savingEdit ? "Saving…" : `Save ${tier}`}
                  </ButtonBase>
                </>
              ) : (
                <ButtonBase
                  onClick={() => { setDraft(html); setEditing(true); }}
                  sx={{ px: 1.6, py: 0.55, borderRadius: 999, fontWeight: 800, fontSize: "0.76rem", color: "#6366f1", gap: 0.5 }}
                >
                  <Icon icon="mdi:pencil-outline" width={14} />
                  Edit this reading level
                </ButtonBase>
              )}
            </Box>
          )}
          {editing ? (
            <Box
              component="textarea"
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
              disabled={savingEdit}
              spellCheck
              sx={{
                width: "100%", minHeight: 380, resize: "vertical", p: 1.5, borderRadius: 2,
                fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.7,
                color: "var(--font-primary)", bgcolor: "var(--card-bg)",
                border: "1px solid color-mix(in srgb, #6366f1 45%, transparent)",
                "&:focus": { outline: "2px solid color-mix(in srgb, #6366f1 40%, transparent)" },
              }}
            />
          ) : (
            <AdaptiveArticleBody html={html} explainTerms={[]} onExplain={() => {}} />
          )}
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
