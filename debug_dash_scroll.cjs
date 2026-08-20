const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('https://staging.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'perf.scrollcheck@ailinc.com');
  await page.fill('input[type="password"]', 'PerfScroll@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.goto('https://staging.ailinc.com/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const diag = await page.evaluate(() => {
    const el = document.elementFromPoint(720, 450);
    const chain = [];
    let cur = el;
    while (cur && chain.length < 8) {
      const cs = getComputedStyle(cur);
      chain.push({ tag: cur.tagName, cls: String(cur.className).slice(0, 50), pos: cs.position, ovf: cs.overflowY, h: cur.clientHeight, sh: cur.scrollHeight });
      cur = cur.parentElement;
    }
    const fixed = [...document.querySelectorAll('*')].filter(e => {
      const cs = getComputedStyle(e);
      return (cs.position === 'fixed') && e.clientWidth >= innerWidth * 0.9 && e.clientHeight >= innerHeight * 0.9 && cs.pointerEvents !== 'none' && cs.display !== 'none';
    }).map(e => e.tagName + '.' + String(e.className).slice(0, 60));
    const doc = document.scrollingElement;
    return { chainAtPoint: chain, fullScreenFixed: fixed, docSH: doc.scrollHeight, docCH: doc.clientHeight };
  });
  console.log(JSON.stringify(diag, null, 1));
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => document.scrollingElement.scrollTop);
  console.log('docTop after wheel:', after);
  await page.screenshot({ path: '../dash_scroll_debug.png' });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
