"use client";

import { Renderer, Program, Mesh, Color, Triangle, RenderTarget } from "ogl";
import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Strands — from React Bits (reactbits.dev), vendored.
 *
 * Two deliberate changes from upstream, both about this app rather than about the effect:
 *
 * 1. **`liveRef`.** Upstream reads its props through a ref that is reassigned on every
 *    render, so animating a prop means re-rendering at frame rate. This component sits
 *    beside a live WebRTC audio encode and has to react to the tutor's voice sixty times a
 *    second, so a re-render per frame is exactly the budget we cannot spend. `liveRef` lets
 *    the internal rAF loop read audio-driven values directly, with zero React involvement.
 *    Props still work unchanged when `liveRef` is absent.
 *
 * 2. **No Tailwind classes.** Upstream ships `relative w-full h-full bg-transparent`.
 *    Tailwind is installed here but effectively unused (the codebase is MUI `sx`), so the
 *    equivalent is expressed as inline style to avoid depending on a utility layer nothing
 *    else in this module relies on.
 *
 * Everything else, including both shaders, is upstream.
 */

const MAX_STRANDS = 12;
const MAX_COLORS = 8;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uScaleY;
uniform float uSaturation;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  // Anisotropic on purpose. A single isotropic scale has to serve two jobs at once: fit the
  // taper envelope horizontally, and leave the wave somewhere to move vertically. In a wide band
  // those conflict, and the horizontal fit wins, squeezing uv.y until the wave's own excursion is
  // several times the visible height. The ribbon then reads as a flat line whose amplitude does
  // not respond to the voice, because the movement is happening off-screen.
  uv.x /= max(uScale, 0.0001);
  uv.y /= max(uScaleY, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;

const GLASS_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + 0.5;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // sphere height: 0 at the rim, 1 at the center
  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r; // 0 at the center, 1 at the rim

  // refraction is confined to a narrow band near the rim; the rest stays undistorted
  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  // neutral fresnel rim (no color tint so the glass stays clear)
  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  // specular highlight from the upper-left
  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= smoothstep(r, r * 0.55, d);

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);

  // almost clear glass body: only a faint neutral darkening, mostly near the rim
  float bodyA = 0.05 + fres * 0.05;

  // composite emissive light over the clear body (premultiplied)
  float outA = emissiveA + bodyA * (1.0 - emissiveA);
  vec3 outRGB = emissive;

  outRGB *= mask;
  outA *= mask;

  fragColor = vec4(outRGB, outA);
}
`;

/** Values the rAF loop may read every frame without a React render. */
export interface StrandsLive {
  colors?: string[];
  speed?: number;
  amplitude?: number;
  waviness?: number;
  thickness?: number;
  glow?: number;
  intensity?: number;
  saturation?: number;
  opacity?: number;
  scale?: number;
  hueShift?: number;
  spread?: number;
}

export interface StrandsProps {
  colors?: string[];
  count?: number;
  speed?: number;
  amplitude?: number;
  waviness?: number;
  thickness?: number;
  glow?: number;
  taper?: number;
  spread?: number;
  hueShift?: number;
  intensity?: number;
  saturation?: number;
  opacity?: number;
  scale?: number;
  glass?: boolean;
  refraction?: number;
  dispersion?: number;
  glassSize?: number;
  /**
   * Per-frame overrides, read inside the animation loop.
   *
   * Anything present here wins over the matching prop. This is how the tutor's voice drives
   * the effect without re-rendering React sixty times a second.
   */
  liveRef?: { current: StrandsLive };
  /** Freeze the animation and hold a calm frame. Wire this to prefers-reduced-motion. */
  paused?: boolean;
  /**
   * Keep the effect to a SINGLE ribbon regardless of how wide the container is.
   *
   * The shader's taper envelope is `pow(cos(uv.x * PI * 1.3), taper)`, and `uv.x` spans
   * `±aspect/2` before `uScale` divides it. In a roughly square box that cosine fades once
   * and you get one elegant strand. In a wide banner (say 10:1) `uv.x` reaches ±5, the
   * cosine oscillates, and the envelope TILES — the effect renders as a row of repeating
   * lens shapes, which reads as a glitch rather than a design.
   *
   * With this on, `uScale` is computed from the aspect ratio so that the envelope's first
   * lobe fits *inside* the viewport with a margin on each side, and `scale` is ignored.
   *
   * The first attempt floored `uScale` at `1.32 * aspect`, which put the taper's zero
   * crossing marginally OUTSIDE the frame: no tiling, but the ribbon still carried luminance
   * where it met the left and right edges, so it read as a wide beam that had been cropped.
   * `RIBBON_FILL` below fixes that by leaving the taper room to actually reach zero. It also
   * has to be an absolute rather than a floor, because `Math.max` against the caller's
   * `scale` re-introduced the crop in any container narrower than about 4:3.
   */
  fitSingleRibbon?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Where `cos(uv.x * PI * 1.3)` first hits zero: the outer edge of the taper envelope. */
const TAPER_ZERO = 0.3846;

/**
 * How much of the container's half-width the ribbon is allowed to span.
 *
 * Below 1 the taper reaches zero before the edge, which is the difference between a ribbon
 * that fades out and a ribbon that looks cut off.
 */
const RIBBON_FILL = 0.82;

/**
 * Ceiling on the vertical scale, so `uv.y` never shrinks below the wave's own excursion.
 *
 * The wave peaks at roughly +/-0.1125 uv units at these settings. A cap of 3 gives +/-0.167, so
 * about 1.5x headroom at any aspect ratio. Without it a 10:1 band had +/-0.047 - the wave swung
 * more than twice the visible height, off the top and bottom of the container.
 */
const MAX_VERTICAL_SCALE = 3.0;

const buildPalette = (colors: string[]): number[][] => {
  const filled = colors && colors.length ? colors : ["#ffffff"];
  const padded: number[][] = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const hex = filled[i] ?? filled[filled.length - 1];
    const c = new Color(hex);
    padded.push([c.r, c.g, c.b]);
  }
  return padded;
};

export default function Strands({
  colors = ["#FF4242", "#7C3AED", "#06B6D4", "#EAB308"],
  count = 3,
  speed = 0.5,
  amplitude = 1,
  waviness = 1,
  thickness = 0.7,
  glow = 2.6,
  taper = 3,
  spread = 1,
  hueShift = 0,
  intensity = 0.6,
  saturation = 1.5,
  opacity = 1,
  scale = 1.5,
  glass = false,
  refraction = 1,
  dispersion = 1,
  glassSize = 1,
  liveRef,
  paused = false,
  fitSingleRibbon = false,
  className = "",
  style,
}: StrandsProps) {
  const propsRef = useRef<
    Required<
      Omit<StrandsProps, "className" | "style" | "liveRef" | "paused" | "fitSingleRibbon">
    >
  >({
    colors,
    count,
    speed,
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize,
  });
  propsRef.current = {
    colors,
    count,
    speed,
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize,
  };

  const liveHolder = useRef<{ current: StrandsLive }>({ current: {} });
  if (liveRef) liveHolder.current = liveRef;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const fitRef = useRef(fitSingleRibbon);
  fitRef.current = fitSingleRibbon;
  /** Minimum uScale that keeps the taper envelope to one lobe at the current aspect. */
  const minScaleRef = useRef(0);
  const minScaleYRef = useRef(0);

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uColors: { value: buildPalette(propsRef.current.colors) },
        uColorCount: { value: Math.min(propsRef.current.colors.length, MAX_COLORS) },
        uStrandCount: { value: Math.min(propsRef.current.count, MAX_STRANDS) },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uWaviness: { value: waviness },
        uThickness: { value: thickness },
        uGlow: { value: glow },
        uTaper: { value: taper },
        uSpread: { value: spread },
        uHueShift: { value: hueShift },
        uIntensity: { value: intensity },
        uOpacity: { value: opacity },
        uScale: { value: scale },
        // Declared here or the render loop's `program.uniforms.uScaleY.value = ...` throws on
        // the first frame, which kills the rAF loop and the ribbon never draws at all.
        uScaleY: { value: scale },
        uSaturation: { value: saturation },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const renderTarget = new RenderTarget(gl, {
      width: ctn.offsetWidth,
      height: ctn.offsetHeight,
    });

    const glassProgram = new Program(gl, {
      vertex: VERT,
      fragment: GLASS_FRAG,
      uniforms: {
        uScene: { value: renderTarget.texture },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uRadius: { value: 0.46 * glassSize },
        uRefraction: { value: refraction },
        uDispersion: { value: dispersion },
      },
    });
    const glassMesh = new Mesh(gl, { geometry, program: glassProgram });

    ctn.appendChild(gl.canvas);

    // Upstream listens on window resize only, which misses the case that actually happens
    // here: the transport bar and the IDE panel change this element's size without the
    // window changing at all.
    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
      renderTarget.setSize(width, height);
      glassProgram.uniforms.uResolution.value = [width, height];
      // TAPER_ZERO is where cos(x * PI * 1.3) first reaches zero, i.e. the outer edge of the
      // envelope's single lobe. Mapping that edge to RIBBON_FILL of the half-width puts the
      // ribbon's own fade comfortably inside the frame: no tiling, and no crop either.
      minScaleRef.current =
        ((width / Math.max(height, 1)) * RIBBON_FILL) / (2 * TAPER_ZERO);
      // Vertical scale is capped, so a short wide band keeps room for the wave. Below the cap
      // the two are equal and the effect is exactly as isotropic as it always was.
      minScaleYRef.current = Math.min(minScaleRef.current, MAX_VERTICAL_SCALE);
    }
    window.addEventListener("resize", resize);
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(ctn);
    resize();

    let animateId = 0;
    let frozenTime = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const base = propsRef.current;
      const live = liveHolder.current.current || {};
      // Per-frame overrides win. Absent keys fall through to the declarative prop.
      const current = { ...base, ...live };

      if (pausedRef.current) {
        // Hold a still frame rather than tearing down the context, so resuming is instant.
        program.uniforms.uTime.value = frozenTime;
      } else {
        frozenTime = t * 0.001;
        program.uniforms.uTime.value = frozenTime;
      }
      program.uniforms.uColors.value = buildPalette(current.colors);
      program.uniforms.uColorCount.value = Math.min(current.colors.length, MAX_COLORS);
      program.uniforms.uStrandCount.value = Math.min(
        Math.max(Math.round(current.count), 1),
        MAX_STRANDS
      );
      program.uniforms.uSpeed.value = current.speed;
      program.uniforms.uAmplitude.value = current.amplitude;
      program.uniforms.uWaviness.value = current.waviness;
      program.uniforms.uThickness.value = current.thickness;
      program.uniforms.uGlow.value = current.glow;
      program.uniforms.uTaper.value = current.taper;
      program.uniforms.uSpread.value = current.spread;
      program.uniforms.uHueShift.value = current.hueShift;
      program.uniforms.uIntensity.value = current.intensity;
      program.uniforms.uOpacity.value = current.opacity;
      program.uniforms.uScale.value = fitRef.current
        ? minScaleRef.current
        : current.scale;
      program.uniforms.uScaleY.value = fitRef.current
        ? minScaleYRef.current
        : current.scale;
      program.uniforms.uSaturation.value = current.saturation;

      if (current.glass) {
        renderer.render({ scene: mesh, target: renderTarget });
        glassProgram.uniforms.uScene.value = renderTarget.texture;
        glassProgram.uniforms.uRefraction.value = current.refraction;
        glassProgram.uniforms.uDispersion.value = current.dispersion;
        glassProgram.uniforms.uRadius.value = 0.46 * current.glassSize;
        renderer.render({ scene: glassMesh });
      } else {
        renderer.render({ scene: mesh });
      }
    };
    animateId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      observer?.disconnect();
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      // Without this the context leaks and a few navigations into the room exhaust the
      // browser's WebGL context budget, after which the effect silently stops appearing.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ctnDom}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        ...style,
      }}
    />
  );
}
