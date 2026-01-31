import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Serve from dist folder
  await page.goto('file:///home/matheus/projects/NasaHackathon/NasaHackathon/globe-lite/dist/index.html', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/updated-index.png' });
  await page.screenshot({ path: 'screenshots/updated-index-full.png', fullPage: true });

  await browser.close();
  console.log('Done!');
}

capture().catch(console.error);
