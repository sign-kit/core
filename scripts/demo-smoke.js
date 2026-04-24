const puppeteer = require('puppeteer');

(async () => {
  const urlBase = process.env.DEMO_URL || 'http://localhost:5178';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1366, height: 900 });

  const consoleLines = [];
  page.on('console', (msg) => {
    try {
      const line = `[PAGE CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`;
      console.log(line);
      consoleLines.push(line);
    } catch (e) {}
  });
  page.on('pageerror', (err) => {
    const line = '[PAGE ERROR] ' + (err.stack || err.message || String(err));
    console.error(line);
    consoleLines.push(line);
  });
  page.on('requestfailed', (req) => {
    try {
      const f = req.failure();
      const line = `[REQUEST FAILED] ${req.url()} ${f && f.errorText}`;
      console.warn(line);
      consoleLines.push(line);
    } catch (e) {}
  });

  const paths = ['/builder', '/signer'];
  for (const p of paths) {
    const url = urlBase + p;
    console.log('\n=== NAVIGATING TO', url, '===');
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      console.error('Navigation error:', e.message);
    }
    // wait briefly for SPA updates and for canvas to appear
    try {
      await page.waitForSelector('.pdf-page', { timeout: 3000 });
    } catch (e) {
      // fallback short wait
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const shotPath = `scripts/smoke-${p.replace(/\//g, '')}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log('Saved screenshot:', shotPath);

    const domInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas')).map((c) => ({
        w: c.width,
        h: c.height,
        visible: !!c.offsetParent,
      }));
      const overlays = Array.from(document.querySelectorAll('.overlay')).map((el) => ({
        children: el.children.length,
        rect: el.getBoundingClientRect().toJSON ? el.getBoundingClientRect().toJSON() : {},
      }));
      const fields = Array.from(document.querySelectorAll('.sk-field-box')).map((el) => ({
        text: el.innerText.trim(),
        rect: el.getBoundingClientRect().toJSON ? el.getBoundingClientRect().toJSON() : {},
      }));
      const fieldOverlays = Array.from(document.querySelectorAll('.field-overlay')).map((el) => ({
        html: el.outerHTML ? el.outerHTML.slice(0, 800) : null,
        style: el.getAttribute('style'),
        rect: el.getBoundingClientRect().toJSON ? el.getBoundingClientRect().toJSON() : {},
      }));
      const viewer = document.querySelector('.pdf-builder__viewer')?.outerHTML || null;
      const viewerCount = !!document.querySelector('.pdf-builder__viewer');
      const title = document.title;
      const url = location.pathname;
      return { title, url, canvases, overlays, fields, fieldOverlays, viewer, viewerCount };
    });
    console.log('DOM INFO for', p, JSON.stringify(domInfo, null, 2));
    // persist dom info and console lines for offline inspection
    const outBase = `scripts/smoke-${p.replace(/\//g, '')}`;
    const fs = require('fs');
    try {
      fs.writeFileSync(outBase + '.json', JSON.stringify(domInfo, null, 2));
      fs.writeFileSync(outBase + '.log', consoleLines.join('\n'));
    } catch (e) {
      console.warn('Failed to write smoke outputs', e && e.message);
    }
  }

  await browser.close();
  console.log('\nSmoke test completed.');
  process.exit(0);
})().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(2);
});
