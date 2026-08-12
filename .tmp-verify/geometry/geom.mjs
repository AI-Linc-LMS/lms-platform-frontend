// Geometry verifier for the roadmap spine/trail. Read-only: measures the rendered DOM/SVG.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import zlib from "node:zlib";

const OUT = "/private/tmp/claude-501/-Users-utkarshsingh-Developer-ai-linc-backend/bd3fc238-6c74-4465-bc22-5eef411ff0d0/scratchpad/geomout";
fs.mkdirSync(OUT, { recursive: true });
const URL_ = "http://localhost:3177/geomverify";

const SECTION_ACCENTS = [
  { spine: "#c4b5fd", branch: "#ede9fe", rail: "#7c3aed" },
  { spine: "#a5d8ff", branch: "#e7f5ff", rail: "#1c7ed6" },
  { spine: "#b2f2bb", branch: "#ebfbee", rail: "#2f9e44" },
  { spine: "#ffd8a8", branch: "#fff4e6", rail: "#e8590c" },
  { spine: "#fcc2d7", branch: "#fff0f6", rail: "#c2255c" },
  { spine: "#d0bfff", branch: "#f3f0ff", rail: "#7048e8" },
];
const hexToRgb = (h) =>
  `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;

const viol = [];
const V = (code, msg) => viol.push(`[${code}] ${msg}`);

/* ---------------- path parsing ---------------- */
const NUMRE = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|NaN|-?Infinity|undefined|null/gi;
function parsePath(d) {
  const segs = [];
  const cmds = [...d.matchAll(/([MLCmlc])([^MLCmlc]*)/g)];
  let cur = null;
  for (const [, c, argstr] of cmds) {
    const nums = (argstr.match(NUMRE) || []).map((s) => Number(s));
    if (c.toUpperCase() === "M") cur = [nums[0], nums[1]];
    else if (c.toUpperCase() === "L") {
      const p = [nums[0], nums[1]];
      segs.push({ type: "L", p0: cur, pts: [p] });
      cur = p;
    } else if (c.toUpperCase() === "C") {
      const p1 = [nums[0], nums[1]], p2 = [nums[2], nums[3]], p3 = [nums[4], nums[5]];
      segs.push({ type: "C", p0: cur, pts: [p1, p2, p3] });
      cur = p3;
    }
  }
  return segs;
}
function sampleSeg(seg, n = 40) {
  const out = [];
  if (!seg.p0) return out;
  if (seg.type === "L") {
    const [x0, y0] = seg.p0, [x1, y1] = seg.pts[0];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); }
  } else {
    const [x0, y0] = seg.p0, [x1, y1] = seg.pts[0], [x2, y2] = seg.pts[1], [x3, y3] = seg.pts[2];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      ]);
    }
  }
  return out;
}

/* ---------------- PNG decode (8-bit RGB/RGBA) ---------------- */
function decodePng(buf) {
  let p = 8, w = 0, h = 0, bd = 0, ct = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bd !== 8 || (ct !== 2 && ct !== 6)) throw new Error(`unsupported png bd=${bd} ct=${ct}`);
  const bpp = ct === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  let o = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[o++];
    const line = raw.subarray(o, o + stride); o += stride;
    const cur = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}
const pxAt = (img, x, y) => { const i = y * img.w * img.bpp + x * img.bpp; return [img.px[i], img.px[i + 1], img.px[i + 2]]; };

/* ---------------- extraction in the page ---------------- */
const EXTRACT = () => {
  const root = document.querySelector("[data-geom-root]");
  const svgs = [...root.querySelectorAll("svg")].filter((s) => s.getAttribute("preserveAspectRatio") === "none");
  const rr = (el, W) => {
    const b = el.getBoundingClientRect();
    return {
      l: +(b.left - W.left).toFixed(2), r: +(b.right - W.left).toFixed(2),
      t: +(b.top - W.top).toFixed(2), b: +(b.bottom - W.top).toFixed(2),
      w: +b.width.toFixed(2), h: +b.height.toFixed(2),
      cx: +(b.left - W.left + b.width / 2).toFixed(2), cy: +(b.top - W.top + b.height / 2).toFixed(2),
    };
  };
  return svgs.map((svg, si) => {
    const wrap = svg.parentElement;
    const W = wrap.getBoundingClientRect();
    const grid = svg.nextElementSibling;
    const cells = [...grid.children];
    const steps = cells.map((cell, ci) => {
      const stepCell = cell.firstElementChild;
      const kids = [...stepCell.children];
      const stepBox = kids[0];
      const stepBtn = stepBox.querySelector("button");
      const branchStack = kids.slice(1).filter((k) => k.querySelector("button")).pop() || null;
      const leaves = branchStack
        ? [...branchStack.children].map((flexBox, bi) => {
            const wrapBox = flexBox.firstElementChild;
            const btn = wrapBox.querySelector("button");
            return {
              index: bi, text: btn.innerText.trim(),
              wrapRect: rr(wrapBox, W), btnRect: rr(btn, W),
              bg: getComputedStyle(btn).backgroundColor,
            };
          })
        : [];
      return {
        seq: ci, text: stepBtn.innerText.trim(),
        cellRect: rr(cell, W), stepRect: rr(stepBox, W), btnRect: rr(stepBtn, W),
        bg: getComputedStyle(stepBtn).backgroundColor, leaves,
      };
    });
    const svgR = svg.getBoundingClientRect();
    const paths = [...svg.querySelectorAll("path")].map((p) => {
      let len = -1;
      try { len = p.getTotalLength(); } catch (e) { len = -2; }
      return { d: p.getAttribute("d") || "", totalLength: len };
    });
    return {
      si,
      wrapRect: { w: +W.width.toFixed(2), h: +W.height.toFixed(2) },
      svgRect: { l: +(svgR.left - W.left).toFixed(2), t: +(svgR.top - W.top).toFixed(2), w: +svgR.width.toFixed(2), h: +svgR.height.toFixed(2) },
      viewBox: svg.getAttribute("viewBox"),
      limbsD: paths[0]?.d ?? "", trailD: paths[1]?.d ?? "",
      limbsLen: paths[0]?.totalLength ?? -1, trailLen: paths[1]?.totalLength ?? -1,
      steps,
    };
  });
};

/* ---------------- run one viewport ---------------- */
async function run(browser, W, H) {
  const tag = `${W}x${H}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  await ctx.addCookies([
    { name: "access_token", value: "geomfixture", domain: "localhost", path: "/" },
    { name: "user_role", value: "student", domain: "localhost", path: "/" },
  ]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
  await page.goto(URL_, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForSelector("[data-geom-root] button", { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const data = await page.evaluate(EXTRACT);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/geom-${tag}.json`, JSON.stringify({ errors, data }, null, 2));

  console.log(`\n================ VIEWPORT ${tag} ================`);
  console.log(`sections=${data.length} pageErrors=${errors.length}`);
  errors.slice(0, 4).forEach((e) => console.log("  PAGE ERROR: " + e));
  if (errors.some((e) => /Maximum update depth|error #185/.test(e))) V("LOOP", `${tag}: React #185 / max update depth detected`);

  for (const sec of data) {
    const S = `${tag} s${sec.si + 1}`;
    const nSteps = sec.steps.length;
    const allD = sec.limbsD + " " + sec.trailD;

    const bad = allD.match(/NaN|Infinity|undefined|null/gi);
    if (bad) V("A", `${S}: path d contains ${[...new Set(bad)].join(",")} -> "${allD.slice(0, 160)}"`);

    if (nSteps > 1 && !sec.trailD.trim()) V("B", `${S}: ${nSteps} steps but trail d is EMPTY`);
    if (sec.steps.some((s) => s.leaves.length > 0) && !sec.limbsD.trim()) V("B", `${S}: has leaves but limbs d is EMPTY`);
    if (nSteps > 1 && sec.trailLen <= 0) V("B", `${S}: trail getTotalLength()=${sec.trailLen}`);
    if (sec.steps.some((s) => s.leaves.length) && sec.limbsLen <= 0) V("B", `${S}: limbs getTotalLength()=${sec.limbsLen}`);

    /* C */
    const limbSegs = parsePath(sec.limbsD);
    const curves = limbSegs.filter((s) => s.type === "C");
    const allLeaves = sec.steps.flatMap((st) => st.leaves.map((lf) => ({ ...lf, stepSeq: st.seq, stepCx: st.stepRect.cx })));
    if (curves.length !== allLeaves.length) V("C", `${S}: ${curves.length} limb curves for ${allLeaves.length} leaves`);
    let cFail = 0;
    for (const c of curves) {
      const [ex, ey] = c.pts[2];
      let best = null, bestD = 1e9;
      for (const lf of allLeaves) {
        const R = lf.wrapRect;
        const onLeft = R.cx < lf.stepCx;
        const target = onLeft ? R.r : R.l;
        const d = Math.hypot(ex - target, ey - R.cy);
        if (d < bestD) { bestD = d; best = { lf, target, onLeft }; }
      }
      if (!best || bestD > 8) {
        cFail++;
        if (cFail <= 5)
          V("C", `${S}: limb endpoint (${ex.toFixed(1)},${ey.toFixed(1)}) is ${bestD.toFixed(1)}px from nearest leaf edge ("${best?.lf.text.slice(0, 26)}" edge x=${best?.target.toFixed(1)} cy=${best?.lf.wrapRect.cy.toFixed(1)})`);
      }
    }
    if (cFail > 5) V("C", `${S}: ...and ${cFail - 5} more disconnected limbs (total ${cFail})`);

    /* D */
    const boxes = [];
    sec.steps.forEach((st) => {
      boxes.push({ kind: "step", text: st.text, r: st.btnRect, seq: st.seq });
      st.leaves.forEach((lf) => boxes.push({ kind: "leaf", text: lf.text, r: lf.btnRect, seq: st.seq }));
    });
    const TOL = 3;
    const inside = (p, r) => p[0] > r.l + TOL && p[0] < r.r - TOL && p[1] > r.t + TOL && p[1] < r.b - TOL;
    const crossings = new Map();
    for (const [name, dstr] of [["limb", sec.limbsD], ["trail", sec.trailD]]) {
      for (const seg of parsePath(dstr)) {
        for (const p of sampleSeg(seg, 40)) {
          for (const b of boxes) {
            if (inside(p, b.r)) {
              const k = `${name}|${b.kind}|${b.text.slice(0, 30)}|step#${b.seq}`;
              const e = crossings.get(k) || { n: 0, sample: p, box: b };
              e.n++; crossings.set(k, e);
            }
          }
        }
      }
    }
    const crossList = [...crossings.entries()].sort((a, b) => b[1].n - a[1].n);
    if (crossList.length) {
      V("D", `${S}: ${crossList.length} line-through-box intersections; worst: ` +
        crossList.slice(0, 3).map(([k, e]) => `${k} (${e.n}/41 samples inside, e.g. ${e.sample[0].toFixed(1)},${e.sample[1].toFixed(1)} in box l=${e.box.r.l} r=${e.box.r.r} t=${e.box.r.t} b=${e.box.r.b})`).join(" || "));
    }

    /* E */
    let ov = 0;
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r, b = boxes[j].r;
        const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
        const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (ox > 0.5 && oy > 0.5) {
          ov++;
          if (ov <= 3) V("E", `${S}: "${boxes[i].text.slice(0, 22)}" overlaps "${boxes[j].text.slice(0, 22)}" by ${ox.toFixed(1)}x${oy.toFixed(1)}px`);
        }
      }
    if (ov > 3) V("E", `${S}: ...${ov - 3} more overlapping pairs (total ${ov})`);

    /* F */
    for (const b of boxes) {
      if (b.r.l < -0.5 || b.r.t < -0.5 || b.r.r > sec.wrapRect.w + 0.5 || b.r.b > sec.wrapRect.h + 0.5)
        V("F", `${S}: box "${b.text.slice(0, 22)}" outside container (l=${b.r.l} t=${b.r.t} r=${b.r.r} b=${b.r.b}; container ${sec.wrapRect.w}x${sec.wrapRect.h})`);
    }
    const vb = (sec.viewBox || "").split(/\s+/).map(Number);
    if (Math.abs(vb[2] - sec.svgRect.w) > 1 || Math.abs(vb[3] - sec.svgRect.h) > 1)
      V("F", `${S}: viewBox "${sec.viewBox}" != rendered svg ${sec.svgRect.w}x${sec.svgRect.h} -> lines scaled x*${(sec.svgRect.w / (vb[2] || 1)).toFixed(4)} y*${(sec.svgRect.h / (vb[3] || 1)).toFixed(4)}`);
    if (Math.abs(sec.svgRect.l) > 0.5 || Math.abs(sec.svgRect.t) > 0.5)
      V("F", `${S}: svg not at container origin (l=${sec.svgRect.l} t=${sec.svgRect.t})`);
    for (const [name, dstr] of [["limb", sec.limbsD], ["trail", sec.trailD]]) {
      const pts = parsePath(dstr).flatMap((s) => [s.p0, ...s.pts]).filter(Boolean);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      if (xs.length) {
        const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
        if (minx < -0.5 || miny < -0.5 || maxx > vb[2] + 0.5 || maxy > vb[3] + 0.5)
          V("F", `${S}: ${name} path escapes viewBox: x[${minx.toFixed(1)},${maxx.toFixed(1)}] y[${miny.toFixed(1)},${maxy.toFixed(1)}] vs 0 0 ${vb[2]} ${vb[3]}`);
      }
    }

    /* G */
    for (const st of sec.steps) {
      if (st.leaves.length < 2) continue;
      const sides = st.leaves.map((lf) => (lf.wrapRect.cx < st.stepRect.cx ? "L" : "R"));
      const alt = sides.every((s, i) => i === 0 || s !== sides[i - 1]);
      if (!alt) V("G", `${S} step "${st.text.slice(0, 22)}": leaf sides ${sides.join("")} do not alternate (step cx=${st.stepRect.cx}, leaf cx=${st.leaves.map((l) => l.wrapRect.cx).join(",")})`);
    }

    /* H per-section */
    const expect = hexToRgb(SECTION_ACCENTS[sec.si % 6].spine);
    const spineBgs = sec.steps.map((s) => s.bg);
    if (!spineBgs.includes(expect)) V("H", `${S}: no spine box painted with accent ${expect}; found ${[...new Set(spineBgs)].join(", ")}`);
    const expectLeaf = hexToRgb(SECTION_ACCENTS[sec.si % 6].branch);
    const leafBgs = sec.steps.flatMap((s) => s.leaves.map((l) => l.bg));
    if (leafBgs.length && !leafBgs.includes(expectLeaf)) V("H", `${S}: no leaf painted with branch accent ${expectLeaf}; found ${[...new Set(leafBgs)].join(", ")}`);
  }

  const pendingOf = (sec) => {
    const exp = hexToRgb(SECTION_ACCENTS[sec.si % 6].spine);
    return sec.steps.map((s) => s.bg).includes(exp) ? exp : null;
  };
  for (let i = 1; i < data.length; i++) {
    const a = pendingOf(data[i - 1]), b = pendingOf(data[i]);
    if (a && b && a === b) V("H", `${tag}: section ${i} and ${i + 1} share the pending colour ${a}`);
  }
  if (data.length >= 7) {
    const a = pendingOf(data[0]), g = pendingOf(data[6]);
    if (a !== g) V("H", `${tag}: section 7 pending ${g} != section 1 pending ${a}`);
    else console.log(`  H: accent cycle wraps, s1 == s7 == ${a}`);
  }

  /* stroke-hit check on the real rendered path */
  const strokeReport = await page.evaluate(() => {
    const root = document.querySelector("[data-geom-root]");
    const svgs = [...root.querySelectorAll("svg")].filter((s) => s.getAttribute("preserveAspectRatio") === "none");
    const out = [];
    svgs.forEach((svg, si) => {
      const limbs = svg.querySelectorAll("path")[0];
      const wrap = svg.parentElement;
      const W = wrap.getBoundingClientRect();
      const grid = svg.nextElementSibling;
      [...grid.children].forEach((cell, ci) => {
        const stepCell = cell.firstElementChild;
        const kids = [...stepCell.children];
        const stack = kids.slice(1).filter((k) => k.querySelector("button")).pop();
        if (!stack) return;
        [...stack.children].forEach((fb, bi) => {
          const wb = fb.firstElementChild.getBoundingClientRect();
          const sb = kids[0].getBoundingClientRect();
          const stepCx = sb.left - W.left + sb.width / 2;
          const cy = wb.top - W.top + wb.height / 2;
          const onLeft = wb.left - W.left + wb.width / 2 < stepCx;
          const ex = onLeft ? wb.right - W.left : wb.left - W.left;
          const pt = svg.createSVGPoint();
          let hits = 0, n = 0;
          for (let i = 1; i <= 9; i++) {
            pt.x = stepCx + ((ex - stepCx) * i) / 10; pt.y = cy; n++;
            try { if (limbs.isPointInStroke(pt)) hits++; } catch (e) {}
          }
          out.push({ si, ci, bi, hits, n, len: limbs.getTotalLength() });
        });
      });
    });
    return out;
  });
  const noStroke = strokeReport.filter((r) => r.hits === 0);
  console.log(`  stroke-hit: ${strokeReport.length - noStroke.length}/${strokeReport.length} leaves have limb stroke on the step->leaf ray`);
  if (noStroke.length)
    V("STROKE", `${tag}: ${noStroke.length}/${strokeReport.length} leaves have ZERO limb stroke on the ray from step centre to leaf (first: section ${noStroke[0].si + 1} step#${noStroke[0].ci} leaf#${noStroke[0].bi})`);

  /* screenshots + pixel analysis at 1440 only */
  if (W === 1440) {
    await page.screenshot({ path: `${OUT}/full-${tag}.png`, fullPage: true });
    for (const sec of data) {
      const box = await page.evaluate((i) => {
        const root = document.querySelector("[data-geom-root]");
        const svgs = [...root.querySelectorAll("svg")].filter((s) => s.getAttribute("preserveAspectRatio") === "none");
        const r = svgs[i].parentElement.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
      }, sec.si);
      await page.screenshot({ path: `${OUT}/sec-${sec.si + 1}.png`, clip: box, fullPage: true });
      const img = decodePng(fs.readFileSync(`${OUT}/sec-${sec.si + 1}.png`));
      const counts = new Map();
      for (let y = 0; y < img.h; y += 2) for (let x = 0; x < img.w; x += 2) {
        const k = pxAt(img, x, y).join(","); counts.set(k, (counts.get(k) || 0) + 1);
      }
      const acc = SECTION_ACCENTS[sec.si % 6];
      const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      const want = hx(acc.spine), wantB = hx(acc.branch), wantR = hx(acc.rail);
      let spinePx = 0, branchPx = 0, railPx = 0;
      for (const [k, n] of counts) {
        const c = k.split(",").map(Number);
        const d = (t) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]);
        if (d(want) <= 6) spinePx += n;
        if (d(wantB) <= 6) branchPx += n;
        if (d(wantR) <= 60) railPx += n;
      }
      console.log(`  px s${sec.si + 1} (${img.w}x${img.h}): ${counts.size} distinct colours; spine-accent px=${spinePx}; branch-accent px=${branchPx}; rail-ish px=${railPx}`);
      if (spinePx < 200) V("PX", `${tag} s${sec.si + 1}: spine accent ${acc.spine} covers only ${spinePx} sampled px`);
      if (railPx < 50) V("PX", `${tag} s${sec.si + 1}: rail colour ${acc.rail} covers only ${railPx} sampled px (line may not render)`);
    }
  }

  const nLeaves = data.flatMap((s) => s.steps).reduce((a, s) => a + s.leaves.length, 0);
  const nCurves = data.reduce((a, s) => a + parsePath(s.limbsD).filter((x) => x.type === "C").length, 0);
  const nTrunks = data.reduce((a, s) => a + parsePath(s.limbsD).filter((x) => x.type === "L").length, 0);
  console.log(`  boxes: ${data.reduce((a, s) => a + s.steps.length, 0)} steps + ${nLeaves} leaves; limb curves ${nCurves}; trunks ${nTrunks}; trail segs ${data.reduce((a, s) => a + parsePath(s.trailD).length, 0)}`);
  await ctx.close();
  return data;
}

const browser = await chromium.launch();
for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080]]) await run(browser, w, h);
await browser.close();

console.log("\n================ VIOLATIONS ================");
if (!viol.length) console.log("none");
viol.forEach((v) => console.log(v));
console.log(`\ntotal violations: ${viol.length}`);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/violations.txt`, viol.join("\n"));
