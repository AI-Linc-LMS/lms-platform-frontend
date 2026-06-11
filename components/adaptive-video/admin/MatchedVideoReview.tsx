"use client";

import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, type ReactNode } from "react";
import {
  adaptiveVideoAdminService,
  type VimeoVideoWire,
  type VideoCompanion,
} from "@/lib/services/adaptive-video.service";
import type { AdminAdaptiveCourseVideoCompanion } from "@/lib/services/admin/admin-adaptive-course.service";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Author review of the AI-matched video for a submodule (spec §"author confirm/
 * override"). Shows the matched video, lets the author regenerate its scaffolds,
 * or swap it for another catalog video via search.
 */
export function MatchedVideoReview({
  companion,
  onChanged,
}: {
  companion: AdminAdaptiveCourseVideoCompanion;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<null | "regen" | "swap" | "sync">(null);
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<VimeoVideoWire[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [transcribedOnly, setTranscribedOnly] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [preview, setPreview] = useState<VideoCompanion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const togglePreview = async () => {
    if (previewOpen) {
      setPreviewOpen(false);
      return;
    }
    setPreviewOpen(true);
    if (!preview) {
      setPreviewLoading(true);
      try {
        setPreview(await adaptiveVideoAdminService.getCompanion(companion.id));
      } catch {
        setNote("Couldn't load the preview.");
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const run = async (kind: "regen" | "swap" | "sync", fn: () => Promise<unknown>, ok: string) => {
    setBusy(kind);
    setNote(null);
    try {
      await fn();
      setNote(ok);
      setPreview(null); // scaffolds/video may have changed — refetch on next open
      onChanged?.();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const search = async () => {
    setSearching(true);
    try {
      const { results } = await adaptiveVideoAdminService.searchCatalog(q, transcribedOnly);
      setResults(results);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const hasVideo = !!companion.video_title;

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", p: 1.75 }}>
        {/* Thumbnail */}
        <Box
          sx={{
            position: "relative", width: 96, height: 54, borderRadius: 2, overflow: "hidden", flexShrink: 0,
            bgcolor: "#0f0c29", display: "grid", placeItems: "center",
          }}
        >
          {companion.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Icon icon="mdi:video-outline" width={22} style={{ color: "#64618a" }} />
          )}
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(15,12,41,0.25)" }}>
            <Icon icon="mdi:play-circle" width={24} style={{ color: "rgba(255,255,255,0.92)" }} />
          </Box>
          {companion.duration_seconds > 0 && (
            <Box sx={{ position: "absolute", bottom: 3, right: 3, px: 0.5, borderRadius: 0.75, bgcolor: "rgba(0,0,0,0.72)", color: "#fff", fontSize: "0.6rem", fontWeight: 700 }}>
              {fmt(companion.duration_seconds)}
            </Box>
          )}
        </Box>

        {/* Title + meta */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.4 }}>
            <Typography
              sx={{ fontWeight: 800, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {companion.title}
            </Typography>
            <StatusPill active={companion.is_active} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
              {hasVideo ? companion.video_title : "No video attached"}
            </Typography>
            <MetaDot />
            <MetaChip icon="mdi:lightning-bolt" label={`${companion.check_in_count} check-ins`} />
          </Box>
        </Box>
      </Box>

      {/* Action toolbar */}
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1.25, flexWrap: "wrap",
          borderTop: "1px solid var(--border-default, #ececf1)",
          bgcolor: "var(--bg-subtle, #fafafb)",
        }}
      >
        <ToolbarButton
          icon={busy === "regen" ? undefined : "mdi:refresh"}
          loading={busy === "regen"}
          disabled={!!busy}
          onClick={() => run("regen", () => adaptiveVideoAdminService.regenerate(companion.id), "Scaffolds regenerated.")}
        >
          Regenerate
        </ToolbarButton>
        <ToolbarButton
          icon={previewOpen ? "mdi:eye-off-outline" : "mdi:eye-outline"}
          active={previewOpen}
          disabled={!!busy}
          onClick={togglePreview}
        >
          {previewOpen ? "Hide preview" : "Preview"}
        </ToolbarButton>
        <ToolbarButton
          icon="mdi:swap-horizontal"
          active={showSearch}
          disabled={!!busy}
          onClick={() => setShowSearch((v) => !v)}
        >
          Swap video
        </ToolbarButton>
        <Box sx={{ flex: 1 }} />
        <ToolbarButton
          icon={companion.is_active ? "mdi:eye-off" : "mdi:check-circle-outline"}
          tone={companion.is_active ? "danger" : "default"}
          loading={busy === "sync"}
          disabled={!!busy}
          onClick={() => run("sync", () => adaptiveVideoAdminService.toggleActive(companion.id), "Visibility updated.")}
        >
          {companion.is_active ? "Deactivate" : "Activate"}
        </ToolbarButton>
      </Box>

      <Box sx={{ px: 1.75, pb: showSearch || previewOpen || note ? 1.75 : 0 }}>

      {previewOpen && (
        <CompanionPreview loading={previewLoading} data={preview} />
      )}

      {showSearch && (
        <Box
          sx={{
            mt: 1.75, p: 1.75, borderRadius: 2.5,
            bgcolor: "var(--bg-subtle, #fafafb)",
            border: "1px solid var(--border-default, #ececf1)",
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
            <Icon icon="mdi:swap-horizontal" width={16} style={{ color: "#6366f1" }} />
            <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>
              Swap from catalog
            </Typography>
            <Typography sx={{ ml: "auto", fontSize: "0.7rem", color: "text.disabled", display: "inline-flex", alignItems: "center", gap: 0.4 }}>
              <Icon icon="mdi:cloud-check-outline" width={13} /> auto-synced nightly
            </Typography>
          </Box>

          {/* Search bar */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search your Vimeo catalog by title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              InputProps={{
                startAdornment: <Icon icon="mdi:magnify" width={18} style={{ color: "#94a3b8", marginRight: 6 }} />,
                sx: { borderRadius: 2.5, bgcolor: "var(--card-bg, #fff)" },
              }}
            />
            <Button
              variant="contained"
              onClick={search}
              disabled={searching}
              sx={{ borderRadius: 2.5, px: 2.5, fontWeight: 700, textTransform: "none",
                background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              {searching ? <CircularProgress size={18} color="inherit" /> : "Search"}
            </Button>
          </Box>

          {/* Transcribed-only toggle */}
          <Box
            component="button"
            onClick={() => setTranscribedOnly((v) => !v)}
            sx={{ all: "unset", cursor: "pointer", mt: 1, display: "inline-flex", alignItems: "center", gap: 0.6,
              fontSize: "0.76rem", fontWeight: 600, color: "text.secondary" }}
          >
            <Icon icon={transcribedOnly ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"} width={17}
              style={{ color: transcribedOnly ? "#6366f1" : "#94a3b8" }} />
            Transcribed only
            <Typography component="span" sx={{ fontSize: "0.7rem", color: "text.disabled" }}>
              (a companion needs a transcript)
            </Typography>
          </Box>

          {/* Results */}
          <Box sx={{ mt: 1.25, maxHeight: 280, overflow: "auto", display: "flex", flexDirection: "column", gap: 0.75 }}>
            {searched && results.length === 0 && (
              <Box sx={{ py: 2.5, textAlign: "center" }}>
                <Icon icon="mdi:movie-search-outline" width={26} style={{ color: "#cbd5e1" }} />
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.5 }}>
                  No matching videos. Try different keywords or sync the catalog.
                </Typography>
              </Box>
            )}
            {results.map((v) => (
                <Box
                  key={v.id}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.25, p: 1, borderRadius: 2,
                    bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)",
                    transition: "border-color 120ms ease",
                    "&:hover": { borderColor: "color-mix(in srgb, #6366f1 40%, transparent)" },
                  }}
                >
                  <Box sx={{ position: "relative", width: 72, height: 41, borderRadius: 1.5, overflow: "hidden", flexShrink: 0, bgcolor: "#0f0c29" }}>
                    {v.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <Box sx={{ position: "absolute", bottom: 2, right: 2, px: 0.5, borderRadius: 0.75, bgcolor: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "0.6rem", fontWeight: 700 }}>
                      {fmt(v.duration_seconds)}
                    </Box>
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.title}
                    </Typography>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, mt: 0.25,
                      fontSize: "0.7rem", fontWeight: 700, color: v.has_text_track ? "#16a34a" : "#f59e0b" }}>
                      <Icon icon={v.has_text_track ? "mdi:closed-caption" : "mdi:closed-caption-outline"} width={13} />
                      {v.has_text_track ? "Transcript" : "No transcript"}
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!!busy || !v.has_text_track}
                    onClick={() => run("swap", () => adaptiveVideoAdminService.swapVideo(companion.id, v.vimeo_id), "Video swapped.")}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, flexShrink: 0,
                      ...(busy === "swap" ? {} : {}) }}
                  >
                    {busy === "swap" ? <CircularProgress size={14} /> : "Use"}
                  </Button>
                </Box>
            ))}
          </Box>
        </Box>
      )}

      {note && (
        <Box sx={{ mt: 1.25, display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.25, py: 0.6, borderRadius: 2,
          bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)", border: "1px solid color-mix(in srgb, #6366f1 18%, transparent)" }}>
          <Icon icon="mdi:information-outline" width={15} style={{ color: "#6366f1" }} />
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>{note}</Typography>
        </Box>
      )}
      </Box>
    </Box>
  );
}

/** Status pill — Active (green) / Inactive (grey). */
function StatusPill({ active }: { active: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.85, py: 0.25, borderRadius: 999,
        fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase",
        color: active ? "#16a34a" : "#94a3b8",
        bgcolor: active ? "color-mix(in srgb, #16a34a 12%, transparent)" : "var(--bg-subtle, #f1f1f4)",
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: 999, bgcolor: active ? "#16a34a" : "#cbd5e1" }} />
      {active ? "Active" : "Inactive"}
    </Box>
  );
}

function MetaDot() {
  return <Box component="span" sx={{ width: 3, height: 3, borderRadius: 999, bgcolor: "var(--border-default, #d4d4d8)", flexShrink: 0 }} />;
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.35, fontSize: "0.74rem", fontWeight: 700, color: "text.secondary" }}>
      <Icon icon={icon} width={13} style={{ color: "#6366f1" }} />
      {label}
    </Box>
  );
}

