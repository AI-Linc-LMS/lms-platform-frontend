/**
 * The grand verification tour: real-browser, real-input measurements of the
 * complete user flows on staging (student + admin) and prod (demo), plus
 * browser-measured landing metrics for every healthy tenant domain.
 * Every number is measured in this session — no reuse, no estimates.
 */
const { chromium } = require('playwright');

const HEALTHY_DOMAINS = [
  'staging.ailinc.com', 'learn.ailinc.com', 'demo.ailinc.com', 'careerxp.ailinc.com',
  'assessment.ailinc.com', 'zskillup.ailinc.com', 'learn.agileologyedu.com',
  'kayalasacademy.ailinc.com', 'learn.kayalasacademy.com', 'utb.ailinc.com',
  'test.fde.academy', 'impacteers.ailinc.com', 'learn.inun.com', 'kotiw.ailinc.com',
  'kuwomenscollege.ailinc.com', 'app.glocalinfo.in', 'marvitech.ailinc.com',
  'kakatiyauniversity.ailinc.com',
];

const STUDENT_ROUTES = ['/dashboard', '/adaptive-courses', '/courses', '/assessments', '/community', '/live-sessions', '/tickets', '/profile', '/jobs-v2', '/ai-tutor'];
const ADMIN_ROUTES = ['/admin/dashboard', '/admin/manage-students', '/admin/assessment', '/admin/adaptive-courses', '/admin/notifications', '/admin/instructors', '/admin/live-sessions', '/admin/admin-mock-interview'];

async function measureNav(page, base, route) {
  // real click when a matching nav link exists, else SPA-equivalent goto
  const link = page.locator(`a[href="${route}"]`).first();
  const t0 = Date.now();
  const beforeMain = await page.evaluate(() => (document.querySelector('main')?.innerHTML || '').length);
  if (await link.count()) await link.click();
  else await page.goto(base + route, { waitUntil: 'commit' });
  // content-changed: main innerHTML length shifts meaningfully
  let paint = null;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(100);
    const nowLen = await page.evaluate(() => (document.querySelector('main')?.innerHTML || '').length);
    const url = await page.evaluate(() => location.pathname);
    if (url === route && Math.abs(nowLen - beforeMain) > 200) { paint = Date.now() - t0; break; }
  }
  // settle: network quiet-ish
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  const settled = Date.now() - t0;
  // bar must not be stranded
  await page.waitForTimeout(600);
  const barStuck = await page.evaluate(() => {
    const bars = [...document.querySelectorAll('div[aria-hidden="true"]')].filter(d => d.style.position === 'fixed' && d.style.height === '3px');
    return bars.length > 0 && parseFloat(bars[0].style.width) < 100 && bars[0].style.opacity !== '0';
  });
  // wheel check
  await page.mouse.move(660, 430);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(250);
  const scroll = await page.evaluate(() => {
    const doc = document.scrollingElement;
    const ok = doc.scrollTop > 5 || doc.scrollHeight <= doc.clientHeight + 10;
    window.scrollTo(0, 0);
    return ok;
  });
  return { route, clickToContentMs: paint, settledMs: settled, barStuck, scrollOk: scroll };
}

async function fullFlow(browser, base, email, password, withAdmin) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  const out = { site: base, loginFlow: {}, studentNav: [], adminNav: [], errors };

  // login page load (browser-measured)
  const tL = Date.now();
  await page.goto(base + '/login', { waitUntil: 'load' });
  out.loginFlow.pageLoadMs = Date.now() - tL;
  out.loginFlow.perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
    return { ttfbMs: Math.round(nav.responseStart), fcpMs: fcp ? Math.round(fcp.startTime) : null, docKB: Math.round(nav.decodedBodySize / 1024) };
  });
  // submit -> dashboard
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  const tS = Date.now();
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30000 });
  out.loginFlow.submitToUrlMs = Date.now() - tS;
  let painted = null;
  for (let i = 0; i < 80; i++) {
    await page.waitForTimeout(100);
    const len = await page.evaluate(() => (document.querySelector('main')?.innerHTML || '').length);
    if (len > 3000) { painted = Date.now() - tS; break; }
  }
  out.loginFlow.submitToContentMs = painted;
  await page.waitForTimeout(1500);
  const skip = page.locator('.MuiDialog-root button:has-text("Skip")').first();
  if (await skip.count()) { await skip.click().catch(() => {}); await page.waitForTimeout(800); }

  for (const r of STUDENT_ROUTES) out.studentNav.push(await measureNav(page, base, r));

  if (withAdmin) {
    const toggle = page.locator('text=Admin Mode').first();
    if (await toggle.count()) { await toggle.click(); await page.waitForTimeout(2500); }
    for (const r of ADMIN_ROUTES) out.adminNav.push(await measureNav(page, base, r));
  }
  out.watchdogRescues = await page.evaluate(() => window.__scrollLockRescues ?? 0);
  await page.close();
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const report = { measuredAt: new Date().toISOString(), flows: [], landings: [] };

  report.flows.push(await fullFlow(browser, 'https://staging.ailinc.com', 'perf.scrollcheck@ailinc.com', 'PerfScroll@2026', true));
  report.flows.push(await fullFlow(browser, 'https://demo.ailinc.com', 'student1@demo.ailinc.com', 'DemoAiLinc@2026', false));

  // PRIORITY domains (user-named): 4 browser loads + document integrity.
  const PRIORITY = ['impacteers.ailinc.com', 'learn.agileologyedu.com', 'learn.ailinc.com', 'zskillup.ailinc.com', 'assessment.ailinc.com'];
  for (const host of PRIORITY) {
    try {
      const page = await browser.newPage();
      const loads = [];
      for (let i = 0; i < 4; i++) {
        await page.goto(`https://${host}/login`, { waitUntil: 'load', timeout: 30000 });
        const m = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
          return { ttfb: Math.round(nav.responseStart), fcp: fcp ? Math.round(fcp.startTime) : null, kb: Math.round(nav.decodedBodySize / 1024) };
        });
        loads.push(m);
        await page.waitForTimeout(400);
      }
      const integrity = await page.evaluate(() => ({
        emotionBlocks: document.querySelectorAll('style[data-emotion]').length,
        formInputs: document.querySelectorAll('input').length,
        satoshiLoaded: document.fonts.check('16px Satoshi'),
        fontshareLinks: document.querySelectorAll('link[href*="fontshare"]').length,
      }));
      report.landings.push({ host, priority: true, loads, integrity });
      await page.close();
    } catch (e) {
      report.landings.push({ host, priority: true, error: String(e).slice(0, 80) });
    }
  }

  // fleet landing metrics, real browser, 2 loads each
  for (const host of HEALTHY_DOMAINS.filter(h => !PRIORITY.includes(h) && h !== 'staging.ailinc.com' && h !== 'demo.ailinc.com')) {
    try {
      const page = await browser.newPage();
      const loads = [];
      for (let i = 0; i < 2; i++) {
        await page.goto(`https://${host}/login`, { waitUntil: 'load', timeout: 30000 });
        const m = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
          return { ttfb: Math.round(nav.responseStart), fcp: fcp ? Math.round(fcp.startTime) : null, kb: Math.round(nav.decodedBodySize / 1024) };
        });
        loads.push(m);
      }
      report.landings.push({ host, load1: loads[0], load2: loads[1] });
      await page.close();
    } catch (e) {
      report.landings.push({ host, error: String(e).slice(0, 80) });
    }
  }
  console.log(JSON.stringify(report, null, 1));
  require('fs').writeFileSync('../grand_tour_report.json', JSON.stringify(report, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
