"use client";

import { useRef, useState } from "react";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveCourseService,
  type CourseImageTarget,
} from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Admin cover-art manager for an adaptive course: preview + regenerate (AI),
 * upload custom, and hide/show — independently for the header banner and the
 * card thumbnail. Mounted on the admin course detail page; calls back with the
 * new url/hidden state so the parent keeps its `course` in sync.
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.75 }}>
        <Icon icon="mdi:image-multiple-outline" width={18} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Cover art</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", ml: 0.5 }}>
          Shown to students on the course card &amp; header. Regenerate, upload, or hide.
        </Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" }, gap: 2 }}>
        <CoverSlot
          courseId={courseId}
          target="header"
          label="Header banner"
          aspect="1024 / 300"
          url={headerUrl}
          hidden={headerHidden}
          onChange={onChange}
        />
        <CoverSlot
          courseId={courseId}
          target="card"
          label="Card thumbnail"
          aspect="16 / 9"
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
  label,
  aspect,
  url,
  hidden,
  onChange,
}: {
  courseId: number;
  target: CourseImageTarget;
  label: string;
  aspect: string;
  url: string | null | undefined;
  hidden: boolean;
  onChange: (target: CourseImageTarget, patch: { url?: string | null; hidden?: boolean }) => void;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<null | "regen" | "upload" | "hide">(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const regenerate = async () => {
    setBusy("regen");
    try {
      const res = await adminAdaptiveCourseService.regenerateCourseImage(courseId, target);
      onChange(target, { url: res.url, hidden: res.hidden });
      showToast(`New ${label.toLowerCase()} generated.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't generate the image.", "error");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (file: File) => {
    setBusy("upload");
    try {
      const res = await adminAdaptiveCourseService.uploadCourseImage(courseId, target, file);
      onChange(target, { url: res.url, hidden: res.hidden });
      showToast(`${label} updated.`, "success");
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

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary", mb: 0.75 }}>
        {label}
      </Typography>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: aspect,
          borderRadius: 2.5,
          overflow: "hidden",
          bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)",
          border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
          display: "grid",
          placeItems: "center",
        }}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: hidden ? 0.4 : 1 }}
            />
            {hidden && (
              <Box sx={{ position: "absolute", top: 8, left: 8, px: 1, py: 0.3, borderRadius: 999, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", color: "white", bgcolor: "rgba(15,23,42,0.72)", display: "flex", alignItems: "center", gap: 0.4 }}>
                <Icon icon="mdi:eye-off-outline" width={12} /> Hidden from students
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: "center", color: "text.secondary", px: 2 }}>
            <Icon icon="mdi:image-off-outline" width={26} />
            <Typography sx={{ fontSize: "0.78rem", mt: 0.5 }}>No image yet</Typography>
          </Box>
        )}
        {anyBusy && (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(15,23,42,0.45)" }}>
            <CircularProgress size={26} sx={{ color: "white" }} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
        <SlotBtn icon="mdi:autorenew" label="Regenerate" onClick={() => void regenerate()} disabled={anyBusy} />
        <SlotBtn icon="mdi:upload" label="Upload" onClick={() => fileRef.current?.click()} disabled={anyBusy} />
        {url && (
          <SlotBtn
            icon={hidden ? "mdi:eye-outline" : "mdi:eye-off-outline"}
            label={hidden ? "Show" : "Hide"}
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

function SlotBtn({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
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
        color: "#6366f1",
        border: "1px solid color-mix(in srgb, #6366f1 40%, transparent)",
        opacity: disabled ? 0.5 : 1,
        "&:hover": { bgcolor: "color-mix(in srgb, #6366f1 10%, transparent)" },
      }}
    >
      <Icon icon={icon} width={15} />
      {label}
    </ButtonBase>
  );
}
