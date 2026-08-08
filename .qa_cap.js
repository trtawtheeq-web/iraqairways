const puppeteer = require('/home/ubuntu/node_modules/puppeteer');
const fs = require('fs');
const OUT = '/home/ubuntu/compare';
fs.mkdirSync(OUT, { recursive: true });

const targets = [
  { name: 'ref_desktop', url: 'http://localhost:8088/ref_home.html', w: 1440, h: 900, mobile: false },
  { name: 'ref_mobile',  url: 'http://localhost:8088/ref_home.html', w: 390,  h: 844, mobile: true  },
  { name: 'react_desktop', url: 'http://localhost:8077/home', w: 1440, h: 900, mobile: false },
  { name: 'react_mobile',  url: 'http://localhost:8077/home', w: 390,  h: 844, mobile: true  },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    protocolTimeout: 60000,
  });
  for (const tt of targets) {
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: tt.w, height: tt.h, isMobile: tt.mobile, deviceScaleFactor: 1 });
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const u = req.url();
        // allow local + local assets, block external/tracking/scene7
        if (u.startsWith('http://localhost')) return req.continue();
        return req.abort();
      });
      await page.goto(tt.url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(()=>{});
      await new Promise(r => setTimeout(r, 3500));
      // scroll to bottom to trigger lazy content
      await page.evaluate(async () => {
        await new Promise((res) => {
          let y = 0; const step = 600;
          const t = setInterval(() => { window.scrollBy(0, step); y += step; if (y > document.body.scrollHeight + 2000) { clearInterval(t); res(); } }, 80);
        });
      }).catch(()=>{});
      await new Promise(r => setTimeout(r, 1200));
      await page.evaluate(() => window.scrollTo(0,0));
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUT}/${tt.name}.png`, fullPage: true });
      console.log('OK', tt.name);
      await page.close();
    } catch (e) {
      console.log('ERR', tt.name, e.message);
    }
  }
  await browser.close();
  console.log('DONE');
})();
