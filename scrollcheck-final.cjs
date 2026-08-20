const { chromium } = require('playwright');

const ROUTES = ['/dashboard', '/courses', '/adaptive-courses', '/community', '/live-sessions'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 200)));

  await page.goto('https://demo.ailinc.com/login', { waitUntil: 'load', timeout: 60000 });
  await page.fill('input[type="email"]', 'student1@demo.ailinc.com');
  await page.fill('input[type="password"]', 'DemoAiLinc@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 45000 });
  await page.waitForTimeout(4000);

  const results = [];

  async function checkRoute(route, pass) {
    await page.goto('https://demo.ailinc.com' + route, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3500);

    const pre = await page.evaluate(() => {
      const bodyCS = getComputedStyle(document.body);
      const htmlCS = getComputedStyle(document.documentElement);
      // find deepest scrollable container covering the content area
      const candidates = [...document.querySelectorAll('*')].filter(e => {
        const cs = getComputedStyle(e);
        return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
               e.scrollHeight > e.clientHeight + 20 && e.clientHeight > 300;
      }).map(e => ({ tag: e.tagName, cls: String(e.className).slice(0, 40), sh: e.scrollHeight, ch: e.clientHeight, top: e.scrollTop }));
      const overlays = [...document.querySelectorAll('*')].filter(e => {
        const cs = getComputedStyle(e);
        return cs.position === 'fixed' && e.clientWidth >= innerWidth * 0.9 && e.clientHeight >= innerHeight * 0.9 &&
               cs.pointerEvents !== 'none' && cs.display !== 'none' && cs.visibility !== 'hidden';
      }).map(e => e.tagName + '.' + String(e.className).slice(0, 50));
      const doc = document.scrollingElement;
      return {
        bodyOverflow: bodyCS.overflow + '/' + bodyCS.overflowY,
        htmlOverflow: htmlCS.overflow + '/' + htmlCS.overflowY,
        bodyPos: bodyCS.position,
        docScrollable: doc.scrollHeight > doc.clientHeight + 20,
        docSH: doc.scrollHeight, docCH: doc.clientHeight, docTop: doc.scrollTop,
        scrollContainers: candidates.slice(0, 4),
        fullScreenFixedOverlays: overlays,
      };
    });

    // reset any scroll, then wheel like a user
    await page.evaluate(() => {
      document.scrollingElement.scrollTop = 0;
      document.querySelectorAll('*').forEach(e => { if (e.scrollTop > 0) e.scrollTop = 0; });
    });
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(700);

    const post = await page.evaluate(() => {
      const doc = document.scrollingElement;
      let maxContainerTop = 0, which = null;
      document.querySelectorAll('*').forEach(e => {
        if (e.scrollTop > maxContainerTop) { maxContainerTop = e.scrollTop; which = e.tagName + '.' + String(e.className).slice(0, 40); }
      });
      return { docTopAfter: doc.scrollTop, maxContainerTopAfter: maxContainerTop, container: which };
    });

    const moved = post.docTopAfter > 10 || post.maxContainerTopAfter > 10;
    const hasScrollableContent = pre.docScrollable || pre.scrollContainers.length > 0;
    results.push({
      route, pass,
      verdict: !hasScrollableContent ? 'NO-OVERFLOW-CONTENT (nothing to scroll)' : (moved ? 'SCROLLS' : 'STUCK'),
      moved, hasScrollableContent, pre, post,
    });
    console.log(`[pass ${pass}] ${route}: ${results[results.length - 1].verdict}  docTop=${post.docTopAfter} containerTop=${post.maxContainerTopAfter} (${post.container}) bodyOvf=${pre.bodyOverflow} overlays=${pre.fullScreenFixedOverlays.length}`);
  }

  for (const r of ROUTES) await checkRoute(r, 1);
  // second pass: revisit after cycling (the historical trigger was navigation leaving a scroll lock behind)
  for (const r of ROUTES) await checkRoute(r, 2);

  const fs = require('fs');
  fs.writeFileSync('/private/tmp/claude-501/-Users-utkarshsingh-Developer-ai-linc-backend/1ebac7f2-b79f-4f8b-882e-be07cf1529cf/scratchpad/finalverify/scrollcheck-result.json', JSON.stringify(results, null, 1));
  const stuck = results.filter(r => r.verdict === 'STUCK');
  console.log('SUMMARY: checks=' + results.length + ' stuck=' + stuck.length + (stuck.length ? ' STUCK_ROUTES=' + stuck.map(s => s.route + '#' + s.pass).join(',') : ' all scrollable routes scroll'));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
