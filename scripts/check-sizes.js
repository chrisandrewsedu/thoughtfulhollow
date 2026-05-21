const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const SIZES = [
  { label: 'iPhone SE',      w: 375,  h: 667  },
  { label: 'iPhone 14',      w: 390,  h: 844  },
  { label: 'iPhone 14 Plus', w: 430,  h: 932  },
  { label: 'Android mid',    w: 360,  h: 780  },
  { label: 'iPad portrait',  w: 768,  h: 1024 },
  { label: 'iPad landscape', w: 1024, h: 768  },
  { label: 'Laptop small',   w: 1280, h: 800  },
  { label: 'Laptop short',   w: 1280, h: 600  },
  { label: 'Desktop',        w: 1440, h: 900  },
  { label: 'Wide',           w: 1920, h: 1080 },
];

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.resolve(__dirname, 'size-check-output');

const MIME = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
};

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      const filePath = path.join(ROOT, urlPath === '/' ? 'glossari.html' : urlPath);
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const PORT = 54321;
  const server = await startServer(PORT);
  const BASE = `http://127.0.0.1:${PORT}`;

  const browser = await chromium.launch();
  const results = [];

  try {
    for (const { label, w, h } of SIZES) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/glossari.html`);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        // Use documentElement (html) for the page-level overflow check: this reflects
        // actual scrollability, not the body's scrollHeight which can exceed clientHeight
        // even when body has overflow:hidden (e.g. a sibling footer below .app).
        const html = document.documentElement;
        const bodyOverflows = html.scrollHeight > html.clientHeight;
        const overlays = Array.from(document.querySelectorAll('.overlay.show'));
        const overlayOverflows = overlays.some(el => el.scrollHeight > el.clientHeight);
        return { body: bodyOverflows, overlay: overlayOverflows };
      });

      const pass = !overflow.body && !overflow.overlay;
      const screenshotPath = path.join(OUT, `${w}x${h}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      results.push({ label, w, h, pass, overflow });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n── Glossari Size Check ─────────────────────────────');
  for (const { label, w, h, pass, overflow } of results) {
    const icon = pass ? '✓' : '✗';
    const detail = pass
      ? ''
      : ` (body:${overflow.body} overlay:${overflow.overlay})`;
    console.log(`  ${icon} ${label.padEnd(16)} ${String(w).padStart(4)}×${h}${detail}`);
  }
  const allPass = results.every(r => r.pass);
  console.log(
    `\n  ${allPass
      ? 'All sizes pass.'
      : 'Some sizes FAILED — check scripts/size-check-output/ for screenshots'}`
  );
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
