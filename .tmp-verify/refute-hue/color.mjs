// Self-contained colour measurement for the SECTION_ACCENTS claim.
const ACC = [
  { name: "1 violet", spine: "#c4b5fd", branch: "#ede9fe", text: "#1e1b4b", rail: "#7c3aed" },
  { name: "2 blue",   spine: "#a5d8ff", branch: "#e7f5ff", text: "#0b3d64", rail: "#1c7ed6" },
  { name: "3 green",  spine: "#b2f2bb", branch: "#ebfbee", text: "#0b4a1e", rail: "#2f9e44" },
  { name: "4 amber",  spine: "#ffd8a8", branch: "#fff4e6", text: "#6b3009", rail: "#e8590c" },
  { name: "5 pink",   spine: "#fcc2d7", branch: "#fff0f6", text: "#6b183c", rail: "#c2255c" },
  { name: "6 indigo", spine: "#d0bfff", branch: "#f3f0ff", text: "#2c1a5e", rail: "#7048e8" },
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const relLum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const L1 = relLum(a), L2 = relLum(b); const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]; return (hi + 0.05) / (lo + 0.05); };
const euclid = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// sRGB -> Lab (D65)
function lab(rgb) {
  const [r, g, b] = rgb.map(lin);
  let X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  let Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  X /= 0.95047; Y /= 1.0; Z /= 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deltaE2000(l1, l2) {
  const [L1, a1, b1] = l1, [L2, a2, b2] = l2;
  const avgLp = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const deg = (r) => (r * 180) / Math.PI;
  const h = (ap, bp) => { if (ap === 0 && bp === 0) return 0; let x = deg(Math.atan2(bp, ap)); return x < 0 ? x + 360 : x; };
  const h1p = h(a1p, b1), h2p = h(a2p, b2);
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dLp = L2 - L1, dCp = C2p - C1p;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
  let avgHp;
  if (C1p * C2p === 0) avgHp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) avgHp = (h1p + h2p) / 2;
  else avgHp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  const T = 1 - 0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180) + 0.24 * Math.cos((2 * avgHp * Math.PI) / 180)
    + 0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180) - 0.20 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const Sl = 1 + (0.015 * (avgLp - 50) ** 2) / Math.sqrt(20 + (avgLp - 50) ** 2);
  const Sc = 1 + 0.045 * avgCp;
  const Sh = 1 + 0.015 * avgCp * T;
  const dTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
  const Rt = -Rc * Math.sin((2 * dTheta * Math.PI) / 180);
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

// Viénot/Brettel/Mollon 1999 dichromat simulation in linear RGB.
function simulate(rgb, type) {
  const [r, g, b] = rgb.map(lin);
  // LMS via Hunt-Pointer-Estevez applied to linear sRGB (Viénot matrices)
  const L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
  const M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
  const S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;
  let l = L, m = M, s = S;
  if (type === "protan") l = 2.02344 * M - 2.52581 * S;
  if (type === "deutan") m = 0.494207 * L + 1.24827 * S;
  if (type === "tritan") s = -0.395913 * L + 0.801109 * M;
  let R = 0.0809444479 * l - 0.130504409 * m + 0.116721066 * s;
  let G = -0.0102485335 * l + 0.0540193266 * m - 0.113614708 * s;
  let B = -0.000365296938 * l - 0.00412161469 * m + 0.693511405 * s;
  const gam = (c) => { c = Math.min(1, Math.max(0, c)); return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)); };
  return [gam(R), gam(G), gam(B)];
}

function pairs(label, get) {
  const out = [];
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    const A = get(ACC[i]), B = get(ACC[j]);
    out.push({ pair: `${i + 1}v${j + 1}`, euclid: +euclid(A, B).toFixed(1), dE00: +deltaE2000(lab(A), lab(B)).toFixed(1) });
  }
  out.sort((a, b) => a.dE00 - b.dE00);
  console.log(`\n== ${label} (sorted by dE2000, ascending) ==`);
  console.log(out.map((o) => `${o.pair}: dE00=${o.dE00} rgbDist=${o.euclid}`).join("  |  "));
  return out;
}

console.log("### NORMAL VISION");
pairs("spine fill", (a) => hex(a.spine));
pairs("rail stroke", (a) => hex(a.rail));

for (const t of ["deutan", "protan", "tritan"]) {
  console.log(`\n### ${t.toUpperCase()}OPIA (Vienot 1999)`);
  pairs(`spine fill / ${t}`, (a) => simulate(hex(a.spine), t));
  pairs(`rail stroke / ${t}`, (a) => simulate(hex(a.rail), t));
}

console.log("\n### GREYSCALE: adjacent-section spine fill luminance contrast");
for (let i = 0; i < 6; i++) {
  const j = (i + 1) % 6;
  console.log(`${i + 1}v${j + 1}: ${contrast(hex(ACC[i].spine), hex(ACC[j].spine)).toFixed(2)}:1`);
}
console.log("\n### GREYSCALE: adjacent-section RAIL luminance contrast");
for (let i = 0; i < 6; i++) {
  const j = (i + 1) % 6;
  console.log(`${i + 1}v${j + 1}: ${contrast(hex(ACC[i].rail), hex(ACC[j].rail)).toFixed(2)}:1`);
}

console.log("\n### Section-number badge legibility: #fff on accent.rail");
for (const a of ACC) console.log(`${a.name}: ${contrast([255, 255, 255], hex(a.rail)).toFixed(2)}:1`);

console.log("\n### Node label legibility: accent.text on accent.spine (spine node, 14px/700)");
for (const a of ACC) console.log(`${a.name}: ${contrast(hex(a.text), hex(a.spine)).toFixed(2)}:1`);
console.log("\n### Node label legibility: accent.text on accent.branch (branch node, 12.5px/600)");
for (const a of ACC) console.log(`${a.name}: ${contrast(hex(a.text), hex(a.branch)).toFixed(2)}:1`);
