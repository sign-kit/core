const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: 'localhost', port, path: '/', method: 'GET', timeout: 3000 },
      (res) => {
        resolve(res.statusCode === 200);
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

(async () => {
  try {
    const ports = [4178, 4177, 4176, 4174, 4173];
    let foundPort = null;
    for (const p of ports) {
      if (await checkPort(p)) {
        foundPort = p;
        break;
      }
    }
    if (!foundPort) {
      console.error('Could not find running preview server on candidate ports:', ports);
      process.exit(2);
    }
    const demoUrl = 'http://localhost:4178/#/signer';
    console.log('Using preview URL:', demoUrl);

    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.on('console', (m) => console.log('PAGE LOG>', m.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR>', err.stack || err.message));
    page.on('dialog', (d) => {
      console.log('PAGE DIALOG>', d.message());
      d.accept();
    });

    await page.setViewport({ width: 1200, height: 900 });

    await page.evaluateOnNewDocument(() => {
      (function () {
        window.__capturedBlob = null;
        const orig = URL.createObjectURL;
        URL.createObjectURL = function (b) {
          try {
            window.__capturedBlob = b;
          } catch (e) {
            /* ignore */
          }
          return orig.call(URL, b);
        };
      })();
    });
    // capture uncaught errors and unhandled rejections with stack traces
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('error', (e) => {
        try {
          // log stack if available
          const s = e.error && e.error.stack ? e.error.stack : String(e.message || e.error || e);
          // @ts-ignore
          console.error('WINDOW_ERROR_STACK:\n' + s);
        } catch (err) {
          console.error('WINDOW_ERROR:', err && err.stack ? err.stack : String(err));
        }
      });
      window.addEventListener('unhandledrejection', (ev) => {
        try {
          const r = ev.reason;
          const s = r && r.stack ? r.stack : String(r);
          // @ts-ignore
          console.error('UNHANDLED_REJECTION_STACK:\n' + s);
        } catch (err) {
          console.error('UNHANDLED_REJECTION:', String(err));
        }
      });
    });

    console.log('Navigating to', demoUrl);
    await page.goto(demoUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // ensure correct route: click the "Signer" nav link if present
    try {
      const loc = await page.evaluate(() => ({ href: location.href, hash: location.hash }));
      console.log('PAGE LOG> initial location', loc);
      await page.waitForSelector('nav', { timeout: 5000 });
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav a'));
        const signer = links.find((a) => a.textContent && a.textContent.trim() === 'Signer');
        if (signer) signer.click();
      });
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      console.log('No nav link click performed:', String(e));
    }

    // Wait for the Signer page heading to render, then look for signature field
    await page.waitForSelector('h2', { timeout: 20000 });
    const h2Text = await page.$eval('h2', (el) => el.textContent?.trim() || '');
    console.log('PAGE LOG> h2 text:', h2Text);

    let sigFound = await page.evaluate(() => {
      if (document.querySelector('.signature-field')) return true;
      const overlays = Array.from(document.querySelectorAll('.field-overlay'));
      for (const el of overlays) {
        if ((el.textContent || '').includes('Signature') || el.querySelector('.signature-field'))
          return true;
      }
      return false;
    });

    if (!sigFound) {
      const body = await page.content();
      console.warn('Signature field not found; page body head:');
      console.warn(body.slice(0, 3000));
    } else {
      console.log('Found signature field, clicking it...');
      await page.evaluate(() => {
        const sf = document.querySelector('.signature-field');
        if (sf) sf.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        else {
          const overlays = Array.from(document.querySelectorAll('.field-overlay'));
          for (const el of overlays) {
            if ((el.textContent || '').includes('Signature')) {
              el.click();
              break;
            }
          }
        }
      });
    }

    await page.waitForSelector('.modal input', { timeout: 10000 });
    console.log('Modal open, clicking Save...');
    await page.evaluate(() => {
      const btn = document.querySelector('.modal-actions button.primary');
      if (btn) btn.click();
    });

    await new Promise((r) => setTimeout(r, 300));
    console.log('Clicking Finalize button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent && b.textContent.includes('Finalize & Download'));
      if (btn) btn.click();
    });

    // check for validation errors
    await new Promise((r) => setTimeout(r, 500));
    const errors = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.errors .err')).map((e) => e.textContent || ''),
    );
    if (errors && errors.length) console.warn('Validation errors present:', errors);

    console.log('Waiting for manifest to appear...');
    let manifestText = null;
    try {
      await page.waitForFunction(
        () => {
          const pre = document.querySelector('.manifest pre');
          return pre && pre.textContent && pre.textContent.trim().length > 20;
        },
        { timeout: 30000 },
      );
      manifestText = await page.$eval('.manifest pre', (el) => el.textContent || '');
    } catch (waitErr) {
      console.warn('Timed out waiting for manifest. Gathering diagnostics...');
      try {
        const eventLog = await page.$eval('.log pre', (el) => el.textContent || '');
        console.log('EVENT LOG:\n', eventLog);
      } catch (e) {
        console.log('No event log present');
      }
      try {
        const errs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('.errors .err')).map((e) => e.textContent || ''),
        );
        console.log('UI validation errors:', errs);
      } catch (e) {
        console.log('No UI validation error nodes');
      }
      try {
        const manifestHtml = await page.$eval('.manifest', (el) => el.innerHTML);
        console.log('Manifest HTML:', manifestHtml);
      } catch (e) {
        console.log('No manifest container present');
      }
    }

    let manifest = null;
    try {
      if (manifestText) manifest = JSON.parse(manifestText);
    } catch (e) {
      console.warn('Manifest JSON parse failed');
    }

    const captured = await page.evaluate(async () => {
      if (!window.__capturedBlob) return null;
      try {
        const ab = await window.__capturedBlob.arrayBuffer();
        return {
          bytes: Array.from(new Uint8Array(ab)),
          type: window.__capturedBlob.type || 'application/pdf',
        };
      } catch (e) {
        return null;
      }
    });

    if (captured) {
      const outDir = path.resolve(__dirname, '..', 'packages', 'demo', 'headless-output');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'signed.pdf');
      fs.writeFileSync(outPath, Buffer.from(captured.bytes));
      console.log('Saved signed PDF to', outPath);
    } else {
      console.warn('No captured PDF blob via URL.createObjectURL');
    }

    console.log('Manifest summary:', {
      manifestId: manifest && manifest.manifestId,
      pdfHash: manifest && manifest.pdfHash,
      sessionHash: manifest && manifest.sessionHash,
      integrityOk: manifest && manifest.integrity && manifest.integrity.ok,
    });

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Headless test failed:', err);
    process.exit(2);
  }
})();
