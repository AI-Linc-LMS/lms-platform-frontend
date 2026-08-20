// Watchdog verification on PROD learn.ailinc.com /login (unauthenticated).
// 1. Load page. 2. Inject body overflow:hidden (no modal open). 3. Wait 8s.
// 4. Confirm the watchdog auto-cleared it. 5. Confirm wheel scroll moves the page.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 500 } });
  const t0 = Date.now();
  await page.goto('https://learn.ailinc.com/login', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('loaded /login in', Date.now() - t0, 'ms');

  // Make sure the page is scrollable regardless of login-page height: add tall spacer (local DOM only).
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'wd-spacer';
    d.style.height = '3000px';
    document.body.appendChild(d);
  });

  const before = await page.evaluate(() => ({
    inline: document.body.style.overflow,
    computed: getComputedStyle(document.body).overflow,
    modalOpen: !!document.querySelector('[role="dialog"], [data-state="open"], .MuiModal-root'),
  }));
  console.log('before-inject:', JSON.stringify(before));

  // Inject the stuck lock.
  await page.evaluate(() => { document.body.style.overflow = 'hidden'; });
  const justAfter = await page.evaluate(() => document.body.style.overflow);
  console.log('immediately-after-inject inline overflow:', JSON.stringify(justAfter));

  // Poll every 500ms for 8s to observe when it clears.
  let clearedAtMs = null;
  for (let i = 1; i <= 16; i++) {
    await page.waitForTimeout(500);
    const cur = await page.evaluate(() => document.body.style.overflow);
    if ((cur === '' || cur === 'auto' || cur === 'visible') && clearedAtMs === null) {
      clearedAtMs = i * 500;
      console.log('overflow cleared at ~' + clearedAtMs + 'ms (inline value now: ' + JSON.stringify(cur) + ')');
    }
  }
  const after8s = await page.evaluate(() => ({
    inline: document.body.style.overflow,
    computed: getComputedStyle(document.body).overflow,
  }));
  console.log('after-8s:', JSON.stringify(after8s), 'clearedAtMs:', clearedAtMs);

  // Wheel scroll test.
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.move(640, 250);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  const y1 = await page.evaluate(() => window.scrollY);
  console.log('wheel scroll: scrollY', y0, '->', y1, y1 > y0 ? 'SCROLL WORKS' : 'SCROLL BLOCKED');

  const pass = clearedAtMs !== null && (after8s.inline === '' || after8s.inline === 'auto' || after8s.inline === 'visible') && y1 > y0;
  console.log('WATCHDOG TEST:', pass ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error('ERROR:', e.message); process.exit(2); });
