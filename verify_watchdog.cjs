const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const site of [
    { base: 'https://staging.ailinc.com', email: 'perf.scrollcheck@ailinc.com', pass: 'PerfScroll@2026' },
    { base: 'https://demo.ailinc.com', email: 'student1@demo.ailinc.com', pass: 'DemoAiLinc@2026' },
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(site.base + '/login', { waitUntil: 'load' });
    await page.fill('input[type="email"]', site.email);
    await page.fill('input[type="password"]', site.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin/, { timeout: 30000 });
    await page.waitForTimeout(3500);
    // dismiss the tour if open
    const skip = page.locator('.MuiDialog-root button:has-text("Skip")').first();
    if (await skip.count()) await skip.click().catch(() => {});
    await page.waitForTimeout(800);
    // SIMULATE the stuck state: orphaned inline scroll-lock, no modal
    await page.evaluate(() => { document.body.style.overflow = 'hidden'; });
    const lockedNow = await page.evaluate(() => document.body.style.overflow);
    await page.waitForTimeout(8000); // watchdog: 3 strikes x 2s + margin
    const after = await page.evaluate(() => document.body.style.overflow);
    // and wheel must work again
    await page.mouse.move(640, 420);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(400);
    const top = await page.evaluate(() => document.scrollingElement.scrollTop);
    console.log(JSON.stringify({ site: site.base, injectedLock: lockedNow, lockAfter8s: after || '(cleared)', wheelScrollsAfter: top > 10, WATCHDOG: (after === '' && top > 10) ? 'WORKS' : 'CHECK' }));
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
