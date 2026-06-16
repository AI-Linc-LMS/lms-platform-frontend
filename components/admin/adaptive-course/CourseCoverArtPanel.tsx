"use client";

import { useRef, useState, type DragEvent } from "react";
import { Box, ButtonBase, CircularProgress, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveCourseService,
  type CourseImageTarget,
} from "@/lib/services/admin/admin-adaptive-course.service";

type Device = "desktop" | "mobile";

/**
 * Per-target render contract — mirrors EXACTLY how each image is shown to
 * students so the editor preview is a faithful WYSIWYG, not an approximation:
 *
 * - header → app/adaptive-courses/[courseId]/page.tsx (responsive banner: a wide
 *   1024/300 strip on desktop, 16/9 on mobile; rounded 4, with a drop shadow).
 * - card   → app/adaptive-courses/page.tsx (16/9 listing thumbnail; rounded 2.5,
 *   no shadow at rest).
 *
 * If those render sites change, update these values in lock-step.
 */
const SURFACE: Record<
  CourseImageTarget,
  {
    label: string;
    caption: string;
    radius: number;
    shadow: string;
    responsive: boolean;
    aspect: Record<Device, string>;
  }
> = {
  header: {
    label: "Header banner",
    caption: "Top of the course page",
    radius: 4,
    shadow: "0 18px 44px -22px rgba(99,102,241,0.45)",
    responsive: true,
    aspect: { desktop: "1024 / 300", mobile: "16 / 9" },
  },
  card: {
    label: "Card thumbnail",
    caption: "Course listing card",
    radius: 2.5,
    shadow: "none", // the listing card itself only lifts on hover; the image sits flat
    responsive: false,
    aspect: { desktop: "16 / 9", mobile: "16 / 9" },
  },
};

/**
 * Admin cover-art manager for an adaptive course: preview + regenerate (AI),
 * upload custom, and hide/show — independently for the header banner and the
 * card thumbnail. Each preview renders the image with the same aspect ratio,
 * corner radius and shadow students actually see (the header offers a
 * desktop/mobile toggle since its crop is responsive). Mounted on the admin
 * course detail page; calls back with the new url/hidden state so the parent
 * keeps its `course` in sync.
 */
export function CourseCoverArtPanel({
  courseId,
  headerUrl,
  headerHidden,
  cardUrl,
  cardHidden,
  onChange,
}: {
  courseId: number;
  headerUrl: string | null | undefined;
  headerHidden: boolean;
  cardUrl: string | null | undefined;
  cardHidden: boolean;
  onChange: (target: CourseImageTarget, patch: { url?: string | null; hidden?: boolean }) => void;
}) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 2, md: 2.5 },
        mb: 2.5,
        bgcolor: "color-mix(in srgb, var(--card-bg) 75%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
        <Icon icon="mdi:image-multiple-outline" width={18} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Cover art</Typography>
      </Box>
      <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", mb: 1.75 }}>
        Exactly how it appears to students on the course card &amp; header. Regenerate with AI, upload
        your own, or hide.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" },
          gap: { xs: 2.5, md: 2 },
          alignItems: "start",
        }}
      >
        <CoverSlot
          courseId={courseId}
          target="header"
          url={headerUrl}
          hidden={headerHidden}
          onChange={onChange}
        />
        <CoverSlot
          courseId={courseId}
          target="card"
          url={cardUrl}
          hidden={cardHidden}
          onChange={onChange}
        />
      </Box>
    </Box>
  );
}