/** Compact toolbar button — quiet by default, fills when active, red text for danger. */
function ToolbarButton({
  icon,
  children,
  onClick,
  disabled,
  loading,
  active,
  tone = "default",
}: {
  icon?: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  tone?: "default" | "danger";
}) {
  const danger = tone === "danger";
  return (
    <Button
      size="small"
      onClick={onClick}
      disabled={disabled}
      startIcon={loading ? <CircularProgress size={13} /> : icon ? <Icon icon={icon} width={15} /> : undefined}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        fontSize: "0.78rem",
        borderRadius: 2,
        px: 1.25,
        color: active ? "#fff" : danger ? "#dc2626" : "text.primary",
        bgcolor: active ? "#6366f1" : "transparent",
        border: "1px solid",
        borderColor: active ? "#6366f1" : "var(--border-default, #ececf1)",
        "& .MuiButton-startIcon": { mr: 0.6, color: active ? "#fff" : danger ? "#dc2626" : "#6366f1" },
        "&:hover": {
          bgcolor: active ? "#5457e6" : danger ? "color-mix(in srgb, #dc2626 8%, transparent)" : "var(--bg-subtle, #f4f4f6)",
          borderColor: active ? "#5457e6" : danger ? "color-mix(in srgb, #dc2626 40%, transparent)" : "color-mix(in srgb, #6366f1 40%, transparent)",
        },
      }}
    >
      {children}
    </Button>
  );
}

