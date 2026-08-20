const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  const wheelTest = async (label) => {
    await page.waitForTimeout(2800);
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const doc = document.scrollingElement;
      let container = null;
      for (const el of document.querySelectorAll('*')) {
        if (el.scrollTop > 10) { container = (el.tagName + '.' + String(el.className).slice(0, 60)); break; }
      }
      return {
        url: location.pathname,
        docTop: doc.scrollTop, docSH: doc.scrollHeight, docCH: doc.clientHeight,
        scrolledContainer: container,
      };
    });
    const overflows = r.docSH > r.docCH + 10;
    console.log(JSON.stringify({ label, ...r, overflows, wheelWorked: r.docTop > 10 || !!r.scrolledContainer }));
    await page.evaluate(() => window.scrollTo(0, 0));
  };
  await page.goto('https://demo.ailinc.com/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'student1@demo.ailinc.com');
  await page.fill('input[type="password"]', 'DemoAiLinc@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(3000);

  // adaptive course journey (click first course card)
  await page.goto('https://demo.ailinc.com/adaptive-courses', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const courseLink = page.locator('a[href^="/adaptive-courses/"], [class*="card"] >> visible=true').first();
  const adaptiveHref = await page.locator('a[href^="/adaptive-courses/"]').first().getAttribute('href').catch(() => null);
  if (adaptiveHref) {
    await page.goto('https://demo.ailinc.com' + adaptiveHref, { waitUntil: 'domcontentloaded' });
    await wheelTest('adaptive journey ' + adaptiveHref);
  } else {
    // click the first clickable card
    await courseLink.click().catch(() => {});
    await page.waitForTimeout(3000);
    await wheelTest('adaptive journey (clicked card): ' + page.url());
  }

  // course detail
  await page.goto('https://demo.ailinc.com/courses', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const courseHref = await page.locator('a[href^="/courses/"]').first().getAttribute('href').catch(() => null);
  if (courseHref) {
    await page.goto('https://demo.ailinc.com' + courseHref, { waitUntil: 'domcontentloaded' });
    await wheelTest('course detail ' + courseHref);
  }

  // assessment detail/instructions
  await page.goto('https://demo.ailinc.com/assessments', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const assessHref = await page.locator('a[href^="/assessments/"]').first().getAttribute('href').catch(() => null);
  if (assessHref) {
    await page.goto('https://demo.ailinc.com' + assessHref, { waitUntil: 'domcontentloaded' });
    await wheelTest('assessment detail ' + assessHref);
  } else {
    console.log(JSON.stringify({ label: 'assessment detail', note: 'no link found (cards may use router.push)' }));
    const card = page.locator('[class*="Card"], [class*="card"]').first();
    if (await card.count()) { await card.click().catch(()=>{}); await page.waitForTimeout(2500); await wheelTest('assessment via card click: ' + page.url()); }
  }

  // profile + community deep too
  await page.goto('https://demo.ailinc.com/community', { waitUntil: 'domcontentloaded' });
  await wheelTest('community');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
