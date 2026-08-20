const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const api = [];
  page.on('response', async r => {
    const u = r.url();
    if (u.includes('be-app.ailinc.com')) {
      let size = 0; try { size = (await r.body()).length; } catch {}
      api.push({ u: u.replace('https://be-app.ailinc.com', '').slice(0, 70), s: r.status(), ms: null, size });
    }
  });
  await page.goto('https://staging.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'perf.scrollcheck@ailinc.com');
  await page.fill('input[type="password"]', 'PerfScroll@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30000 });
  await page.waitForTimeout(3000);
  const toggle = page.locator('text=Admin Mode').first();
  if (await toggle.count()) { await toggle.click(); await page.waitForTimeout(3000); }

  const barState = () => page.evaluate(() => {
    const bars = [...document.querySelectorAll('div[aria-hidden="true"]')].filter(d => d.style.position === 'fixed' && d.style.top === '0px' && d.style.height === '3px');
    if (!bars.length) return { present: false };
    const b = bars[0];
    return { present: true, width: b.style.width, opacity: b.style.opacity };
  });

  const navAndCheck = async (label, action) => {
    api.length = 0;
    const t0 = Date.now();
    await action();
    await page.waitForTimeout(3500);
    const bar = await barState();
    const apiTop = api.sort((a, b) => b.size - a.size).slice(0, 3);
    console.log(label, JSON.stringify({ url: page.url().replace('https://staging.ailinc.com',''), barAfter3_5s: bar, apiCalls: api.length, biggest: apiTop }));
  };

  await navAndCheck('[managestudents]', async () => { await page.locator('a[href*="manage-student"]').first().click(); });
  await navAndCheck('[same-route-again]', async () => { await page.locator('a[href*="manage-student"]').first().click(); });
  await navAndCheck('[assessment]', async () => { await page.locator('a[href="/admin/assessment"]').first().click(); });
  await navAndCheck('[notifications]', async () => { await page.locator('a[href="/admin/notifications"]').first().click(); });
  await navAndCheck('[adaptive-adm]', async () => { await page.locator('a[href="/admin/adaptive-courses"]').first().click(); });
  await navAndCheck('[admindash]', async () => { await page.locator('a[href="/admin/dashboard"]').first().click(); });
  // state-only history update simulation (libs do this)
  await navAndCheck('[pushState-null-url]', async () => { await page.evaluate(() => history.pushState({ x: 1 }, '', null)); });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
