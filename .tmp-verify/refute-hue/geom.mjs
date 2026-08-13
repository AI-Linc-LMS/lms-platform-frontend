import { chromium } from "playwright";

const URL = "http://localhost:3177/__geom";
const VW = 1440, VH = 900;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: VW, height: VH } });
await ctx.addCookies([
  { name: "access_token", value: "probe", domain: "localhost", path: "/" },
  { name: "user_role", value: "student", domain: "localhost", path: "/" },
]);
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: "domcontentloaded", timeout: 180000 });
await p.waitForFunction(() => document.querySelectorAll("button").length > 100, null, { timeout: 60000 });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1500);

const out = await p.evaluate(() => {
  const norm = (c) => {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? "#" + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, "0")).join("") : c;
  };
  // Section headers: the bordered white card whose first child is a round numbered badge.
  const badges = Array.from(document.querySelectorAll("div"))
    .filter((d) => /^\d+$/.test((d.textContent || "").trim()) && d.children.length === 0
      && getComputedStyle(d).borderRadius.startsWith("50%"));
  const headers = badges.map((bd) => {
    const card = bd.parentElement;
    const r = card.getBoundingClientRect();
    return {
      n: bd.textContent.trim(),
      title: (card.textContent || "").replace(/^\d+/, "").trim(),
      top: Math.round(r.top + scrollY),
      height: Math.round(r.height),
      badgeBg: norm(getComputedStyle(bd).backgroundColor),
      badgeColor: norm(getComputedStyle(bd).color),
      badgeSize: Math.round(bd.getBoundingClientRect().width),
      titleTag: Array.from(card.querySelectorAll("*")).find((e) => e.textContent.trim() === (card.textContent || "").replace(/^\d+/, "").trim())?.tagName,
    };
  });

  // Every spine node button (the big centred ones) grouped by which section it falls under.
  const btns = Array.from(document.querySelectorAll("button")).map((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width),
      bg: norm(getComputedStyle(el).backgroundColor), text: el.textContent.trim().slice(0, 30) };
  });
  const bounds = headers.map((h) => h.top);
  const secOf = (top) => { let s = 0; for (let i = 0; i < bounds.length; i++) if (top >= bounds[i]) s = i; return s; };
  const bySec = {};
  for (const bt of btns) { const s = secOf(bt.top); (bySec[s] ||= []).push(bt); }

  const sections = headers.map((h, i) => {
    const items = bySec[i] || [];
    const tops = items.map((x) => x.top);
    const bots = items.map((x) => x.top + x.h);
    const fills = {};
    for (const it of items) fills[it.bg] = (fills[it.bg] || 0) + 1;
    return {
      n: h.n, title: h.title, headerTop: h.top, badgeBg: h.badgeBg, badgeColor: h.badgeColor,
      badgeSize: h.badgeSize, titleTag: h.titleTag,
      nodeCount: items.length,
      contentTop: Math.min(...tops), contentBottom: Math.max(...bots),
      pixelHeight: Math.max(...bots) - h.top,
      fills,
    };
  });
  return { docHeight: document.documentElement.scrollHeight, sections };
});

console.log(`document height: ${out.docHeight}px  (viewport ${VW}x${VH})`);
console.log("\n== per-section geometry ==");
for (const s of out.sections) {
  const top3 = Object.entries(s.fills).sort((a, c) => c[1] - a[1]).slice(0, 3)
    .map(([k, v]) => `${k}x${v}`).join(" ");
  console.log(
    `sec ${s.n} "${s.title}" headerTop=${s.headerTop} span=${s.pixelHeight}px nodes=${s.nodeCount} ` +
    `badge=${s.badgeBg} on ${s.badgeColor} (${s.badgeSize}px, tag=${s.titleTag}) fills: ${top3}`,
  );
}

console.log("\n== co-visibility: can two sections' nodes share one 900px viewport? ==");
const S = out.sections;
for (let i = 0; i < S.length; i++) {
  for (let j = i + 1; j < S.length; j++) {
    const gap = S[j].headerTop - S[i].headerTop;
    // overlap of [contentTop, contentBottom] windows within a single VH-tall viewport
    const covis = S[i].contentBottom - S[j].contentTop > -VH && S[j].contentTop - S[i].contentBottom < VH
      && S[j].contentTop < S[i].contentBottom + VH;
    if (j === i + 1 || (i === 0 && j === S.length - 1)) {
      console.log(`sec ${S[i].n} -> sec ${S[j].n}: header gap ${gap}px (${(gap / VH).toFixed(1)} viewports), co-visible=${covis}`);
    }
  }
}

// Scroll sweep: at every viewport-height step, how many distinct sections have a node on screen?
const sweep = await p.evaluate(async (VH) => {
  const res = [];
  const H = document.documentElement.scrollHeight;
  const badges = Array.from(document.querySelectorAll("div"))
    .filter((d) => /^\d+$/.test((d.textContent || "").trim()) && d.children.length === 0
      && getComputedStyle(d).borderRadius.startsWith("50%"));
  const bounds = badges.map((bd) => bd.parentElement.getBoundingClientRect().top + scrollY);
  const btns = Array.from(document.querySelectorAll("button")).map((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, bot: r.bottom + scrollY };
  });
  const secOf = (t) => { let s = 0; for (let i = 0; i < bounds.length; i++) if (t >= bounds[i]) s = i; return s; };
  for (let y = 0; y + VH <= H; y += Math.round(VH / 2)) {
    const on = new Set();
    for (const bt of btns) if (bt.bot > y && bt.top < y + VH) on.add(secOf(bt.top));
    res.push({ y, sections: [...on].sort((a, b) => a - b).map((i) => i + 1) });
  }
  return res;
}, VH);

console.log("\n== scroll sweep (half-viewport steps): sections with a node on screen ==");
const counts = {};
let sawPair16 = false;
for (const r of sweep) {
  counts[r.sections.length] = (counts[r.sections.length] || 0) + 1;
  if (r.sections.includes(1) && r.sections.includes(6)) sawPair16 = true;
}
console.log(`positions sampled: ${sweep.length}  distribution of #sections on screen: ${JSON.stringify(counts)}`);
console.log(`any viewport showing BOTH section 1 and section 6: ${sawPair16}`);
console.log(`max sections ever co-visible: ${Math.max(...sweep.map((r) => r.sections.length))}`);
const adj = new Set();
for (const r of sweep) for (let i = 0; i < r.sections.length; i++) for (let j = i + 1; j < r.sections.length; j++) adj.add(`${r.sections[i]}v${r.sections[j]}`);
console.log(`section pairs that ever share a viewport: ${[...adj].join(", ") || "none"}`);

await b.close();
