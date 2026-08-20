const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  await page.goto('https://demo.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'student1@demo.ailinc.com');
  await page.fill('input[type="password"]', 'DemoAiLinc@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(3500);
  const out = {};
  for (const r of ['/dashboard', '/adaptive-courses', '/assessments', '/courses']) {
    await page.goto('https://demo.ailinc.com' + r, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // REAL wheel scroll in the middle of the content area
    const before = await page.evaluate(() => {
      const doc = document.scrollingElement;
      const main = document.querySelector('main');
      return { docTop: doc.scrollTop, mainTop: main ? main.scrollTop : null,
               docSH: doc.scrollHeight, docCH: doc.clientHeight,
               mainSH: main ? main.scrollHeight : null, mainCH: main ? main.clientHeight : null };
    });
    await page.mouse.move(720, 500);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => {
      const doc = document.scrollingElement;
      const main = document.querySelector('main');
      // also check EVERY element that moved
      let anyScrolled = null;
      for (const el of document.querySelectorAll('*')) {
        if (el.scrollTop > 10) { anyScrolled = el.tagName + '.' + String(el.className).slice(0,50); break; }
      }
      return { docTop: doc.scrollTop, mainTop: main ? main.scrollTop : null, anyScrolled };
    });
    out[r] = { before, after,
      wheelWorked: (after.docTop > 10) || (after.mainTop !== null && after.mainTop > 10) || !!after.anyScrolled,
      contentOverflows: before.docSH > before.docCH + 10 || (before.mainSH !== null && before.mainSH > before.mainCH + 10) };
  }
  console.log(JSON.stringify(out, null, 1));
  await page.screenshot({ path: '../scroll_repro.png' });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
