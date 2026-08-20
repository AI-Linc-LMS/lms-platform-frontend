const { chromium } = require('playwright');
const ROUTES = ['/resume','/admin/instructors','/admin/adaptive-courses','/assessments','/live-sessions','/admin/jobs-v2','/admin/notifications','/dashboard','/courses'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('https://staging.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'perf.scrollcheck@ailinc.com');
  await page.fill('input[type="password"]', 'PerfScroll@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30000 });
  await page.waitForTimeout(3000);
  for (const r of ROUTES) {
    await page.goto('https://staging.ailinc.com' + r, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3200);
    const d = await page.evaluate(() => {
      const doc = document.scrollingElement;
      const bodyOvf = getComputedStyle(document.body).overflow;
      const dialogs = [...document.querySelectorAll('.MuiDialog-root, .MuiModal-root')].map(e => {
        const cs = getComputedStyle(e);
        const txt = (e.textContent || '').trim().slice(0, 60);
        return { cls: String(e.className).slice(0, 40), display: cs.display, vis: cs.visibility, txt };
      });
      return { bodyOvf, docSH: doc.scrollHeight, docCH: doc.clientHeight, dialogs, bodyPadRight: document.body.style.paddingRight };
    });
    await page.mouse.move(640, 420);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(400);
    const top = await page.evaluate(() => document.scrollingElement.scrollTop);
    console.log(JSON.stringify({ r, scrolled: top > 10, ...d }));
    await page.evaluate(() => window.scrollTo(0,0));
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
