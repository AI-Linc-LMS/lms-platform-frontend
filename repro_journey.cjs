const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  await page.goto('https://demo.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'student1@demo.ailinc.com');
  await page.fill('input[type="password"]', 'DemoAiLinc@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(2500);
  for (const r of ['/adaptive-courses/33', '/adaptive-courses/33/journey']) {
    try {
      await page.goto('https://demo.ailinc.com' + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(500);
      const res = await page.evaluate(() => {
        const doc = document.scrollingElement;
        let container = null;
        for (const el of document.querySelectorAll('*')) {
          if (el.scrollTop > 10) { container = el.tagName + '.' + String(el.className).slice(0,60); break; }
        }
        return { url: location.pathname, docTop: doc.scrollTop, docSH: doc.scrollHeight, docCH: doc.clientHeight, container };
      });
      console.log(JSON.stringify({ r, ...res, wheelWorked: res.docTop > 10 || !!res.container, overflows: res.docSH > res.docCH + 10 }));
      await page.screenshot({ path: `../journey_${r.replace(/\//g,'_')}.png` });
    } catch (e) { console.log(JSON.stringify({ r, error: String(e).slice(0,100) })); }
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
