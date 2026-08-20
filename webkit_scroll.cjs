const { webkit } = require('playwright');
(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  await page.goto('https://staging.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'perf.scrollcheck@ailinc.com');
  await page.fill('input[type="password"]', 'PerfScroll@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(6000);
  for (const r of ['/admin/dashboard', '/assessments', '/adaptive-courses', '/live-sessions']) {
    await page.goto('https://staging.ailinc.com' + r, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3200);
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
    const res = await page.evaluate(() => {
      const doc = document.scrollingElement;
      let c = null;
      for (const el of document.querySelectorAll('*')) if (el.scrollTop > 10) { c = el.tagName; break; }
      return { top: doc.scrollTop, sh: doc.scrollHeight, ch: doc.clientHeight, c };
    });
    console.log(JSON.stringify({ engine: 'webkit', r, ...res, SCROLL: (res.top > 10 || !!res.c || res.sh <= res.ch + 10) ? 'OK' : 'BROKEN' }));
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