/** Inline admin preview: the actual video + the generated companion scaffolds. */
function CompanionPreview({ loading, data }: { loading: boolean; data: VideoCompanion | null }) {
  if (loading) {
    return (
      <Box sx={{ mt: 2, py: 4, textAlign: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!data) return null;
  return (
    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" }, gap: 2 }}>
      {/* Player */}
      <Box>
        {data.video?.embed_url ? (
          <Box sx={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 2, overflow: "hidden", bgcolor: "#0f0c29" }}>
            <iframe
              src={`${data.video.embed_url}?title=0&byline=0&portrait=0`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0 }}
              title={data.title}
            />
          </Box>
        ) : (
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>No video attached.</Typography>
        )}
        {data.takeaways?.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <PreviewHeading icon="mdi:lightbulb-on-outline" label="Takeaways" />
            <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
              {data.takeaways.map((t, i) => (
                <Typography key={i} component="li" sx={{ fontSize: "0.82rem", mb: 0.4 }}>{t}</Typography>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Scaffolds */}
      <Box>
        {data.chapters?.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <PreviewHeading icon="mdi:format-list-numbered" label={`Chapters (${data.chapters.length})`} />
            {data.chapters.map((c, i) => (
              <Typography key={i} sx={{ fontSize: "0.82rem", mb: 0.3 }}>
                <Box component="span" sx={{ color: "text.secondary", mr: 0.75 }}>{fmt(c.start_seconds)}</Box>
                {c.title}
              </Typography>
            ))}
          </Box>
        )}
        {data.check_ins?.length > 0 && (
          <Box>
            <PreviewHeading icon="mdi:lightning-bolt" label={`Check-ins (${data.check_ins.length})`} />
            {data.check_ins.map((c) => (
              <Box key={c.id} sx={{ mb: 1, p: 1, borderRadius: 1.5, bgcolor: "color-mix(in srgb, #6366f1 6%, transparent)" }}>
                <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
                  @ {fmt(c.timestamp_seconds)} · {c.concept}
                </Typography>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{c.question_text}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function PreviewHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
      <Icon icon={icon} width={15} style={{ color: "#6366f1" }} />
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}
