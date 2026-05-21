const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

const FILE = path.resolve(__dirname, '..', 'glossari.html');
const OUT  = path.resolve(__dirname, 'size-check-output');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const { label, w, h } of SIZES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`file://${FILE}`);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const body = document.body;
      const bodyOverflows = body.scrollHeight > body.clientHeight;
      const overlay = document.querySelector('.overlay.show');
      const overlayOverflows = overlay
        ? overlay.scrollHeight > overlay.clientHeight
        : false;
      return { body: bodyOverflows, overlay: overlayOverflows };
    });

    const pass = !overflow.body && !overflow.overlay;
    const screenshotPath = path.join(OUT, `${w}x${h}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    results.push({ label, w, h, pass, overflow });
    await page.close();
  }

  await browser.close();

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
