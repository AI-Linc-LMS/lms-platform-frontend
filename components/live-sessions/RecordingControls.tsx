"use client";

/**
 * One control bar for a recording, with every control in it.
 *
 * Reported, after the speed control shipped: "the speed changing option is added in the top
 * right corner rather than in the bottom bar where other options are also present. A new full
 * screen button has also added at the top disabling the one already existed."
 *
 * Both true, and the second was my doing. The native bar is browser-rendered shadow DOM: a
 * custom control cannot be put INSIDE it, so the speed pill had to float somewhere, and the
 * fullscreen button had to be duplicated because the native one promotes the <video> element
 * alone and strands anything floating over it.
 *
 * Floating two controls over a bar that already has its own is the wrong shape. So the native
 * bar is off and this is the bar: play, time, scrub, volume, speed, fullscreen - in one row,
 * in the order people expect, with nothing hovering above the picture.
 *
 * Turning `controls` off also retires `controlsList` entirely. There is no native menu left to
 * carry a Download item, so the restriction that flag expressed is now structural rather than
 * requested - which is stronger, though still not access control: the signed stream URL is the
 * thing that actually limits a copied link.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Menu, MenuItem, Slider, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE } from "@/components/common/mobile/phone";

/** The usual ladder. 2x is the top because a lecture past that is not listenable. */
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** `h:mm:ss` past an hour, `m:ss` below it - these recordings run to two hours. */
export function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

const BAR_BG = "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)";

/**
 * The element the browser is currently showing full screen, if any.
 *
 * Reported after the bar shipped: "in full screen the playback speed the options of speed is
 * not coming even after clicking speed changer". The menu was opening every time - it just had
 * nowhere visible to open. A full screen element is promoted to the browser's top layer and
 * ONLY its own subtree is painted, so a menu that MUI portals onto `document.body` renders
 * outside the one subtree on screen. Mounting it inside the full screen element instead puts it
 * back in the painted tree, and out of full screen `container={undefined}` is MUI's own default.
 *
 * `webkitFullscreenElement` is the iOS Safari spelling, which is the half of the fleet most
 * likely to be watching a recording full screen in the first place.
 */
function fullscreenElement(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  const d = document as Document & { webkitFullscreenElement?: Element | null };
  return (d.fullscreenElement ?? d.webkitFullscreenElement ?? undefined) as HTMLElement | undefined;
}

export function RecordingControls({
  videoRef,
  isFullscreen,
  onToggleFullscreen,
  rate,
  onRate,
  label,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  rate: number;
  onRate: (r: number) => void;
  label: (key: string, fallback: string) => string;
}) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rateAnchor, setRateAnchor] = useState<HTMLElement | null>(null);
  /** True while the learner drags, so time updates do not fight the thumb. */
  const scrubbing = useRef(false);

  // Read the element rather than assume: it autoplays, it can be paused by the OS, and the
  // duration arrives after metadata.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const sync = () => {
      setPlaying(!el.paused && !el.ended);
      setMuted(el.muted);
      setVolume(el.muted ? 0 : el.volume);
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      if (!scrubbing.current) setCurrent(el.currentTime);
    };
    sync();
    const events = ["play", "pause", "ended", "timeupdate", "loadedmetadata", "durationchange", "volumechange"];
    events.forEach((e) => el.addEventListener(e, sync));
    return () => events.forEach((e) => el.removeEventListener(e, sync));
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
  }, [videoRef]);

  const seek = useCallback((to: number) => {
    const el = videoRef.current;
    if (el && Number.isFinite(to)) el.currentTime = to;
  }, [videoRef]);

  const btn = {
    minWidth: 0,
    p: 0.5,
    borderRadius: "50%",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    "&:hover": { background: "rgba(255,255,255,0.14)" },
    "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 },
    [PHONE]: { minHeight: 44, minWidth: 44 },
  } as const;

  return (
    <Box
      data-testid="recording-controls"
      sx={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        px: 1.25, pt: 3, pb: 0.75, background: BAR_BG, zIndex: 2,
      }}
    >
      <Slider
        aria-label={label("liveSessions.seek", "Seek")}
        value={Math.min(current, duration || 0)}
        max={duration || 0}
        step={1}
        onChange={(_e, v) => { scrubbing.current = true; setCurrent(v as number); }}
        onChangeCommitted={(_e, v) => { scrubbing.current = false; seek(v as number); }}
        sx={{
          color: "#fff", py: 0.5,
          "& .MuiSlider-rail": { opacity: 0.35 },
          "& .MuiSlider-thumb": { width: 12, height: 12, [PHONE]: { width: 16, height: 16 } },
        }}
      />
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box component="button" type="button" onClick={togglePlay} sx={btn}
             aria-label={playing ? label("liveSessions.pause", "Pause") : label("liveSessions.play", "Play")}>
          <IconWrapper icon={playing ? "mdi:pause" : "mdi:play"} size={22} />
        </Box>
        <Typography sx={{ color: "#fff", fontSize: "0.78rem", fontVariantNumeric: "tabular-nums", px: 0.5,
                          [PHONE]: { fontSize: "0.8rem" } }}>
          {fmtTime(current)} / {fmtTime(duration)}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Box component="button" type="button" onClick={toggleMute} sx={btn}
             aria-label={muted ? label("liveSessions.unmute", "Unmute") : label("liveSessions.mute", "Mute")}>
          <IconWrapper icon={muted || volume === 0 ? "mdi:volume-off" : "mdi:volume-high"} size={21} />
        </Box>

        {/* Speed, here in the bar rather than floating over the picture. */}
        <Box
          component="button"
          type="button"
          onClick={(e: React.MouseEvent<HTMLElement>) => setRateAnchor(e.currentTarget)}
          aria-label={label("liveSessions.playbackSpeed", "Playback speed")}
          aria-haspopup="menu"
          sx={{ ...btn, px: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem", font: "inherit" }}
        >
          {rate}x
        </Box>
        <Menu
          // Without this the menu lands on document.body, which the browser does not paint
          // while something else is full screen. See fullscreenElement above.
          container={isFullscreen ? fullscreenElement() : undefined}
          anchorEl={rateAnchor}
          open={Boolean(rateAnchor)}
          onClose={() => setRateAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {SPEEDS.map((v) => (
            <MenuItem
              key={v}
              selected={v === rate}
              onClick={() => { onRate(v); setRateAnchor(null); }}
              sx={{ fontWeight: v === rate ? 700 : 500, [PHONE]: { minHeight: 44 } }}
            >
              {v}x
            </MenuItem>
          ))}
        </Menu>

        <Box component="button" type="button" onClick={onToggleFullscreen} sx={btn}
             aria-label={isFullscreen
               ? label("liveSessions.exitFullscreen", "Exit full screen")
               : label("liveSessions.enterFullscreen", "Full screen")}>
          <IconWrapper icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"} size={22} />
        </Box>
      </Stack>
    </Box>
  );
}
