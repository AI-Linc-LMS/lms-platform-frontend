const { chromium } = require('playwright');
const URLS = ['/adaptive-courses','/ai-tutor','/assessments','/jobs-v2','/live-sessions','/tickets',
  '/admin/dashboard','/admin/instructors','/admin/adaptive-courses','/admin/scorecard','/admin/admin-mock-interview','/admin/notifications'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0,120)));
  await page.goto('https://staging.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'perf.scrollcheck@ailinc.com');
  await page.fill('input[type="password"]', 'PerfScroll@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(6000);
  console.log('after login url:', page.url());
  for (const r of URLS) {
    try {
      await page.goto('https://staging.ailinc.com' + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3200);
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(500);
      const res = await page.evaluate(() => {
        const doc = document.scrollingElement;
        let c = null;
        for (const el of document.querySelectorAll('*')) if (el.scrollTop > 10) { c = el.tagName + '.' + String(el.className).slice(0,45); break; }
        return { top: doc.scrollTop, sh: doc.scrollHeight, ch: doc.clientHeight, c, url: location.pathname };
      });
      const overflows = res.sh > res.ch + 10;
      const worked = res.top > 10 || !!res.c || !overflows;
      console.log(JSON.stringify({ r, ...res, overflows, SCROLL: worked ? 'OK' : 'BROKEN' }));
      if (!worked) await page.screenshot({ path: `../broken${r.replace(/\//g,'_')}.png` });
    } catch (e) { console.log(JSON.stringify({ r, error: String(e).slice(0,100) })); }
  }
  console.log('pageErrors:', JSON.stringify(errors.slice(0,5)));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