function CoverSlot({
  courseId,
  target,
  url,
  hidden,
  onChange,
}: {
  courseId: number;
  target: CourseImageTarget;
  url: string | null | undefined;
  hidden: boolean;
  onChange: (target: CourseImageTarget, patch: { url?: string | null; hidden?: boolean }) => void;
}) {
  const cfg = SURFACE[target];
  const { showToast } = useToast();
  const [busy, setBusy] = useState<null | "regen" | "upload" | "hide">(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const regenerate = async () => {
    setBusy("regen");
    try {
      const res = await adminAdaptiveCourseService.regenerateCourseImage(courseId, target);
      onChange(target, { url: res.url, hidden: res.hidden });
      showToast(`New ${cfg.label.toLowerCase()} generated.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't generate the image.", "error");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    setBusy("upload");
    try {
      const res = await adminAdaptiveCourseService.uploadCourseImage(courseId, target, file);
      onChange(target, { url: res.url, hidden: res.hidden });
      showToast(`${cfg.label} updated.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't upload the image.", "error");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleHidden = async () => {
    setBusy("hide");
    try {
      const res = await adminAdaptiveCourseService.setCourseImageVisibility(courseId, target, !hidden);
      onChange(target, { hidden: res.hidden });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update visibility.", "error");
    } finally {
      setBusy(null);
    }
  };

  const anyBusy = busy !== null;

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (anyBusy) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.75,
          minHeight: 30,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.primary" }}>
            {cfg.label}
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{cfg.caption}</Typography>
        </Box>
        {cfg.responsive && <DeviceToggle device={device} onChange={setDevice} />}
      </Box>

      <Box
        onClick={() => {
          if (!url && !anyBusy) fileRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!anyBusy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: cfg.responsive ? cfg.aspect[device] : cfg.aspect.desktop,
          borderRadius: cfg.radius,
          overflow: "hidden",
          bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)",
          // Faithful to the real surface only when an image is actually shown;
          // empty/hidden slots get the editor's dashed dropzone affordance.
          boxShadow: url && !hidden ? cfg.shadow : "none",
          border: url
            ? "none"
            : `1px dashed color-mix(in srgb, ${dragOver ? "#6366f1" : "var(--border-default)"} 90%, transparent)`,
          outline: dragOver ? "2px solid #6366f1" : "none",
          outlineOffset: -2,
          cursor: !url && !anyBusy ? "pointer" : "default",
          transition: "box-shadow .2s ease, outline-color .15s ease, border-color .15s ease",
          display: "grid",
          placeItems: "center",
        }}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={cfg.label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                opacity: hidden ? 0.4 : 1,
              }}
            />
            {hidden && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  px: 1,
                  py: 0.3,
                  borderRadius: 999,
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "white",
                  bgcolor: "rgba(15,23,42,0.72)",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                }}
              >
                <Icon icon="mdi:eye-off-outline" width={12} /> Hidden from students
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: "center", color: "text.secondary", px: 2, pointerEvents: "none" }}>
            <Icon icon={dragOver ? "mdi:tray-arrow-down" : "mdi:image-plus-outline"} width={26} />
            <Typography sx={{ fontSize: "0.78rem", mt: 0.5, fontWeight: 600 }}>
              {dragOver ? "Drop to upload" : "Click or drop an image"}
            </Typography>
          </Box>
        )}
        {anyBusy && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(15,23,42,0.45)",
            }}
          >
            <CircularProgress size={26} sx={{ color: "white" }} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
        <SlotBtn
          icon="mdi:auto-fix"
          label="Regenerate"
          variant="primary"
          loading={busy === "regen"}
          onClick={() => void regenerate()}
          disabled={anyBusy}
        />
        <SlotBtn
          icon="mdi:upload"
          label="Upload"
          loading={busy === "upload"}
          onClick={() => fileRef.current?.click()}
          disabled={anyBusy}
        />
        {url && (
          <SlotBtn
            icon={hidden ? "mdi:eye-outline" : "mdi:eye-off-outline"}
            label={hidden ? "Show" : "Hide"}
            loading={busy === "hide"}
            onClick={() => void toggleHidden()}
            disabled={anyBusy}
          />
        )}
      </Box>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
    </Box>
  );
}

function DeviceToggle({ device, onChange }: { device: Device; onChange: (d: Device) => void }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        p: 0.3,
        gap: 0.3,
        borderRadius: 999,
        bgcolor: "color-mix(in srgb, var(--border-default) 30%, transparent)",
      }}
    >
      {(
        [
          { key: "desktop", icon: "mdi:monitor", tip: "Desktop crop (wide banner)" },
          { key: "mobile", icon: "mdi:cellphone", tip: "Mobile crop (16:9)" },
        ] as const
      ).map((opt) => {
        const active = device === opt.key;
        return (
          <Tooltip key={opt.key} title={opt.tip} arrow disableInteractive>
            <ButtonBase
              onClick={() => onChange(opt.key)}
              aria-label={opt.tip}
              sx={{
                width: 26,
                height: 22,
                borderRadius: 999,
                color: active ? "white" : "text.secondary",
                bgcolor: active ? "#6366f1" : "transparent",
                transition: "background-color .15s ease, color .15s ease",
                "&:hover": { bgcolor: active ? "#6366f1" : "color-mix(in srgb, #6366f1 14%, transparent)" },
              }}
            >
              <Icon icon={opt.icon} width={14} />
            </ButtonBase>
          </Tooltip>
        );
      })}
    </Box>
  );
}

function SlotBtn({
  icon,
  label,
  onClick,
  disabled,
  loading,
  variant = "ghost",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "ghost" | "primary";
}) {
  const primary = variant === "primary";
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        px: 1.4,
        py: 0.7,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: "0.78rem",
        gap: 0.5,
        display: "inline-flex",
        alignItems: "center",
        color: primary ? "white" : "#6366f1",
        bgcolor: primary ? "#6366f1" : "transparent",
        border: primary
          ? "1px solid #6366f1"
          : "1px solid color-mix(in srgb, #6366f1 40%, transparent)",
        opacity: disabled && !loading ? 0.5 : 1,
        transition: "background-color .15s ease, opacity .15s ease",
        "&:hover": {
          bgcolor: primary
            ? "color-mix(in srgb, #6366f1 88%, black)"
            : "color-mix(in srgb, #6366f1 10%, transparent)",
        },
      }}
    >
      {loading ? (
        <CircularProgress size={14} sx={{ color: primary ? "white" : "#6366f1" }} />
      ) : (
        <Icon icon={icon} width={15} />
      )}
      {label}
    </ButtonBase>
  );
}
