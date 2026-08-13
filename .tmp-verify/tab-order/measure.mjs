import { chromium } from "playwright";

const URL = "http://localhost:3177/__geom";

const collect = () => {
  const nodes = [...document.querySelectorAll("button")]
    .map((el) => ({ el, t: (el.textContent || "").trim() }))
    .filter((x) => /^S\d+T\d+(L\d+)?(Optional)?$/.test(x.t));
  return nodes.map(({ el, t }, i) => {
    const r = el.getBoundingClientRect();
    const m = t.match(/^S(\d+)T(\d+)(?:L(\d+))?/);
    return {
      dom: i,
      t,
      sec: +m[1],
      step: +m[2],
      leaf: m[3] === undefined ? null : +m[3],
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      cx: Math.round(r.left + window.scrollX + r.width / 2),
      cy: Math.round(r.top + window.scrollY + r.height / 2),
    };
  });
};

async function run(page, width, height, label) {
  await page.setViewportSize({ width, height });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("text=S0T0", { timeout: 180000 }); await page.waitForTimeout(2500);
  const boxes = await page.evaluate(collect);

  // Real tab traversal: focus the first node box, then Tab through and record order.
  const tabOrder = await page.evaluate(async () => {
    const label = (el) =>
      el && el.tagName === "BUTTON" ? (el.textContent || "").trim() : null;
    const first = [...document.querySelectorAll("button")].find((el) =>
      /^S0T0$/.test((el.textContent || "").trim())
    );
    if (!first) return [];
    first.focus();
    return [label(document.activeElement)];
  });

  // Walk Tab for the first section only (30 steps+leaves + chips).
  const seq = [tabOrder[0]];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const l = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el.tagName === "BUTTON" ? (el.textContent || "").trim() : `<${el?.tagName}>`;
    });
    seq.push(l);
  }

  // Section trail order == DOM order of step boxes (registry.step(seq) is assigned by
  // (seq += 1) in DOM render order), so we report DOM order of steps and their columns.
  const sec0 = boxes.filter((b) => b.sec === 0);
  const steps0 = sec0.filter((b) => b.leaf === null);
  const colOf = (b) => {
    const xs = [...new Set(steps0.map((s) => s.x))].sort((a, c) => a - c);
    return xs.indexOf(b.x) + 1;
  };
  const rowOf = (b) => {
    const ys = [...new Set(steps0.map((s) => s.y))].sort((a, c) => a - c);
    return ys.indexOf(b.y) + 1;
  };

  console.log(`\n########## ${label}  viewport ${width}x${height} ##########`);
  console.log("distinct step x positions (cols):", [...new Set(steps0.map((s) => s.x))].sort((a, c) => a - c));
  console.log("distinct step y positions (rows):", [...new Set(steps0.map((s) => s.y))].sort((a, c) => a - c));
  console.log("\nSection 1 step boxes, in DOM order (== trail travel order):");
  for (const s of steps0) {
    console.log(
      `  dom#${String(s.dom).padStart(3)}  ${s.t.padEnd(6)} col=${colOf(s)} row=${rowOf(s)}  x=${s.x} y=${s.y} w=${s.w} h=${s.h}`
    );
  }

  console.log("\nReading order (left->right, top->bottom) per row vs DOM order:");
  const rows = {};
  for (const s of steps0) (rows[rowOf(s)] ||= []).push(s);
  for (const [r, arr] of Object.entries(rows)) {
    const dom = arr.map((s) => s.t);
    const ltr = [...arr].sort((a, b) => a.x - b.x).map((s) => s.t);
    console.log(
      `  row ${r}: DOM=[${dom.join(", ")}]  LTR=[${ltr.join(", ")}]  ${
        dom.join() === ltr.join() ? "SAME" : "REVERSED"
      }`
    );
  }

  console.log("\nTab traversal (real key presses) from S0T0, 40 stops:");
  console.log("  " + seq.join(" -> "));

  console.log("\nFocus jump geometry between consecutive node boxes in section 1 (DOM order):");
  const byLabel = new Map(boxes.map((b) => [b.t.replace(/Optional$/, ""), b]));
  let maxUp = 0, maxRight = 0;
  for (let i = 1; i < sec0.length; i++) {
    const a = sec0[i - 1], b = sec0[i];
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const kind =
      a.leaf !== null && b.leaf === null ? "LEAF->NEXT STEP" : b.leaf !== null && a.leaf === null ? "STEP->LEAF0" : b.leaf !== null ? "leaf->leaf" : "step->step";
    if (kind === "LEAF->NEXT STEP") {
      maxUp = Math.max(maxUp, -dy);
      maxRight = Math.max(maxRight, Math.abs(dx));
      console.log(`  ${a.t} -> ${b.t}  dx=${dx}  dy=${dy}   [${kind}]`);
    }
    if (kind === "leaf->leaf") {
      // horizontal jitter from alternating sides
    }
  }
  console.log(`  MAX upward jump = ${maxUp}px, MAX horizontal jump = ${maxRight}px`);

  // Leaf stack: alternating side jitter
  const leaves = sec0.filter((b) => b.leaf !== null && b.step === 0);
  console.log("\nLeaf stack of S0T0 (alternating sides):");
  for (const l of leaves) console.log(`  ${l.t}  x=${l.x} w=${l.w} right=${l.x + l.w} cy=${l.cy}`);
  if (leaves.length > 1) {
    let jit = 0;
    for (let i = 1; i < leaves.length; i++) jit = Math.max(jit, Math.abs(leaves[i].cx - leaves[i - 1].cx));
    console.log(`  MAX leaf->leaf horizontal centre jitter = ${jit}px`);
    console.log(`  leaf stack total height (top of leaf0 -> bottom of last) = ${leaves[leaves.length - 1].y + leaves[leaves.length - 1].h - leaves[0].y}px`);
    const step = steps0[0];
    console.log(`  step bottom = ${step.y + step.h}, leaf0 top = ${leaves[0].y}, gap(mt) = ${leaves[0].y - (step.y + step.h)}px`);
    console.log(`  full block: step top ${step.y} -> last leaf bottom ${leaves[leaves.length-1].y + leaves[leaves.length-1].h} = ${leaves[leaves.length-1].y + leaves[leaves.length-1].h - step.y}px`);
  }
  return { boxes, seq };
}

const b = await chromium.launch();
const ctx = await b.newContext();
await ctx.addCookies([
  { name: "access_token", value: "geomprobe", domain: "localhost", path: "/" },
  { name: "user_role", value: "student", domain: "localhost", path: "/" },
]);
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERR:", m.text().slice(0, 200)); });

await run(page, 1440, 900, "DESKTOP 1440 (cols should be 3)");
await run(page, 1000, 900, "MID 1000 (cols should be 2)");
await run(page, 360, 900, "400% BROWSER ZOOM of 1440 => 360 CSS px (cols should be 1)");
await run(page, 320, 900, "WCAG 1.4.10 reflow width 320 (cols should be 1)");

await b.close();
