const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  // 1) staging public page wheel + chunk integrity
  const p1 = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  const failed = [];
  p1.on('response', r => { if (r.status() >= 400 && r.url().includes('/_next/')) failed.push(r.status() + ' ' + r.url().slice(-60)); });
  await p1.goto('https://staging.ailinc.com/signup', { waitUntil: 'load' });
  await p1.mouse.move(400, 400); await p1.mouse.wheel(0, 900); await p1.waitForTimeout(400);
  const stagingScroll = await p1.evaluate(() => document.scrollingElement.scrollTop);
  console.log(JSON.stringify({ staging_signup_wheel: stagingScroll, chunk404s: failed }));

  // 2) demo dashboard at small laptop + mobile viewports
  for (const vp of [{ width: 1280, height: 620 }, { width: 390, height: 740 }]) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto('https://demo.ailinc.com/login', { waitUntil: 'load' });
    await page.fill('input[type="email"]', 'student1@demo.ailinc.com');
    await page.fill('input[type="password"]', 'DemoAiLinc@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3500);
    const out = {};
    for (const r of ['/dashboard', '/adaptive-courses/33', '/assessments']) {
      await page.goto('https://demo.ailinc.com' + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await page.mouse.move(Math.floor(vp.width/2), Math.floor(vp.height*0.6));
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(500);
      const res = await page.evaluate(() => {
        const doc = document.scrollingElement;
        let c = null;
        for (const el of document.querySelectorAll('*')) if (el.scrollTop > 10) { c = el.tagName + '.' + String(el.className).slice(0,40); break; }
        return { top: doc.scrollTop, sh: doc.scrollHeight, ch: doc.clientHeight, c };
      });
      out[r] = { ...res, worked: res.top > 10 || !!res.c || res.sh <= res.ch + 10 };
    }
    console.log(JSON.stringify({ viewport: vp, out }));
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
